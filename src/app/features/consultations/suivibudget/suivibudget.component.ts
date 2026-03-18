import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { utilisateurdepartementservice } from '../../administration/service/userdepartement.service';
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


@Component({
  selector: 'app-suivibudget',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './suivibudget.component.html',
  styleUrl: './suivibudget.component.css'
})
export class SuiviBudgetComponent implements OnInit {
  title = 'Evlution globale budget';
  fb: FormBuilder = new FormBuilder();
  parametreForm: FormGroup = this.fb.group({});

  loading = false;
  error = '';
  msgErros = '';
  msgSuccess = '';

  //AFFICHER L ELEMENT EN COURS
  breadCrumbItems: any;

  currentPage: number = 1;

  filteredBudgets: BudgetModel[] = [];
  params: any = {};
  budgets: BudgetModel[] = [];

  //Liste des natures des départements
  naturesBydepartements: any[] = [];

  departements : departementmodel[] = [];

  filtredepartement : departementmodel[] = [];

  affectees: any[] = [];

  departementForm!: FormGroup;
  



  //TITRE ET BOUTON RETOUR
  url: string = "";

  evolutionbudget : any[] = [];

  // Nombre d'éléments par page
  totalPages: number = 0;



  constructor(private router : Router, private activatedRoute: ActivatedRoute
    , private ConsultationService : ConsultationService,
    private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private budgetservice : BudgetService,
    private dp : departementservice){}


  ngOnInit(): void {
    this.departementForm = this.fb.group({
          iddepartement: ["", Validators.required],
        });

    //initialiser le formulaire 
    this.initForm();
    this.getAllBudgets();
    this.getEvolBudget();
    this.getalldepartements();

    // ✅ Écoute du changement de departement
    this.parametreForm.get('iddepartement')?.valueChanges.subscribe(iddepartement => {
      if (iddepartement) {
        this.getallAffectations(iddepartement);
      }
    });

    this.soumettre();
  }


  //Initialiser le formulaire
  initForm() {
    this.parametreForm = this.fb.group({
      idbudget: ['', Validators.required],
      iddepartement: ['', Validators.required],
      idnature: ['', Validators.required],
    });

    // Sauvegarde automatique
    this.parametreForm.valueChanges.subscribe(values => {
      localStorage.setItem(
        'suiviFiltres',
        JSON.stringify(values)
      );
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
          console.log(this.budgets)
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }


  getalldepartements (){
    this.dp.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.departements = res.data;
            console.log(this.departements);
         }
      }
    });
  }

  
  getallAffectations(iddepartement: string) {
    this.AffectationDepartementNatureService.getAll(iddepartement).subscribe({
      next: (res) => {
        if (res.success) {
          this.affectees = res.data.naturesaffectes;
        }

      }
    });
  }



  getEvolBudget() {
    console.log(this.parametreForm);
    this.ConsultationService.getEvolBudget(this.parametreForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.evolutionbudget = res.data.data;
        }
      }
    });
  }


  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }




  //Recuperer le departement selectionné
  get departement() {
    return this.parametreForm.get("departement")?.value;
  }


  // Enregistrer les affectations
  soumettre() {
    const parms = {
      idbudget : this.parametreForm.get('idbudget')?.value,
      iddepartement : this.parametreForm.get('iddepartement')?.value,
      idnature : this.parametreForm.get('idnature')?.value,
    }

    console.log(parms);

    this.ConsultationService.getEvolBudget(parms).subscribe({
      next: (res) => {
        if (res.success) {
          this.evolutionbudget = res.data.data;
        }
      },
      error: (err) => {
          console.error(err);
        }
      });
    }


  resetForm(){
    this.parametreForm.reset();
    this.rafreshpage();
  }

  rafreshpage(){
    const currentUrl = this.router.url; 
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

    //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  get form() {
    return this.parametreForm.controls;
  }

    //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
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
      SheetNames: ['Evolution Budget']
    };
  
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
  
    const data: Blob = new Blob(
      [excelBuffer],
      { type: 'application/octet-stream' }
    );
  
    saveAs(data, `Evolution_budget_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.xlsx`);
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
      type: 'text/csv;charset=utf-8;'
    });
  
    saveAs(blob, `evolution_budget_${new Date().getTime()}.csv`);
  }
  

}
