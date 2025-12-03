import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { plancomptableModel } from '../models/plancomptable.model';
import { PlancomptableService } from '../services/plancomptable.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-plancomptable',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './plancomptable.component.html',
  styleUrl: './plancomptable.component.css' 
})

export class PlancomptableComponent implements OnInit{
  title = "Plan comptable";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  comptes : plancomptableModel[] = [];
  compte : plancomptableModel = new plancomptableModel();
  msgErros : string = "";
  loading: Boolean = false;
  plancomptableForm : FormGroup = this.fb.group({})

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  //Faire le check selection **********
  objectsSelected : plancomptableModel[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Changement titre modal
  actionModal: string = "create";

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  //Element à supprimer 
  deleteCompte: any = null;


  constructor(private plancomptableservice: PlancomptableService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les comptes
      this.getAllComptes();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce compte");
      this.titleMsg = TITLE_DELETE;
  }

  getAllComptes(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.plancomptableservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.comptes = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //Création du formulaire
  initForm(): void{
    this.plancomptableForm = this.fb.group({
      numcompte : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      ventillable: [false],
      auxiliaire: [false],
      suivibudgetaire: [false],
      suivibudgetairemensuel: [false],
      idsociete : ["", [Validators.required]],
      actif : [true],
    })
  }

  get form() {
    return this.plancomptableForm.controls;
  }

  dispatchComptes(_object: plancomptableModel){
    const status = _object.actif === 1;
    this.plancomptableForm.patchValue({
      numcompte : _object.numcompte,
      libelle : _object.libelle,
      ventillable : _object.ventillable,
      auxiliaire : _object.auxiliaire,
      suivibudgetaire : _object.suivibudgetaire,
      suivibudgetairemensuel : _object.suivibudgetairemensuel,
      idsociete: _object.idsociete,
      actif : status
    })
  }

  //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.idcompte);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(compte: plancomptableModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcompte == compte.idcompte
    );
    if (index == -1 && actif) this.objectsSelected.push(compte);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.comptes?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.comptes.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllComptes(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.plancomptableForm.controls;
    if (this.plancomptableForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.plancomptableForm.value;

    const _comptes: plancomptableModel = {
      ...this.compte,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
      ventillable: formValue.ventillable ? 1 : 0,
      auxiliaire: formValue.auxiliaire ? 1 : 0,
      suivibudgetaire: formValue.suivibudgetaire ? 1 : 0,
      suivibudgetairemensuel: formValue.suivibudgetairemensuel ? 1 : 0,
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_comptes);
    else this.update(_comptes);
    // if (!_comptes.idcomptes) this.create(_comptes);
    // else this.update(_comptes);
  }

  //Enregistrement de données
  create(_comptes: plancomptableModel) {
    const {idcompte, ...dataToSend} = _comptes;
    this.loading = true;
    this.plancomptableservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllComptes();
        } else {
          this.error = "Erreur de création";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de création";
        this.loading = false;
      }
    })
  }

  //Modification de données
  update(_comptes: plancomptableModel){
    this.plancomptableservice.update(_comptes).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllComptes();
        } else {
          this.error = "Erreur de modification";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de modification";
        this.loading = false;
      }
    })
  }

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  modalCreate(){
    this.actionModal = "create";
    this.initForm();
  }

  modalUpdate(_object: plancomptableModel){
    this.compte = _object;
    this.actionModal = "update";
    this.plancomptableForm.reset();
    this.dispatchComptes(_object);
  }

  modalDelete(item: plancomptableModel){
    this.deleteCompte = item;
  }

  deleteConfirmed(){
    if(!this.deleteCompte) return ;
    this.plancomptableservice.delete(this.deleteCompte.idcompte).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllComptes();
        } else {
          this.error = "Erreur de Suppression";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Suppression échec";
        this.loading = false;
      }
    })
  }
}
