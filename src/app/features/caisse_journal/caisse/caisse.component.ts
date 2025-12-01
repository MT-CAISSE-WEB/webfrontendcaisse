import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { caisseModel } from '../models/caisse.model';
import { CaisseService } from '../services/caisse.service';
import { Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';
import { journalModel } from '../models/journal.model';
import { JournalService } from '../services/journal.service';

@Component({
  selector: 'app-caisse',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './caisse.component.html',
  styleUrl: './caisse.component.css'
})
export class CaisseComponent implements OnInit{
  title = "Caisse";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  caisses : caisseModel[] = [];
  caisse : caisseModel = new caisseModel();
  msgErros : string = "";
  loading: Boolean = false;
  caisseForm : FormGroup = this.fb.group({});
  journaux : journalModel[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected : caisseModel[] = [];
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
  deleteCaisse: any = null;


  constructor(private caisseservice: CaisseService,
              private journalservice: JournalService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les caisses
      this.getAllcaisses();
      //Ramener tous les journaux
      this.getAllJournaux();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette caisse");
      this.titleMsg = TITLE_DELETE
  }

  getAllcaisses(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.caisseservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.caisses = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  getAllJournaux(){
    const params = {
      page: 1,
      limit: 1000
    };
    this.journalservice.getAll(params).subscribe({
      next : (res) => {
        if(res.success){
          this.journaux = res.data.data;
        }
      }
    });
  }

  getAllDevises(){}

  getAllComptes(){}

  //création du formulaire
  initForm(): void{
    this.caisseForm = this.fb.group({
      codecaisse : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      journal : ["", [Validators.required]],
      devise : ["", [Validators.required]],
      compte : ["", [Validators.required]],
      site : ["197D7C37-7180-4DD1-80CC-843B9A6C5B52"],
      societe : ["B89B381E-691E-4BA7-979E-1AC4D5B1E018"],
      actif : [true],
    })
  }

  get form() {
    return this.caisseForm.controls;
  }

  dispatchCaisse(_object: caisseModel){
    const status = _object.actif === 1;
    this.caisseForm.patchValue({
      codecaisse : _object.codecaisse,
      libelle : _object.libelle,
      societe: _object.societe.idsociete,
      devise: _object.devise.iddevise,
      journal: _object.journal.idjournal,
      site: _object.site,
      compte: _object.compte.idcompte,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idcaisse);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(journal: caisseModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcaisse == journal.idcaisse
    );
    if (index == -1 && actif) this.objectsSelected.push(journal);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.caisses?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.caisses.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllcaisses(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit(){
    console.log("Sumit");
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.caisseForm.controls;
    if (this.caisseForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.caisseForm.value;

    const _caisse: caisseModel = {
      ...this.caisse,
      ...formValue,
      actif: formValue.actif ? 1 : 0  
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_caisse);
    else this.update(_caisse);
    // if (!_caisse.idcaisse) this.create(_caisse);
    // else this.update(_caisse);
  }

  //Enregistrement de données
  create(_caisse: caisseModel) {
    const {idcaisse, ...dataToSend} = _caisse;
    this.loading = true;
    this.caisseservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcaisses();
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
  update(_caisse: caisseModel){
    this.caisseservice.update(_caisse).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcaisses();
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

  modalUpdate(_object: caisseModel){
    this.caisse = _object;
    this.actionModal = "update";
    this.caisseForm.reset();
    this.dispatchCaisse(_object);
  }

  // loader(){
  //   this.router.navigateByUrl(APP_caisse_CAISSE_caisse).then();
  // }

  modalDelete(item: caisseModel){
    this.deleteCaisse = item;
  }

  deleteConfirmed(){
    if(!this.deleteCaisse) return ;
    this.caisseservice.delete(this.deleteCaisse.idcaisse).subscribe({
      next: (res) => {
        if (res.success) {
          this.deleteCaisse = null;
          this.closeModal('deleteOrder');
          this.getAllcaisses();
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
