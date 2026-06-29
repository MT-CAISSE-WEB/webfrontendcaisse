import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { BudgetModel } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';
import { CommonModule } from '@angular/common';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LigneBudgetModel } from '../models/ligne_budget.model';
import { circuitvalidationservice } from '../../workflow/service/circuitvalidation.service';
import { circuitvalidationmodel } from '../../workflow/model/circuitvalidation.model';
import { BudgetPrevisionService } from '../services/budget-calcul.service';
import { LigneBudgetService } from '../services/ligne_budget.service';
import { BudgetPJService } from '../../PJ/service/budgetpj.service';
import { PieceJointe } from '../../PJ/models/pj.model';
import { ToastrService } from 'ngx-toastr';
import { catchError, forkJoin, of } from 'rxjs';

type BudgetStatusFilter = 'ALL' | 'ACTIF' | 'INACTIF';

@Component({
  selector: 'app-budget',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css',
})
export class BudgetComponent implements OnInit {
  title = 'Budget';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  budgets: BudgetModel[] = [];
  budget: BudgetModel = new BudgetModel();
  msgErros: string = '';
  loading: Boolean = false;
  budgetForm: FormGroup = this.fb.group({});
  filteredBudgets: BudgetModel[] = [];
  circuitValidation?: circuitvalidationmodel;
  lignesBudgetaires: LigneBudgetModel[] = [];

  currentStatusFilter: BudgetStatusFilter = 'ALL';
  searchTerm: string = '';

  // formatage de date
  formatDateForInput(dateString: string | null): string | null {
    if (!dateString) return null;

    const date = new Date(dateString);
    // Décalage fuseau → on corrige avec toISOString()
    return date.toISOString().split('T')[0];
  }

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected: BudgetModel[] = [];
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
  deleteBudget: any = null;

  selectedBudgetParent?: BudgetModel;
  entiteParent?: string;
  selectedBudget?: BudgetModel;

  // Propriétés pour les pièces jointes
  piecesJointes: PieceJointe[] = [];
  piecesJointesLoading = false;
  selectedFiles: File[] = [];
  selectedBudgetPJ: BudgetModel | null = null;
  pjUploading = false;
  pjDeleting: string | null = null;
  piecesCountMap: Map<string, number> = new Map(); // Cache pour les compteurs
  newlyCreatedBudget: BudgetModel | null = null;

  constructor(
    private budgetservice: BudgetService,
    private circuitvalidationservice: circuitvalidationservice,
    private budgetPrevisionService: BudgetPrevisionService,
    private lignebudgetservice: LigneBudgetService,
    private bugetPJService: BudgetPJService,
    private toastr: ToastrService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    //Initialisation du formulaire
    this.initForm();

    //Afficher tous les journaux
    this.getAllBudgets();
    this.getAllCircuits();
    this.getAllLigneBudgetaire();

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('Ce budget');
    this.titleMsg = TITLE_DELETE;
  }

  getAllBudgets() {
    this.isExpanded = {};
    this.params = {
      page: this.currentPage,
      limit: 10000,
    };
    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          const lesbudgets = res.data as BudgetModel[];
          if (this.user.typeentitesociete === 1) {
            this.budgets = lesbudgets.filter(
              (b) => b.idsociete === this.user.idsociete,
            );
          } else {
            this.budgets = lesbudgets.filter(
              (b) =>
                b.idsite === this.user.idsite &&
                b.idsociete === this.user.idsociete,
            );
          }

          this.loadPiecesCountsForAllOperations(); // Appeler la fonction de chargement des compteurs de piloadPiecesCountsForAllOperations

          this.applyStatusFilter(this.currentStatusFilter);
          this.filteredBudgets = [...this.budgets];
          this.applyFilters();
          this.totalPages = res.totalPages;
          this.budgetForm?.updateValueAndValidity({
            onlySelf: false,
            emitEvent: true,
          });
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  lignesByBudget: LigneBudgetModel[] = [];

  // Sélection multiple
  areAllChildrenSelected(parentId: string): boolean {
    const children = this.getBudgetsMensuels(parentId);
    return (
      children.length > 0 &&
      children.every((child) => this.isChecked(child.idbudget))
    );
  }

  toggleSelectAllChildren(parentId: string, checked: boolean): void {
    const children = this.getBudgetsMensuels(parentId);
    if (checked) {
      children.forEach((child) => {
        if (!this.isChecked(child.idbudget)) {
          this.objectsSelected.push(child);
        }
      });
    } else {
      children.forEach((child) => {
        this.objectsSelected = this.objectsSelected.filter(
          (obj) => obj.idbudget !== child.idbudget,
        );
      });
    }
    this.checkAllRow =
      this.objectsSelected.length === this.filteredBudgets.length;
  }

  // Afficher les lignes budgétaires du budget
  onClickAfficherLignesBudgetaire(budget: BudgetModel): void {
    if (!budget) return;
    this.selectedBudget = budget;
    const lignes = this.lignesBudgetaires.filter(
      (l) => l.idbudget === budget.idbudget,
    );
    this.lignesByBudget = lignes;
  }

  getAllCircuits() {
    this.isExpanded = {};

    this.circuitvalidationservice.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          const circuits: circuitvalidationmodel[] = res.data;
          this.circuitValidation = circuits.find(
            (c) =>
              c.idsite === this.user.idsite &&
              c.idsociete === this.user.idsociete &&
              c.typeaction.toLocaleLowerCase() === 'budget' &&
              c.typeentite.toLocaleLowerCase() === 'site',
          );
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  getAllLigneBudgetaire() {
    this.params = {
      page: this.currentPage,
      limit: 1000000000,
    };
    this.lignebudgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.lignesBudgetaires = res.data;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  openContextMenu: string | null = null;

  toggleContextMenu(id: string) {
    this.openContextMenu = this.openContextMenu === id ? null : id;
  }

  selectedBudgetForLignes?: BudgetModel;
  lignesBudgetDuBudget: LigneBudgetModel[] = [];

  openLignesBudgetModal(budget: BudgetModel) {
    this.selectedBudgetForLignes = budget;

    this.lignesBudgetDuBudget = this.lignesBudgetaires.filter(
      (l) => l.idbudget === budget.idbudget,
    );

    const modal = document.getElementById('modalLignesBudget');
    modal?.classList.add('show');
    modal?.setAttribute('style', 'display:block');
  }

  closeLignesBudgetModal() {
    const modal = document.getElementById('modalLignesBudget');
    modal?.classList.remove('show');
    modal?.setAttribute('style', 'display:none');
  }

  isExpanded: Record<string, boolean> = {};

  toggleExpand(id: string) {
    this.isExpanded[id] = !this.isExpanded[id];
  }

  getBudgetsAnnuels() {
    return this.filteredBudgets.filter((b) => b.typebudget === 'Annuel');
  }

  getBudgetsMensuels(parentId: string): BudgetModel[] {
    return this.filteredBudgets.filter(
      (b) => b.typebudget === 'Mensuel' && b.idbudgetparent === parentId,
    );
  }
  get totalActifs(): number {
    return this.budgets.filter(
      (b) => b.actif === 1 && b.typebudget === 'Annuel',
    ).length;
  }

  get totalInactifs(): number {
    return this.budgets.filter(
      (b) => b.actif === 0 && b.typebudget === 'Annuel',
    ).length;
  }

  get hasNoResult(): boolean {
    return this.filteredBudgets.length === 0;
  }

  applyFilters(): void {
    let result = [...this.budgets];

    /* ==========================
   1️⃣ FILTRE PAR STATUT (ANNUELS UNIQUEMENT)
   ========================== */
    switch (this.currentStatusFilter) {
      case 'ACTIF':
        result = result.filter((b) => b.actif === 1);
        break;

      case 'INACTIF':
        result = result.filter((b) => b.actif === 0);
        break;
    }

    /* ==========================
   2️⃣ FILTRE PAR RECHERCHE (PARENTS + ENFANTS)
   ========================== */
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();

      // Budgets qui matchent le texte
      const matched = this.budgets.filter(
        (b) =>
          b.codebudget?.toLowerCase().includes(term) ||
          b.libelle?.toLowerCase().includes(term),
      );

      // IDs des budgets annuels trouvés
      const parentIds = new Set(
        matched.filter((b) => b.typebudget === 'Annuel').map((b) => b.idbudget),
      );

      // Appliquer la recherche en incluant les mensuels liés
      result = this.budgets.filter(
        (b) =>
          matched.includes(b) ||
          (b.idbudgetparent && parentIds.has(b.idbudgetparent)),
      );
    }

    this.filteredBudgets = result;

    /* ==========================
   Reset sélection
   ========================== */
    this.objectsSelected = [];
    this.selectedItems = [];
    this.checkAllRow = false;
  }

  applyStatusFilter(status: BudgetStatusFilter): void {
    this.currentStatusFilter = status;

    let parents: BudgetModel[] = [];

    switch (status) {
      case 'ACTIF':
        parents = this.budgets.filter(
          (b) => b.actif === 1 && b.typebudget === 'Annuel',
        );
        break;

      case 'INACTIF':
        parents = this.budgets.filter(
          (b) => b.actif === 0 && b.typebudget === 'Annuel',
        );
        break;

      default:
        this.filteredBudgets = [...this.budgets];
        return;
    }

    const parentIds = new Set(parents.map((p) => p.idbudget));

    this.filteredBudgets = this.budgets.filter(
      (b) =>
        parentIds.has(b.idbudget) ||
        (b.idbudgetparent && parentIds.has(b.idbudgetparent)),
    );

    // Reset sélection
    this.objectsSelected = [];
    this.selectedItems = [];
    this.checkAllRow = false;
  }

  get hasAnnualBudgets(): boolean {
    return this.filteredBudgets.some((b) => b.typebudget === 'Annuel');
  }

  getPrevisionAnnuel(budget: BudgetModel): number {
    return this.budgetPrevisionService.calculPrevisionBudgetAnnuel(
      budget,
      this.budgets,
      this.lignesBudgetaires,
    );
  }

  getPrevisionMensuel(budget: BudgetModel): number {
    return this.budgetPrevisionService.calculPrevisionBudget(
      budget,
      this.lignesBudgetaires,
    );
  }

  //création du formulaire
  initForm(): void {
    this.budgetForm = this.fb.group(
      {
        codebudget: ['', [Validators.required]],
        libelle: ['', [Validators.required]],
        datedebut: ['', [Validators.required]],
        typebudget: ['', [Validators.required]],
        entite: [''],
        datefin: ['', [Validators.required]],
        idbudgetparent: [''],
        idsite: [this.user.idsite ?? null],
        idsociete: [this.user.idsociete ?? null],
        idcircuitvalidation: [
          this.circuitValidation?.idcircuitvalidation ?? null,
        ],
        // createdby
        actif: [false],
        isanalytique: [false],
      },
      {
        validators: this.budgetDateValidator(() => this.selectedBudgetParent),
      },
    );

    // Désactivation et masquage du circuit de validation
    this.budgetForm.get('idcircuitvalidation')?.disable({ emitEvent: false });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  get form() {
    return this.budgetForm.controls;
  }

  dispatchBudget(_object: BudgetModel) {
    // const status = _object.actif === 1;
    this.budgetForm.patchValue({
      codebudget: _object.codebudget,
      libelle: _object.libelle,
      isanalytique: _object.isanalytique,
      datedebut: this.formatDateForInput(_object.datedebut),
      typebudget: _object.typebudget,
      datefin: this.formatDateForInput(_object.datefin),
      idbudgetparent: _object.idbudgetparent,
      idcircuitvalidation: _object.idcircuitvalidation,
      idsite: _object.idsite,
      idsociete: _object.idsociete,
      entite: _object.entite,
      actif: _object.actif,
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

  hasError(controlName: string, errorKey: string): boolean {
    const ctrl = this.budgetForm.get(controlName);
    return !!(
      ctrl &&
      ctrl.touched &&
      ctrl.errors &&
      ctrl.errors[errorKey] &&
      !ctrl.errors['required']
    );
  }

  isTouchedAndInvalid(controlName: string): boolean {
    const ctrl = this.budgetForm.get(controlName);
    return !!(ctrl && ctrl.touched && ctrl.invalid);
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.idbudget);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(budget: BudgetModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idbudget == budget.idbudget,
    );
    if (index == -1 && actif) this.objectsSelected.push(budget);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.budgets?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.budgets.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllBudgets(); // recharge les données
  }

  // Validation des dates
  budgetDateValidator(getParent: () => BudgetModel | undefined): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startCtrl = group.get('datedebut');
      const endCtrl = group.get('datefin');
      const typeCtrl = group.get('typebudget');

      if (!startCtrl || !endCtrl || !typeCtrl) return null;

      /* ==========================
       🔄 NETTOYAGE DES ERREURS
       ========================== */
      const resetErrors = (ctrl: AbstractControl, keys: string[]) => {
        if (!ctrl.errors) return;

        const errors = { ...ctrl.errors };
        keys.forEach((k) => delete errors[k]);

        ctrl.setErrors(Object.keys(errors).length ? errors : null);
      };

      resetErrors(startCtrl, [
        'invalidMonthRange',
        'outOfParentRange',
        'duplicateMonthlyBudget',
        'invalidAnnualStartDate',
        'duplicateAnnualBudget',
      ]);

      resetErrors(endCtrl, [
        'startAfterEnd',
        'invalidMonthRange',
        'outOfParentRange',
        'duplicateMonthlyBudget',
        'invalidAnnualEndDate',
        'duplicateAnnualBudget',
      ]);

      if (!startCtrl.value || !endCtrl.value) return null;

      const start = new Date(startCtrl.value);
      const end = new Date(endCtrl.value);

      /* ==========================
       1️⃣ DÉBUT < FIN
       ========================== */
      if (start >= end) {
        endCtrl.setErrors({
          ...endCtrl.errors,
          startAfterEnd: true,
        });
        return null;
      }

      /* ==========================
 2️⃣ VALIDATION ANNUELLE
 ========================== */
      if (typeCtrl.value === 'Annuel') {
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        const isFirstDayOfYear =
          start.getDate() === 1 && start.getMonth() === 0; // Janvier = 0

        const isLastDayOfYear = end.getDate() === 31 && end.getMonth() === 11; // Décembre = 11

        if (!isFirstDayOfYear) {
          startCtrl.setErrors({
            ...startCtrl.errors,
            invalidAnnualStartDate: true,
          });
        }

        if (!isLastDayOfYear || startYear !== endYear) {
          endCtrl.setErrors({
            ...endCtrl.errors,
            invalidAnnualEndDate: true,
          });
        }

        /* ==========================
 🔒 CONTRÔLE UNICITÉ ANNUEL PAR SITE
 ========================== */
        const currentYear = start.getFullYear();

        const duplicateAnnual = this.budgets.some((b) => {
          if (
            b.typebudget !== 'Annuel' ||
            b.idbudget === this.budget?.idbudget // exclusion en mode édition
          ) {
            return false;
          }

          const bYear = new Date(b.datedebut).getFullYear();

          return (
            bYear === currentYear &&
            b.idsite === this.budgetForm.get('idsite')?.value
          );
        });

        if (duplicateAnnual) {
          startCtrl.setErrors({
            ...startCtrl.errors,
            duplicateAnnualBudget: true,
          });

          endCtrl.setErrors({
            ...endCtrl.errors,
            duplicateAnnualBudget: true,
          });
        }

        return null;
      }

      /* ==========================
       2️⃣ VALIDATION MENSUELLE
       ========================== */
      if (typeCtrl.value === 'Mensuel') {
        const sameMonth =
          start.getMonth() === end.getMonth() &&
          start.getFullYear() === end.getFullYear();

        const lastDayOfMonth = new Date(
          start.getFullYear(),
          start.getMonth() + 1,
          0,
        ).getDate();

        if (!sameMonth || end.getDate() !== lastDayOfMonth) {
          startCtrl.setErrors({
            ...startCtrl.errors,
            invalidMonthRange: true,
          });
          endCtrl.setErrors({
            ...endCtrl.errors,
            invalidMonthRange: true,
          });
          return null;
        }
      }

      /* ==========================
       3️⃣ CONTRÔLE PARENT
       ========================== */
      const parent = getParent();
      if (parent && typeCtrl.value === 'Mensuel') {
        const parentStart = new Date(parent.datedebut);
        const parentEnd = new Date(parent.datefin);

        if (!(start >= parentStart && end <= parentEnd)) {
          startCtrl.setErrors({
            ...startCtrl.errors,
            outOfParentRange: true,
          });
          endCtrl.setErrors({
            ...endCtrl.errors,
            outOfParentRange: true,
          });
          return null;
        }
      }

      /* ==========================
       4️⃣ CHEVAUCHEMENT EXISTANT
       ========================== */
      if (parent && typeCtrl.value === 'Mensuel') {
        const startTime = start.getTime();
        const endTime = end.getTime();

        const overlap = this.budgets.some((b) => {
          if (
            b.typebudget !== 'Mensuel' ||
            b.idbudgetparent !== parent.idbudget ||
            b.idbudget === this.budget?.idbudget
          ) {
            return false;
          }

          const bStart = new Date(b.datedebut).getTime();
          const bEnd = new Date(b.datefin).getTime();

          return startTime <= bEnd && endTime >= bStart;
        });

        if (overlap) {
          startCtrl.setErrors({
            ...startCtrl.errors,
            duplicateMonthlyBudget: true,
          });
          endCtrl.setErrors({
            ...endCtrl.errors,
            duplicateMonthlyBudget: true,
          });
        }
      }

      return null;
    };
  }

  // choix du budget parent
  onSelectionChange(event: Event) {
    const selectedId = (event.target as HTMLSelectElement).value;

    this.selectedBudgetParent = this.budgets.find(
      (b) => b.idbudget === selectedId,
    );

    const entiteCtrl = this.budgetForm.get('entite');
    const analytiqueCtrl = this.budgetForm.get('isanalytique');

    if (!this.selectedBudgetParent) {
      entiteCtrl?.reset(null);
      entiteCtrl?.enable({ emitEvent: false });

      analytiqueCtrl?.reset(null);
      analytiqueCtrl?.enable({ emitEvent: false });
    } else {
      entiteCtrl?.setValue(this.selectedBudgetParent.entite);
      entiteCtrl?.disable({ emitEvent: false });

      analytiqueCtrl?.setValue(this.selectedBudgetParent.isanalytique);
      analytiqueCtrl?.disable({ emitEvent: false });
    }

    this.budgetForm.updateValueAndValidity({
      onlySelf: false,
      emitEvent: true,
    });

    this.budgetForm.get('datedebut')?.updateValueAndValidity();
    this.budgetForm.get('datefin')?.updateValueAndValidity();
  }

  //Soumission du formulaire
  onSubmit() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.budgetForm.controls;
    if (this.budgetForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.budgetForm.getRawValue();

    this.budget.idcircuitvalidation = this.circuitValidation
      ?.idcircuitvalidation as string;
    this.budget.idsite = this.user?.idsite as string;
    this.budget.idsociete = this.user?.idsociete as string;
    this.budget.datevalidedept = null;
    this.budget.datevalidesite = null;
    this.budget.datevalidesociete = null;
    this.budget.createdby = this.user.nom ?? 'MAF';
    this.budget.dernierniveau = null;
    this.budget.niveauactuel = 1;

    const _budget: BudgetModel = {
      ...this.budget,
      ...formValue,
      idbudgetparent:
        formValue.idbudgetparent === '' ? null : formValue.idbudgetparent,
      datedebut: formValue.datedebut,
      datefin: formValue.datefin,
      actif: formValue.actif ? 1 : 0,
      isanalytique: formValue.isanalytique ? 1 : 0,
    };

    /** 3. choices action */
    if (this.actionModal == 'create') this.create(_budget);
    else {
      this.update({
        idbudget: _budget.idbudget,
        libelle: _budget.libelle,
        entite: _budget.entite,
        datedebut: formValue.datedebut,
        datefin: formValue.datefin,
        idcircuitvalidation: _budget.idcircuitvalidation,
        idsite: _budget.idsite,
        idsociete: _budget.idsociete,
        actif: formValue.actif,
        isanalytique: formValue.isanalytique,
      });
    }
  }

  //Enregistrement de données
  create(_budget: BudgetModel) {
    const { idbudget, ...dataToSend } = _budget;

    this.loading = true;
    this.budgetservice.create(dataToSend).subscribe({
      next: async (res: any) => {
        //console.log('Resultat:', res);
        if (res.success) {
          this.currentStatusFilter = 'ALL';
          await this.uploadPendingFiles(res.data.idbudget);
          this.toastr.success('Budget créé avec succès');
          this.closeModal('showModal');
          this.getAllBudgets();
        } else {
          this.error = 'Erreur de création';
          alert(this.error);
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.msgErros = err.error.error;
        this.loading = false;
        this.toastr.error(this.msgErros || 'Erreur lors de la création');
      },
    });
  }

  //Modification de données
  update(_budget: any) {
    _budget.updatedby = this.user.nom + ' ' + this.user.prenom;
    this.budgetservice.update(_budget).subscribe({
      next: async (res: any) => {
        if (res.success) {
          await this.deleteMarkedFiles(_budget.idbudget);
          await this.uploadPendingFiles(_budget.idbudget);
          this.toastr.success('Budget modifié avec succès');
          this.closeModal('showModal');
          this.getAllBudgets();
        } else {
          this.error = 'Erreur de modification';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
        this.loading = false;
        this.toastr.error(this.msgErros || 'Erreur lors de la modification');
      },
    });
  }

  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
    this.selectedBudget = undefined;
    this.existingPieces = []; // ⭐ Nettoyer après fermeture
    // this.uploadedFiles = [];
  }

  modalCreate() {
    this.actionModal = 'create';
    this.selectedBudget = undefined;
    this.existingPieces = [];
    this.selectedFiles = [];
    // this.uploadedFiles = [];
    this.initForm();
  }

  modalUpdate(_object: BudgetModel) {
    this.budget = _object;
    this.actionModal = 'update';
    this.budgetForm.reset();

    this.selectedBudgetParent = this.budgets.find(
      (b) => b.idbudget === _object.idbudgetparent,
    );

    this.selectedBudget = _object;

    this.dispatchBudget(_object);
    /* 🔒 Désactivation */
    this.budgetForm.get('codebudget')?.disable({ emitEvent: false });
    this.budgetForm.get('typebudget')?.disable({ emitEvent: false });
    // Désactivation et masquage du circuit de validation
    this.budgetForm.get('idcircuitvalidation')?.disable({ emitEvent: false });
    // Désactivation du paramètre analytique
    this.budgetForm.get('isanalytique')?.disable({ emitEvent: false });

    this.budgetForm.markAllAsTouched();
    this.budgetForm.updateValueAndValidity();
    this.selectedFiles = [];
    this.loadExistingPieces(_object.idbudget);
  }

  /**
   * Charge les pièces jointes existantes d'un budget
   */
  loadExistingPieces(idbudget: string): void {
    this.bugetPJService.getAll(idbudget).subscribe({
      next: (res) => {
        if (res.success) {
          this.existingPieces = res.data;
          console.log('PJ existantes chargées:', this.existingPieces);
        } else {
          this.existingPieces = [];
        }
      },
      error: (err) => {
        console.error('Erreur chargement PJ existantes:', err);
        this.existingPieces = [];
      },
    });
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: BudgetModel) {
    this.deleteBudget = item;
  }

  deleteConfirmed() {
    if (!this.deleteBudget) return;
    this.budgetservice.delete(this.deleteBudget.idbudget).subscribe({
      next: (res: any) => {
        console.log('Res:', res);
        if (res.success) {
          this.deleteBudget = null;
          this.closeModal('deleteOrder');
          this.toastr.success('Budget supprimé avec succès');
          this.getAllBudgets();
        } else {
          this.error = 'Erreur de Suppression';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Suppression échec';
        this.loading = false;
        this.toastr.error(
          err.error?.message || 'Erreur lors de la suppression',
        );
      },
    });
  }

  // Récupère le nombre de pièces jointes (avec cache)
  getPiecesCount(idbudget: string): number {
    return this.piecesCountMap.get(idbudget) || 0;
  }

  modalPJVisible = false;
  // Ouvre le modal des pièces jointes
  openPiecesJointesModal(budget: BudgetModel): void {
    this.selectedBudgetPJ = budget;
    this.selectedFiles = [];
    this.loadPiecesJointes(budget.idbudget);
    this.modalPJVisible = true;
    document.body.style.overflow = 'hidden'; // Empêche le scroll
  }

  closePiecesJointesModal(): void {
    this.modalPJVisible = false;
    this.selectedBudgetPJ = null;
    this.piecesJointes = [];
    this.selectedFiles = [];
    this.pjUploading = false;
    this.pjDeleting = null;
    this.existingPieces = []; // Nettoyer après fermeture
    // this.uploadedFiles = [];
    document.body.style.overflow = ''; // Restaure le scroll
  }

  // Charge les pièces jointes d'une demande
  loadPiecesJointes(idbudget: string): void {
    this.piecesJointesLoading = true;
    this.bugetPJService.getAll(idbudget).subscribe({
      next: (res) => {
        if (res.success) {
          this.piecesJointes = res.data;
          this.piecesCountMap.set(idbudget, this.piecesJointes.length);
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
    if (!this.selectedBudgetPJ || this.selectedFiles.length === 0) return;

    this.pjUploading = true;
    const userId = this.user.idutilisateur;

    this.bugetPJService
      .create(this.selectedBudgetPJ.idbudget, this.selectedFiles, userId)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success(
              `${res.data.length} fichier(s) uploadé(s) avec succès`,
            );
            this.selectedFiles = [];
            this.loadPiecesJointes(this.selectedBudgetPJ!.idbudget);
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
    this.bugetPJService.downloadFile(piece.urlpiece).subscribe({
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

    this.bugetPJService
      .delete(this.selectedBudgetPJ!.idbudget, piece.idpiecejointe)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Fichier supprimé');
            this.loadPiecesJointes(this.selectedBudgetPJ!.idbudget);
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

  // selectedFiles: File[] = [];
  existingPieces: PieceJointe[] = [];
  filesToDelete: string[] = [];

  private uploadPendingFiles(idbudget: string): Promise<void> {
    if (this.selectedFiles.length === 0) return Promise.resolve();

    this.pjUploading = true;
    const userId = this.user.idutilisateur;

    return new Promise((resolve, reject) => {
      this.bugetPJService
        .create(idbudget, this.selectedFiles, userId)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.toastr.success(`${res.data.length} fichier(s) uploadé(s)`);
              this.selectedFiles = [];
              resolve();
            } else {
              reject(new Error('Upload failed'));
            }
            this.pjUploading = false;
          },
          error: (err) => {
            this.pjUploading = false;
            reject(err);
          },
        });
    });
  }

  private deleteMarkedFiles(idbudget: string): Promise<void> {
    if (this.filesToDelete.length === 0) return Promise.resolve();

    const deletePromises = this.filesToDelete.map((id) =>
      this.bugetPJService.delete(idbudget, id).toPromise(),
    );

    return Promise.all(deletePromises)
      .then(() => {
        this.toastr.success(
          `${this.filesToDelete.length} fichier(s) supprimés`,
        );
        this.filesToDelete = [];
      })
      .catch((err) => {
        console.error('Erreur suppression:', err);
        throw err;
      });
  }

  removeExistingFile(piece: PieceJointe): void {
    if (!confirm(`Supprimer définitivement "${piece.nomfichier}" ?`)) return;

    this.pjDeleting = piece.idpiecejointe;

    // ⭐ Utiliser l'ID du budget sélectionné, pas this.idbudget
    const budgetId = this.selectedBudget?.idbudget || this.budget?.idbudget;

    if (!budgetId) {
      this.toastr.error('ID du budget non trouvé');
      this.pjDeleting = null;
      return;
    }

    this.bugetPJService.delete(budgetId, piece.idpiecejointe).subscribe({
      next: (res) => {
        if (res.success) {
          const index = this.existingPieces.findIndex(
            (p) => p.idpiecejointe === piece.idpiecejointe,
          );
          if (index !== -1) {
            this.existingPieces.splice(index, 1);
          }
          this.toastr.success('Fichier supprimé avec succès');
        } else {
          this.toastr.error('Erreur lors de la suppression');
        }
        this.pjDeleting = null;
      },
      error: (err) => {
        this.toastr.error(
          err.error?.message || 'Erreur lors de la suppression',
        );
        this.pjDeleting = null;
      },
    });
  }
  loadPiecesCountsForAllOperations(): void {
    if (!this.budgets || this.budgets.length === 0) return;

    // Créer un tableau de promesses pour toutes les opérations
    const requests = this.budgets.map((budget) =>
      this.bugetPJService
        .getAll(budget.idbudget)
        .pipe(catchError(() => of({ success: false, data: [] }))),
    );

    // Exécuter toutes les requêtes en parallèle
    forkJoin(requests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          const budget = this.budgets[index];
          if (response.success && response.data) {
            this.piecesCountMap.set(budget.idbudget, response.data.length);
          } else {
            this.piecesCountMap.set(budget.idbudget, 0);
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement compteurs PJ:', err);
        // En cas d'erreur, initialiser à 0 pour toutes
        this.budgets.forEach((budget) => {
          this.piecesCountMap.set(budget.idbudget, 0);
        });
      },
    });
  }

  isDragOver = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  selectedFile: File | null = null;

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      // Filtrer par extension
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
        return allowedExtensions.includes(ext) && file.size <= 10 * 1024 * 1024;
      });
      this.selectedFiles.push(...validFiles);
    }
  }

  // budget.component.ts

  /**
   * Télécharge toutes les pièces jointes du budget
   */
  downloadAllFiles(): void {
    if (!this.selectedBudgetPJ && !this.budget) {
      this.toastr.error('Aucun budget sélectionné');
      return;
    }

    const budgetId = this.selectedBudgetPJ?.idbudget || this.budget?.idbudget;

    if (!budgetId) {
      this.toastr.error('ID du budget non trouvé');
      return;
    }

    this.loading = true;
    this.bugetPJService.downloadAllFiles(budgetId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extraire le nom du fichier des headers ou utiliser un nom par défaut
        const contentDisposition = blob.type;
        const filename = `budget_${this.selectedBudgetPJ?.codebudget || this.budget?.codebudget}_${this.selectedBudgetPJ?.libelle || this.budget?.libelle}_pieces_jointes.zip`;

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

  /**
   * Formate une période de dates de manière moderne et professionnelle
   * @param startDate Date de début
   * @param endDate Date de fin
   * @returns Chaîne formatée (ex: "Janv. 2024 - Déc. 2024" ou "01/01/2024 - 31/12/2024")
   */
  formatPeriod(startDate: string | Date, endDate: string | Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Si c'est une année complète (01/01 au 31/12)
    if (
      start.getMonth() === 0 &&
      start.getDate() === 1 &&
      end.getMonth() === 11 &&
      end.getDate() === 31 &&
      start.getFullYear() === end.getFullYear()
    ) {
      return start.getFullYear().toString();
    }

    // Si c'est un mois complet
    const lastDayOfMonth = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
    ).getDate();
    if (
      start.getDate() === 1 &&
      end.getDate() === lastDayOfMonth &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return start.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
    }

    // Format moderne pour les autres périodes
    return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }

  /**
   * Obtient les infos de badge pour un statut
   * @param value Valeur du statut (0, 1, ou autre)
   * @param type Type de statut ('boolean' pour Oui/Non, 'triple' pour Oui/En cours/Non)
   * @returns Objet avec la classe CSS et le texte à afficher
   */
  getStatusInfo(
    value: Number | number | null | undefined,
    type: 'boolean' | 'triple',
  ): { class: string; text: string } {
    if (value === null || value === undefined) {
      return { class: 'status-non', text: 'Non' };
    }

    if (type === 'boolean') {
      return {
        class: value === 1 ? 'status-oui' : 'status-non',
        text: value === 1 ? 'Oui' : 'Non',
      };
    } else {
      // (0 = En cours, 1 = Oui, autre = Non)
      if (value === 1) return { class: 'status-oui', text: 'Oui' };
      if (value === 0) return { class: 'status-encours', text: 'En cours' };
      return { class: 'status-non', text: 'Non' };
    }
  }
}
