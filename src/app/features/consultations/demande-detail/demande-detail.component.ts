import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConsultationOpService } from '../services/operations.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { CommonModule, AsyncPipe } from '@angular/common';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';

@Component({
  selector: 'app-demande-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    AsyncPipe,
  ],
  templateUrl: './demande-detail.component.html',
  styleUrl: './demande-detail.component.css',
})
export class DemandeDetailComponent implements OnInit {
  title = 'Détail des demandes';
  demandes: any = [];
  fb: FormBuilder = new FormBuilder();

  //Formulaire de recherche
  searchForm: FormGroup = this.fb.group({});

  //Liste des natures filtrées
  natureoperations: natureoperationModel[] = [];

  //Liste des tiers
  tiers: tiersModel[] = [];

  //Liste des centres analytiques
  centres: centreanalytiqueModel[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  totalPages: number = 0;
  limit: number = 10;

  msgErros: string = '';
  loading: Boolean = false;

  filteredNatureoperations: Observable<natureoperationModel[]> =
    new Observable();
  filteredTiers: Observable<tiersModel[]> = new Observable();
  filteredCentres: Observable<centreanalytiqueModel[]> = new Observable();

  Math = Math;

  constructor(
    private service: ConsultationOpService,
    private toastr: ToastrService,
    private natureoperationservice: NatureoperationService,
    private tiersservice: TiersService,
    private centreanalytiqueservice: CentreAnalytiqueService,
  ) {}

  ngOnInit(): void {
    //Initialisation du formulaire
    this.initSearchForm();

    // ✅ Recherche automatique à chaque changement
    this.searchForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.onSubmit();
      });

    // ✅ Filtrer les autocomplete
    this.filteredNatureoperations = this.searchForm
      .get('natureop')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => {
          const val = typeof value === 'string' ? value : value?.libelle || '';
          return this._filterNature(val);
        }),
      );

    this.filteredTiers = this.searchForm.get('tiers')!.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const val =
          typeof value === 'string' ? value : value?.designation || '';
        return this._filterTiers(val);
      }),
    );

    this.filteredCentres = this.searchForm.get('centre')!.valueChanges.pipe(
      startWith(''),
      map((value) => {
        const val = typeof value === 'string' ? value : value?.libelle || '';
        return this._filterCentre(val);
      }),
    );

    //Charger les données
    this.getAllNatureoperations();
    this.getAlltiers();
    this.getAllCentres();

    // ✅ Charger les données au démarrage
    setTimeout(() => {
      this.onSubmit();
    }, 500);
  }

  private _filterNature(value: string): natureoperationModel[] {
    const filterValue = this._normalizeValue(value);
    return this.natureoperations.filter((option) =>
      this._normalizeValue(option.libelle).includes(filterValue),
    );
  }

  private _filterTiers(value: string): tiersModel[] {
    const filterValue = this._normalizeValue(value);
    return this.tiers.filter((option) =>
      this._normalizeValue(option.designation).includes(filterValue),
    );
  }

  private _filterCentre(value: string): centreanalytiqueModel[] {
    const filterValue = this._normalizeValue(value);
    return this.centres.filter((option) =>
      this._normalizeValue(option.libelle).includes(filterValue),
    );
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  // ✅ Méthodes display pour les autocomplete
  displayNature(nature: natureoperationModel): string {
    return nature?.libelle || '';
  }

  displayTiers(tiers: tiersModel): string {
    return tiers?.designation || '';
  }

  displayCentre(centre: centreanalytiqueModel): string {
    return centre?.libelle || '';
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      codedemande: [null],
      datedebut: [null],
      datefin: [null],
      natureop: [null],
      tiers: [null],
      centre: [null],
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  resetFilters(): void {
    this.searchForm.reset({
      codedemande: null,
      datedebut: null,
      datefin: null,
      natureop: null,
      tiers: null,
      centre: null,
    });
    this.currentPage = 1;
    this.onSubmit();
    this.toastr.info('Filtres réinitialisés');
  }

  // ✅ CORRECTION : Soumission du formulaire
  onSubmit() {
    // Récupérer les valeurs du formulaire
    const formValue = this.searchForm.value;

    // ✅ Récupérer l'ID de la nature sélectionnée
    const selectedNature = formValue.natureop;
    const idnature = selectedNature?.idnature || null;

    // ✅ Récupérer l'ID du tiers sélectionné
    const selectedTiers = formValue.tiers;
    const idtiers = selectedTiers?.idtiers || null;

    // ✅ Récupérer l'ID du centre analytique sélectionné
    const selectedCentre = formValue.centre;
    const idcentre = selectedCentre?.idcentreanalytique || null;

    // ✅ Construire les paramètres de recherche
    const params: any = {
      page: this.currentPage,
      limit: this.limit,
    };

    console.log('🔍 Valeurs du formulaire:', formValue);
    console.log('paramètres de recherche avant ajout des filtres:', params);

    // ✅ Ajouter les filtres uniquement s'ils sont remplis
    if (formValue.codedemande) {
      params.codedemande = formValue.codedemande;
    }
    if (formValue.datedebut) {
      params.datedebut = formValue.datedebut;
    }
    if (formValue.datefin) {
      params.datefin = formValue.datefin;
    }
    if (idnature) {
      params.natureop = idnature;
    }
    if (idtiers) {
      params.tiers = idtiers;
    }
    if (idcentre) {
      params.centre = idcentre;
    }

    // ✅ Ajouter les filtres par défaut
    params.typeentitesociete = this.user.typeentitesociete;
    params.idsite = this.user.idsite;

    console.log('🔍 Paramètres de recherche:', params);
    this.search(params);
  }

  // ✅ Méthode search avec gestion du loading
  search(data: any) {
    this.loading = true;
    this.service.getdemandeDetail(data).subscribe({
      next: (res) => {
        this.demandes = res.data.data || [];
        this.totalPages = res.data.totalPages || 0;
        this.loading = false;
        console.log('✅ Résultats trouvés:', this.demandes.length);
      },
      error: (err) => {
        this.loading = false;
        this.demandes = [];
        console.error('❌ Erreur de recherche:', err);
        this.toastr.error(err?.error?.message || 'Erreur lors de la recherche');
      },
    });
  }

  changePage(page: number) {
    this.currentPage = page;
    this.onSubmit();
  }

  getAllNatureoperations() {
    this.natureoperationservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.natureoperations = (res.data || []).filter(
            (n: any) => n.actif === 1,
          );
          console.log('✅ Natures chargées:', this.natureoperations.length);
        }
      },
      error: (err) => console.error('Erreur chargement natures:', err),
    });
  }

  getAlltiers() {
    this.tiersservice.getAll().subscribe((res) => {
      if (res.success) {
        this.tiers = (res.data || []).filter((n: any) => n.actif === 1);
        console.log('✅ Tiers chargés:', this.tiers.length);
      }
    });
  }

  getAllCentres() {
    this.centreanalytiqueservice.getAll().subscribe((res) => {
      if (res.success) {
        this.centres = (res.data || []).filter((n: any) => n.actif === 1);
        console.log('✅ Centres chargés:', this.centres.length);
      }
    });
  }
}
