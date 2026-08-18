import { Component, OnInit } from '@angular/core';
import { journalModel } from '../../../caisse_journal/models/journal.model';
import { plancomptableModel } from '../../../donnee_base/models/plancomptable.model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { JournalService } from '../../../caisse_journal/services/journal.service';
import { ParametreComptableService } from '../../services/parametrecomptable.service';
import { PlancomptableService } from '../../../donnee_base/services/plancomptable.service';
import { Correspondance } from '../../models/parametrecomptable.model';
import { centreanalytiqueModel } from '../../../donnee_base/models/centreanalytique.model';
import { CentreAnalytiqueService } from '../../../donnee_base/services/centreanalytique.service';

@Component({
  selector: 'app-config-comptable',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './config-comptable.component.html',
  styleUrl: './config-comptable.component.css',
})
export class ConfigComptableComponent implements OnInit {
  // Données
  params: any = {};
  journaux: journalModel[] = [];
  comptes: plancomptableModel[] = [];
  centres: centreanalytiqueModel[] = [];
  correspondances: any[] = [];

  // États des switches
  axeSecondEnabled = false;
  entiteSiteEnabled = false;
  correspondanceEnabled = false;

  // Nouveaux champs Axes
  libelleAxe1: string = '';
  libelleAxe2: string = '';

  // Autres propriétés
  loading = false;
  loadingComptable = false;
  error = '';
  msgErros = '';
  checkAllRow: any;

  // Formulaire principal
  paramForm: FormGroup;
  currentParam: any;

  // Formulaire pour les correspondances
  showForm = false;
  isEditing = false;
  currentCorrespondance: any = {
    idcentreanalytique: '',
    centreAnalytique: '',
    correspondance: '',
    idcorrespondance: '',
  };
  editingId: string | null = null;
  centreError = '';

  // --- Pagination des correspondances ---
  pageSize = 7;
  currentPageCorrespondance = 1;
  totalPagesCorrespondance = 0;
  paginatedCorrespondances: any[] = [];

  constructor(
    private toastr: ToastrService,
    private journalservice: JournalService,
    private centreanalytiqueservice: CentreAnalytiqueService,
    private plancomptableservice: PlancomptableService,
    private serviceparametre: ParametreComptableService,
    private fb: FormBuilder,
  ) {
    this.paramForm = this.fb.group({
      societe: [this.user.idsociete],
      journal: [''],
      compteintermediaire: [''],
      url: [''],
    });
  }

  ngOnInit(): void {
    this.getAllJournaux();
    this.getAllComptes();
    this.getAllcentres();
    this.getParam();
    this.loadCorrespondances();
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // ---------- Chargement des données ----------
  getAllJournaux() {
    this.loading = true;
    const params = { page: 1, limit: 50, search: '' };
    this.journalservice.getAll(params).subscribe({
      next: (res: any) => {
        if (res.success) this.journaux = res.data.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Erreur lors du chargement des journaux');
      },
    });
  }

  getAllComptes() {
    this.plancomptableservice.getAll().subscribe({
      next: (res) => {
        if (res.success) this.comptes = res.data;
      },
      error: () => this.toastr.error('Erreur lors du chargement des comptes'),
    });
  }

  getAllcentres() {
    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) this.centres = res.data;
      },
      error: () =>
        this.toastr.error('Erreur lors du chargement des centres analytiques'),
    });
  }

  // ---------- Paramètres généraux ----------
  getParam() {
    const payload = { societe: this.user.idsociete };
    this.serviceparametre.getAll(payload).subscribe({
      next: (res: any) => {
        if (res.success && res.data.length) {
          this.currentParam = res.data[0];

          this.entiteSiteEnabled = this.currentParam.analytiquesite === 1;
          this.correspondanceEnabled = this.currentParam.analytiquetable === 1;
          this.axeSecondEnabled = this.currentParam.axesecond === 1;

          // Initialisation des libellés d'axes (si existants dans l'API)
          this.libelleAxe1 = this.currentParam.libelleaxe1 || '';
          this.libelleAxe2 = this.currentParam.libelleaxe2 || '';

          this.paramForm.patchValue({
            journal: this.currentParam.journal?.id || '',
            compteintermediaire: this.currentParam.compte?.id || '',
            url: this.currentParam.url || '',
          });
        }
      },
      error: () =>
        this.toastr.error('Erreur lors du chargement des paramètres'),
    });
  }

  editParam(type: string) {
    const value = this.paramForm.get(type)?.value;
    if (!value) {
      this.toastr.warning(
        "Configuration inexistante. Contactez l'administrateur.",
      );
      return;
    }
    const payload = {
      societe: this.user.idsociete,
      type,
      value,
    };
    this.serviceparametre.save(payload).subscribe({
      next: (res: any) => {
        if (res.success) this.toastr.success('Paramètre enregistré');
      },
      error: () => this.toastr.error("Erreur lors de l'enregistrement"),
    });
  }

  // ---------- Nouvelle méthode : sauvegarde des libellés d'axes ----------
  saveAxisLabels() {
    const data = {
      societe: this.user.idsociete,
      libelleaxe1: this.libelleAxe1,
      libelleaxe2: this.libelleAxe2,
    };
    this.serviceparametre.saveAxisLabels(data).subscribe({
      next: () => {
        this.toastr.success('Libellés des axes enregistrés');
      },
      error: () => {
        this.toastr.error("Erreur lors de l'enregistrement des axes");
      },
    });
  }

  // ---------- Gestion de l'axe second ----------
  toggleAxeSecond() {
    const data = {
      societe: this.user.idsociete,
      axesecond: this.axeSecondEnabled ? 1 : 0,
    };
    this.serviceparametre.saveAxeSecond(data).subscribe({
      next: () => {
        this.toastr.success('Axe second mis à jour');
        if (!this.axeSecondEnabled) {
          this.entiteSiteEnabled = false;
          this.correspondanceEnabled = false;
          this.updateEntiteSite(false);
          this.updateCorrespondanceTable(false);
        }
      },
      error: () => {
        this.toastr.error('Erreur lors de la mise à jour');
        this.axeSecondEnabled = !this.axeSecondEnabled;
      },
    });
  }

  // ---------- Gestion de l'entité site ----------
  onEntiteSiteChange() {
    if (this.entiteSiteEnabled && this.correspondanceEnabled) {
      this.correspondanceEnabled = false;
      this.updateCorrespondanceTable(false);
    }
    this.updateEntiteSite(this.entiteSiteEnabled);
  }

  private updateEntiteSite(value: boolean) {
    const data = {
      societe: this.user.idsociete,
      entite: value ? 1 : 0,
    };
    this.serviceparametre.saveAnalytiqueEntiteSite(data).subscribe({
      next: () => {
        this.toastr.success('Paramètre entité site mis à jour');
      },
      error: () => {
        this.toastr.error('Erreur lors de la mise à jour');
        this.entiteSiteEnabled = !value;
      },
    });
  }

  // ---------- Gestion de la table de correspondance ----------
  onCorrespondanceToggle() {
    if (this.correspondanceEnabled && this.entiteSiteEnabled) {
      this.entiteSiteEnabled = false;
      this.updateEntiteSite(false);
    }
    this.updateCorrespondanceTable(this.correspondanceEnabled);
    if (this.correspondanceEnabled) {
      this.loadCorrespondances();
    }
  }

  private updateCorrespondanceTable(value: boolean) {
    const data = {
      societe: this.user.idsociete,
      table: value ? 1 : 0,
    };
    this.serviceparametre.saveAnalytiqueTable(data).subscribe({
      next: () => {
        this.toastr.success('Paramètre table de correspondance mis à jour');
      },
      error: (err) => {
        console.log('Erreur de mise à jour', err.error.message);
        const message = err.error.message || 'Erreur lors de la mise à jour';
        this.toastr.error(message);
        this.correspondanceEnabled = !value;
      },
    });
  }

  // ---------- CRUD correspondances ----------
  loadCorrespondances() {
    this.loadingComptable = true;
    this.serviceparametre.getCorrespondances().subscribe({
      next: (res: any) => {
        if (res.success) this.correspondances = res.data;
        this.loadingComptable = false;
        this.updatePagination(); // ← ici
      },
      error: () => {
        this.toastr.error('Erreur chargement des correspondances');
        this.loadingComptable = false;
      },
    });
  }

  openAddForm() {
    this.isEditing = false;
    this.showForm = true;
    this.currentCorrespondance = {
      idcorrespondance: '',
      centreAnalytique: '',
      correspondance: '',
    };
    this.centreError = '';
  }

  addCorrespondance() {
    const { idcentreanalytique, correspondance } = this.currentCorrespondance;
    this.serviceparametre
      .addCorrespondance({ idcentreanalytique, correspondance })
      .subscribe({
        next: (newItem) => {
          this.correspondances.push(newItem);
          this.toastr.success('Correspondance ajoutée');
          this.loadCorrespondances();
          this.resetForm();
        },
        error: (err) => {
          if (err.status === 409) {
            this.centreError =
              'Ce centre analytique a déjà une correspondance.';
          } else {
            this.toastr.error("Erreur lors de l'ajout", err.error.message);
          }
        },
      });
  }

  editCorrespondance(item: Correspondance) {
    this.isEditing = true;
    this.editingId = item.idcorrespondance!;
    this.currentCorrespondance = { ...item };
    this.showForm = true;
    this.centreError = '';
  }

  updateCorrespondance() {
    const { idcentreanalytique, correspondance } = this.currentCorrespondance;
    this.serviceparametre
      .updateCorrespondance(this.editingId!, {
        idcentreanalytique,
        correspondance,
      })
      .subscribe({
        next: (updated) => {
          const index = this.correspondances.findIndex(
            (c) => c.idcorrespondance === updated.idcorrespondance,
          );
          if (index !== -1) this.correspondances[index] = updated;
          this.toastr.success('Correspondance modifiée');
          this.loadCorrespondances();
          this.resetForm();
        },
        error: (err) => {
          if (err.status === 409) {
            this.centreError =
              'Ce centre analytique a déjà une correspondance.';
          } else {
            this.toastr.error('Erreur lors de la modification');
          }
        },
      });
  }

  deleteCorrespondance(id: string) {
    this.serviceparametre.deleteCorrespondance(id).subscribe({
      next: () => {
        this.correspondances = this.correspondances.filter(
          (c) => c.idcorrespondance !== id,
        );
        this.toastr.success('Correspondance supprimée');
        this.loadCorrespondances();
      },
      error: () => this.toastr.error('Erreur lors de la suppression'),
    });
  }

  resetForm() {
    this.currentCorrespondance = {
      idcorrespondance: '',
      centreAnalytique: '',
      correspondance: '',
    };
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.centreError = '';
  }

  cancelForm() {
    this.resetForm();
  }

  desactiverTout() {
    // Désactiver les trois switches localement
    this.axeSecondEnabled = false;
    this.entiteSiteEnabled = false;
    this.correspondanceEnabled = false;

    // Appeler les services pour persister la désactivation
    // 1. Désactiver l'axe second
    const dataAxe = {
      societe: this.user.idsociete,
      axesecond: 0,
    };
    this.serviceparametre.saveAxeSecond(dataAxe).subscribe({
      next: () => {
        this.toastr.success('Axe second désactivé');
      },
      error: () => {
        this.toastr.error("Erreur lors de la désactivation de l'axe second");
        // Rollback de l'état local si l'API échoue
        this.axeSecondEnabled = true;
      },
    });

    // 2. Désactiver l'analytique rattaché au site
    this.updateEntiteSite(false);

    // 3. Désactiver la table de correspondance
    this.updateCorrespondanceTable(false);
  }

  updatePagination() {
    this.totalPagesCorrespondance = Math.ceil(
      this.correspondances.length / this.pageSize,
    );
    if (this.currentPageCorrespondance > this.totalPagesCorrespondance) {
      this.currentPageCorrespondance = this.totalPagesCorrespondance || 1;
    }
    const start = (this.currentPageCorrespondance - 1) * this.pageSize;
    this.paginatedCorrespondances = this.correspondances.slice(
      start,
      start + this.pageSize,
    );
  }

  changeCorrespondancePage(page: number) {
    if (page < 1 || page > this.totalPagesCorrespondance) return;
    this.currentPageCorrespondance = page;
    this.updatePagination();
  }

  selectedFile: File | null = null;
  fileName: string = '';
  isDragging: boolean = false;
  isImporting: boolean = false;
  importProgress: number = 0;
  showImportResults: boolean = false;
  importResult: any = null;
  showImportDetails: boolean = false;
  isImportModalOpen: boolean = false;

  /**
   * Ouvre la modale d'import
   */
  openImportModal(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.showImportResults = false;
    this.importResult = null;
    this.showImportDetails = false;
    this.isImportModalOpen = true; // Ouvre la modal
    document.body.classList.add('modal-open'); // Empêche le scroll du body
  }

  /**
   * Ferme la modale d'import
   */
  closeImportModal(): void {
    this.isImportModalOpen = false; // Ferme la modal
    document.body.classList.remove('modal-open');
    // Réinitialise les données
    this.selectedFile = null;
    this.fileName = '';
    this.showImportResults = false;
    this.importResult = null;
    this.isImporting = false;
    this.importProgress = 0;
  }

  // ========== DRAG & DROP ==========

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    input.value = '';
  }

  private handleFile(file: File): void {
    // Vérifier l'extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv') {
      this.toastr.error('Veuillez sélectionner un fichier CSV valide');
      return;
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastr.error('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.showImportResults = false;
    this.importResult = null;
    this.toastr.success('Fichier sélectionné avec succès');
  }

  // ========== IMPORT ==========

  importFile(): void {
    if (!this.selectedFile) {
      this.toastr.warning('Veuillez sélectionner un fichier');
      return;
    }

    this.isImporting = true;
    this.importProgress = 0;
    this.showImportResults = false;

    // Simulation de progression
    const interval = setInterval(() => {
      if (this.importProgress < 90) {
        this.importProgress += 10;
      }
    }, 300);

    this.serviceparametre
      .importCorrespondancesFromCsv(this.selectedFile)
      .subscribe({
        next: (response) => {
          clearInterval(interval);
          this.importProgress = 100;
          this.importResult = response;
          this.showImportResults = true;
          this.isImporting = false;

          if (response.success) {
            console.log('Import réussi', this.importResult.data);
            if (this.importResult.data.erreurs === 0) {
              this.toastr.success(
                `${response.data.importees} correspondances importées sur ${response.data.totalLignes}`,
                'Import terminé',
              );
            } else {
              this.toastr.warning(
                `${response.data.importees} correspondances importées sur ${response.data.totalLignes}`,
                'Import terminé',
              );
            }

            // Recharger les correspondances si nécessaire
            this.loadCorrespondances();
          } else {
            this.toastr.warning(
              `${response.data.importees} importées, ${response.data.erreurs} erreurs`,
              'Import partiel',
            );
          }
        },
        error: (error) => {
          clearInterval(interval);
          this.importProgress = 0;
          this.isImporting = false;
          this.toastr.error(error.error?.message || "Erreur lors de l'import");
        },
      });
  }

  // ========== TEMPLATE ==========

  downloadTemplate(): void {
    const headers = 'codecentreanalytique;correspondance\n';
    const examples = 'C001;CODE001;\nC002;CODE002\n';
    const content = headers + examples;

    const blob = new Blob(['\uFEFF' + content], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_correspondances.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' octets';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
