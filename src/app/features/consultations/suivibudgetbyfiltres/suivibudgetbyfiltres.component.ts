import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { utilisateurdepartementservice } from '../../administration/service/userdepartement.service';
import { affectationdepartementnatureModel } from '../../donnee_base/models/affectationdepartementnature.model';
import { AffectationDepartementNatureService } from '../../donnee_base/services/affectationdepartementnature.service';
import { devisemodel } from '../../donnee_base/donnee_base/model/devise.model';
import { deviseservice } from '../../donnee_base/donnee_base/service/devise.service';
import { SuiviBudgetByFiltresService } from '../services/suivibudgetbyfiltres.service';
import { BudgetService } from '../../budgets/services/budget.service';
import { BudgetModel } from '../../budgets/models/budget.model';

import { RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';



@Component({
  selector: 'app-suivibudgetbyfiltres',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './suivibudgetbyfiltres.component.html',
  styleUrl: './suivibudgetbyfiltres.component.css'
})
export class SuiviBudgetByFiltresComponent implements OnInit {
  title = 'Demandes par budget';
  fb: FormBuilder = new FormBuilder();
  parametreForm: FormGroup = this.fb.group({});

  loading = false;
  error = '';
  msgErros = '';
  msgSuccess = '';

  //AFFICHER L ELEMENT EN COURS
  breadCrumbItems: any;

  iddemande: any = "0";

  //Liste des départements de l'utilisateurs
  departementUser: any = [];

  //Liste des natures des départements
  naturesBydepartements: any[] = [];
  //Liste des centres analytiques des natures opérations
  centresBynatures: any[] = [];

  //Ramener la devise
  devises : devisemodel[] = [];
  devise : devisemodel = new devisemodel();

  //Liste des natures filtrées
  naturesFiltrees: any[] = [];

  //TITRE ET BOUTON RETOUR
  url: string = "";

  evolutionbudget : any[] = [];

  currentPage: number = 1;

  filteredBudgets: BudgetModel[] = [];
  params: any = {};
  budgets: BudgetModel[] = [];
  

  



  constructor(private router : Router, private ds:deviseservice,
     private AffectationDepartementNatureService: AffectationDepartementNatureService,
     private toastr : ToastrService, private activatedRoute: ActivatedRoute,
    private SuiviBudgetByFiltre : SuiviBudgetByFiltresService,
    private budgetservice : BudgetService,
    private userdepartement: utilisateurdepartementservice){}


  ngOnInit(): void {
    //initialiser le formulaire 
    this.initForm();

    //Afficher toutes les devises
    this.getalldevises();

    this.getBudgetsAnnuels();
    this.getAllBudgets();

    //Charger les départements de l'user
    this.getDepartementOfUser();

    this.parametreForm.get('departement')?.valueChanges.subscribe(dept => {
      if(dept){
        //filtrer sur la natures des opérations
        this.getallAffectationNatures(dept);
      }
    });

    this.getAllEvolBudget();

    this.soumettre();
  }


  //Initialiser le formulaire
  initForm() {
    this.parametreForm = this.fb.group({
      datedebut: ['', Validators.required],
      datefin: [''],
      budget: ['', Validators.required],
      nature: ['', Validators.required],
      departement: ['', Validators.required],
    });

    // Sauvegarde automatique
    this.parametreForm.valueChanges.subscribe(values => {
      localStorage.setItem(
        'suiviFiltres',
        JSON.stringify(values)
      );
    });
  }

  //Récupérer les devises
  getalldevises (){
    const params = {
      page: 1,
      limit: 20
    };
    this.ds.getAll(params).subscribe({
      next : (res) => {
         if(res.success){
            this.devises = res.data;
         }
      }
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

  //Récuperer le departement de l'utilisateur
  getDepartementOfUser(){
    this.userdepartement.getutilisateurdepartement(this.user.idutilisateur).subscribe({
      next : (res) => {
        if(res.success){
          this.departementUser = res.data[0];
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message)
      }
    });
  }

  //Affectation natures departements
  getallAffectationNatures(iddepartement: string) {
    this.AffectationDepartementNatureService.getAll(iddepartement).subscribe({
      next: (res) => {
        if (res.success) {
          //this.naturesBydepartements = res.data.naturesaffectes;
          this.naturesBydepartements = (res.data.naturesaffectes || []).filter(
            (n: any) => n.actif === 1
          );
        }
      }
    });
  }


  getAllEvolBudget() {
    console.log(this.parametreForm);
    this.SuiviBudgetByFiltre.getEvolBudget(this.parametreForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.evolutionbudget = res.data;

        }
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Recuperer le departement selectionné
  get departement() {
    return this.parametreForm.get("iddepartement")?.value;
  }

  get form() {
    return this.parametreForm.controls;
  }


  // Enregistrer les affectations
  soumettre() {
    const parms = {
      datedebut : this.parametreForm.get('datedebut')?.value,
      datefin : this.parametreForm.get('datefin')?.value,
      departement : this.parametreForm.get('departement')?.value,
      nature : this.parametreForm.get('nature')?.value,
    }

    this.SuiviBudgetByFiltre.getEvolBudget(parms).subscribe({
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
