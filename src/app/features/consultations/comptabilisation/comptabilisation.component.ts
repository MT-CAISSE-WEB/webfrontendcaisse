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

  // Données pour les selects/autocomplete
  sites : sitemodel[] = [];
  site : sitemodel = new sitemodel();
  filteredSites: Observable<sitemodel[]> = new Observable();

  journaux: journalModel[] = [];
  journal: journalModel = new journalModel();
  filteredJournaux: Observable<journalModel[]> = new Observable();

  //Formulaire de recherche
  criteriaForm : FormGroup = this.fb.group({});

  constructor(private journalservice: JournalService, private st:siteservice, private service: ComptabilisationService){}

  ngOnInit(): void {
    // Formulaire de critères
    this.criteriaForm = this.fb.group({
      datedebut: [''],
      datefin: [''],
      site: [''],
      journal: [''],
      ecrituresdefinitives: ['all']
    });

    //Récupérer les données pour les selects/autocomplete
    this.getallsites();
    //Récupérer les données pour les selects/autocomplete
    this.getalljournals();  

    // Initialiser les observables de filtrage
    this.filteredSites = this.criteriaForm.get('site')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterSite(value))
    );
    // Initialiser les observables de filtrage
    this.filteredJournaux = this.criteriaForm.get('journal')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterJournal(value))
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

  getallsites (){
    this.st.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.sites = res.data;
         }
      }
    });
  }

  getalljournals (){
    this.journalservice.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.journaux = res.data;
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

    if (typeof site === 'number') {
      const found = this.sites.find((s: any) => s.id === site);
      return found ? found.libelle : '';
    }

    return typeof site === 'string' ? site : site.libelle;
  }

  displayJournal(journal: any): string {
    if (!journal) return '';

    if (typeof journal === 'number') {
      const found = this.journaux.find((s: any) => s.id === journal);
      return found ? found.designation : '';
    }

    return typeof journal === 'string' ? journal : journal.designation;
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

}
