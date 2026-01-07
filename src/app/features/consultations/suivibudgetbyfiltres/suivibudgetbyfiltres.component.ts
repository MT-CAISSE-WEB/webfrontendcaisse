import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { utilisateurdepartementservice } from '../../administration/service/userdepartement.service';
import { affectationdepartementnatureModel } from '../../donnee_base/models/affectationdepartementnature.model';
import { AffectationDepartementNatureService } from '../../donnee_base/services/affectationdepartementnature.service';
import { affectationnaturecentreModel } from '../../donnee_base/models/affectationnaturecentre.model';
import { AffectationNatureCentreService } from '../../donnee_base/services/affectationnaturecentre.service';
import { devisemodel } from '../../donnee_base/donnee_base/model/devise.model';
import { deviseservice } from '../../donnee_base/donnee_base/service/devise.service';
import { SuiviBudgetByFiltresService } from '../services/suivibudgetbyfiltres.service';
import { BudgetService } from '../../budgets/services/budget.service';
import { departementmodel } from '../../structure/model/departement.model';
import { departementservice } from '../../structure/service/departement.service';
import { RouterModule } from '@angular/router';


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


  //Liste des natures des départements
  naturesBydepartements: any[] = [];
  //Liste des centres analytiques des natures opérations
  centresBynatures: any[] = [];

  //Ramener la devise
  devises : devisemodel[] = [];
  devise : devisemodel = new devisemodel();

  //Liste des natures filtrées
  naturesFiltrees: any[] = [];
  natureoperations : natureoperationModel[] = [];
  departements : departementmodel[] = [];
  filtredepartement : departementmodel[] = [];

  //Liste des tiers
  tiers : tiersModel[] = [];

  //TITRE ET BOUTON RETOUR
  url: string = "";

  //Liste des centres analytiques
  centres : centreanalytiqueModel[] = [];

  evolutionbudget : any[] = [];



  constructor(private natureoperationservice: NatureoperationService, private router : Router, private ds:deviseservice,
    private centreanalytiqueservice: CentreAnalytiqueService, private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private tiersservice: TiersService, private toastr : ToastrService, private activatedRoute: ActivatedRoute,
    private AffectationNatureCentreService: AffectationNatureCentreService,
    private SuiviBudgetByFiltre : SuiviBudgetByFiltresService,
    private budgetservice : BudgetService,
    private dp : departementservice){}


  ngOnInit(): void {
    //initialiser le formulaire 
    this.initForm();
    //Charger les natures opérations
    //Afficher toutes les devises
    this.getalldevises();
    //charger les centres analytiques
    this.getAllcentres();
    //charger les tiers
    this.getAllTiers();

    this.getAllNatureoperations();
    this.getAllEvolBudget();
    this.getalldepartements();
    this.soumettre()

  }


  //Initialiser le formulaire
  initForm() {
    this.parametreForm = this.fb.group({
      datedebut: ['', Validators.required],
      datefin: [''],
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



  getAllEvolBudget() {
    console.log(this.parametreForm);
    this.SuiviBudgetByFiltre.getEvolBudget(this.parametreForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.evolutionbudget = res.data;

          console.log(this.evolutionbudget);
        }
      }
    });
  }

  //Récupérer les devise
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


  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getalldepartements (){
    this.dp.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.departements = res.data;
            this.filtredepartement = res.data;
         }
      }
    });
  }


  //Recuperer les natures opérations
  getAllNatureoperations(){
    this.natureoperationservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = (res.data || []).filter(
            (n: any) => n.actif === 1
          );
        }
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


  //Affectation natures centre
  getallAffectationCentres(idnature: string) {
    this.AffectationNatureCentreService.getAll(idnature).subscribe({
      next: (res) => {
        if (res.success) {
          this.centresBynatures = (res.data.centresaffectes || []).filter(
            (n: any) => n.actif === 1
          );
        }
      }
    });
  }


  //Recuperer le departement selectionné
  get departement() {
    return this.parametreForm.get("departement")?.value;
  }


  //Recupérer les centres analytiques
  getAllcentres(){
    this.centreanalytiqueservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.centres = (res.data || []).filter(
            (n: any) => n.actif === 1
          )
        }
      }
    });
  }


  //Recupérer les tiers
  getAllTiers(){
    this.tiersservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.tiers = (res.data || []).filter(
            (n: any) => n.actif === 1
          )
        }
      }
    });
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

  get form() {
    return this.parametreForm.controls;
  }

}
