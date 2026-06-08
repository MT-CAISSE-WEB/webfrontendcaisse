import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DemandeService } from '../services/demande.service';
import {
  catchError,
  debounceTime,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
import { DemandeComplet } from '../models/demande-complet.model';
import { EnteteDemande } from '../models/entete-demande.model';
import { LigneDemande } from '../models/ligne-demande.model';
import { DetailsDemande } from '../models/details-demande.model';
import { BudgetModel } from '../../budgets/models/budget.model';
import { BudgetService } from '../../budgets/services/budget.service';
import { APP_ROOT_DMD_EDIT_DECAISSEMENT } from '../../../_core/routes/frontend.root';
import { RouterLink, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { tauxdevisemodel } from '../../donnee_base/donnee_base/model/tauxdevise.model';
import { tauxdeviseservice } from '../../donnee_base/donnee_base/service/tauxdevise.service';
import { motifModel } from '../../paramètres/models/motif.model';
import { MotifService } from '../../paramètres/services/motif.service';
import { PieceJointe } from '../../PJ/models/pj.model';
import { DemandePJService } from '../../PJ/service/demandepj.service';

@Component({
  selector: 'app-demande-decaissement',
  templateUrl: './demande-decaissement.component.html',
  styleUrls: ['./demande-decaissement.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    RouterModule,
  ],
})
export class DemandeDecaissementComponent implements OnInit {
  title = 'Demande multi-étapes';
  root_demande_edit_decaissement = APP_ROOT_DMD_EDIT_DECAISSEMENT;
  root_edit: string = 'edit/';
  loading = false;
  error = '';
  msgErros = '';
  msgSuccess = '';
  actionModal: 'create' | 'update' = 'create';
  budgets: BudgetModel[] = [];

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  demandes: DemandeComplet[] = [];
  demandesValide: any[] = [];
  validateurs: any[] = [];
  detailBudgets: any;
  entetesDmd: EnteteDemande[] = [];
  selectedDemande?: DemandeComplet;

  searchControl = new FormControl('');
  filteredDemandes: DemandeComplet[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  // Nombre d'éléments par page
  demandeMontant: number = 0;

  //Validation possible ou non
  canValidateUser: boolean = false;

  //Liste des taux de devises
  tauxdevises: tauxdevisemodel[] = [];

  motifs: motifModel[] = [];

  //Element à supprimer
  deleteDemande: any = null;
  //Demande à selectionner
  selectedDmd!: EnteteDemande;

  // tout sélectionné/désélectionné
  allSelected = false;
  //Faire le check selection **********
  objectsSelected: EnteteDemande[] = [];
  selectedItems: any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow: any;

  fb: FormBuilder = new FormBuilder();
  //Formulaire de validation
  validForm: FormGroup = this.fb.group({});

  // Propriétés pour les pièces jointes
  piecesJointes: PieceJointe[] = [];
  piecesJointesLoading = false;
  selectedFiles: File[] = [];
  selectedDemandePJ: EnteteDemande | null = null;
  pjUploading = false;
  pjDeleting: string | null = null;
  piecesCountMap: Map<string, number> = new Map(); // Cache pour les compteurs
  newlyCreatedDemande: EnteteDemande | null = null;

  constructor(
    private service: DemandeService,
    private budgetservice: BudgetService,
    private toastr: ToastrService,
    private ts: tauxdeviseservice,
    private motifservice: MotifService,
    private pjService: DemandePJService,
  ) {}

  ngOnInit(): void {
    //initialiser le formulaire
    this.initValidForm();
    //charger les demandes
    this.loadAllDemandes();

    //charger les motifs aussi
    this.getAllMotif();

    // Filtrage live avec debounce pour éviter de spammer le filtre à chaque frappe
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe((searchText) => {
        this.applyFilter(searchText as string);
      });

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('cette opération');
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
          lc.ligne.libellelignedemande!.toLowerCase().includes(filter),
        ),
    );
  }

  /**
   * Charge les compteurs de pièces jointes pour toutes les demandes
   * Utilise des appels parallèles pour optimiser les performances
   */
  loadPiecesCountsForAllDemandes(): void {
    if (!this.entetesDmd || this.entetesDmd.length === 0) return;

    // Créer un tableau de promesses pour toutes les demandes
    const requests = this.entetesDmd.map((demande) =>
      this.pjService
        .getAll(demande.iddemande)
        .pipe(catchError(() => of({ success: false, data: [] }))),
    );

    // Exécuter toutes les requêtes en parallèle
    forkJoin(requests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          const demande = this.entetesDmd[index];
          if (response.success && response.data) {
            this.piecesCountMap.set(demande.iddemande, response.data.length);
          } else {
            this.piecesCountMap.set(demande.iddemande, 0);
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement compteurs PJ:', err);
        // En cas d'erreur, initialiser à 0 pour toutes
        this.entetesDmd.forEach((demande) => {
          this.piecesCountMap.set(demande.iddemande, 0);
        });
      },
    });
  }

  formatNumber(montant: number | string): string {
    if (montant === null || montant === undefined || montant === '') return '';
    const valeur = Number(montant);
    if (isNaN(valeur)) return '';

    return valeur.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // fermeture du modal
  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  //Recuperer tous les motifs
  getAllMotif() {
    const params = {
      page: 1,
      limit: 50,
      search: '',
      actif: '',
    };
    this.motifservice.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.motifs = res.data.data;
        }
      },
    });
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

    return `${day} ${month} ${year}`;
  }

  //Initialiser le formulaire de validation
  initValidForm() {
    this.validForm = this.fb.group({
      iddemande: [''],
      decision: ['', Validators.required],
      motif: [''],
      comment: [''],
    });

    this.validForm.get('decision')?.valueChanges.subscribe((value) => {
      const motifCtrl = this.validForm.get('motif');

      if (value !== 'accepter') {
        motifCtrl?.enable();
        motifCtrl?.setValidators([
          Validators.required,
          Validators.minLength(10),
        ]);
      } else {
        motifCtrl?.reset();
        motifCtrl?.clearValidators();
        motifCtrl?.disable();
      }

      motifCtrl?.updateValueAndValidity();
    });
  }

  //Calcul du solde budget
  calculateSoldeBudget(
    prevision?: number,
    engage?: number,
    preengage?: number,
    realise?: number,
  ): number {
    return (prevision ?? 0) - (engage ?? 0) - (preengage ?? 0) - (realise ?? 0);
  }

  handleDecisionChange(): void {
    this.validForm.get('decision')?.valueChanges.subscribe((decision) => {
      const motifCtrl = this.validForm.get('motif');

      if (decision === 'refuser') {
        motifCtrl?.setValidators([
          Validators.required,
          Validators.minLength(5),
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
      userId: this.user.idutilisateur,
      iddemande: this.selectedDmd?.iddemande,
      decision: this.validForm.value.decision,
      comment:
        this.validForm.value.decision !== 'accepter'
          ? this.validForm.value.comment
          : null,
      motif: this.validForm.value.motif,
    };

    // Appel backend
    if (payload.iddemande) {
      this.service.validationDemande(payload.iddemande, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadAllDemandes();
            this.toastr.success('Décision enrégistrée');
          } else {
            this.toastr.error('Erreur lors de la validation');
          }
        },
        error: (err) => {
          this.toastr.error(err.error.message);
        },
      });
    } else {
      this.toastr.error('Erreur lors de la selection de la demande');
    }
  }

  // afficher toutes les demandes
  loadAllDemandes() {
    this.loading = true;
    const params = {
      page: this.currentPage,
      limit: this.limit,
      search: '',
      date: '',
      status: '',
      user: this.user.idutilisateur,
    };
    this.service.getAllEntetes(params).subscribe({
      next: (res) => {
        if (res.success) {
          // this.entetesDmd = res.data.data;
          this.entetesDmd = res.data.data.map((item: any) => ({
            ...item,
          }));
          this.totalPages = res.data.totalPages;
          // Afficher les pj
          this.loadPiecesCountsForAllDemandes();
          this.loading = false;
        } else {
          this.loading = false;
          this.toastr.error('Erreur de récuperation des données');
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  openDetail(_object: any) {
    this.loadDetailsBudget(_object.iddemande);
  }

  //Recharger les details budget de la demande
  loadDetailsBudget(iddemande: string) {
    this.service.get_detailBudget(iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.detailBudgets = res.data;
          this.demandeMontant = this.getTotalBydemande(
            this.detailBudgets?.iddemande,
          );
        } else {
          this.toastr.error("Cette demande n'a pas de detail budget");
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
      },
    });
  }

  prepareValidation(item: any) {
    this.validateurs = []; // reset
    this.service.get_validateurs(item.iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.canValidateUser = res.data.some(
            (v: any) => v.idutilisateur === this.user.idutilisateur,
          );
        } else {
          this.canValidateUser = false;
        }
      },
      error: () => {
        this.canValidateUser = false;
        item._validationLoaded = true;
        item.canValidateUser = false;
      },
    });
  }

  getMontantAffiche(montant: any): number {
    const total = montant;
    return total === 0 || total == null ? this.demandeMontant : total;
  }

  isValidateur(): boolean {
    return this.validateurs.some(
      (u) =>
        u.idutilisateur === this.user.idutilisateur &&
        u.decision === 'en attente',
    );
  }

  isRejected(): boolean {
    return this.validateurs.some((u) => u.decision === 'rejete');
  }

  // Recharger toutes les demandes a valider par l'utilisateur
  loadDemandeAvalide() {
    this.service.avalider(this.user.idutilisateur).subscribe({
      next: (res) => {
        if (res.success) {
          this.demandesValide = res.data;
        } else {
          this.toastr.error('Aucune demande a valider');
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
      },
    });
  }

  openValidateur(_object: any) {
    this.validateurs = []; // reset
    this.loadValidateurs(_object);
  }

  //Recharger tous les validateurs d'une demande
  loadValidateurs(demande: any) {
    this.service.get_validateurs(demande.iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.validateurs = res.data;
        } else {
          this.canValidateUser = false;
          this.toastr.error("Cette demande n'a pas de validateur");
        }
      },
      error: (err) => {
        this.canValidateUser = false;
        this.toastr.error(err.error.message);
      },
    });
  }

  //Ouverture
  openValidationModal(demande: any) {
    this.validForm.reset();
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

  getTotalBydemande(iddemande: string) {
    const d = this.entetesDmd.find(
      (c: EnteteDemande) => c.iddemande === iddemande,
    );

    if (!d) {
      return 0;
    }

    return this.getTotalDemande(d);
  }

  getTotalAny(element: any): number {
    return element.details.reduce(
      (sum: number, l: any) => sum + l.montant_demande,
      0,
    );
  }

  //selectionner une instance dans une liste
  handleSelectOne(demande: EnteteDemande, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.iddemande == demande.iddemande,
    );
    if (index == -1 && actif) this.objectsSelected.push(demande);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.demandes?.length;
  }

  modalDelete(item: EnteteDemande) {
    this.deleteDemande = item;
  }

  deleteConfirmed() {
    if (!this.deleteDemande) return;
    this.service.deleteEntete(this.deleteDemande.iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.deleteDemande = null;
          this.closeModal('deleteOrder');
          this.toastr.error('Demande supprimée avec succès');
        } else {
          this.error = 'Erreur de Suppression';
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Suppression échec';
        this.loading = false;
        this.toastr.error(this.error + '\n', err.error.message);
      },
    });
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant ?? 0);
  }

  // Récupère le nombre de pièces jointes (avec cache)
  getPiecesCount(iddemande: string): number {
    return this.piecesCountMap.get(iddemande) || 0;
  }

  modalPJVisible = false;
  // Ouvre le modal des pièces jointes
  openPiecesJointesModal(demande: EnteteDemande): void {
    this.selectedDemandePJ = demande;
    this.selectedFiles = [];
    this.loadPiecesJointes(demande.iddemande);
    this.modalPJVisible = true;
    document.body.style.overflow = 'hidden'; // Empêche le scroll
  }

  closePiecesJointesModal(): void {
    this.modalPJVisible = false;
    this.selectedDemandePJ = null;
    this.piecesJointes = [];
    this.selectedFiles = [];
    this.pjUploading = false;
    this.pjDeleting = null;
    document.body.style.overflow = ''; // Restaure le scroll
  }

  // Charge les pièces jointes d'une demande
  loadPiecesJointes(iddemande: string): void {
    this.piecesJointesLoading = true;
    this.pjService.getAll(iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.piecesJointes = res.data;
          this.piecesCountMap.set(iddemande, this.piecesJointes.length);
        } else {
          this.piecesJointes = [];
        }
        this.piecesJointesLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement PJ:', err);
        this.piecesJointes = [];
        this.piecesJointesLoading = false;
        this.toastr.error('Erreur lors du chargement des pièces jointes');
      },
    });
  }

  // Sélection des fichiers
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  // Supprime un fichier de la liste de sélection
  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  // Upload des fichiers
  uploadPieces(): void {
    if (!this.selectedDemandePJ || this.selectedFiles.length === 0) return;

    this.pjUploading = true;
    const userId = this.user.idutilisateur;

    this.pjService
      .create(this.selectedDemandePJ.iddemande, this.selectedFiles, userId)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success(
              `${res.data.length} fichier(s) uploadé(s) avec succès`,
            );
            this.selectedFiles = [];
            this.loadPiecesJointes(this.selectedDemandePJ!.iddemande);
          } else {
            this.toastr.error("Erreur lors de l'upload");
          }
          this.pjUploading = false;
        },
        error: (err) => {
          console.error('Erreur upload:', err);
          this.toastr.error(err.error?.message || "Erreur lors de l'upload");
          this.pjUploading = false;
        },
      });
  }

  // Téléchargement d'un fichier
  downloadPiece(piece: PieceJointe): void {
    this.pjService.downloadFile(piece.urlpiece).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = piece.nomfichier;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Téléchargement démarré');
      },
      error: (err) => {
        console.error('Erreur téléchargement:', err);
        this.toastr.error('Erreur lors du téléchargement');
      },
    });
  }

  // Suppression d'un fichier
  deletePiece(piece: PieceJointe): void {
    if (!confirm(`Supprimer "${piece.nomfichier}" ?`)) return;

    this.pjDeleting = piece.idpiecejointe;
    const userId = this.user.idutilisateur;

    this.pjService
      .delete(this.selectedDemandePJ!.iddemande, piece.idpiecejointe)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Fichier supprimé');
            this.loadPiecesJointes(this.selectedDemandePJ!.iddemande);
          } else {
            this.toastr.error('Erreur lors de la suppression');
          }
          this.pjDeleting = null;
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.toastr.error(
            err.error?.message || 'Erreur lors de la suppression',
          );
          this.pjDeleting = null;
        },
      });
  }

  // Formatage de la taille des fichiers
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Récupère l'icône selon le type MIME (version 100% sécurisée)
  getFileIcon(pj: any): string {
    // Essaie plusieurs possibilités
    let mimeType = pj?.mimeType || pj?.mimetype || pj?.MimeType || pj?.MIMETYPE;

    if (!mimeType || typeof mimeType !== 'string') {
      return 'ri-file-line text-secondary';
    }

    const mime = mimeType.toLowerCase();

    if (mime.includes('pdf')) return 'ri-file-pdf-line text-danger';
    if (mime.includes('word')) return 'ri-file-word-line text-primary';
    if (mime.includes('excel') || mime.includes('csv'))
      return 'ri-file-excel-line text-success';
    if (mime.includes('image')) return 'ri-profile-line text-warning';
    if (mime.includes('text')) return 'ri-file-text-line';
    if (
      mime.includes(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
    )
      return 'ri-file-excel-line text-success';

    return 'ri-file-line text-secondary';
  }
}