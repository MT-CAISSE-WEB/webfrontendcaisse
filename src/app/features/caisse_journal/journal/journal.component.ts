import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { journalModel } from '../models/journal.model';
import { JournalService } from '../services/journal.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { APP_JOURNAL_CAISSE_JOURNAL } from '../../../_core/routes/frontend.root';

@Component({
  selector: 'app-journal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.css'
})
export class JournalComponent implements OnInit{
  title = "Journal comptable";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  journaux : journalModel[] = [];
  journal : journalModel = new journalModel();
  msgErros : string = "";
  loading: Boolean = false;
  journalForm : FormGroup = this.fb.group({})

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected : journalModel[] = [];
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
  deleteJournal: any = null;


  constructor(private journalservice: JournalService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les journaux
      this.getAllJournaux();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce journal");
      this.titleMsg = TITLE_DELETE
  }

  getAllJournaux(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.journalservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.journaux = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //création du formulaire
  initForm(): void{
    this.journalForm = this.fb.group({
      codejournal : ["", [Validators.required]],
      designation : ["", [Validators.required]],
      idsociete : ["", [Validators.required]],
      actif : [true],
    })
  }

  get form() {
    return this.journalForm.controls;
  }

  dispatchJournal(_object: journalModel){
    const status = _object.actif === 1;
    this.journalForm.patchValue({
      codejournal : _object.codejournal,
      designation : _object.designation,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idjournal);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(journal: journalModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idjournal == journal.idjournal
    );
    if (index == -1 && actif) this.objectsSelected.push(journal);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.journaux?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.journaux.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllJournaux(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.journalForm.controls;
    if (this.journalForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.journalForm.value;

    const _journal: journalModel = {
      ...this.journal,
      ...formValue,
      actif: formValue.actif ? 1 : 0  
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_journal);
    else this.update(_journal);
    // if (!_journal.idjournal) this.create(_journal);
    // else this.update(_journal);
  }

  //Enregistrement de données
  create(_journal: journalModel) {
    const {idjournal, ...dataToSend} = _journal;
    this.loading = true;
    this.journalservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllJournaux();
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
  update(_journal: journalModel){
    console.log(_journal);
    this.journalservice.update(_journal).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllJournaux();
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

  modalUpdate(_object: journalModel){
    this.journal = _object;
    this.actionModal = "update";
    this.journalForm.reset();
    this.dispatchJournal(_object);
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: journalModel){
    this.deleteJournal = item;
  }

  deleteConfirmed(){
    if(!this.deleteJournal) return ;
    this.journalservice.delete(this.deleteJournal.idjournal).subscribe({
      next: (res) => {
        if (res.success) {
          this.deleteJournal = null;
          this.closeModal('deleteOrder');
          this.getAllJournaux();
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
