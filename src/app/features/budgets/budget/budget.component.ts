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

  constructor(
    private budgetservice: BudgetService,
    private circuitvalidationservice: circuitvalidationservice,
    private budgetPrevisionService: BudgetPrevisionService,
    private lignebudgetservice: LigneBudgetService,
    private router: Router
  ) { }

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
          this.budgets = lesbudgets.filter(
            (b) =>
              b.idsite === this.user.idsite &&
              b.idsociete === this.user.idsociete
          );
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

  // Afficher les lignes budgétaires du budget
  onClickAfficherLignesBudgetaire(budget: BudgetModel): void{
    if(!budget) return
    this.selectedBudget = budget
    const lignes = this.lignesBudgetaires.filter(
      l => l.idbudget === budget.idbudget
    );
    this.lignesByBudget = lignes
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
              c.typeentite.toLocaleLowerCase() === 'site'
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
      (l) => l.idbudget === budget.idbudget
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
      (b) => b.typebudget === 'Mensuel' && b.idbudgetparent === parentId
    );
  }
  get totalActifs(): number {
    return this.budgets.filter(
      (b) => b.actif === 1 && b.typebudget === 'Annuel'
    ).length;
  }

  get totalInactifs(): number {
    return this.budgets.filter(
      (b) => b.actif === 0 && b.typebudget === 'Annuel'
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
          b.libelle?.toLowerCase().includes(term)
      );

      // IDs des budgets annuels trouvés
      const parentIds = new Set(
        matched.filter((b) => b.typebudget === 'Annuel').map((b) => b.idbudget)
      );

      // Appliquer la recherche en incluant les mensuels liés
      result = this.budgets.filter(
        (b) =>
          matched.includes(b) ||
          (b.idbudgetparent && parentIds.has(b.idbudgetparent))
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
          (b) => b.actif === 1 && b.typebudget === 'Annuel'
        );
        break;

      case 'INACTIF':
        parents = this.budgets.filter(
          (b) => b.actif === 0 && b.typebudget === 'Annuel'
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
        (b.idbudgetparent && parentIds.has(b.idbudgetparent))
    );

    // Reset sélection
    this.objectsSelected = [];
    this.selectedItems = [];
    this.checkAllRow = false;
  }

  get hasAnnualBudgets(): boolean {
  return this.filteredBudgets.some(b => b.typebudget === 'Annuel');
}

  getPrevisionAnnuel(budget: BudgetModel): number {
    return this.budgetPrevisionService.calculPrevisionBudgetAnnuel(
      budget,
      this.budgets,
      this.lignesBudgetaires
    );
  }

  getPrevisionMensuel(budget: BudgetModel): number {
    return this.budgetPrevisionService.calculPrevisionBudget(
      budget,
      this.lignesBudgetaires
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
        entite: ['', [Validators.required]],
        datefin: ['', [Validators.required]],
        idbudgetparent: [''],
        idsite: [this.user.idsite ?? null],
        idsociete: [this.user.idsociete ?? null],
        idcircuitvalidation: [
          this.circuitValidation?.idcircuitvalidation ?? null,
        ],
        // createdby
        actif: [false],
      },
      {
        validators: this.budgetDateValidator(() => this.selectedBudgetParent),
      }
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
      (el) => el.idbudget == budget.idbudget
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
      ]);

      resetErrors(endCtrl, [
        'startAfterEnd',
        'invalidMonthRange',
        'outOfParentRange',
        'duplicateMonthlyBudget',
        'invalidAnnualEndDate',
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
          0
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

  // budgetDateValidator(getParent: () => BudgetModel | undefined): ValidatorFn {
  //   return (group: AbstractControl): ValidationErrors | null => {
  //     const startCtrl = group.get('datedebut');
  //     const endCtrl = group.get('datefin');
  //     const typeCtrl = group.get('typebudget');

  //     if (!startCtrl || !endCtrl || !typeCtrl) return null;

  //     const clearError = (ctrl: AbstractControl, key: string) => {
  //       if (!ctrl.errors) return;
  //       const { [key]: _, ...rest } = ctrl.errors;
  //       ctrl.setErrors(Object.keys(rest).length ? rest : null);
  //     };

  //     clearError(startCtrl, 'startAfterEnd');
  //     clearError(endCtrl, 'startAfterEnd');
  //     clearError(endCtrl, 'invalidMonthRange');
  //     clearError(startCtrl, 'outOfParentRange');
  //     clearError(endCtrl, 'outOfParentRange');

  //     if (!startCtrl.value || !endCtrl.value) return null;

  //     const start = new Date(startCtrl.value);
  //     const end = new Date(endCtrl.value);

  //     /* ==========================
  //    1️⃣ DATE DÉBUT < DATE FIN
  //    ========================== */
  //     if (start >= end) {
  //       endCtrl.setErrors({
  //         ...endCtrl.errors,
  //         startAfterEnd: true,
  //       });
  //       return { startAfterEnd: true };
  //     }

  //     /* ==========================
  //    2️⃣ VALIDATION MENSUELLE
  //    ========================== */
  //     if (typeCtrl.value === 'Mensuel') {
  //       const sameMonth =
  //         start.getMonth() === end.getMonth() &&
  //         start.getFullYear() === end.getFullYear();

  //       const lastDayOfMonth = new Date(
  //         start.getFullYear(),
  //         start.getMonth() + 1,
  //         0
  //       ).getDate();

  //       if (!sameMonth || end.getDate() !== lastDayOfMonth) {
  //         endCtrl.setErrors({
  //           ...endCtrl.errors,
  //           invalidMonthRange: true,
  //         });
  //         return { invalidMonthRange: true };
  //       }
  //     }

  //     /* ==========================
  //    3️⃣ VALIDATION PARENT STRICTE
  //    ========================== */
  //     const parent = getParent();
  //     if (parent && typeCtrl.value === 'Mensuel') {
  //       const parentStart = new Date(parent.datedebut);
  //       const parentEnd = new Date(parent.datefin);

  //       if (!(start >= parentStart && end <= parentEnd)) {
  //         endCtrl.setErrors({
  //           ...endCtrl.errors,
  //           outOfParentRange: true,
  //         });
  //         return { outOfParentRange: true };
  //       }
  //     }

  //     return null;
  //   };
  // }

  // choix du budget parent
  onSelectionChange(event: Event) {
    const selectedId = (event.target as HTMLSelectElement).value;

    this.selectedBudgetParent = this.budgets.find(
      (b) => b.idbudget === selectedId
    );

    const entiteCtrl = this.budgetForm.get('entite');

    if (!this.selectedBudgetParent) {
      entiteCtrl?.reset(null);
      entiteCtrl?.enable({ emitEvent: false });
    } else {
      entiteCtrl?.setValue(this.selectedBudgetParent.entite);
      entiteCtrl?.disable({ emitEvent: false });
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
        controls[controlName].markAsTouched()
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.budgetForm.getRawValue();

    this.budget.idcircuitvalidation = this.circuitValidation?.idcircuitvalidation as string;
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
      });
    }
    // if (!_journal.idjournal) this.create(_journal);
    // else this.update(_journal);
  }

  //Enregistrement de données
  create(_budget: BudgetModel) {
    const { idbudget, ...dataToSend } = _budget;

    this.loading = true;
    this.budgetservice.create(dataToSend).subscribe({
      next: (res: any) => {
        //console.log('Resultat:', res);
        if (res.success) {
          this.currentStatusFilter = 'ALL';
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
      },
    });
  }

  //Modification de données
  update(_budget: any) {
    _budget.updatedby = this.user.nom + ' ' + this.user.prenom;
    this.budgetservice.update(_budget).subscribe({
      next: (res: any) => {
        if (res.success) {
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
    this.initForm();
  }

  modalUpdate(_object: BudgetModel) {
    this.budget = _object;
    this.actionModal = 'update';
    this.budgetForm.reset();

    this.selectedBudgetParent = this.budgets.find(
      (b) => b.idbudget === _object.idbudgetparent
    );

    this.dispatchBudget(_object);

    /* 🔒 Désactivation */
    this.budgetForm.get('codebudget')?.disable({ emitEvent: false });
    this.budgetForm.get('typebudget')?.disable({ emitEvent: false });
    // Désactivation et masquage du circuit de validation
    this.budgetForm.get('idcircuitvalidation')?.disable({ emitEvent: false });

    this.budgetForm.markAllAsTouched();
    this.budgetForm.updateValueAndValidity();
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
          this.getAllBudgets();
        } else {
          this.error = 'Erreur de Suppression';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Suppression échec';
        this.loading = false;
      },
    });
  }
}
