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
  // filteredDemandes: DemandeComplet[] = [];
  filteredDemandes: EnteteDemande[] = [];

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
        this.applyFilter(searchText ?? '');
      });

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('cette opération');
    this.titleMsg = TITLE_DELETE;
  }

  applyFilter(value: string) {
    this.currentPage = 1; // Réinitialiser à la page 1 après filtrage
    this.loadAllDemandes(); // Recharger avec le nouveau filtre
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

  totalItems: number = 0;
  // afficher toutes les demandes
  loadAllDemandes() {
    this.loading = true;
    const params = {
      page: this.currentPage,
      limit: this.limit,
      search: this.searchControl.value || '', // ✅ Inclure le filtre
      date: '',
      status: '',
      user: this.user.idutilisateur,
    };
    this.service.getAllEntetes(params).subscribe({
      next: (res) => {
        console.log('Résultat:', res);
        if (res.success) {
          this.entetesDmd = res.data.data.map((item: any) => ({ ...item }));
          this.filteredDemandes = [...this.entetesDmd]; // ✅ Pour le filtrage local

          // ✅ Utiliser les données du backend
          this.totalItems = res.data.total; // Nombre total d'éléments
          this.totalPages = res.data.totalPages; // Nombre total de pages

          this.loadPiecesCountsForAllDemandes();
          this.loading = false;
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
        this.loading = false;
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
    if (page < 1 || page > this.totalPages) return; // ✅ Vérification des limites
    this.currentPage = page;
    this.loadAllDemandes(); // ✅ Recharger les données pour la nouvelle page
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
          this.toastr.success('Demande supprimée avec succès');
          this.loadAllDemandes();
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

  // Télécharger tous les fichiers

  downloadAllFiles(): void {
    if (!this.selectedDemandePJ) {
      this.toastr.error('Aucun budget sélectionné');
      return;
    }

    const iddemande = this.selectedDemandePJ?.iddemande;

    if (!iddemande) {
      this.toastr.error('ID demande non trouvée');
      return;
    }

    this.loading = true;
    this.pjService.downloadAllFiles(iddemande).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extraire le nom du fichier des headers ou utiliser un nom par défaut
        const contentDisposition = blob.type;
        const filename = `demande_${this.selectedDemandePJ?.codedemande}_${this.selectedDemandePJ?.libelledemande}_pieces_jointes.zip`;

        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toastr.success('Téléchargement démarré');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur téléchargement ZIP:', err);
        this.toastr.error(err.error?.message);
        this.loading = false;
      },
    });
  }

  // ============================================
  // 🆕 PROPRIÉTÉS À AJOUTER
  // ============================================
  currentStatusFilter: string = 'ALL'; // Filtre actif par défaut
  isDragOver = false; // État du drag & drop
  // Dans ton composant, ajoute :
  allEntetesDmd: EnteteDemande[] = []; // Stock toutes les demandes (non filtrées)

  // ============================================
  // 🆕 MÉTHODES À AJOUTER
  // ============================================

  Math = Math; // Pour utiliser Math dans le template

  /**
   * Compte le nombre de demandes par statut
   */
  getCountByStatus(statut: number, decaisse?: boolean): number {
    if (decaisse !== undefined) {
      return this.entetesDmd.filter(
        (d) => d.statut === statut && d.decaisse === (decaisse ? 1 : 0),
      ).length;
    }
    return this.entetesDmd.filter((d) => d.statut === statut).length;
  }

  /**
   * Gestion du drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Gestion du drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Gestion du drop de fichiers
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      // Filtrer par extension et taille
      const allowedExtensions = [
        '.pdf',
        '.jpg',
        '.jpeg',
        '.png',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.csv',
      ];
      const validFiles = newFiles.filter((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedExtensions.includes(ext) && file.size <= 10 * 1024 * 1024; // 10MB
      });
      this.selectedFiles.push(...validFiles);
    }
  }

  /**
   * Génère les numéros de page pour la pagination
   * @returns Tableau de numéros de page (avec -1 pour les ellipsis)
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5; // Nombre max de pages visibles
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    // Ajuster si pas assez de pages à la fin
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    // Ajouter la première page et ellipsis si nécessaire
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push(-1); // -1 = ellipsis
    }

    // Ajouter les pages centrales
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Ajouter la dernière page et ellipsis si nécessaire
    if (end < this.totalPages) {
      if (end < this.totalPages - 1) pages.push(-1); // ellipsis
      pages.push(this.totalPages);
    }

    return pages;
  }

  /**
   * Récupère la classe CSS pour le statut de validation
   * @param decision Statut de la validation (ex: "accepter", "refuser", "complement")
   * @returns Objet avec la classe CSS à appliquer
   */
  getStatusInfo(decision: string): { class: string } {
    switch (decision?.toLowerCase()) {
      case 'approuve':
      case 'validé':
      case 'accepter':
        return { class: 'status-oui' };
      case 'revoir':
      case 'complement':
        return { class: 'status-warning' };
      case 'rejete':
      case 'refuser':
        return { class: 'status-non' };
      default:
        return { class: 'status-encours' }; // "en attente" ou autre
    }
  }

  /**
   * Récupère le libellé du statut de validation
   * @param decision Statut de la validation
   * @returns Libellé à afficher (ex: "Validé", "Rejeté")
   */
  getStatusLabel(decision: string): string {
    switch (decision?.toLowerCase()) {
      case 'approuve':
      case 'validé':
        return 'Validé';
      case 'revoir':
        return 'Complément';
      case 'complement':
        return "Complément d'info";
      case 'rejete':
      case 'refuser':
        return 'Rejeté';
      case 'en attente':
        return 'En attente';
      default:
        return decision || 'Inconnu';
    }
  }

  /**
   * Récupère la classe CSS pour le statut de la demande
   * @param statut Statut numérique (0, 1, 2, 3, 4)
   * @param decaisse 0=Non payée, 1=Payée
   * @returns Classe CSS (ex: "status-oui", "status-non", "status-encours", "status-warning")
   */
  getDemandeStatusClass(
    statut: number | null | undefined,
    decaisse: number | null | undefined,
  ): string {
    if (statut === 0) return 'status-enattente'; // Non validé
    if (statut === 1) return 'status-encours'; // En cours
    if (statut === 2) return 'status-warning'; // À revoir
    if (statut === 3 && decaisse === 0) return 'status-oui'; // Validée (non payée)
    if (statut === 3 && decaisse === 1) return 'status-payee'; // Payée
    if (statut === 4) return 'status-non'; // Rejetée
    return 'status-enattente'; // Par défaut
  }

  /**
   * Récupère le libellé du statut de la demande
   * @param statut Statut numérique (0, 1, 2, 3, 4)
   * @param decaisse 0=Non payée, 1=Payée
   * @returns Libellé (ex: "Validée", "Payée", "Rejetée")
   */
  getDemandeStatusLabel(
    statut: number | null | undefined,
    decaisse: number | null | undefined,
  ): string {
    if (statut === 0) return 'En attente';
    if (statut === 1) return 'En cours';
    if (statut === 2) return 'À revoir';
    if (statut === 3 && decaisse === 0) return 'Validée';
    if (statut === 3 && decaisse === 1) return 'Payée';
    if (statut === 4) return 'Rejetée';
    return 'Inconnu';
  }

  // Et modifier aussi la pagination pour utiliser filteredDemandes

  get paginatedDemandes(): EnteteDemande[] {
    const start = (this.currentPage - 1) * this.limit;
    const end = start + this.limit;
    return this.filteredDemandes.slice(start, end);
  }
}
