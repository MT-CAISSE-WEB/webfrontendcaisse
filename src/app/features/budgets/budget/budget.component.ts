import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
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

  constructor(private budgetservice: BudgetService, private router: Router) {}

  ngOnInit(): void {
    //Afficher tous les journaux
    this.getAllBudgets();
    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('Ce budget');
    this.titleMsg = TITLE_DELETE;
  }

  getAllBudgets() {
    this.params = {
      page: this.currentPage,
      limit: this.limit,
    };
    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.budgets = res.data;
          // console.log('Budgets:', this.budgets);
          this.totalPages = res.totalPages;
        }
      },
    });
  }

  //création du formulaire
  initForm(): void {
    this.budgetForm = this.fb.group({
      codebudget: ['', [Validators.required]],
      datedebut: ['', [Validators.required]],
      typebudget: ['', [Validators.required]],
      datefin: ['', [Validators.required]],
      idbudgetparent: [''],
      // createdby
      actif: [false],
    });
  }

  get form() {
    return this.budgetForm.controls;
  }

  dispatchBudget(_object: BudgetModel) {
    // const status = _object.actif === 1;
    this.budgetForm.patchValue({
      codebudget: _object.codebudget,
      datedebut: this.formatDateForInput(_object.datedebut),
      typebudget: _object.typebudget,
      datefin: this.formatDateForInput(_object.datefin),
      idbudgetparent: _object.idbudgetparent,
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
    const formValue = this.budgetForm.value;

    this.budget.idcircuitvalidation = null;
    this.budget.idsite = null;
    this.budget.idsociete = null;
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
          this.closeModal('showModal');
          this.getAllBudgets();
        } else {
          this.error = 'Erreur de création';
          alert(this.error);
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.error = 'Création échec';
        alert(this.error + ': ' + err.message);
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
    this.initForm();
  }

  modalUpdate(_object: BudgetModel) {
    this.budget = _object;
    this.actionModal = 'update';
    this.budgetForm.reset();
    this.dispatchBudget(_object);
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
