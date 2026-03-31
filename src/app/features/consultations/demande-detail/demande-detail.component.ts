import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConsultationOpService } from '../services/operations.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { CommonModule, AsyncPipe } from '@angular/common';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';

@Component({
  selector: 'app-demande-detail',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule, AsyncPipe],
  templateUrl: './demande-detail.component.html',
  styleUrl: './demande-detail.component.css'
})
export class DemandeDetailComponent implements OnInit {
  title = "Détail des demandes";
  demandes: any = [];
  fb: FormBuilder = new FormBuilder();

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});

  //Liste des natures filtrées
  naturesFiltrees: natureoperationModel[] = [];
  natureoperations : natureoperationModel[] = [];

  //Liste des tiers filtrées
  tiersFiltrees: tiersModel[] = [];
  tiers : tiersModel[] = [];

  //Liste des centres analytiques filtrés
  centres : centreanalytiqueModel[] = [];
  centresFiltrees: centreanalytiqueModel[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  msgErros : string = "";
  loading: Boolean = false;

  filteredNatureoperations: Observable<natureoperationModel[]> = new Observable();
  filteredTiers: Observable<tiersModel[]> = new Observable();
  filteredCentres: Observable<centreanalytiqueModel[]> = new Observable();

  constructor(private service: ConsultationOpService, private toastr : ToastrService, private natureoperationservice: NatureoperationService,
    private tiersservice: TiersService, private centreanalytiqueservice: CentreAnalytiqueService){}

  ngOnInit(): void {
    //Initialisation du formulaire
    this.initSearchForm();
    //Initialiser les rues filtrées après la création du formulaire
    this.filteredNatureoperations  = this.searchForm.get('natureop')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterNature(value || '')),
    );
    //Initialiser les tiers filtrées après la création du formulaire
    this.filteredTiers  = this.searchForm.get('tiers')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTiers(value || '')),
    );
    //Initialiser les centres analytiques filtrés après la création du formulaire
    this.filteredCentres  = this.searchForm.get('centre')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCentre(value || '')),
    );
    //Charger les natures opérations
    this.getAllNatureoperations();
    //Charger les tiers
    this.getAlltiers();
    //Charger les centres analytiques
    this.getAllCentres();
  }

  private _filterNature(value: any): any[] {
    const filterValue = this._normalizeValue(typeof value === 'string' ? value : value?.libelle || '');

    return this.natureoperations.filter(option =>
      this._normalizeValue(option.libelle).includes(filterValue)
    );
  }

  private _filterTiers(value: any): any[] {
    const filterValue = this._normalizeValue(typeof value === 'string' ? value : value?.designation || '');

    return this.tiers.filter(option =>
      this._normalizeValue(option.designation).includes(filterValue)
    );
  }

  private _filterCentre(value: any): any[] {
    const filterValue = this._normalizeValue(typeof value === 'string' ? value : value?.libelle || '');

    return this.centres.filter(option =>
      this._normalizeValue(option.libelle).includes(filterValue)
    );
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  displayNature(nature: any): string {
    if (!nature) return '';
    return typeof nature === 'string' ? nature : nature.libelle;
  }

  displayTiers(tiers: any): string {
  if (!tiers) return '';
  return typeof tiers === 'string' ? tiers : tiers.designation;
  }

  displayCentre(centre: any): string {
    if (!centre) return '';
    return typeof centre === 'string' ? centre : centre.libelle;
  }
  
  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      codedemande: [null],
      page: [''],
      limit: [''],
      datedebut: [null],
      datefin: [null],
      natureop: [null],
      tiers: [null],
      centre: [null],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite]
    });
  }

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    const controls = this.searchForm.controls;
    if (this.searchForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      //this.toastr.warning(this.msgErros);
      return;
    }

    /** 2. prepare data */
    const formValue = this.searchForm.value;
    const selectedNature = this.searchForm.value.natureop;
    const idnature = selectedNature?.idnature;
    formValue.natureop = idnature;
    formValue.page = this.currentPage;
    formValue.limit = this.limit;
    this.search(formValue);
  }

  search(data : any){
    this.service.getdemandeDetail(data).subscribe({
      next : (res) => {
        this.demandes = res.data.data;
        this.totalPages = res.data.totalPages;
      },
      error : (err) => {}
    });
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
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

  //Recuperer les tiers
  getAlltiers(){
    this.tiersservice.getAll().subscribe(res => {
      if(res.success){
        this.tiers = (res.data || []).filter(
            (n: any) => n.actif === 1
        );
      }
    });
  }

  //Recuperer les centres analytiques
  getAllCentres(){
    this.centreanalytiqueservice.getAll().subscribe(res => {
      if(res.success){
        this.centres = (res.data || []).filter(
            (n: any) => n.actif === 1
        );
      }
    });
  }

}
