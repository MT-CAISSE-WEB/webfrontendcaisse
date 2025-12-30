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

  currentStatusFilter: BudgetStatusFilter = 'ALL';

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

  constructor(private budgetservice: BudgetService, private router: Router) {}

  ngOnInit(): void {
    //Initialisation du formulaire
    this.initForm();

    //Afficher tous les journaux
    this.getAllBudgets();

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('Ce budget');
    this.titleMsg = TITLE_DELETE;
  }

  getAllBudgets() {
    this.isExpanded = {};
    this.params = {
      page: this.currentPage,
      limit: this.getBudgetsAnnuels().length,
    };
    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.budgets = res.data;
          this.applyStatusFilter(this.currentStatusFilter);
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

  applyStatusFilter(status: BudgetStatusFilter) {
    this.currentStatusFilter = status;

    switch (status) {
      case 'ACTIF':
        this.filteredBudgets = this.budgets.filter(
          (b) => b.actif === 1 && b.typebudget === 'Annuel'
        );
        break;

      case 'INACTIF':
        this.filteredBudgets = this.budgets.filter(
          (b) => b.actif === 0 && b.typebudget === 'Annuel'
        );
        break;

      default:
        this.filteredBudgets = [...this.budgets];
    }

    // Reset sélection (important)
    this.objectsSelected = [];
    this.selectedItems = [];
    this.checkAllRow = false;
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
        // createdby
        actif: [false],
      },
      {
        validators: this.budgetDateValidator(() => this.selectedBudgetParent),
      }
    );
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
      ]);

      resetErrors(endCtrl, [
        'startAfterEnd',
        'invalidMonthRange',
        'outOfParentRange',
        'duplicateMonthlyBudget',
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

    this.budget.idcircuitvalidation =
      formValue.idcircuitvalidation === ''
        ? null
        : formValue.idcircuitvalidation;
    this.budget.idsite = formValue.idsite === '' ? null : formValue.idsite;
    this.budget.idsociete =
      formValue.idsociete === '' ? null : formValue.idsociete;
    this.budget.datevalidedept = null;
    this.budget.datevalidesite = null;
    this.budget.datevalidesociete = null;
    this.budget.createdby = 'MAF';
    this.budget.dernierniveau = null;
    this.budget.niveauactuel = null;

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
        console.log('Resultat:', res);
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
    _budget.updatedby = 'admin';
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
