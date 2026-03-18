import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { ConsultationOpService } from '../services/operations.service';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { CustomFieldSelectComponent } from '../../../_core/custom/custom-field-select/custom-field-select.component';
import { COLUMNS_CENTRE, COLUMNS_NATURE, COLUMNS_TIERS } from '../../../_core/constantes/tableau.data';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';

@Component({
  selector: 'app-operation-detail',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CustomFieldSelectComponent],
  templateUrl: './operation-detail.component.html',
  styleUrl: './operation-detail.component.css'
})
export class OperationDetailComponent implements OnInit {
  title = "Detail operation";
  op: any = [];
  fb: FormBuilder = new FormBuilder();

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});

  msgErros : string = "";
  loading: Boolean = false;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];

  // tiers sélectionné
  selectedTiers: any = null;

  // Nature sélectionné
  selectedNature: any = null;

  // Centre sélectionné
  selectedCentre: any = null;

  columnstiers: any[] = COLUMNS_TIERS;
  columnsnature: any[] = COLUMNS_NATURE;
  columnscentre: any[] = COLUMNS_CENTRE;

  tiersControl = new FormControl('');
  tiers : tiersModel[] = [];
  filteredTiers : tiersModel[] = [];
  natureoperations : natureoperationModel[] = [];
  natureoperationsFiltered : natureoperationModel[] = [];
  centres : centreanalytiqueModel[] = [];
  centresFiltered : centreanalytiqueModel[] = [];

  page = 0;
  limit = 20;
  searchs = '';

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;

  // @ViewChild('select') select!: CustomFieldSelectComponent;

  constructor(private centreanalytiqueservice: CentreAnalytiqueService, private natureoperationservice: NatureoperationService, private tiersservice: TiersService, 
    private service: ConsultationOpService, private caisseuserservice: AffectationCaisseService){}
  
  ngOnInit(): void {
    //Initialisation du formulaire
    this.initSearchForm();

    this.tiersservice.getAll().subscribe(res => {
      if(res.success){
        this.tiers = res.data;
        this.filteredTiers = [...this.tiers];
      }
    });

    this.natureoperationservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = res.data;
          this.natureoperationsFiltered = [...this.natureoperations];
        }}
    });

    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.centres = res.data;
          this.centresFiltered = [...this.centres];
      }}
    });
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      numero: [''],
      montantmin: [''],
      montantmax: [''],
      nature: [''],
      centre: [''],
      tiers: [''],
      datedebut: [''],
      datefin: [''],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite]
    });
  }

  //Utilisateur connecté
  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  onSearch(event:any){
    this.searchs = event.term;
    this.page = 0;
    this.tiers = [];
    //this.loadTiers();
  }

  //Chargement plus
  loadMore(){
    this.page++;
    //this.loadTiers();
  }

  onAutocompleteOpen() {
    this.page = 0; // reset pagination quand l'autocomplete s'ouvre
    this.searchTiers('');
  }

  //Chargement du tiers
  searchTiers(event: any){
    const search = event.search || '';
    this.filteredTiers = this.tiers.filter(t =>
      t.designation?.toLowerCase().includes((search).toLowerCase()) ||
      t.codetiers?.toLowerCase().includes((search).toLowerCase())
    );
  }

  //Chargement des natures
  searchNature(event: any){
    const search = event.search || '';
    this.natureoperationsFiltered = this.natureoperations.filter(t =>
      t.libelle?.toLowerCase().includes((search).toLowerCase()) ||
      t.codenature?.toLowerCase().includes((search).toLowerCase())
    );
  }

  //Chargement du centre analytique
  searchCentre(event: any){
    const search = event.search || '';
    this.centresFiltered = this.centres.filter(t =>
      t.codecentreanalytique?.toLowerCase().includes((search).toLowerCase()) ||
      t.libelle?.toLowerCase().includes((search).toLowerCase())
    );
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
  }

  search(data : any){
    this.service.getDetailoperation(data).subscribe({
      next : (res) => {
        this.op = res.data;
      },
      error : (err) => {}
    });
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
    const formValue = {
      ...this.searchForm.value,
    };
    
    this.search(formValue);
  }

  onSelectTiers(tiers:any){
    this.selectedTiers = tiers;
  }

  onSelectNature(nature: any){
    this.selectedNature = nature;
  }

  onSelectCentre(centre: any){
    this.selectedCentre = centre;
  }

}
