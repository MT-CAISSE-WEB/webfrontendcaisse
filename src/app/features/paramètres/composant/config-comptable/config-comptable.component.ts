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
      error: () => {
        this.toastr.error('Erreur lors de la mise à jour');
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

  importCorrespondances() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv'; // formats acceptés
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          let data: any[];

          if (file.name.endsWith('.json')) {
            data = JSON.parse(e.target.result);
          } else if (file.name.endsWith('.csv')) {
            // Conversion CSV -> tableau (exemple basique, améliorez selon votre format)
            const lines = e.target.result
              .split('\n')
              .filter((l: string) => l.trim() !== '');
            const headers = lines[0].split(','); // suppose que la première ligne contient les noms de colonnes
            data = lines.slice(1).map((line: string) => {
              const values = line.split(',');
              const obj: any = {};
              headers.forEach((h: string, i: number) => {
                obj[h.trim()] = values[i]?.trim();
              });
              return obj;
            });
          } else {
            this.toastr.error(
              'Format de fichier non supporté. Utilisez JSON ou CSV.',
            );
            return;
          }

          if (Array.isArray(data) && data.length > 0) {
            this.serviceparametre.importCorrespondances(data).subscribe({
              next: () => {
                this.toastr.success('Correspondances importées avec succès');
                this.loadCorrespondances(); // recharge la liste
              },
              error: (err) => {
                this.toastr.error(
                  'Erreur lors de l’import des correspondances',
                );
                console.error(err);
              },
            });
          } else {
            this.toastr.error('Le fichier ne contient aucune donnée valide.');
          }
        } catch (err) {
          this.toastr.error('Erreur de lecture du fichier.');
          console.error(err);
        }
      };

      reader.readAsText(file);
    };
    input.click();
  }
}
