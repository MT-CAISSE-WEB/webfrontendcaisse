import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
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
import { DatePipe } from '@angular/common';
import { LigneBudgetModel } from '../models/ligne_budget.model';
import { LigneBudgetService } from '../services/ligne_budget.service';
import { BudgetModel } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';

@Component({
  selector: 'app-ligne-budget',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './ligne-budget.component.html',
  styleUrl: './ligne-budget.component.css',
})
export class LigneBudgetComponent implements OnInit {
  title = 'Lignes du budget';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  ligneBudgets: LigneBudgetModel[] = [];
  budgets: BudgetModel[] = [];
  ligneBudget: LigneBudgetModel = new LigneBudgetModel();
  msgErros: string = '';
  loading: Boolean = false;
  ligneBudgetForm: FormGroup = this.fb.group({});

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected: LigneBudgetModel[] = [];
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
  deleteLigneBudget: any = null;

  constructor(
    private lignebudgetservice: LigneBudgetService,
    private budgetservice: BudgetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    //Afficher toutes les lignes budgétaires
    this.getAllBudgets();
    this.getAllLigneBudgets();

    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('cette ligne budgétaire');
    this.titleMsg = TITLE_DELETE;
  }

  // Obtenir la liste de tous les budgets
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
          this.totalPages = res.data.totalPages;
        }
      },
    });
  }

  getAllLigneBudgets() {
    this.params = {
      page: this.currentPage,
      limit: this.limit,
    };
    this.lignebudgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ligneBudgets = res.data;
          // console.log('Budgets:', this.budgets);
          this.totalPages = res.data.totalPages;
        }
      },
    });
  }

  //création du formulaire
  initForm(): void {
    this.ligneBudgetForm = this.fb.group({
      idbudget: ['', [Validators.required]],
      montantprevisiondept: ['', [Validators.required]],
      montantprevisionsite: ['', [Validators.required]],
      montantprevisionsociete: ['', [Validators.required]],
      totalconsocloture: ['', [Validators.required]],
      soldecloture: ['', [Validators.required]],
    });
  }

  get form() {
    return this.ligneBudgetForm.controls;
  }

  dispatchLigneBudget(_object: LigneBudgetModel) {
    this.ligneBudgetForm.patchValue({
      idbudget: _object.idbudget,
      montantprevisiondept: _object.montantprevisiondept,
      montantprevisionsite: _object.montantprevisionsite,
      montantprevisionsociete: _object.montantprevisionsociete,
      totalconsocloture: _object.totalconsocloture,
      soldecloture: _object.soldecloture,
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
      (el) => el.idbudgetdepartementnature
    );
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(ligneBudget: LigneBudgetModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) =>
        el.idbudgetdepartementnature == ligneBudget.idbudgetdepartementnature
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

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllBudgets();
    this.getAllLigneBudgets(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.ligneBudgetForm.controls;
    if (this.ligneBudgetForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched()
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.ligneBudgetForm.value;

    this.ligneBudget.createdby = 'MAF';

    const _ligneBudget: LigneBudgetModel = {
      ...this.ligneBudget,
      ...formValue,
      iddepartement:
        formValue.iddepartement === '' ? null : formValue.iddepartement,
      idnature: formValue.idnature === '' ? null : formValue.idnature,
    };

    /** 3. choices action */
    if (this.actionModal == 'create') this.create(_ligneBudget);
    else {
      this.update({
        idbudgetdepartementnature: _ligneBudget.idbudgetdepartementnature,
        idbudget: formValue.idbudget,
        iddepartement:
          formValue.iddepartement === '' ? null : formValue.iddepartement,
        idnature: formValue.idnature === '' ? null : formValue.idnature,
        montantprevisiondept: formValue.montantprevisiondept,
        montantprevisionsite: formValue.montantprevisionsite,
        montantprevisionsociete: formValue.montantprevisionsociete,
        totalconsocloture: formValue.totalconsocloture,
        soldecloture: formValue.soldecloture,
      });
    }
    // if (!_journal.idjournal) this.create(_journal);
    // else this.update(_journal);
  }

  //Enregistrement de données
  create(_ligneBudget: LigneBudgetModel) {
    const { idbudgetdepartementnature, ...dataToSend } = _ligneBudget;

    this.loading = true;
    this.lignebudgetservice.create(dataToSend).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllBudgets();
          this.getAllLigneBudgets();
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
  update(_ligneBudget: any) {
    _ligneBudget.updatedby = 'admin';
    this.lignebudgetservice.update(_ligneBudget).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllBudgets();
          this.getAllLigneBudgets();
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

  modalUpdate(_object: LigneBudgetModel) {
    this.ligneBudget = _object;
    this.actionModal = 'update';
    this.ligneBudgetForm.reset();
    this.dispatchLigneBudget(_object);
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
          console.log('Suppression:', res);
          if (res.success) {
            this.deleteLigneBudget = null;
            this.closeModal('deleteOrder');
            this.getAllBudgets();
            this.getAllLigneBudgets();
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
