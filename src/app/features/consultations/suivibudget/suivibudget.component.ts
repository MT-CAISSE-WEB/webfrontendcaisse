import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../services/suivibudget.service';
import { BudgetService } from '../../budgets/services/budget.service';
import { BudgetModel } from '../../budgets/models/budget.model';
import { affectationdepartementnatureModel } from '../../donnee_base/models/affectationdepartementnature.model';
import { AffectationDepartementNatureService } from '../../donnee_base/services/affectationdepartementnature.service';
import { departementmodel } from '../../structure/model/departement.model';
import { departementservice } from '../../structure/service/departement.service';
import { RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';
import {
  COLUMNS_BUDGET,
  COLUMNS_CENTRE,
  COLUMNS_DEPARTEMENT,
  COLUMNS_NATURE,
} from '../../../_core/constantes/tableau.data';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { CustomFieldSelectComponent } from '../../../_core/custom/custom-field-select/custom-field-select.component';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-suivibudget',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    CustomFieldSelectComponent,
  ],
  templateUrl: './suivibudget.component.html',
  styleUrl: './suivibudget.component.css',
})
export class SuiviBudgetComponent implements OnInit {
  title = 'Evolution globale budget';
  fb: FormBuilder = new FormBuilder();
  parametreForm: FormGroup = this.fb.group({});

  loading = false;
  error = '';
  msgErros = '';
  msgSuccess = '';

  Math = Math;

  //AFFICHER L ELEMENT EN COURS
  breadCrumbItems: any;

  currentPage: number = 1;

  filteredBudgets: BudgetModel[] = [];
  params: any = {};
  budgets: BudgetModel[] = [];
  filteredbudget: BudgetModel[] = [];

  //Liste des natures des départements
  naturesBydepartements: any[] = [];
  departements: departementmodel[] = [];
  filtredepartement: departementmodel[] = [];
  affectees: any[] = [];
  departementForm!: FormGroup;
  centres: centreanalytiqueModel[] = [];
  centresFiltered: centreanalytiqueModel[] = [];
  natureoperations: natureoperationModel[] = [];
  natureoperationsFiltered: natureoperationModel[] = [];

  //TITRE ET BOUTON RETOUR
  url: string = '';
  evolutionbudget: any[] = [];
  // Nombre d'éléments par page
  totalPages: number = 0;
  page = 1;
  limit = 50;
  searchs = '';

  isanalytique: number = 1;

  columnsbudget: any[] = COLUMNS_BUDGET;
  columnsnature: any[] = COLUMNS_NATURE;
  columnscentre: any[] = COLUMNS_CENTRE;
  columnsdepartement: any[] = COLUMNS_DEPARTEMENT;
  // budget sélectionné
  selectedTiers: any = null;
  // Nature sélectionné
  selectedNature: any = null;
  // Centre sélectionné
  selectedCentre: any = null;
  // Département sélectionné
  selectedDepartement: any = null;
  // Budget sélectionné
  selectedBudget: any = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ConsultationService: ConsultationService,
    private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private centreanalytiqueservice: CentreAnalytiqueService,
    private natureoperationservice: NatureoperationService,
    private budgetservice: BudgetService,
    private toastr: ToastrService,
    private dp: departementservice,
  ) {}

  ngOnInit(): void {
    //initialiser le formulaire
    this.initForm();
    //this.getEvolBudget();

    this.dp.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.departements = res.data;
          this.filtredepartement = [...this.departements];
        }
      },
    });

    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.budgets = res.data;
          this.filteredBudgets = [...this.budgets];
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });

    //Écoute du changement de departement
    // this.parametreForm.get('iddepartement')?.valueChanges.subscribe(iddepartement => {
    //   if (iddepartement) {
    //     this.getallAffectations(iddepartement);
    //   }
    // });

    this.natureoperationservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.natureoperations = res.data;
          this.natureoperationsFiltered = [...this.natureoperations];
        }
      },
    });

    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.centres = res.data;
          this.centresFiltered = [...this.centres];
        }
      },
    });
  }

  //Initialiser le formulaire
  initForm() {
    this.parametreForm = this.fb.group({
      idbudget: ['', Validators.required],
      iddepartement: [''],
      centre: [''],
      idnature: [''],
    });

    // Sauvegarde automatique
    this.parametreForm.valueChanges.subscribe((values) => {
      localStorage.setItem('suiviFiltres', JSON.stringify(values));
    });
  }

  getBudgetsAnnuels() {
    return this.filteredBudgets.filter((b) => b.typebudget === 'Annuel');
  }

  getAllBudgets() {
    this.params = {
      page: this.currentPage,
      limit: this.getBudgetsAnnuels().length,
    };
    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.budgets = res.data;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  getallAffectations(iddepartement: string) {
    this.AffectationDepartementNatureService.getAll(iddepartement).subscribe({
      next: (res) => {
        if (res.success) {
          this.natureoperationsFiltered = res.data.naturesaffectes;
        }
      },
    });
  }

  getEvolBudget() {
    this.ConsultationService.getEvolBudget(this.parametreForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.evolutionbudget = res.data.data;
        }
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Recuperer le departement selectionné
  get departement() {
    return this.parametreForm.get('departement')?.value;
  }

  //Chargement plus
  loadMore() {
    this.page++;
    //this.loadTiers();
  }

  onAutocompleteOpen() {
    this.page = 0; // reset pagination quand l'autocomplete s'ouvre
    this.searchDepartement('');
  }

  //Soumission du formulaire
  onSubmit() {
    /** Check formulaire */
    const controls = this.parametreForm.controls;
    if (this.parametreForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      //this.toastr.warning(this.msgErros);
      return;
    }

    /** 2. prepare data */
    const formValue = {
      ...this.parametreForm.value,
      page: this.page,
      limit: this.limit,
    };

    // Send parametreForm
    this.soumettre(formValue);
  }

  // Enregistrer les affectations
  soumettre(parms: any) {
    this.ConsultationService.getEvolBudget(parms).subscribe({
      next: (res) => {
        console.log('res', res);
        if (res.success) {
          this.evolutionbudget = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      },
      error: (err) => {
        this.toastr.error(err);
      },
    });
  }

  resetForm() {
    this.parametreForm.reset();
    this.rafreshpage();
  }

  rafreshpage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
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

  get form() {
    return this.parametreForm.controls;
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
  }

  //Recharger la page total
  changePageTotal(page: number) {
    this.page = page;
    this.onSubmit();
  }

  exportToExcel(): void {
    const element = document.getElementById('exportTable');

    if (!element) {
      console.error('Table non trouvée');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Evolution Budget': worksheet },
      SheetNames: ['Evolution Budget'],
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(
      data,
      `Evolution_budget_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.xlsx`,
    );
  }

  exportToCSV(): void {
    const element = document.getElementById('exportTable');

    if (!element) {
      console.error('Table non trouvée');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    saveAs(blob, `evolution_budget_${new Date().getTime()}.csv`);
  }

  onSelectDepartement(dept: any) {
    this.selectedDepartement = dept;
  }

  //Chargement du Departement
  searchDepartement(event: any) {
    const search = event.search || '';
    this.filtredepartement = this.departements.filter(
      (d) =>
        d.libelle?.toLowerCase().includes(search.toLowerCase()) ||
        d.codedept?.toLowerCase().includes(search.toLowerCase()),
    );
  }

  //Chargement des natures
  searchNature(event: any) {
    const search = event.search || '';
    this.natureoperationsFiltered = this.natureoperations.filter(
      (t) =>
        t.libelle?.toLowerCase().includes(search.toLowerCase()) ||
        t.codenature?.toLowerCase().includes(search.toLowerCase()),
    );
  }

  onSelectNature(nature: any) {
    this.selectedNature = nature;
  }

  //Chargement du centre analytique
  searchCentre(event: any) {
    const search = event.search || '';
    this.centresFiltered = this.centres.filter(
      (t) =>
        t.codecentreanalytique?.toLowerCase().includes(search.toLowerCase()) ||
        t.libelle?.toLowerCase().includes(search.toLowerCase()),
    );
  }

  onSelectCentre(centre: any) {
    this.selectedCentre = centre;
  }

  //Chargement du budget
  searchBudget(event: any) {
    const search = event.search || '';
    this.filteredBudgets = this.budgets.filter(
      (t) =>
        t.codebudget?.toLowerCase().includes(search.toLowerCase()) ||
        t.libelle?.toLowerCase().includes(search.toLowerCase()),
    );
  }

  onSelectBudget(budget: any) {
    this.selectedBudget = budget;
    if (
      this.selectedBudget.isanalytique &&
      this.selectedBudget.isanalytique == 1
    ) {
      this.isanalytique = 1;
    } else {
      this.isanalytique = 0;
    }
  }
}
