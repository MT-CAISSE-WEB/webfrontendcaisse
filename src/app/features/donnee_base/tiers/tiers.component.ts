import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { tiersModel } from '../models/tiers.model';
import { TiersService } from '../services/tiers.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tiers',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tiers.component.html',
  styleUrl: './tiers.component.css' 
})

export class TiersComponent implements OnInit{
  title = "Gestion des Tiers";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  tiers : tiersModel[] = [];
  tier : tiersModel = new tiersModel();
  msgErros : string = "";
  loading: Boolean = false;
  tiersForm : FormGroup = this.fb.group({})

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  //Faire le check selection **********
  objectsSelected : tiersModel[] = [];
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
  deleteTiers: any = null;


  constructor(private tiersservice: TiersService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les tiers
      this.getAllTiers();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce tiers");
      this.titleMsg = TITLE_DELETE;
  }

  getAllTiers(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.tiersservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.tiers = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //création du formulaire
  initForm(): void{
    this.tiersForm = this.fb.group({
      codetiers : ["", [Validators.required]],
      designation : ["", [Validators.required]],
      typetiers : ["", [Validators.required]],
      idsociete : ["", [Validators.required]],
      actif : [true],
    })
  }

  get form() {
    return this.tiersForm.controls;
  }

  dispatchTiers(_object: tiersModel){
    const status = _object.actif === 1;
    this.tiersForm.patchValue({
      codetiers : _object.codetiers,
      designation : _object.designation,
      typetiers : _object.typetiers,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idtiers);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(tier: tiersModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idtiers == tier.idtiers
    );
    if (index == -1 && actif) this.objectsSelected.push(tier);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.tiers?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.tiers.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllTiers(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.tiersForm.controls;
    if (this.tiersForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.tiersForm.value;

    const _tiers: tiersModel = {
      ...this.tier,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
       
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_tiers);
    else this.update(_tiers);
    // if (!_tiers.idtiers) this.create(_tiers);
    // else this.update(_tiers);
  }

  //Enregistrement de données
  create(_tiers: tiersModel) {
    const {idtiers, ...dataToSend} = _tiers;
    this.loading = true;
    this.tiersservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllTiers();
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
  update(_tiers: tiersModel){
    this.tiersservice.update(_tiers).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllTiers();
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

  modalUpdate(_object: tiersModel){
    this.tier = _object;
    this.actionModal = "update";
    this.tiersForm.reset();
    this.dispatchTiers(_object);
  }

  modalDelete(item: tiersModel){
    this.deleteTiers = item;
  }

  deleteConfirmed(){
    if(!this.deleteTiers) return ;
    this.tiersservice.delete(this.deleteTiers.idtiers).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllTiers();
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
