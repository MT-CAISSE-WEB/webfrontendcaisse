import { Component, OnInit } from '@angular/core';
import { FormArray,FormBuilder,FormGroup,Validators,ReactiveFormsModule,FormControl, FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DemandeService } from '../services/demande.service';
import { catchError, debounceTime, finalize, forkJoin, map, of, switchMap} from 'rxjs';
import { DemandeComplet } from '../models/demande-complet.model';
import { EnteteDemande } from '../models/entete-demande.model';
import { LigneDemande } from '../models/ligne-demande.model';
import { DetailsDemande } from '../models/details-demande.model';
import { BudgetModel } from '../../budgets/models/budget.model';
import { BudgetService } from '../../budgets/services/budget.service';
import { APP_ROOT_DMD_EDIT_DECAISSEMENT } from '../../../_core/routes/frontend.root';
import { RouterLink, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';

@Component({
  selector: 'app-demande-decaissement',
  templateUrl: './demande-decaissement.component.html',
  styleUrls: ['./demande-decaissement.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, RouterModule],
})
export class DemandeDecaissementComponent implements OnInit {
  title = 'Demande multi-étapes';
  root_demande_edit_decaissement = APP_ROOT_DMD_EDIT_DECAISSEMENT;
  root_edit : string = 'edit/'
  loading = false;
  error = '';
  msgErros = '';
  msgSuccess = '';
  actionModal: 'create' | 'update' = 'create';
  budgets: BudgetModel[] = [];

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  demandes: DemandeComplet[] = [];
  demandesValide: any[] = [];
  entetesDmd: EnteteDemande[] = [];
  selectedDemande?: DemandeComplet;

  searchControl = new FormControl('');
  filteredDemandes: DemandeComplet[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  //Element à supprimer 
  deleteDemande: any = null;
  //Demande à selectionner
  selectedDmd! : EnteteDemande;

  // tout sélectionné/désélectionné
  allSelected = false;
  //Faire le check selection **********
  objectsSelected : EnteteDemande[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;

  fb: FormBuilder = new FormBuilder();
  //Formulaire de validation
  validForm : FormGroup = this.fb.group({});

  constructor(
    private service: DemandeService,
    private budgetservice: BudgetService,
    private toastr : ToastrService
  ) {}

  ngOnInit(): void {
    //initialiser le formulaire
    this.initValidForm();
    //charger les demandes
    this.loadAllDemandes();

    // Filtrage live avec debounce pour éviter de spammer le filtre à chaque frappe
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe((searchText) => {
        this.applyFilter(searchText as string);
      });

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette opération");
    this.titleMsg = TITLE_DELETE;
  }

  applyFilter(value: string) {
    const filter = value?.toLowerCase() || '';

    if (!filter) {
      this.filteredDemandes = [...this.demandes]; // aucune recherche => toutes les demandes
      return;
    }

    this.filteredDemandes = this.demandes.filter(
      (demande) =>
        demande.entete.codedemande!.toLowerCase().includes(filter) ||
        demande.entete.libelledemande!.toLowerCase().includes(filter) ||
        demande.lignes.some((lc) =>
          lc.ligne.libellelignedemande!.toLowerCase().includes(filter)
        )
    );
  }

  formatNumber(montant: number | string): string {
    if (montant === null || montant === undefined || montant === "") return "";
    const valeur = Number(montant);
    if (isNaN(valeur)) return "";

    return valeur
      .toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
  }

  // fermeture du modal
  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateFR(dateInput: string | Date): string {
    const date = new Date(dateInput);

    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(date)
      .replace('.', '');

    const day = date.getDate();
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(date)
      .replace('.', '');

    const year = date.getFullYear();

    return `${dayShort} ${day} ${month} ${year}`;
  }

  //Initialiser le formulaire de validation
  initValidForm() {
    this.validForm = this.fb.group({
      iddemande: [''],
      decision: ['', Validators.required],
      motif: [''],
    });

    this.validForm.get('decision')?.valueChanges.subscribe(value => {
      const motifCtrl = this.validForm.get('motifRefus');

      if (value === 'refuser') {
        motifCtrl?.enable();
        motifCtrl?.setValidators([Validators.required, Validators.minLength(5)]);
      } else {
        motifCtrl?.reset();
        motifCtrl?.clearValidators();
        motifCtrl?.disable();
      }

      motifCtrl?.updateValueAndValidity();
    });
  }

  handleDecisionChange(): void {
    this.validForm.get('decision')?.valueChanges.subscribe(decision => {
      const motifCtrl = this.validForm.get('motif');

      if (decision === 'refuser') {
        motifCtrl?.setValidators([
          Validators.required,
          Validators.minLength(5)
        ]);
      } else {
        motifCtrl?.clearValidators();
        motifCtrl?.reset();
      }

      motifCtrl?.updateValueAndValidity();
    });
  }

  //Envoi du formulaire
  onSubmit(): void {
    if (this.validForm.invalid) {
      this.validForm.markAllAsTouched();
      return;
    }

    const payload = {
      iddemande: this.selectedDmd?.iddemande,
      decision: this.validForm.value.decision,
      motif: this.validForm.value.decision === 'refuser'
        ? this.validForm.value.motif
        : null
    };

      // Exemple appel backend
    if(payload.iddemande){
        this.service.validationDemande(payload.iddemande, payload).subscribe({
        next: (res) => {
          if(res.succes){
            this.toastr.success('Décision enrégistrée');
          }else{
            this.toastr.error('Erreur lors de la validation');
          }
        },
        error: (err) => {
          this.toastr.error(err.error.message);
        }
      });
    }else{
      this.toastr.error('Erreur lors de la selection de la demande');
    }
    
  }

  // afficher toutes les demandes
  loadAllDemandes() {
    const params = {
      page: this.currentPage,
      limit: this.limit,
      search: '',
      date: '',
      status: '',
    };
    this.service.getAllEntetes(params).subscribe({
      next : (res) => {
        if(res.success){
          this.entetesDmd = res.data.data;
          this.totalPages = res.data.totalPages;
          console.log(this.entetesDmd);
          this.loadDemandeAvalide();
        }else{
          this.toastr.error("Erreur de récuperation des données");
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // Recharger toutes les demandes a valider
  loadDemandeAvalide() {
    this.service.avalider(this.user.idutilisateur).subscribe({
      next : (res) => {
        if(res.success){
          this.demandesValide = res.data;
        }else{
          this.toastr.error("Aucune demande a valider");
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
      }
    });
  }

  //Ouverture
  openValidationModal(demande: any) {
    this.selectedDmd = demande;
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.iddemande);
    return ids.includes(_id);
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.loadAllDemandes(); // recharge les données
  }

  getTotalDemande(demande: EnteteDemande): number {
    return demande.lignes.reduce((sum, l) => sum + l.montantdemande, 0);
  }

  //selectionner une instance dans une liste
  handleSelectOne(demande: EnteteDemande, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.iddemande == demande.iddemande
    );
    if (index == -1 && actif) this.objectsSelected.push(demande);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.demandes?.length;
  }

  modalDelete(item: EnteteDemande){
    this.deleteDemande = item;
  }

  deleteConfirmed(){
    if(!this.deleteDemande) return ;
    this.service.deleteEntete(this.deleteDemande.iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.deleteDemande = null;
          this.closeModal('deleteOrder');
          this.toastr.error('Demande supprimée avec succès');
        } else {
          this.error = "Erreur de Suppression";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Suppression échec";
        this.loading = false;
        this.toastr.error(this.error + "\n", err);
      }
    })
  }

}
