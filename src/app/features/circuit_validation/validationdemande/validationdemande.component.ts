import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { validationdemandeModel } from '../models/validationdemande.model';
import { validationdemandeService } from '../services/validationdemande.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-validationdemande',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './validationdemande.component.html',
  styleUrl: './validationdemande.component.css'
})
export class ValidationdemandeComponent implements OnInit{
  title = "Demande validation";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  demandes : validationdemandeModel[] = [];
  demande : validationdemandeModel = new validationdemandeModel();
  msgErros : string = "";
  loading: Boolean = false;
  validationdemandeForm : FormGroup = this.fb.group({})

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected : validationdemandeModel[] = [];
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
  deletedemande: any = null;


  constructor(private validationdemandeservice: validationdemandeService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les journaux
      this.getAlldemandes();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette demande");
      this.titleMsg = TITLE_DELETE
  }

  getAlldemandes(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.validationdemandeservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.demandes = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //création du formulaire
  initForm(): void{
    this.validationdemandeForm = this.fb.group({
      iddemande : ["", [Validators.required]],
      idsociete : ["", [Validators.required]],
      datevalidation : ["", [Validators.required]],     
      actif : [true],
    })
  }

  get form() {
    return this.validationdemandeForm.controls;
  }

  dispatchdemande(_object: validationdemandeModel){
    const status = _object.actif === 1;
    this.validationdemandeForm.patchValue({
      iddemande : _object.iddemande,
      idsociete: _object.idsociete,
      datevalidation : _object.datevalidation,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idvalidationdemande);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(demande: validationdemandeModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idvalidationdemande == demande.idvalidationdemande
    );
    if (index == -1 && actif) this.objectsSelected.push(demande);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.demandes?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.demandes.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAlldemandes(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.validationdemandeForm.controls;
    if (this.validationdemandeForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.validationdemandeForm.value;

    const _demande: validationdemandeModel = {
      ...this.demande,
      ...formValue,
      actif: formValue.actif ? 1 : 0  
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_demande);
    else this.update(_demande);
    // if (!_journal.idjournal) this.create(_journal);
    // else this.update(_journal);
  }

  //Enregistrement de données
  create(_demande: validationdemandeModel) {
    const {idvalidationdemande, ...dataToSend} = _demande;
    this.loading = true;
    this.validationdemandeservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAlldemandes();
        } else {
          this.error = "Erreur de création";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Création échec";
        this.loading = false;
      }
    })
  }

  //Modification de données
  update(_demande: validationdemandeModel){
    console.log(_demande);
    this.validationdemandeservice.update(_demande).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAlldemandes();
        } else {
          this.error = "Erreur de modification";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Modification échec";
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

  modalUpdate(_object: validationdemandeModel){
    this.demande = _object;
    this.actionModal = "update";
    this.validationdemandeForm.reset();
    this.dispatchdemande(_object);
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: validationdemandeModel){
    this.deletedemande = item;
  }

  deleteConfirmed(){
    if(!this.deletedemande) return ;
    this.validationdemandeservice.delete(this.deletedemande.idvalidationdemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.deletedemande = null;
          this.closeModal('deleteOrder');
          this.getAlldemandes();
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
