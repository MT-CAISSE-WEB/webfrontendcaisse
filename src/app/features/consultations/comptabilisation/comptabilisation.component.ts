import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComptabilisationService } from '../services/comptabilisation.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { MatOptionModule } from '@angular/material/core';
import { sitemodel } from '../../structure/model/site.model';
import { siteservice } from '../../structure/service/site.service';
import { journalModel } from '../../caisse_journal/models/journal.model';
import { JournalService } from '../../caisse_journal/services/journal.service';
import { Observable } from 'rxjs/internal/Observable';
import { map, startWith } from 'rxjs';
import { OperationService } from '../../operations/service/operation.service';
import { operationModel } from '../../operations/model/operation.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-comptabilisation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatRadioModule, MatOptionModule],
  templateUrl: './comptabilisation.component.html',
  styleUrl: './comptabilisation.component.css'
})
export class ComptabilisationComponent implements OnInit{
  title = "Simulation écriture comptable";
  fb: FormBuilder = new FormBuilder();

  msgErros : string = "";
  loading: Boolean = false;

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 4000;

  // Données pour les selects/autocomplete
  sites : sitemodel[] = [];
  site : sitemodel = new sitemodel();
  filteredSites: Observable<sitemodel[]> = new Observable();

  journaux: journalModel[] = [];
  journal: journalModel = new journalModel();
  filteredJournaux: Observable<journalModel[]> = new Observable();

  //Formulaire de recherche
  criteriaForm : FormGroup = this.fb.group({});

  //Formulaire de recherche
  comptabiliteForm : FormGroup = this.fb.group({});

  operations : operationModel[] = [];

  constructor(private journalservice: JournalService, private st:siteservice, private service: ComptabilisationService, private operationservice: OperationService,
    private toastr : ToastrService
  ){}

  ngOnInit(): void {
    // Formulaire de critères
    this.criteriaForm = this.fb.group({
      datedebut: [''],
      datefin: [''],
      site: [''],
      journal: [''],
      ecrituresdefinitives: ['all']
    });

    // Formulaire de Comptabilisation
    this.comptabiliteForm = this.fb.group({
      datedebut: [''],
      datefin: [''],
      operation: [''],
      journal: [''],
    });

    //Récupérer les données pour les selects/autocomplete
    this.getallsites();
    //Récupérer les données pour les selects/autocomplete
    this.getalljournals();  
    //Récupérer toutes les opérations
    this.getAllOperations();

    // Initialiser les observables de filtrage
    this.filteredSites = this.criteriaForm.get('site')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        return this._filterSite(value)
      })
    );

    // Initialiser les observables de filtrage
    this.filteredJournaux = this.criteriaForm.get('journal')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        return this._filterJournal(value)
      })
    );
  }

  search(data : any){
    this.service.getAllEcriture(data).subscribe({
      next : (res) => {
        //this.op = res.data;
      },
      error : (err) => {}
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getallsites (){
    this.st.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.sites = res.data;
            //this.criteriaForm.get('site')?.setValue(this.criteriaForm.get('site')?.value ?? '', { emitEvent: true });
         }
      }
    });
  }

  getalljournals (){
    this.journalservice.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.journaux = res.data.data;
         }
      }
    });
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  private _filterSite(value: any): any[] {
    const filterValue = this._normalizeValue(typeof value === 'string' ? value : value?.libelle || '');

    return this.sites.filter(option =>
      this._normalizeValue(option.libelle).includes(filterValue)
    );
  }

  private _filterJournal(value: any): any[] {
    const filterValue = this._normalizeValue(typeof value === 'string' ? value : value?.designation || '');

    return this.journaux.filter(option =>
      this._normalizeValue(option.designation).includes(filterValue)
    );
  }

  displaySite(site: any): string {
    if (!site) return '';

    if (typeof site === 'number' || typeof site === 'string') {
      const found = this.sites.find((s: any) => s.idsite === site);
      return found ? found.libelle : '';
    }

    return site.libelle;
  }

  displayJournal(journal: any): string {
    if (!journal) return '';

    if (typeof journal === 'number' || typeof journal === 'string') {
      const found = this.journaux.find((s: any) => s.idjournal === journal);
      return found ? found.designation : '';
    }

    return journal.designation;
  }

  // Applique les critères et déclenche la recherche
  applyCriteria(): void {
    if (this.criteriaForm.invalid) {
      this.msgErros = 'Veuillez renseigner correctement les critères.';
      Object.values(this.criteriaForm.controls).forEach(control => control.markAsTouched());
      return;
    }
    
    const criteria = this.criteriaForm.value;
    this.search(criteria);

    // Fermer le modal si bootstrap est utilisé
    const modalEl = document.getElementById('criteriaModal');
    if (modalEl) {
      const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }
  }

  // Generer les écritures
  applyComptability(): void {
    if (this.comptabiliteForm.invalid) {
      this.msgErros = 'Veuillez renseigner correctement les critères.';
      Object.values(this.comptabiliteForm.controls).forEach(control => control.markAsTouched());
      return;
    }
    
    const ecritures = this.comptabiliteForm.value;
    this.generate(ecritures);

    // Fermer le modal si bootstrap est utilisé
    const modalEl = document.getElementById('comptabiliteModal');
    if (modalEl) {
      const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }
  }

  generate(data: any){
    console.log(data);
    this.service.generateEcriture(data).subscribe({
      next : (res) => {
        console.log(res);
        if(res.success){
          this.toastr.success("Ecritures générées avec succès");
        }
      },
      error : (err) => {
        this.toastr.error("Une erreur s'est produite lors de la génération des écritures", err);
      }
    });
  }

  //Recuperer toutes les opérations
  getAllOperations(){
    this.loading = true;
    const params = {
      page: this.currentPage,
      limit: this.limit,
      search: '',
      date: '',
      user: this.user.idutilisateur,
    };
    this.operationservice.getAll(params).subscribe({
      next : (res) => {
        if(res.success){
          this.operations = res.data.data;
          this.loading = false;
        }
      },
      error : (err) => {
        this.loading = false;
      },
    });
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

}
