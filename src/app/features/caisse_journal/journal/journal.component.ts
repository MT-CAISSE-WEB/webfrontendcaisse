import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { journalModel } from '../models/journal.model';
import { CrudOperationsService } from '../services/crud-operations.service';
import { CommonModule } from '@angular/common';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { JournalService } from '../services/journal.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-journal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.css',
})
export class JournalComponent implements OnInit {
  title = 'Journal comptable';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  journaux: journalModel[] = [];
  journal: journalModel = new journalModel();
  msgErros: string = '';
  loading: Boolean = false;
  journalForm: FormGroup = this.fb.group({});

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected: journalModel[] = [];
  selectedItems: any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow: any;
  error: string = '';

  //Changement titre modal
  actionModal: string = 'create';

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  //Element à supprimer
  deleteJournal: any = null;

  // Indicateur pour différencier suppression individuelle vs multiple
  isMultipleDelete: boolean = false;

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});

  constructor(private journalservice: JournalService, private router: Router, private crudService: CrudOperationsService, private toastr: ToastrService) {}

  ngOnInit(): void {
    //initialiser le formulaire de recherche
    this.initSearchForm();
    //Afficher tous les journaux
    this.getAllJournaux();
    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('ce journal');
    this.titleMsg = TITLE_DELETE;

    this.searchForm.valueChanges
      .pipe(debounceTime(400),distinctUntilChanged()).subscribe(values => {
      this.applyFilters(values);});
  }

  getAllJournaux() {
    this.loading = true; // Démarrer le chargement
    const filters = this.searchForm.value;
    this.params = {
      page: this.currentPage,
      limit: this.limit,
      search:  '',
      actif: filters.status ?? ''
    };
    this.journalservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.journaux = res.data.data;
          this.totalPages = res.data.totalPages;
        }
        this.loading = false; // Arrêter le chargement
      },
      error: (err: any) => {
        this.loading = false; // Arrêter le chargement même en cas d'erreur
        this.error = 'Erreur lors du chargement des données';
        this.toastr.error('Erreur lors du chargement des données.');
      }
    });
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      search: [''],
      date: [''],
      status: ['']
    });
  }

  setStatus(value: number | '') {
    this.searchForm.patchValue(
      { status: value },
      { emitEvent: true } // déclenche valueChanges
    );
  }

  //application du filtre
  applyFilters(filters: any) {
    const params = {
      page: this.currentPage,
      limit: this.limit,
      search: filters.search || '',
      actif: filters.status || ''
    };

    this.journalservice.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.journaux = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //création du formulaire
  initForm(): void {
    this.journalForm = this.fb.group({
      codejournal: ['', [Validators.required]],
      designation: ['', [Validators.required]],
      idsociete: [this.user.idsociete ?? null, [Validators.required]],
      actif: [true],
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Méthode helper pour obtenir le nom complet de l'utilisateur
  getUserFullName(): string {
    const user = this.user;
    if (user && user.nom && user.prenom) {
      return `${user.nom} ${user.prenom}`;
    }
    return user?.nom || user?.prenom || 'Systeme';
  }

  get form() {
    return this.journalForm.controls;
  }

  dispatchJournal(_object: journalModel) {
    const status = _object.actif === 1;
    this.journalForm.patchValue({
      codejournal: _object.codejournal,
      designation: _object.designation,
      idsociete: _object.idsociete ?? null,
      actif: status,
    });
  }

  //validation required
  isValidField(label: string): string {
    let status: string = '';
    this.form[label].valid && this.form[label].touched
      ? (status = 'is-valid')
      : this.form[label].invalid && this.form[label].touched
      ? (status = 'is-invalid')
      : (status = '');
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

  //Méthode générique pour actualiser les données (réutilisable dans d'autres composants)
  refreshData(): void {
    this.currentPage = 1; // Remettre à la première page
    this.objectsSelected = []; // Vider la sélection
    this.checkAllRow = false; // Désélectionner tout
    this.getAllJournaux(); // Recharger les données
  }

  //Suppression individuelle d'un journal
  deleteJournalItem(journal: journalModel): void {
    // Configurer le modal pour la suppression individuelle
    this.isMultipleDelete = false;
    this.deleteJournal = journal;
    this.titleMsg = 'Suppression individuelle';
    this.msgSup = `Êtes-vous sûr de vouloir supprimer le journal "${journal.designation}" ?`;

    // Ouvrir le modal de suppression
    this.openDeleteModal();
  }

  //Suppression en masse des journaux sélectionnés
  deleteMultiple(): void {
    if (this.objectsSelected.length === 0) {
      this.toastr.warning('Veuillez sélectionner au moins un journal à supprimer.');
      return;
    }

    // Configurer le modal pour la suppression multiple
    this.isMultipleDelete = true;
    this.titleMsg = 'Suppression multiple';
    this.msgSup = this.objectsSelected.length === 1
      ? `Êtes-vous sûr de vouloir supprimer le journal "${this.objectsSelected[0].designation}" ?`
      : `Êtes-vous sûr de vouloir supprimer ${this.objectsSelected.length} journaux sélectionnés ?`;

    // Ouvrir le modal de suppression
    this.openDeleteModal();
  }

  //Filtrage par statut (méthode améliorée)
  filterByStatus(status: number | ''): void {
    this.setStatus(status);
  }

  //Méthode pour obtenir le nombre d'éléments par statut
  getStatusCount(status: number | ''): number {
    if (status === '') return this.journaux.length;
    return this.journaux.filter(journal => journal.actif === status).length;
  }

  rafreshpage(){
    const currentUrl = this.router.url; 
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  //Soumission du formulaire
  onSubmit() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.journalForm.controls;
    if (this.journalForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched()
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.journalForm.value;

    const baseJournal = {
      ...this.journal,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
    };

    // Ajouter les informations utilisateur selon l'action
    const _journal: journalModel = this.actionModal === 'create'
      ? {
          ...baseJournal,
          createdby: this.getUserFullName(),
          updatedby: this.getUserFullName(),
        }
      : {
          ...baseJournal,
          updatedby: this.getUserFullName(),
        };

    /** 3. choices action */
    if (this.actionModal == 'create') this.create(_journal);
    else this.update(_journal);
  }

  //Enregistrement de données
  create(_journal: journalModel) {
    const { idjournal, ...dataToSend } = _journal;
    this.loading = true;
    this.journalservice.create(dataToSend).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.closeModal('showModal');
          this.toastr.success('Journal créé avec succès.');
          // Recharger la page après l'affichage du toast
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          this.error = 'Erreur de création';
          this.toastr.error('Erreur lors de la création du journal.');
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Création échec';
        this.loading = false;
        this.toastr.error('Échec de la création du journal.');
      },
    });
  }

  //Modification de données
  update(_journal: journalModel){
    this.loading = true;
    this.journalservice.update(_journal).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.closeModal('showModal');
          this.toastr.success('Journal modifié avec succès.');
          // Recharger la page après l'affichage du toast
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          this.error = 'Erreur de modification';
          this.toastr.error('Erreur lors de la modification du journal.');
        }
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = 'Modification échec';
        this.loading = false;
        this.toastr.error('Échec de la modification du journal.');
      },
    });
  }

  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  // Méthode pour ouvrir le modal de suppression
  openDeleteModal(): void {
    const modalEl = document.getElementById('deleteOrder');
    if (modalEl) {
      modalEl.classList.add('show');
      modalEl.setAttribute('aria-hidden', 'false');
      modalEl.style.display = 'block';
      document.body.classList.add('modal-open');

      // Créer et ajouter le backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  modalCreate() {
    this.actionModal = 'create';
    this.initForm();
  }

  modalUpdate(_object: journalModel) {
    this.journal = _object;
    this.actionModal = 'update';
    this.journalForm.reset();
    this.dispatchJournal(_object);
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: journalModel) {
    this.deleteJournal = item;
    this.isMultipleDelete = false; // S'assurer que c'est une suppression individuelle
  }

  deleteConfirmed() {
    if (this.isMultipleDelete) {
      // Suppression multiple
      this.loading = true;
      let successCount = 0;
      let errorCount = 0;

      // Boucler sur chaque élément sélectionné et appeler l'API de suppression
      const deletePromises = this.objectsSelected.map(journal =>
        this.journalservice.delete(journal.idjournal).toPromise()
          .then(() => {
            successCount++;
          })
          .catch(() => {
            errorCount++;
          })
      );

      Promise.allSettled(deletePromises)
        .then(() => {
          this.closeModal('deleteOrder');
          this.objectsSelected = []; // Vider la sélection
          this.checkAllRow = false; // Désélectionner tout
          this.isMultipleDelete = false; // Réinitialiser l'indicateur
          this.loading = false;

          if (errorCount === 0) {
            this.toastr.success(`${successCount} journal(s) supprimé(s) avec succès.`);
          } else if (successCount === 0) {
            this.toastr.error('Échec de la suppression de tous les journaux.');
          } else {
            this.toastr.warning(`${successCount} journal(s) supprimé(s), ${errorCount} échec(s).`);
          }

          // Recharger la page après la suppression
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        });
    } else {
      // Suppression individuelle
      if (!this.deleteJournal) return;
      this.loading = true;
      this.journalservice.delete(this.deleteJournal.idjournal).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.deleteJournal = null;
            this.closeModal('deleteOrder');
            this.toastr.success('Journal supprimé avec succès.');
            // Recharger la page après la suppression individuelle aussi
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            this.error = 'Erreur de Suppression';
            this.toastr.error('Erreur lors de la suppression du journal.');
          }
          this.loading = false;
        },
        error: (err: any) => {
          this.error = 'Suppression échec';
          this.loading = false;
          this.toastr.error('Échec de la suppression du journal.');
        },
      });
    }
  }
}