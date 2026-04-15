import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { LigneBudgetModel } from '../models/ligne_budget.model';
import { LigneBudgetService } from '../services/ligne_budget.service';
import { BudgetModel } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';
import { departementservice } from '../../structure/service/departement.service';
import { departementmodel } from '../../structure/model/departement.model';
import { AffectationDepartementNatureService } from '../../donnee_base/services/affectationdepartementnature.service';
import { affectationdepartementnatureModel } from '../../donnee_base/models/affectationdepartementnature.model';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';
import { utilisateurdepartementservice } from '../../administration/service/userdepartement.service';
import { MotifService } from '../services/motif.service';
import { Motif } from '../models/motif.model';
import { ValidateursBudget } from '../models/validateursbudget.model';
import { ToastrService } from 'ngx-toastr';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';

@Component({
  selector: 'app-ligne-budget',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ligne-budget.component.html',
  styleUrl: './ligne-budget.component.css',
})
export class LigneBudgetComponent implements OnInit {
  title = 'Lignes du budget';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  ligneBudgets: LigneBudgetModel[] = [];
  ligneBudgetsGrouped: Array<{
    budget: BudgetModel;
    lignes: LigneBudgetModel[];
  }> = [];
  budgets: BudgetModel[] = [];
  departements: departementmodel[] = [];
  appartenanceDepartement: departementmodel[] = [];
  ligneBudget: LigneBudgetModel = new LigneBudgetModel();
  msgErros: string = '';
  loading: Boolean = false;
  ligneBudgetForm: FormGroup = this.fb.group({});

  availableNatures: any[] = [];
  motifs: Motif[] = [];
  centreAnalytiques: centreanalytiqueModel[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  totalPages: number = 0;
  totalItems: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected: LigneBudgetModel[] = [];
  selectedItems: { [id: string]: boolean } = {};
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow: any;
  error: string = '';

  //Changement titre modal
  actionModal: string = 'create';
  showRejectComment = false;
  rejectComment = '';
  rejectForm!: FormGroup;

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  //Element à supprimer
  deleteLigneBudget: any = null;

  searchCtrl = new FormControl('');
  ligneBudgetsSource: LigneBudgetModel[] = [];

  // savoir l'entité du budget
  selectedBudget?: BudgetModel;
  selectedDept?: departementmodel;

  // MODE DE SAISIE
  modeSaisie = '';
  // Gestion progressive des natures
  allNatures: Array<{
    idnature: string;
    libelle: string;
    iddepartement: string;
  }> = [];
  currentNatureIndex: number = 0;
  validationLines: Array<{
    departement: string;
    code: string;
    nature: string;
    centre: string;
    montantDept: number;
    montantSite: number;
    montantSociete: number;
  }> = [];

  constructor(
    private lignebudgetservice: LigneBudgetService,
    private budgetservice: BudgetService,
    private departementservice: departementservice,
    private affectationService: AffectationDepartementNatureService,
    private utilisateurdepartementservice: utilisateurdepartementservice,
    private motifservice: MotifService,
    private toastr: ToastrService,
    private router: Router,
    private centreAnalytiqueService: CentreAnalytiqueService,
  ) {}

  ngOnInit(): void {
    //Afficher toutes les lignes budgétaires

    this.ligneBudgetsGrouped = [];
    // A l'affichage de l'inteface la table est vide
    this.paginatedLignes = null;
    this.selectedBudgetId = null;
    this.getAllBudgets();
    this.getAllDepartements();
    this.getAllLigneBudgets();
    this.getUserDepartement();
    this.getAllMotifs();
    this.getAllCentreAnalytique();

    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('cette ligne budgétaire');
    this.titleMsg = TITLE_DELETE;

    this.rejectForm = this.fb.group({
      motif: [null, Validators.required],
    });
  }

  naturesSource: Array<{
    idnature: string;
    libelle: string;
    iddepartement: string;
  }> = [];

  natureGrid: Array<{
    idnature: string | null;
    libelle: string;

    // ID de la ligne budgétaire existante (si présente)
    idbudgetdepartementnature?: string;
    idcentreanalytique?: string | null;
    iddepartement?: string | null;
    codecentreanalytique?: string | null;
    montantDept: number;
    montantSite: number;
    montantSociete: number;
  }> = [];

  validateursBudget: ValidateursBudget[] = [];

  // Vérification si budget isanalytique
  isAnalytique(): boolean {
    return this.selectedBudget?.isanalytique === 1;
  }

  budget?: BudgetModel;

  //

  loadCentreAnalytiqueGrid() {
    if (!this.selectedBudget) return;

    const existingLines = this.ligneBudgetsSource.filter(
      (l) => l.idbudget === this.selectedBudget!.idbudget,
    );

    if (this.modeSaisie === 'ALL') {
      this.natureGrid = this.centreAnalytiques.map((c) => {
        const existing = existingLines.find(
          (l) => l.idcentreanalytique === c.idcentreanalytique,
        );

        return {
          idnature: null,
          idcentreanalytique: c.idcentreanalytique,
          libelle: c.libelle,
          idbudgetdepartementnature: existing?.idbudgetdepartementnature,
          codecentreanalytique: c.codecentreanalytique,

          montantDept: existing?.montantprevisiondept ?? 0,
          montantSite: existing?.montantprevisionsite ?? 0,
          montantSociete: existing?.montantprevisionsociete ?? 0,
        };
      });

      return;
    }

    // MODE STEP
    const usedIds = new Set(existingLines.map((l) => l.idcentreanalytique));

    this.natureGrid = existingLines.map((l) => ({
      idnature: null,
      idcentreanalytique: l.idcentreanalytique,
      iddepartement: null,
      libelle: this.centreAnalytiques.find(
        (c) => c.idcentreanalytique === l.idcentreanalytique,
      )?.libelle as string,

      idbudgetdepartementnature: l.idbudgetdepartementnature,
      codecentreanalytique: l.centre_analytique?.codecentreanalytique,

      montantDept: l.montantprevisiondept ?? 0,
      montantSite: l.montantprevisionsite ?? 0,
      montantSociete: l.montantprevisionsociete ?? 0,
    }));

    this.availableNatures = this.centreAnalytiques
      .filter((c) => !usedIds.has(c.idcentreanalytique))
      .map((c) => ({
        idcentreanalytique: c.idcentreanalytique, // ⚠️ on réutilise le champ
        codecentreanalytique: c.codecentreanalytique,
        libelle: c.libelle,
        iddepartement: '',
      }));
  }
  getAllCentreAnalytique() {
    this.centreAnalytiqueService.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.centreAnalytiques = res.data as centreanalytiqueModel[];
        }
      },
      error: (err) => {
        console.error('Erreur récupération motifs', err);
        this.msgErros = err.error.error;
      },
    });
  }

  isDeptReadonly(): boolean {
    return true; // toujours grisé
  }

  isSiteReadonly(): boolean {
    if (!this.selectedBudget) return true;

    // Utilisateur SITE peut saisir tant que site non validé
    return !(
      this.user.typeentitesite === 1 && this.selectedBudget.validesite !== 1
    );
  }

  isSocieteReadonly(): boolean {
    if (!this.selectedBudget) return true;

    // Utilisateur SOCIETE peut saisir seulement si site validé
    return !(
      this.user.typeentitesociete === 1 && this.selectedBudget.validesite === 1
    );
  }

  motifOfBudgetRejected?: string;

  getMotifLibelle(id: string) {
    this.motifOfBudgetRejected = this.motifs.find(
      (m) => m.idmotif === id,
    )?.libellemotif;
  }

  // Obtenir la liste de tous les motifs
  getAllMotifs() {
    this.params = { page: 1, limit: 1000 };

    this.motifservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.motifs = res.data.data as Motif[];
        }
      },
      error: (err) => {
        console.error('Erreur récupération motifs', err);
        this.msgErros = err.error.error;
      },
    });
  }

  // Obtenir tous les validateurs du budget
  getAllValidateursBudget(idbudget: string) {
    this.budgetservice.getValidateursBudget(idbudget).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.validateursBudget = res.data as ValidateursBudget[];
          this.getMotifLibelle(
            this.validateursBudget.find((v) => v.decision === 'rejete')
              ?.idmotif as string,
          );
        }
      },
      error: (err) => {
        console.error('Erreur récupération des validateurs du budget', err);
        this.msgErros = err.error.error;
      },
    });
  }

  // Obtenir la liste de tous les budgets
  getAllBudgets() {
    this.params = { page: 1, limit: 1000 };

    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          const lesbudgets = res.data as BudgetModel[];
          if (this.user.typeentitesociete === 1) {
            this.budgets = lesbudgets.filter(
              (b) => b.idsociete === this.user.idsociete && b.valide === 0,
            );
          } else {
            this.budgets = lesbudgets.filter(
              (b) =>
                b.idsite === this.user.idsite &&
                b.idsociete === this.user.idsociete &&
                b.valide === 0,
            );
          }
        }
      },
      error: (err) => {
        console.error('Erreur récupération budgets', err);
        this.msgErros = err.error.error;
      },
    });
  }

  //
  isValidateur(): boolean {
    return this.validateursBudget.some(
      (u) =>
        u.idutilisateur === this.user.idutilisateur &&
        u.decision === 'en attente',
    );
  }

  isRejected(): boolean {
    return this.validateursBudget.some((u) => u.decision === 'rejete');
  }

  groupLigneBudgetsByBudget() {
    const map = new Map<
      string,
      { budget: BudgetModel; lignes: LigneBudgetModel[] }
    >();

    for (const ligne of this.ligneBudgets) {
      if (!ligne.budget) continue;

      const idBudget = ligne.budget.idbudget;

      if (!map.has(idBudget)) {
        map.set(idBudget, {
          budget: ligne.budget,
          lignes: [],
        });
      }

      map.get(idBudget)!.lignes.push(ligne);
    }

    this.ligneBudgetsGrouped = Array.from(map.values());
  }

  // Obtenir les départements
  getAllDepartements() {
    this.departementservice.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.departements = res.data;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  getUserDepartement() {
    this.utilisateurdepartementservice
      .getutilisateurdepartement(this.user.idutilisateur)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const userDepartements: any[] = res.data[0];

            const allowedIds = new Set(
              userDepartements.map((item) => item.iddepartement),
            );
            // Filtrage du tableau complet
            const filteredDepartments = this.departements.filter((dept) =>
              allowedIds.has(dept.iddepartement),
            );
            this.appartenanceDepartement = filteredDepartments;
          }
        },
        error: (err: any) => {
          this.msgErros = err.error.error;
        },
      });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // onSelectionDepartementChange(event: Event) {
  //   const id = (event.target as HTMLSelectElement).value;
  //   this.selectedDept = this.departements.find((d) => d.iddepartement === id);
  // }

  onSelectionDepartementChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;

    // 1. Département sélectionné
    this.selectedDept = this.departements.find((d) => d.iddepartement === id);

    if (!this.selectedDept) {
      this.resetNatureSaisie();
      return;
    }

    // 2. Synchroniser le formulaire (si utilisé ailleurs)
    this.ligneBudgetForm.patchValue({
      iddepartement: id,
    });

    // 3. Déclencher la logique métier centrale
    this.onDepartementChange();
  }

  private resetNatureSaisie() {
    this.allNatures = [];
    this.natureGrid = [];
    this.selectedNatureId = null;
    this.selectedCentreId = null;
  }

  onDepartementChange(event?: any) {
    const idDept = this.ligneBudgetForm.get('iddepartement')?.value;
    if (!idDept) return;

    // Charger les natures du département
    this.allNatures = this.naturesSource.filter(
      (n) => n.iddepartement === idDept,
    );

    // Reset
    this.natureGrid = [];
    this.selectedNatureId = null;
    this.selectedCentreId = null;

    // Mode ALL → on ajoute tout automatiquement
    if (this.modeSaisie === 'ALL') {
      this.allNatures.forEach((nature) => {
        this.addNatureToGrid(nature);
      });
    }
  }

  get naturesDisponibles() {
    return this.natureGrid;
  }

  addSelectedNature() {
    if (!this.isAnalytique() && !this.selectedNatureId) {
      return;
    }

    let index: number;
    if (this.isAnalytique()) {
      index = this.availableNatures.findIndex(
        (n) => n.idcentreanalytique === this.selectedCentreId,
      );
    } else {
      index = this.availableNatures.findIndex(
        (n) => n.idnature === this.selectedNatureId,
      );
    }

    if (index === -1) return;
    let ligne: any = {};

    const nature = this.availableNatures.splice(index, 1)[0];
    if (this.isAnalytique()) {
      ligne = {
        idcentreanalytique: nature.idcentreanalytique,
        libelle: nature.libelle,
        codecentreanalytique: nature.codecentreanalytique,
        iddepartement: null,
        montantDept: 0,
        montantSite: 0,
        montantSociete: 0,
      };
    } else {
      ligne = {
        idnature: nature.idnature,
        libelle: nature.libelle,
        iddepartement: nature.iddepartement,
        montantDept: 0,
        montantSite: 0,
        montantSociete: 0,
      };
    }
    this.natureGrid.push(ligne);

    this.selectedNatureId = null;
    this.selectedCentreId = null;
  }

  canValidateCurrentLine(): boolean {
    if (this.natureGrid.length === 0) return false;

    const line = this.natureGrid[this.natureGrid.length - 1];

    return (
      (line.montantDept ?? 0) > 0 ||
      (line.montantSite ?? 0) > 0 ||
      (line.montantSociete ?? 0) > 0
    );
  }

  validateCurrentStep() {
    if (!this.selectedBudget || !this.selectedDept) return;
    if (this.natureGrid.length === 0) return;

    const line = this.natureGrid[this.natureGrid.length - 1];

    const hasMontant =
      (line.montantDept ?? 0) > 0 ||
      (line.montantSite ?? 0) > 0 ||
      (line.montantSociete ?? 0) > 0;

    if (!hasMontant) return;

    const idBudget = this.selectedBudget.idbudget;
    const idDept = this.selectedDept.iddepartement;

    // 1️⃣ Mise à jour de la source
    this.ligneBudgetsSource.push({
      idbudget: idBudget,
      iddepartement: idDept,
      idnature: line.idnature,
      montantprevisiondept: line.montantDept,
      montantprevisionsite: line.montantSite,
      montantprevisionsociete: line.montantSociete,
      nature_operation: { libelle: line.libelle },
    } as LigneBudgetModel);

    // 2️⃣ Passage en ALL SANS RECHARGER
    this.modeSaisie = 'ALL';

    // 3️⃣ Injection directe dans la vue
    this.natureGrid = [
      {
        idnature: line.idnature,
        libelle: line.libelle,
        montantDept: line.montantDept,
        montantSite: line.montantSite,
        montantSociete: line.montantSociete,
      },
    ];
  }

  private addNatureToGrid(nature: any) {
    const idDept = this.ligneBudgetForm.getRawValue().iddepartement;

    const ligne = {
      idnature: nature.idnature,
      libelle: nature.libelle,
      montantDept: 0,
      montantSite: 0,
      montantSociete: 0,
    } as any;

    const existing = this.ligneBudgetsSource.find(
      (l) =>
        l.idbudget === this.selectedBudget!.idbudget &&
        l.iddepartement === idDept &&
        l.idnature === nature.idnature,
    );

    if (existing) {
      ligne.idbudgetdepartementnature = existing.idbudgetdepartementnature;
      ligne.montantDept = existing.montantprevisiondept ?? 0;
      ligne.montantSite = existing.montantprevisionsite ?? 0;
      ligne.montantSociete = existing.montantprevisionsociete ?? 0;
    }

    this.natureGrid.push(ligne);
  }

  onSelectionChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedBudget = this.budgets.find((b) => b.idbudget === id);

    this.ligneBudgetForm.patchValue({ idbudget: id });

    if (!this.selectedBudget) return;

    if (this.selectedBudget.entite === 'Site') {
      // Département NON obligatoire
      this.ligneBudgetForm.get('iddepartement')?.clearValidators();
      this.ligneBudgetForm.get('iddepartement')?.updateValueAndValidity();

      // Montants département NON obligatoires
      this.ligneBudgetForm.get('montantprevisiondept')?.clearValidators();
      this.ligneBudgetForm
        .get('montantprevisiondept')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.updateValueAndValidity();

      this.natureGrid = [];
      this.modeSaisie = '';
      this.availableNatures = [];
    } else {
      // Budget Département
      this.ligneBudgetForm
        .get('iddepartement')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm.get('iddepartement')?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisiondept')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisiondept')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.updateValueAndValidity();
    }
  }

  paginatedLignes: any = {};

  getLigneBudgetsByBudget() {
    this.loading = true;
    this.lignebudgetservice
      .getByBudget(this.selectedBudgetId!, this.limit, this.currentPage)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.paginatedLignes = res.data;
            this.totalItems = res.data.pagination.totalItems;
            this.totalPages = res.data.pagination.totalPages;
            this.currentPage = res.data.pagination.currentPage;
            this.selectedBudget = res.data.budget;
          }
          this.loading = false;
        },
        error: (err: any) => {
          this.msgErros = err.error.error;
          this.loading = false;
        },
      });
  }

  getAllLigneBudgets() {
    this.params = {
      page: this.currentPage,
      limit: 1000000000,
    };

    this.lignebudgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ligneBudgetsSource = [...res.data]; // 🔥 IMMUTABILITÉ

          this.groupLigneBudgetsByBudget();

          // 🔥 SI un budget est sélectionné → recalcul auto
          if (this.selectedBudgetId) {
            this.onClickAfficher();
          }

          this.totalPages = res.totalPages;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  onBudgetChange(event: any) {
    const id = event.target.value;
    this.selectedBudget = this.budgets.find((b) => b.idbudget === id);
    this.natureGrid = [];
    this.ligneBudgetForm.patchValue({ iddepartement: '' });
  }

  stepNatures: Array<{
    idnature: string;
    libelle: string;
    montantDept: number;
    montantSite: number;
    montantSociete: number;
  }> = [];

  loadNextNature() {
    if (this.currentNatureIndex >= this.stepNatures.length) return;

    const next = this.stepNatures[this.currentNatureIndex];

    // Ajouter la nature suivante à la grille
    this.natureGrid.push(next);

    this.prefillNatureGrid(); // si tu veux pré-remplir avec des valeurs existantes
    this.currentNatureIndex++;
  }

  onClickNextNature() {
    this.loadNextNature();
  }

  // Nature pour site
  loadNaturesForSite() {
    if (!this.selectedBudget) return;

    // 1. départements du site de l'utilisateur
    const siteDepartements = this.departements.filter(
      (d) => d.idsite === this.user.idsite,
    );

    // 2. départements autorisés pour l'utilisateur
    const userDeptIds = new Set(
      this.appartenanceDepartement.map((d) => d.iddepartement),
    );

    const filteredDepartements = siteDepartements.filter((d) =>
      userDeptIds.has(d.iddepartement),
    );

    if (filteredDepartements.length === 0) {
      this.natureGrid = [];
      this.availableNatures = [];
      return;
    }

    // 3. appel API pour chaque département
    const requests = filteredDepartements.map((dep) =>
      this.affectationService.getAll(dep.iddepartement),
    );

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        let allNatures: any[] = [];

        responses.forEach((res, index) => {
          if (res.success) {
            const depId = filteredDepartements[index].iddepartement;

            const mapped = res.data.naturesaffectes.map((n: any) => ({
              idnature: n.idnature,
              libelle: n.libelle,
              iddepartement: depId, // ⚠️ CRUCIAL
            }));

            allNatures.push(...mapped);
          }
        });

        // 🔥 supprimer doublons
        const uniqueMap = new Map();
        allNatures.forEach((n) => {
          if (!uniqueMap.has(n.idnature)) {
            uniqueMap.set(n.idnature, n);
          }
        });

        this.allNatures = Array.from(uniqueMap.values());

        this.initNatureGridForSite();
      },
    });
  }

  initNatureGridForSite() {
    if (!this.selectedBudget) return;

    const existingLines = this.ligneBudgetsSource.filter(
      (l) => l.idbudget === this.selectedBudget!.idbudget,
    );

    if (this.modeSaisie === 'ALL') {
      this.natureGrid = this.allNatures.map((n) => {
        const existing = existingLines.find((l) => l.idnature === n.idnature);

        return {
          idnature: n.idnature,
          libelle: n.libelle,
          iddepartement: n.iddepartement, // ⚠️ important
          idbudgetdepartementnature: existing?.idbudgetdepartementnature,
          montantDept: 0,
          montantSite: existing?.montantprevisionsite ?? 0,
          montantSociete: existing?.montantprevisionsociete ?? 0,
        };
      });

      return;
    }

    // STEP
    const usedIds = new Set(existingLines.map((l) => l.idnature));

    this.natureGrid = existingLines.map((l) => ({
      idnature: l.idnature!,
      libelle: l.nature_operation?.libelle ?? '',
      iddepartement: l.iddepartement,
      idbudgetdepartementnature: l.idbudgetdepartementnature,
      montantDept: 0,
      montantSite: l.montantprevisionsite ?? 0,
      montantSociete: l.montantprevisionsociete ?? 0,
    }));

    this.availableNatures = this.allNatures
      .filter((n) => !usedIds.has(n.idnature))
      .map((n) => ({
        ...new natureoperationModel(),
        idnature: n.idnature,
        libelle: n.libelle,
        iddepartement: n.iddepartement,
      }));
  }

  loadNatureGrid(idDepartement: string) {
    if (!this.selectedBudget || !idDepartement) return;

    this.natureGrid = [];
    this.availableNatures = [];
    this.selectedNatureId = null;
    this.selectedCentreId = null;

    this.affectationService.getAll(idDepartement).subscribe({
      next: (res: any) => {
        if (!res.success) return;

        const allNatures = res.data.naturesaffectes;

        const existingLines = this.ligneBudgetsSource.filter(
          (l) =>
            l.idbudget === this.selectedBudget!.idbudget &&
            l.iddepartement === idDepartement,
        );

        if (this.modeSaisie === 'ALL') {
          // 🔵 Mode complet : afficher toutes les natures + montants
          this.natureGrid = allNatures.map((n: any) => {
            const existing = existingLines.find(
              (l) => l.idnature === n.idnature,
            );
            return {
              idnature: existing?.idnature ?? n.idnature ?? '', // <-- fix TS
              libelle: n.libelle,
              idbudgetdepartementnature: existing?.idbudgetdepartementnature,
              montantDept: existing?.montantprevisiondept ?? 0,
              montantSite: existing?.montantprevisionsite ?? 0,
              montantSociete: existing?.montantprevisionsociete ?? 0,
            };
          });

          return;
        }

        // 🟢 Mode STEP : lignes existantes
        const usedIds = new Set(existingLines.map((l) => l.idnature));

        this.natureGrid = existingLines.map((l) => ({
          idnature: l.idnature!, // assurance non-null
          libelle: l.nature_operation?.libelle ?? '',
          idbudgetdepartementnature: l.idbudgetdepartementnature,
          montantDept: l.montantprevisiondept ?? 0,
          montantSite: l.montantprevisionsite ?? 0,
          montantSociete: l.montantprevisionsociete ?? 0,
        }));

        // natures encore disponibles pour ajout
        this.availableNatures = allNatures.filter(
          (n: any) => !usedIds.has(n.idnature),
        );
      },
    });
  }

  // Nature choisie par l'utilisateur
  selectedNatureId: string | null = null;
  selectedCentreId: string | null = null;

  setMode(mode: 'ALL' | 'STEP') {
    this.modeSaisie = mode;

    if (this.isAnalytique()) {
      this.loadCentreAnalytiqueGrid();
      return;
    }

    if (this.selectedBudget?.entite === 'Département') {
      const idDept = this.ligneBudgetForm.getRawValue().iddepartement;
      if (idDept) this.loadNatureGrid(idDept);
    }

    // ✅ NOUVEAU
    if (this.selectedBudget?.entite === 'Site') {
      this.loadNaturesForSite();
    }
  }
  // ajoutons un ligne à chaque clic
  addNextNature() {
    if (
      this.currentNatureIndex >= this.allNatures.length ||
      !this.selectedBudget
    ) {
      return;
    }

    const nature = this.allNatures[this.currentNatureIndex];

    // Nouvelle ligne conforme à ton type natureGrid
    const nouvelleLigne = {
      idnature: nature.idnature,
      libelle: nature.libelle,
      iddepartement: nature.iddepartement,
      idbudgetdepartementnature: '', // optionnelle
      montantDept: 0,
      montantSite: 0,
      montantSociete: 0,
    };

    // Préremplissage si une ligne existe déjà
    const idDept = this.ligneBudgetForm.getRawValue().iddepartement;

    const existing = this.ligneBudgetsSource.find(
      (l) =>
        l.idbudget === this.selectedBudget!.idbudget &&
        l.iddepartement === idDept &&
        l.idnature === nature.idnature,
    );

    if (existing) {
      nouvelleLigne.idbudgetdepartementnature =
        existing.idbudgetdepartementnature;
      nouvelleLigne.montantDept = existing.montantprevisiondept ?? 0;
      nouvelleLigne.montantSite = existing.montantprevisionsite ?? 0;
      nouvelleLigne.montantSociete = existing.montantprevisionsociete ?? 0;
    }

    this.natureGrid.push(nouvelleLigne);
    this.updateMontantsSelonValidation();
    this.currentNatureIndex++;
  }

  prefillNatureGrid() {
    if (!this.selectedBudget) return;

    const idDept = this.ligneBudgetForm.getRawValue().iddepartement;

    if (!idDept) return;

    this.natureGrid.forEach((ligne) => {
      const lignesExistantes = this.ligneBudgetsSource.filter(
        (l) =>
          l.idbudget === this.selectedBudget!.idbudget &&
          l.iddepartement === idDept &&
          l.idnature === ligne.idnature,
      );

      if (lignesExistantes.length > 0) {
        const last = lignesExistantes[lignesExistantes.length - 1];

        ligne.idbudgetdepartementnature = last.idbudgetdepartementnature;
        ligne.montantDept = last.montantprevisiondept ?? 0;
        ligne.montantSite = last.montantprevisionsite ?? 0;
        ligne.montantSociete = last.montantprevisionsociete ?? 0;
      } else {
        ligne.idbudgetdepartementnature = undefined;
        ligne.montantDept = 0;
        ligne.montantSite = 0;
        ligne.montantSociete = 0;
      }
    });

    this.updateMontantsSelonValidation();
  }

  selectedBudgetId: string | null = null;

  onClickAfficher(): void {
    // Sécurité : aucun budget sélectionné
    if (!this.selectedBudgetId) {
      this.ligneBudgetsGrouped = [];
      this.paginatedLignes = null;
      this.totalPages = 0;
      this.totalItems = 0;
      return;
    }

    const budget = this.budgets.find(
      (b) => b.idbudget === this.selectedBudgetId,
    );

    if (!budget) {
      this.ligneBudgetsGrouped = [];
      this.paginatedLignes = null;
      return;
    }

    this.selectedBudget = budget;

    const lignes = this.ligneBudgetsSource.filter(
      (l) => l.idbudget === budget.idbudget,
    );

    this.ligneBudgetsGrouped = [
      {
        budget,
        lignes: [...lignes],
      },
    ];
    this.currentPage = 1;
    this.getLigneBudgetsByBudget();
  }

  Math = Math;

  private propagateMontantsOnValidationOpen(): void {
    if (!this.selectedBudget) return;

    const vDept = Number(this.selectedBudget.validedept) === 1;
    const vSite = Number(this.selectedBudget.validesite) === 1;

    this.validationLines = this.validationLines.map((l: any) => {
      const dept = Number(l.montantDept ?? 0);
      const site = Number(l.montantSite ?? 0);
      const soc = Number(l.montantSociete ?? 0);

      const newSite = vDept && site === 0 ? dept : site;
      const newSoc = vSite && soc === 0 ? newSite : soc;

      return {
        ...l,
        montantSite: newSite,
        montantSociete: newSoc,
      };
    });
  }

  updateMontantsSelonValidation() {
    if (!this.selectedBudget) return;
    const vDept = this.selectedBudget.validedept === 1;
    const vSite = this.selectedBudget.validesite === 1;
    this.natureGrid = this.natureGrid.map((l) => {
      if (vDept && !vSite) {
        return { ...l, montantSite: l.montantDept };
      }
      if (vSite) {
        return { ...l, montantSociete: l.montantSite };
      }
      return l;
    });
  }

  onMontantChange(
    ligne: any,
    field: 'montantDept' | 'montantSite' | 'montantSociete',
    value: number,
  ) {
    ligne[field] = value;
    if (
      field === 'montantDept' &&
      this.selectedBudget?.validedept === 1 &&
      !this.selectedBudget?.validesite
    )
      ligne.montantSite = value;
    if (field === 'montantSite' && this.selectedBudget?.validesite === 1)
      ligne.montantSociete = value;
  }

  //création du formulaire
  initForm(): void {
    this.ligneBudgetForm = this.fb.group({
      idbudget: ['', [Validators.required]],
      iddepartement: [''],
      // montantprevisiondept: [''],
      montantprevisionsite: ['', [Validators.required]],
      montantprevisionsociete: ['', [Validators.required]],
      // totalconsocloture: ['', [Validators.required]],
      // soldecloture: ['', [Validators.required]],
    });
  }

  get form() {
    return this.ligneBudgetForm.controls;
  }

  dispatchLigneBudget(_object: LigneBudgetModel) {
    this.ligneBudgetForm.patchValue({
      idbudget: _object.idbudget,
      iddepartement: _object.iddepartement,
      idnature: _object.idnature,
      montantprevisiondept: _object.montantprevisiondept,
      montantprevisionsite: _object.montantprevisionsite,
      montantprevisionsociete: _object.montantprevisionsociete,
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
    const ids: string[] = this.objectsSelected.map(
      (el) => el.idbudgetdepartementnature,
    );
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(ligneBudget: LigneBudgetModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) =>
        el.idbudgetdepartementnature == ligneBudget.idbudgetdepartementnature,
    );
    if (index == -1 && actif) this.objectsSelected.push(ligneBudget);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow =
      this.objectsSelected?.length == this.ligneBudgets?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.ligneBudgets.slice();
    else this.objectsSelected = [];
  }

  //Changer la page
  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    this.getLigneBudgetsByBudget(); // Recharger avec la nouvelle page

    if (this.paginatedLignes !== null) {
      this.paginatedLignes.lignes.forEach((line: LigneBudgetModel) => {
        this.ligneBudgetsSource.push({
          idbudget: line.idbudget,
          iddepartement:
            line.budget?.entite === 'Département' ? line.iddepartement : null,
          idnature: line.idnature ? line.idnature : null,
          idcentreanalytique: line.idcentreanalytique
            ? line.idcentreanalytique
            : null,
          montantprevisiondept: line.montantprevisiondept,
          montantprevisionsite: line.montantprevisionsite,
          montantprevisionsociete: line.montantprevisionsociete,
          nature_operation: { libelle: line.nature_operation?.libelle ?? '-' },
          centre_analytique: {
            libelle: line.centre_analytique?.libelle ?? '-',
          },
        } as LigneBudgetModel);
      });
    }

    // Scroll vers le haut de la table
    setTimeout(() => {
      const tableElement = document.querySelector('.table-responsive');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // Méthode pour changer le nombre d'éléments par page
  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.currentPage = 1; // Reset à la première page
    this.getLigneBudgetsByBudget();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Ajouter la première page si pas dans la plage
      if (start > 1) {
        pages.unshift(1);
        if (start > 2) {
          pages.splice(1, 0, -1); // -1 pour les points de suspension
        }
      }

      // Ajouter la dernière page si pas dans la plage
      if (end < this.totalPages) {
        if (end < this.totalPages - 1) {
          pages.push(-1); // points de suspension
        }
        pages.push(this.totalPages);
      }
    }

    return pages;
  }

  private lockBudgetAndDepartement(): void {
    this.ligneBudgetForm.get('idbudget')?.disable({ emitEvent: false });
    this.ligneBudgetForm.get('iddepartement')?.disable({ emitEvent: false });
  }

  private unlockBudgetAndDepartement(): void {
    this.ligneBudgetForm.get('idbudget')?.enable({ emitEvent: false });
    this.ligneBudgetForm.get('iddepartement')?.enable({ emitEvent: false });
  }

  updateBudget(_budget: any) {
    _budget.updatedby = this.user.nom + ' ' + this.user.prenom;
    this.budgetservice.update(_budget).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
        } else {
          this.error = 'Erreur de modification';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
        this.loading = false;
      },
    });
  }

  openValidationBudget(budget: BudgetModel) {
    this.selectedBudget = budget;
    this.showRejectComment = false;
    this.rejectComment = '';
    this.msgErros = '';

    const lignes = this.ligneBudgetsSource.filter(
      (l) => l.idbudget === budget.idbudget,
    );

    this.validationLines = lignes.map((l) => ({
      idbudgetdepartementnature: l.idbudgetdepartementnature,
      iddepartement: l.iddepartement ?? null,
      idnature: l.idnature ?? null,
      idcentreanalytique: this.isAnalytique() ? l.idcentreanalytique : null,
      code: l.centre_analytique?.codecentreanalytique ?? '-',
      departement: l.departement?.libelle ?? '-',
      nature: l.nature_operation?.libelle ?? '-',
      centre: l.centre_analytique?.libelle ?? '-',
      montantDept: Number(l.montantprevisiondept ?? 0),
      montantSite: Number(l.montantprevisionsite ?? 0),
      montantSociete: Number(l.montantprevisionsociete ?? 0),
    }));

    // ✅ SI dept pas encore validé => on force le front à 1
    if (Number(this.selectedBudget.validedept) !== 1) {
      this.selectedBudget.validedept = 1; // ✅ IMPORTANT (résout l'intermittence)

      this.updateBudget({
        idbudget: budget.idbudget,
        libelle: budget.libelle,
        entite: budget.entite,
        datedebut: budget.datedebut,
        datefin: budget.datefin,
        idcircuitvalidation: budget.idcircuitvalidation,
        idsite: budget.idsite,
        idsociete: budget.idsociete,
        isanalytique: budget.isanalytique,
        actif: budget.actif,
        validedept: 1,
        datevalidedept: new Date(),
      });
    }

    // ✅ Maintenant vDept sera toujours true
    this.propagateMontantsOnValidationOpen();

    // ✅ force le refresh dans la vue (très important avec modals Bootstrap)
    this.validationLines = [...this.validationLines];
  }

  private updateMontantsBudgetFromValidationModal() {
    if (!this.selectedBudget) return;

    // Ici on met à jour uniquement les champs qui ont été modifiés dans la modale
    const payload = this.validationLines
      .filter((l: any) => !!l.idbudgetdepartementnature)
      .map((l: any) => ({
        idbudgetdepartementnature: l.idbudgetdepartementnature,
        idbudget: this.selectedBudget!.idbudget,
        iddepartement: l.iddepartement,
        idnature: l.idnature,
        idcentreanalytique: l.idcentreanalytique,

        // ✅ On push les montants de la modale
        montantprevisiondept: Number(l.montantDept ?? 0),
        montantprevisionsite: Number(l.montantSite ?? 0),
        montantprevisionsociete: Number(l.montantSociete ?? 0),

        updatedby: this.user.nom + ' ' + this.user.prenom,
      }));

    if (payload.length === 0) return;

    return this.lignebudgetservice.updateMultiple(payload);
  }

  onClickValidateBudget() {
    if (!this.selectedBudget) return;

    this.msgErros = '';
    this.loading = true;

    // 1) Sauvegarder les montants de la modale en DB
    const update$ = this.updateMontantsBudgetFromValidationModal();

    // Si aucune ligne à mettre à jour → on valide directement
    if (!update$) {
      this.validationBudget(this.selectedBudget.idbudget);
      return;
    }

    update$.subscribe({
      next: () => {
        // 2) Recharge les lignes pour être clean
        this.getAllBudgets();
        this.getAllLigneBudgets();

        // 3) Ensuite validation du workflow
        this.validationBudget(this.selectedBudget!.idbudget);
      },
      error: (err: any) => {
        this.loading = false;
        this.msgErros =
          err?.error?.error ||
          err?.error?.message ||
          'Erreur lors de la mise à jour des montants';
        this.toastr.error(this.msgErros);
      },
    });
  }

  onSubmit() {
    this.msgErros = '';

    if (!this.selectedBudget) {
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    if (
      this.selectedBudget.entite === 'Département' &&
      !this.ligneBudgetForm.getRawValue().iddepartement
    ) {
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    if (this.selectedBudget.isanalytique === 1) {
      return this.handleSubmitAnalytique();
    }

    if (this.selectedBudget.entite === 'Site') {
      return this.handleSubmitSite();
    }

    if (this.selectedBudget.entite === 'Département') {
      return this.handleSubmitDepartement();
    }
  }

  private buildRequests(
    getPayload: (l: any, type: 'create' | 'update') => any,
  ) {
    const toCreate = this.natureGrid.filter(
      (l) => !l.idbudgetdepartementnature,
    );

    const toUpdate = this.natureGrid.filter((l) => l.idbudgetdepartementnature);

    const requests$ = [];

    if (toCreate.length) {
      requests$.push(
        this.lignebudgetservice.createMultiple(
          toCreate.map((l) => getPayload(l, 'create')),
        ),
      );
    }

    if (toUpdate.length) {
      requests$.push(
        this.lignebudgetservice.updateMultiple(
          toUpdate.map((l) => getPayload(l, 'update')),
        ),
      );
    }

    return requests$;
  }

  handleSubmitAnalytique() {
    this.loading = true;
    const requests$ = this.buildRequests((l, type) => ({
      idbudgetdepartementnature:
        type === 'update' ? l.idbudgetdepartementnature : undefined,
      idcentreanalytique: l.idcentreanalytique,

      idbudget: this.selectedBudget!.idbudget,
      iddepartement: null,
      idnature: null,

      montantprevisiondept: l.montantDept ?? 0,
      montantprevisionsite: l.montantSite ?? 0,
      montantprevisionsociete: l.montantSociete ?? 0,

      ...(type === 'create'
        ? { createdby: this.user.nom + ' ' + this.user.prenom }
        : { updatedby: this.user.nom + ' ' + this.user.prenom }),
    }));

    this.executeRequests(requests$);
  }

  private handleSubmitSite() {
    this.loading = true;

    const requests$ = this.buildRequests((l, type) => ({
      idbudgetdepartementnature:
        type === 'update' ? l.idbudgetdepartementnature : undefined,
      idcentreanalytique: null,

      idbudget: this.selectedBudget!.idbudget,
      iddepartement: l.iddepartement, // ✅ SOURCE GRID
      idnature: l.idnature,

      montantprevisiondept: 0,
      montantprevisionsite: l.montantSite ?? 0,
      montantprevisionsociete: l.montantSociete ?? 0,

      ...(type === 'create'
        ? { createdby: this.user.nom + ' ' + this.user.prenom }
        : { updatedby: this.user.nom + ' ' + this.user.prenom }),
    }));

    this.executeRequests(requests$);
  }

  private handleSubmitDepartement() {
    const formValue = this.ligneBudgetForm.getRawValue();

    this.loading = true;

    const requests$ = this.buildRequests((l, type) => ({
      idbudgetdepartementnature:
        type === 'update' ? l.idbudgetdepartementnature : undefined,
      idcentreanalytique: null,

      idbudget: this.selectedBudget!.idbudget,
      iddepartement: formValue.iddepartement, // ✅ FORMULAIRE
      idnature: l.idnature,

      montantprevisiondept: l.montantDept ?? 0,
      montantprevisionsite: l.montantSite ?? 0,
      montantprevisionsociete: l.montantSociete ?? 0,

      ...(type === 'create'
        ? { createdby: this.user.nom + ' ' + this.user.prenom }
        : { updatedby: this.user.nom + ' ' + this.user.prenom }),
    }));

    this.executeRequests(requests$);
  }

  private executeRequests(requests$: any[]) {
    if (!requests$.length) {
      this.loading = false;
      return;
    }

    forkJoin(requests$).subscribe({
      next: () => {
        this.getAllLigneBudgets();
        this.loading = false;

        if (this.actionModal === 'update') {
          this.closeModal('showModal');
        }
      },
      error: (err) => {
        this.msgErros = err.error?.error || 'Erreur serveur';
        this.loading = false;
      },
    });
  }

  resetAfterSubmit(modalId: string = 'showModal') {
    // Reset formulaire
    this.ligneBudgetForm.reset();

    // Reset état métier
    this.ligneBudget = new LigneBudgetModel();
    this.selectedBudget = undefined;
    this.natureGrid = [];
    this.actionModal = 'create';
    this.msgErros = '';

    // Reset validations visuelles
    this.ligneBudgetForm.markAsPristine();
    this.ligneBudgetForm.markAsUntouched();

    this.modeSaisie = '';

    // Fermer la modale
    this.closeModal(modalId);
  }

  //Enregistrement de données
  create(_ligneBudget: LigneBudgetModel) {
    const { idbudgetdepartementnature, ...dataToSend } = _ligneBudget;

    this.loading = true;
    this.lignebudgetservice.create(dataToSend).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.resetAfterSubmit();
        } else {
          this.msgErros = 'Erreur de création';
          alert(this.error);
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.msgErros = err.error.error;
        this.loading = false;
      },
    });
  }

  validationBudget(id: string) {
    const data = {
      idbudget: id,
      iduser: this.user.idutilisateur,
      decision: 'accepter',
      motif: null,
      comment: null,
    };

    this.loading = true;
    this.budgetservice.validationBudget(id, data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.toastr.success('Décision enrégistrée');
          this.closeModal('validateBudgetModal');
        } else {
          this.msgErros = 'Erreur lors de la validation';
          this.toastr.error('Erreur lors de la validation');
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.msgErros = err.error.message;
        this.toastr.error(err.error.message ?? 'Erreur lors de la validation');
        this.loading = false;
      },
    });
  }

  //Modification de données
  update(_ligneBudget: any) {
    _ligneBudget.updatedby = this.user.nom + ' ' + this.user.prenom;
    this.lignebudgetservice.update(_ligneBudget).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.resetAfterSubmit();
        } else {
          this.error = 'Erreur de modification';
        }
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = 'Modification échec';
        this.loading = false;
      },
    });
  }

  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  modalCreate() {
    this.actionModal = 'create';
    this.unlockBudgetAndDepartement();
    this.paginatedLignes = null;
    this.initForm();
  }

  onRejectClick() {
    if (!this.selectedBudget) return;
    this.showRejectComment = true;
    this.confirmRejectBudget(this.selectedBudget!.idbudget);
  }

  confirmRejectBudget(id: string) {
    const motifId = this.rejectForm.get('motif')?.value;
    const commentaire = this.rejectComment;

    if (!this.rejectComment.trim()) {
      this.msgErros = 'Le motif de rejet est obligatoire';
      return;
    }

    const data = {
      idbudget: id,
      iduser: this.user.idutilisateur,
      decision: 'refuser',
      motif: motifId,
      comment: commentaire,
    };

    this.loading = true;

    // 👉 appel API rejet budget
    this.budgetservice.validationBudget(id, data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.toastr.error('Décision de refus enrégistrée');
          this.closeModal('validateBudgetModal');
        } else {
          this.msgErros = 'Erreur lors du refus du budget';
          this.toastr.error('Erreur lors du refus du budget');
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.msgErros = err.error.message;
        this.toastr.error(
          err.error.message ?? 'Erreur lors du refus du budget',
        );
        this.loading = false;
      },
    });

    this.loading = false;
    this.resetValidationModal();
  }

  resetValidationModal() {
    this.validationLines = [];
    this.selectedBudget = undefined;
    this.rejectComment = '';
    this.showRejectComment = false;
    this.msgErros = '';

    this.closeModal('validateBudgetModal');
  }

  onValidateClick() {
    if (!this.selectedBudget) return;

    // 👉 appel service validation
    // budgetService.validateBudget(this.selectedBudget.idbudget)

    this.resetAfterSubmit();
  }

  resetModeSaisie() {
    this.modeSaisie = '';
  }

  modalUpdate(ligne: LigneBudgetModel) {
    this.actionModal = 'update';
    this.modeSaisie = 'ALL';
    this.ligneBudgetForm.reset();
    this.msgErros = '';

    // Sélection du budget
    this.selectedBudget = this.budgets.find(
      (b) => b.idbudget === ligne.idbudget,
    );

    if (!this.selectedBudget) return;

    // ============================
    // CAS DÉPARTEMENT (OK chez toi)
    // ============================
    if (this.selectedBudget.entite === 'Département') {
      this.ligneBudgetForm.patchValue({
        idbudget: ligne.idbudget,
        iddepartement: ligne.iddepartement,
      });

      this.lockBudgetAndDepartement();
      this.natureGrid = [];

      this.loadNatureGrid(ligne.iddepartement!);
      return;
    }

    // ============================
    // CAS SITE (CORRIGÉ)
    // ============================

    this.ligneBudgetForm.patchValue({
      idbudget: ligne.idbudget,
    });

    this.lockBudgetAndDepartement();
    if (this.selectedBudget?.entite === 'Site') {
      // 🔥 IMPORTANT : reconstruire la grille
      this.prefillNatureGridForSite(ligne.idbudget);
      return;
    }

    if (this.isAnalytique()) {
      this.prefillNatureGridAnalytique(ligne.idbudget);
      return;
    }
  }

  prefillNatureGridForSite(idbudget: string) {
    // 🔥 lignes existantes venant de ta table affichée
    const existingLines = this.ligneBudgetsGrouped
      .flatMap((g) => g.lignes)
      .filter((l) => l.idbudget === idbudget);

    this.natureGrid = existingLines.map((l) => ({
      idnature: l.idnature as string,
      libelle: l.nature_operation?.libelle || '—',

      idbudgetdepartementnature: l.idbudgetdepartementnature,
      iddepartement: l.iddepartement ?? null,

      // on reprend EXACTEMENT les valeurs existantes
      montantDept: 0, // pas utilisé pour Site
      montantSite: l.montantprevisionsite,
      montantSociete: l.montantprevisionsociete,
    }));
  }

  prefillNatureGridAnalytique(idbudget: string) {
    // 🔥 lignes existantes venant de ta table affichée

    if (this.paginatedLignes === null) return;

    const tab = [];
    tab.push({
      budget: this.paginatedLignes.budget,
      lignes: this.paginatedLignes.lignes,
    });

    const existingLines = tab
      .flatMap((g) => g.lignes)
      .filter((l) => l.idbudget === idbudget);

    this.natureGrid = existingLines.map((l) => ({
      idnature: null,
      libelle: l.centre_analytique?.libelle || '—',
      idcentreanalytique: l.centre_analytique?.idcentreanalytique,
      codecentreanalytique: l.centre_analytique?.codecentreanalytique,
      idbudgetdepartementnature: l.idbudgetdepartementnature,
      iddepartement: null,

      // on reprend EXACTEMENT les valeurs existantes
      montantDept: l.montantprevisiondept,
      montantSite: l.montantprevisionsite,
      montantSociete: l.montantprevisionsociete,
    }));
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: LigneBudgetModel) {
    this.deleteLigneBudget = item;
  }

  deleteConfirmed() {
    if (!this.deleteLigneBudget) return;
    this.lignebudgetservice
      .delete(this.deleteLigneBudget.idbudgetdepartementnature)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.deleteLigneBudget = null;
            this.closeModal('deleteOrder');
            this.getAllBudgets();
            this.getAllLigneBudgets();
          } else {
            this.msgErros = 'Erreur lors de la suppression';
          }
          this.loading = false;
        },
        error: (err: any) => {
          this.msgErros = err.error.error;
          this.loading = false;
        },
      });
  }
}
