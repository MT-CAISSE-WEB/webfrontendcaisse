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
import { LigneBudgetModel } from '../models/ligne_budget.model';
import { LigneBudgetService } from '../services/ligne_budget.service';
import { BudgetModel } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';
import { departementservice } from '../../structure/service/departement.service';
import { departementmodel } from '../../structure/model/departement.model';
import { AffectationDepartementNatureService } from '../../donnee_base/services/affectationdepartementnature.service';
import { affectationdepartementnatureModel } from '../../donnee_base/models/affectationdepartementnature.model';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';

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
  selectedItems: { [id: string]: boolean } = {};
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

  // savoir l'entité du budget
  selectedBudget?: BudgetModel;
  constructor(
    private lignebudgetservice: LigneBudgetService,
    private budgetservice: BudgetService,
    private departementservice: departementservice,
    private affectationService: AffectationDepartementNatureService,
    private router: Router
  ) {}

  ngOnInit(): void {
    //Afficher toutes les lignes budgétaires
    this.getAllBudgets();
    this.getAllDepartements();
    this.getAllLigneBudgets();

    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('cette ligne budgétaire');
    this.titleMsg = TITLE_DELETE;
  }

  natureGrid: Array<{
    idnature: string;
    libelle: string;

    // ID de la ligne budgétaire existante (si présente)
    idbudgetdepartementnature?: string;

    montantDept: number;
    montantSite: number;
    montantSociete: number;
  }> = [];

  // Obtenir la liste de tous les budgets
  getAllBudgets() {
    this.params = { page: 1, limit: 1000 };

    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.budgets = res.data;
        }
      },
      error: (err) => {
        console.error('Erreur récupération budgets', err);
        this.msgErros = err.error.error;
      },
    });
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
          // this.totalPages = res.totalPages;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  onSelectionChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;

    this.selectedBudget = this.budgets.find((b) => b.idbudget === id);

    this.ligneBudgetForm.patchValue({ idbudget: id });
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
          this.groupLigneBudgetsByBudget();
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

  onDepartementChange(event: any) {
    const idDept = event.target.value;

    // Reset STRICT
    this.natureGrid = [];

    if (!idDept || !this.selectedBudget) return;

    this.loadNatureGrid(idDept);
  }

  loadNatureGrid(idDepartement: string) {
    if (!idDepartement) return;
    this.affectationService.getAll(idDepartement).subscribe({
      next: (res: any) => {
        console.log('Affectation:', res.data.naturesaffectes);
        if (res.success) {
          this.natureGrid = res.data.naturesaffectes
            .sort((a: natureoperationModel, b: natureoperationModel) =>
              a.libelle.localeCompare(b.libelle)
            )
            .map((item: natureoperationModel) => ({
              idnature: item.idnature,
              libelle: item.libelle,
              montantDept: 0,
              montantSite: 0,
              montantSociete: 0,
            }));
          this.prefillNatureGrid();
        }
      },
    });
  }

  // prefillNatureGrid() {
  //   if (!this.selectedBudget) return;

  //   const idDept = this.ligneBudgetForm.value.iddepartement;

  //   this.natureGrid.forEach((ligne) => {
  //     const existing = this.ligneBudgets.find(
  //       (l) =>
  //         l.idbudget === this.selectedBudget!.idbudget &&
  //         l.iddepartement === idDept &&
  //         l.idnature === ligne.idnature
  //     );

  //     if (existing) {
  //       ligne.montantDept = existing.montantprevisiondept ?? 0;
  //       ligne.montantSite = existing.montantprevisionsite ?? 0;
  //       ligne.montantSociete = existing.montantprevisionsociete ?? 0;
  //     } else {
  //       // Reset explicite (évite toute pollution mémoire)
  //       ligne.montantDept = 0;
  //       ligne.montantSite = 0;
  //       ligne.montantSociete = 0;
  //     }
  //   });

  //   this.updateMontantsSelonValidation();
  // }

  // prefillNatureGrid() {
  //   if (!this.selectedBudget) return;

  //   const idDept = this.ligneBudgetForm.value.iddepartement;

  //   this.natureGrid.forEach((ligne) => {
  //     const existing = this.ligneBudgets.find(
  //       (l) =>
  //         l.idbudget === this.selectedBudget!.idbudget &&
  //         l.iddepartement === idDept &&
  //         l.idnature === ligne.idnature
  //     );

  //     if (existing) {
  //       ligne.idbudgetdepartementnature = existing.idbudgetdepartementnature;

  //       ligne.montantDept = existing.montantprevisiondept ?? 0;
  //       ligne.montantSite = existing.montantprevisionsite ?? 0;
  //       ligne.montantSociete = existing.montantprevisionsociete ?? 0;
  //     } else {
  //       // IMPORTANT : reset si aucune ligne existante
  //       ligne.idbudgetdepartementnature = undefined;
  //       ligne.montantDept = 0;
  //       ligne.montantSite = 0;
  //       ligne.montantSociete = 0;
  //     }
  //   });
  // }

  prefillNatureGrid() {
    if (!this.selectedBudget) return;

    const idDept = this.ligneBudgetForm.value.iddepartement;

    this.natureGrid.forEach((ligne) => {
      const existing = this.ligneBudgets.find(
        (l) =>
          l.idbudget === this.selectedBudget!.idbudget &&
          l.iddepartement === idDept &&
          l.idnature === ligne.idnature
      );

      // Si ligne existante, on prend les montants
      if (existing) {
        ligne.idbudgetdepartementnature = existing.idbudgetdepartementnature;
        ligne.montantDept = existing.montantprevisiondept ?? ligne.montantDept;
        ligne.montantSite = existing.montantprevisionsite ?? ligne.montantSite;
        ligne.montantSociete =
          existing.montantprevisionsociete ?? ligne.montantSociete;
      } else {
        // Sinon garder ce qui était dans la grid ou 0
        ligne.idbudgetdepartementnature = undefined;
        ligne.montantDept = ligne.montantDept ?? 0;
        ligne.montantSite = ligne.montantSite ?? 0;
        ligne.montantSociete = ligne.montantSociete ?? 0;
      }
    });
  }

  private hasExistingLines(budgetId: string, deptId: string): boolean {
    return this.ligneBudgets.some(
      (l) => l.idbudget === budgetId && l.iddepartement === deptId
    );
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
    value: number
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
      montantprevisiondept: ['', [Validators.required]],
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

  // onSubmit() {
  //   this.msgErros = '';

  //   const formValue = this.ligneBudgetForm.value;

  //   // ============================
  //   // MODE GRILLE (prioritaire)
  //   // ============================
  //   if (
  //     this.natureGrid?.length > 0 &&
  //     this.selectedBudget &&
  //     formValue.iddepartement
  //   ) {
  //     const payload = this.natureGrid.map((l) => ({
  //       idbudget: this.selectedBudget!.idbudget,
  //       iddepartement: formValue.iddepartement,
  //       idnature: l.idnature,
  //       montantprevisiondept: l.montantDept || 0,
  //       montantprevisionsite: l.montantSite || 0,
  //       montantprevisionsociete: l.montantSociete || 0,
  //       createdby: 'MAF',
  //     }));

  //     this.lignebudgetservice.createMultiple(payload).subscribe({
  //       next: () => {
  //         this.getAllLigneBudgets();
  //         this.resetAfterSubmit();
  //       },
  //       error: (err) => (this.msgErros = err.error?.error || 'Erreur serveur'),
  //     });

  //     return;
  //   }

  //   // ============================
  //   // MODE MODAL (une seule ligne)
  //   // ============================
  //   if (this.ligneBudgetForm.invalid) {
  //     Object.values(this.ligneBudgetForm.controls).forEach((c) =>
  //       c.markAsTouched()
  //     );
  //     this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
  //     return;
  //   }

  //   const ligne: LigneBudgetModel = {
  //     ...this.ligneBudget,
  //     ...formValue,
  //     createdby: 'MAF',
  //   };

  //   this.actionModal === 'create' ? this.create(ligne) : this.update(ligne);
  // }

  onSubmit() {
    this.msgErros = '';
    const formValue = this.ligneBudgetForm.value;

    if (!this.selectedBudget || !formValue.iddepartement) {
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    // Payload commun
    const payload = this.natureGrid.map((l) => ({
      idbudget: this.selectedBudget!.idbudget,
      iddepartement: formValue.iddepartement,
      idnature: l.idnature,
      montantprevisiondept: l.montantDept ?? 0,
      montantprevisionsite: l.montantSite ?? 0,
      montantprevisionsociete: l.montantSociete ?? 0,
      createdby: 'MAF',
    }));
    const payloadUpdate = this.natureGrid
      .filter((l) => l.idbudgetdepartementnature) // sécurité
      .map((l) => ({
        idbudgetdepartementnature: l.idbudgetdepartementnature!,
        idbudget: this.selectedBudget!.idbudget,
        iddepartement: formValue.iddepartement,
        idnature: l.idnature,
        montantprevisiondept: l.montantDept ?? 0,
        montantprevisionsite: l.montantSite ?? 0,
        montantprevisionsociete: l.montantSociete ?? 0,
        updatedby: 'MAF',
      }));

    const exists = this.hasExistingLines(
      this.selectedBudget.idbudget,
      formValue.iddepartement
    );

    this.loading = true;

    const request$ = exists
      ? this.lignebudgetservice.updateMultiple(payloadUpdate)
      : this.lignebudgetservice.createMultiple(payload);

    request$.subscribe({
      next: () => {
        this.getAllLigneBudgets();
        this.prefillNatureGrid();
        this.resetAfterSubmit();
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

  //Modification de données
  update(_ligneBudget: any) {
    _ligneBudget.updatedby = 'admin';
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
