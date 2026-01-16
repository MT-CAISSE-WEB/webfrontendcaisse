import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { operationModel } from '../model/operation.model';
import { OperationService } from '../service/operation.service';
import { caissePeriodeModel } from '../../caisse_journal/models/periodecaisse.model';
import { CaissePeriodeService } from '../../caisse_journal/services/caisseperiode.service';
import { debounceTime, distinctUntilChanged, forkJoin, map, Observable, takeUntil, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';
import { societemodel } from '../../structure/model/societe.model';
import { societeservice } from '../../structure/service/societe.service';
import { ToastrService } from 'ngx-toastr';
import { EnteteDemande } from '../../demande/models/entete-demande.model';
import { DemandeService } from '../../demande/services/demande.service';
import { AffectationNatureCentreService } from '../../donnee_base/services/affectationnaturecentre.service';
import { devisemodel } from '../../donnee_base/donnee_base/model/devise.model';
import { deviseservice } from '../../donnee_base/donnee_base/service/devise.service';

@Component({
  selector: 'app-operation-caisse',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './operation-caisse.component.html',
  styleUrl: './operation-caisse.component.css',
  providers: [CurrencyPipe]
})
export class OperationCaisseComponent implements OnInit{
  title = "Opération";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  msgErros : string = "";
  loading: Boolean = false;
  operationForm : FormGroup = this.fb.group({});
  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;
  operations : operationModel[] = [];
  operation : operationModel = new operationModel();
  operationdetail : operationModel | null = new operationModel();

  //Faire le check selection **********
  objectsSelected : operationModel[] = [];
  selectedItems : any[] = [];

  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Changement titre modal
  actionModal: string = "create";

  //Ramener la devise
  devises : devisemodel[] = [];
  devise : devisemodel = new devisemodel();

  //Bouton active / inactive
  isUpdated: boolean = true;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];

  //Liste des natures filtrées
  naturesFiltrees: any[] = [];
  natureoperations : natureoperationModel[] = [];

  //Liste des centres analytiques des natures opérations
  centresBynatures: any[] = [];

  //Liste des tiers
  tiers : tiersModel[] = [];

  //Liste des centres analytiques
  centres : centreanalytiqueModel[] = [];

  //Societé de l'utilisateur connecté
  societe : societemodel = new societemodel();

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  //Element à supprimer 
  deleteOperation: any = null;

  //Element statistiques
  stats : any = null;

  //caisseSolde
  caisseSolde : any = [];
  caisseSoldeMap = new Map<string, number>();

  //Liste periode 
  caisseperiodes: caissePeriodeModel[] = [];

  showCaisses = false;
  loadingModal = false;
  isAnyOpen: boolean = false;

  private periodeDateMap = new Map<string, string>();
  maxDecaissementJour : any = {};
  minDecaissementJour : any = {};
  nbrDecaissementJour = 0;
  totalDecaissementJour = 0;
  //resteARepartir: number = 0;

  //Les demandes
  entetesDmd: EnteteDemande[] = [];

  caisseStatuses: any = {};
  //caisseStatuses: string[] = [];

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});
  //initialiser le filtre
  filters = {
    search: '',
    date: '',
    status: '',
    page: 1
  };

  constructor(private natureoperationservice: NatureoperationService, private caisseuserservice: AffectationCaisseService,
    private router : Router, private caissePeriodeservice: CaissePeriodeService, private centreanalytiqueservice: CentreAnalytiqueService,
    private operationservice: OperationService, private tiersservice: TiersService,private sc: societeservice, private AffectationNatureCentreService: AffectationNatureCentreService,
    private currencyPipe: CurrencyPipe, private toastr : ToastrService, private service: DemandeService, private ds:deviseservice,
  ){}

  ngOnInit(): void {
    //Recuperer la devise
    this.getalldevises();
    //initialiser le formulaire de recherche
    this.initSearchForm();
    //Afficher toutes les opérations
    this.getAllOperations();
    //Initialisation du formulaire
    this.initForm();
    //Charger les natures d'opérations
    this.getAllNatureoperations();
    //Charger mes caisses
    this.getCaisseUser();
    //Récuperer les soldes de caisses
    this.getSoldeCaisse();
    //Récuperer le max operation
    this.getMaxOperations();

    // Récupérer les statuts de caisse
    this.caissePeriodeservice.statuses$.subscribe(status => {
      this.caisseStatuses = status;
      this.isAnyOpen = Object.values(status).some(
        (s: any) => s?.toLowerCase() === 'ouverte'
      );
    });

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette opération");
    this.titleMsg = TITLE_DELETE;
    this.lignes;

    this.searchForm.valueChanges
      .pipe(debounceTime(400),distinctUntilChanged()).subscribe(values => {
        this.applyFilters(values);});
  }

  //Recuperer toutes les opérations
  getAllOperations(){
    this.params = {
      page: this.currentPage,
      limit: this.limit,
      search: '',
      date: '',
      status: '',
    };
    this.operationservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.operations = res.data.data;
          this.totalPages = res.data.totalPages;
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

  //Affectation natures centre for modify
  getallCentresDispatch(natureId: string, ligne: FormGroup, centreId?: string) {
    this.AffectationNatureCentreService.getAll(natureId).subscribe(res => {
      if (res.success) {
        const centres = (res.data.centresaffectes || [])
          .filter((c: any) => c.actif === 1);

        //stocker les centres dans la ligne
        ligne.get('centres')?.setValue(centres);

        //activer le champ centre
        ligne.get('centre')?.enable({ emitEvent: false });

        //positionner le centre APRÈS chargement
        if (centreId) {
          ligne.get('centre')?.setValue(centreId, { emitEvent: false });
        }
      }
    });
  }

  //Charger les centres de chaque ligne
  loadCentresForLigne(ligne: FormGroup, idnature: string, resetCentre: boolean = true, centreId: string) {
    this.AffectationNatureCentreService.getAll(idnature).subscribe({
      next: (res) => {
        if (res.success) {
          const centres = (res.data.centresaffectes || [])
            .filter((c: any) => c.actif === 1);

          //stocké dans la ligne
          ligne.get('centres')?.setValue(centres);

          // reset centre sélectionné
          if (resetCentre) {
            ligne.get('centre')?.reset();
          }

          // Patch le centre sélectionné si fourni
          if (centreId) {
            const centreTrouve = centres.find(
              (c: any) => c.idcentre === centreId
            );
            if (centreTrouve) {
              ligne.get('centre')?.setValue(centreTrouve.idcentre);
            }
          }
        }
      }
    });
  }

  //Reload les datas
  reloadData() {
    this.loading = true;

    forkJoin([
      this.getAllOperations(),
      this.getSoldeCaisse(),
      this.getCaisseUser()
    ]).subscribe({
      next: () => this.loading = false,
      error: () => this.loading = false
    });
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      search: [''],
      date: [''],
      status: ['']
    });
  }

  applyFilters(filters: any) {
    const params = {
      page: this.currentPage,
      limit: this.limit,
      search: filters.search || '',
      date: filters.date || '',
      status: filters.status || ''
    };

    this.operationservice.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.operations = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //chargement des demandes
  loadAllDemandes() {
    const params = {
      page: this.currentPage,
      limit: 100,
      search: '',
      date: '',
      status: '',
    };
    this.service.getAllEntetes(params).subscribe({
      next : (res) => {
        if(res.success){
          //this.entetesDmd = res.data.data;
          this.entetesDmd = (res.data.data || []).filter(
            (n: any) => n.decaisse === 0 && n.statut === 2
          )
        }
      },
      error: (err) => {
        this.toastr.error("Erreur backend");
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

  tryComputeMaxDecaissement() {
    if (this.stats?.length && this.caisseperiodes?.length) {
      this.maxDecaissementJour = this.getMaxDecaissementDuJour().opmax;
      this.minDecaissementJour = this.getMaxDecaissementDuJour().opmin;
      this.nbrDecaissementJour = this.getMaxDecaissementDuJour().taille;
      this.totalDecaissementJour = this.getMaxDecaissementDuJour().total;
    }
  }

  getMaxDecaissementDuJour(): any {
    if (!this.stats || this.stats.length === 0) return 0;

    const idPeriodeJour = this.getIdPeriodeDuJour();
    const datePeiordeJour = this.getDatePeriodeDuJour();

    if (!idPeriodeJour) return 0;
    if (!datePeiordeJour) return 0;

    const jour = this.toDateOnly(datePeiordeJour);
  
    const decaissements = this.stats.filter((op: any) =>
      op.codtypeoperation === 'decaissement' &&
      this.toDateOnly(op.dateperiode) === jour
    );

    const nombreOperationsUniques = new Set(decaissements.map((op: any) => op.codeoperation)).size;

    if (decaissements.length === 0) return 0;

    const maxDecaissement = decaissements.length > 0 
    ? decaissements.reduce((acc: any, curr: any) => 
        curr.montantref > acc.montantref ? curr : acc
      ) 
    : null;

    const minDecaissement = decaissements.length > 0 
    ? decaissements.reduce((acc: any, curr: any) => 
        curr.montantref < acc.montantref ? curr : acc
      ) 
    : null;

    const totalDecaissements = decaissements.reduce((sum: number, op: any) => {
      return sum + Number(op.montantref || 0);
    }, 0);

    return {opmin : minDecaissement, opmax : maxDecaissement, taille: nombreOperationsUniques, total: totalDecaissements};
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

  private toDateOnly(value: string | Date): string {
    const d = new Date(value);
    return d.toISOString().split('T')[0];
  }

  //Recuperer le Max des operations
  getMaxOperations(){
    this.operationservice.getMaxOperation().subscribe({
      next : (res) => {
        if(res.success){
          this.stats = res.data;
          this.tryComputeMaxDecaissement();
        }
      }
    });
  }

  //Récuperer les soldes
  getSoldeCaisse(){
    this.operationservice.getSoldeCaisse().subscribe({
      next : (res) => {
        if(res.success){
          this.caisseSolde = res.data.data;
        }
      }
    });
  }

  //Calcul solde de caisse 
  calculerSoldeCaisse(idcaisse: string, operations: any[]): number {
    let solde = 0;
    operations.forEach(op => {
      op.caisses.forEach((c: any) => {
        if (c.idcaisse === idcaisse) {
          if (c.codtypeoperation === "encaissement") {
            solde += Number(c.montant);
          } else if (c.codtypeoperation === "decaissement") {
            solde -= Number(c.montant);
          }
        }
      });
    });

    return solde;
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  rafreshpage(){
    const currentUrl = this.router.url; 
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  //Initialiser le formulaire
  initForm(){
    this.operationForm = this.fb.group({
      demande : [""],
      codeoperation : [""],
      libelle : [""],
      dateoperation : [{ value: null, disabled: false }, [Validators.required]],
      typepaiement: ["", [Validators.required]],
      lignes: this.fb.array([]),
      devise : ["", [Validators.required]],
      site : [this.user.idsite ?? null],
      societe : [this.user.idsociete ?? null],
      montant: [0],
      montantRefglobal: [0],
      caisses : this.fb.array([])
    })
  }

  checkSameDatePeriodes() {
    if (!this.caisseperiodes || this.caisseperiodes.length === 0) return null;

    const firstDate = this.caisseperiodes[0].dateperiode;

    const allSame = this.caisseperiodes.every(
      p => p.dateperiode === firstDate
    );

    return allSame ? firstDate : null;
  }

  get form() {
    return this.operationForm.controls;
  }

  formatNumber(montant: number | string): string {
    if (montant === null || montant === undefined || montant === "") return "";
    const valeur = Number(montant);
    if (isNaN(valeur)) return "";

    return valeur
      .toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
  }

  get lignes(): FormArray<FormGroup> {
    return this.operationForm.get('lignes') as FormArray<FormGroup>;
  }

  getCaisseUser(){
    this.loading = true;
    this.caisseuserservice.getCaisseByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caissesUser = res.data || [];
          if (this.caissesUser.length > 0) {
            this.loadCaissesEtPeriodes();
          } else {
            this.caisseperiodes = [];
          }
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Erreur chargement caisses utilisateur');
      }
    });
  }

  //Récupérer l'ID periode du jour
  getIdPeriodeDuJour(): string | null {
    if (!this.caisseperiodes || this.caisseperiodes.length === 0) return null;

    // Toutes les périodes ont la même date
    return this.caisseperiodes[0].idperiode ?? null;
  }

  //Récupérer date periode du jour
  getDatePeriodeDuJour(): string | null {
    if (!this.caisseperiodes || this.caisseperiodes.length === 0) return null;

    // Toutes les périodes ont la même date
    return this.caisseperiodes[0].dateperiode ?? null;
  }

  loadCaissesEtPeriodes() {
    this.caissePeriodeservice.getCaissesPeriodes(this.caissesUser).subscribe({
      next: (responses) => {
        //périodes = source de vérité
        this.caisseperiodes = responses.map(res => res.data);
        //remplir le formulaire depuis les périodes
        this.loadCaissesFormFromPeriodes(this.caisseperiodes);
        //logique métier
        this.updateButtonState();
        //
        this.tryComputeMaxDecaissement();
      },
      error: () => {
        console.error("Erreur chargement caisses / périodes");
      }
    });
  }

  loadCaissesFormFromPeriodes(periodes: any[]) {
    const caissesArray = this.operationForm.get('caisses') as FormArray;
    caissesArray.clear();
    periodes.forEach(p => {
      caissesArray.push(
        this.fb.group({
          idcaisse: [p.idcaisse, Validators.required],
          caisse: [p.caisse?.codecaisse || null, Validators.required],
          statut: [p.statut],
          devisecaisse: [p.caisse?.devise?.codedevise || null],
          solde: [this.formatNumber(p.soldeouverture) ?? 0],
          montantcaisse: [0],
          taux: [1],
          montantref: [0],
          idperiode : [p.idperiode ? p.idperiode : null, Validators.required]
        })
      );
    });
  }

  formatMontant(montant: number, devise: string) {
    if (!montant && montant !== 0) return "";

    let formatDevise = devise;

    //Normalisation des devises CFA
    if (devise === "XOF" || devise === "XAF") {
      formatDevise = "XOF"; // Angular ne connaît pas XAF
      return this.currencyPipe.transform(montant, formatDevise, "symbol", "1.0-2")
        ?.replace("XOF", "CFA")      // remplacer XOF par CFA
        .replace("CFA", "FCFA");     // finition OHADA
    }

    //USD, EUR, etc. (Angular sait gérer nativement)
    return this.currencyPipe.transform(montant, devise, "symbol", "1.0-2");
  }

  get typePaiement() {
    return this.operationForm.get("typepaiement")?.value;
  }

  filtrerNatures(type: string) {
    if (!type || !this.natureoperations.length) {
      this.naturesFiltrees = [];
      return;
    }

    const cleanType = type.toLowerCase().trim();

    this.naturesFiltrees = this.natureoperations.filter(n =>
      n.typeoperation?.toLowerCase().trim() === cleanType 
    );
    //&& n.demandedecaissement === 0
  }

  get caisses(): FormArray<FormGroup> {
    return this.operationForm.get("caisses") as FormArray<FormGroup>;
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.idoperation);
    return ids.includes(_id);
  }

  updateTotalMontant() {
    let total = 0;

    this.lignes.controls.forEach((ctrl: any) => {
      const val = parseFloat(ctrl.get("montantligne")?.value || 0);
      total += isNaN(val) ? 0 : val;
    });

    this.operationForm.patchValue({ montant: total });
  }

  //selectionner une instance dans une liste
  handleSelectOne(operation: operationModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idoperation == operation.idoperation
    );
    if (index == -1 && actif) this.objectsSelected.push(operation);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.operations?.length;
  }

  //Champ caisse
  addCaisse(_caisse: any){
    const periode = this.caisseperiodes.find(p => p.idcaisse === _caisse.idcaisse);
    const caisseFG = this.fb.group({
      idcaisse : [_caisse.idcaisse, Validators.required],
      caisse: [_caisse.caisse?.codecaisse, Validators.required],
      solde: [this.formatNumber(_caisse.caisse?.solde) ?? 0],
      montantcaisse: [0],
      taux: [1],
      montantref: [0],
      devisecaisse: [_caisse.caisse?.devise],
      idperiode : [periode?.idperiode ? periode.idperiode : null, Validators.required]
    });

    this.caisses.push(caisseFG);
    //Calcul automatique
    this.applyAutoCalcul(caisseFG);
  }

  //Charger les caisses sur le formulaires
  loadCaissesForm(): Observable<void> {
    const payload = {
      idutilisateur : this.user.idutilisateur,
      iddeviserefsoc: this.user.devise_ref_id
    };

    return this.caisseuserservice.getCaissesUserPeriode(payload).pipe(
      tap(res => {
        const periodes = res?.data ?? [];
        // this.caisseperiodes = periodes;
        const caissesArray = this.operationForm.get('caisses') as FormArray;
        caissesArray.clear();
        periodes.forEach((p: any) => {
          caissesArray.push(this.fb.group({
            idcaisse: [p.caisse?.idcaisse, Validators.required],
            caisse: [p.caisse?.code, Validators.required],
            statut: [p.periode?.statut ?? null],
            devisecaisse: [p.devise?.code ?? null],
            iddevisecaisse: [p.devise?.iddevise ?? null],
            solde: [this.formatNumber(p.solde?.montant ?? 0)],
            montantcaisse: [0, [Validators.required, Validators.min(0)]],
            montantref: [0],
            taux: [p.solde?.taux ?? 1],
            idperiode: [p.periode?.idperiode, Validators.required]
          }));
        });
      }),
      map(res => res?.data ?? [])
    );
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.operations.slice();
    else this.objectsSelected = [];
  }

  //Selection de la nature / Activer ou desactiver imputation tiers
  handleNatureChange(ligne: FormGroup, natureId: string) {
    const nature = this.natureoperations.find(
      n => n.idnature === natureId
    );

    if (!nature) {
      ligne.get('tiers')?.disable();
      ligne.get('tiers')?.reset();
      return;
    }

    if (nature.imputationtiers === 1) {
      ligne.get('tiers')?.enable();
    } else {
      ligne.get('tiers')?.disable();
      ligne.get('tiers')?.reset();
    }
  }

  dispatchOperation(_object: operationModel){
    // Patch des champs simples
    this.operationForm.patchValue({
      codeoperation : _object.codeoperation,
      libelle       : _object.lignes[0]?.libelle,
      devise        : _object.devise.iddevise,
      site          : _object.site.idsite,
      typepaiement  : _object.caisses[0].codtypeoperation,
      montant       : _object.montant,
      dateoperation : this.formatDateForInput(_object.dateoperation),
      societe       : _object.societe.idsociete,
    });

    this.lignes.clear();
    _object.lignes.forEach((l: any) => {
      const ligneGroup = this.fb.group({
        idligne: [l.idligneoperation ?? null],
        natureop: [l.nature?.idnature ?? null, Validators.required],
        centre: [{ value: null, disabled: true }],
        tiers: [{ value: l.tiers?.idtiers ?? null, disabled: true }],
        montantligne: [{ value: l.montantoperation ?? "", disabled: false }, Validators.required],

        //centres propres à la ligne
        centres: this.fb.control<any[]>([])
      });

      this.lignes.push(ligneGroup);

      // règles métier
      this.handleNatureChange(ligneGroup, l.nature?.idnature);

      //charger centres PUIS positionner le centre
      if (l.nature?.idnature) {
        this.getallCentresDispatch(l.nature.idnature, ligneGroup, l.centre?.idcentreanalytique);
      }
    });

    //différentes caisses utilisées 
    const caissesUtiliseesMap = new Map<string, any>();

    _object.caisses.forEach(c => {
      caissesUtiliseesMap.set(c.idcaisse, c);
    });

    const caissesFA = this.operationForm.get('caisses') as FormArray;

    caissesFA.controls.forEach(control => {
      const fg = control as FormGroup;
      const idcaisse = fg.get('idcaisse')?.value;
      const caisseOp = caissesUtiliseesMap.get(idcaisse);

      if (caisseOp) {
        fg.patchValue({
          montantcaisse   : caisseOp.montant,
          taux            : caisseOp.taux,
          montantref      : caisseOp.montantref,
          idtypeoperation : caisseOp.idtypeoperation
        });

        fg.enable({ emitEvent: false });
      } else {
        fg.patchValue({
          montantcaisse : 0,
          montantref    : 0
        });

        fg.disable({ emitEvent: false });
      }
    });

    //Filtrer les natures quand typeoperation change
    this.filtrerNatures(_object.caisses[0].codtypeoperation);

    //Bloquer tout le formulaire
    this.operationForm.disable({ emitEvent: false });
  }

  // Formater la date ( mer, 13-jan 2025)
  formatDatePreview(dateStr: string): string {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    // Formatter jour abrégé FR : lun, mar, mer, jeu, ven, sam, dim
    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', '');
    const day = date.getDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    return `${dayShort}, ${day}-${month} ${year}`;
  }

  formatDateFR(dateInput: string | Date | null | undefined): string {
    if (!dateInput) {
      return '';
    }
    const date = new Date(dateInput);

    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(date)
      .replace('.', '');

    const day = date.getDate();
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(date)
      .replace('.', '');

    const year = date.getFullYear();

    return `${dayShort} ${day} ${month} ${year}`;
  }

  //Calculer la somme des lignes de la demande
  getTotalDemande(demande: EnteteDemande): number {
    return demande.lignes.reduce((sum, l) => sum + l.montantdemande, 0);
  }
  
  //Ajouter la ligne dans le tableau
  addLine() {
    const ligne = this.fb.group({
      natureop : [{ value: "", disabled: false }, [Validators.required]],
      centre: [{ value: "", disabled: true }, ],
      tiers: [{ value: "", disabled: true }, ],
      montantligne: [{ value: "", disabled: true }, [Validators.required]],
      //CENTRES PAR LIGNE
      centres: this.fb.control<any[]>([])
    });

    ligne.get("natureop")?.valueChanges.subscribe(natureId => {
      if (!natureId) {
        ligne.get("centre")?.disable();
        ligne.get("tiers")?.disable();
        ligne.get("montantligne")?.disable();
        ligne.get('centres')?.setValue([]);
        return;
      }

      // Champs de base
      ligne.get("centre")?.enable();
      ligne.get("montantligne")?.enable();

      //charger centres POUR CETTE LIGNE
      this.loadCentresForLigne(ligne, natureId, true, '');
      // Règle métier sur tiers
      this.handleNatureChange(ligne, natureId);
    });

    ligne.get("montantligne")?.valueChanges.subscribe(() => {
      this.updateTotalMontant();
    });

    this.lignes.push(ligne);
  }

  protectionField(ligne: FormGroup, field: string) {
    if (!ligne.get("natureop")?.value) {
      this.toastr.error("Veuillez renseigner la nature avant de continuer.");
      return false;
    }
    // return true;
    if (field === 'tiers') {
      const natureId = ligne.get('natureop')?.value;
      const nature = this.natureoperations.find(n => n.idnature === natureId);
      if (!nature || nature.imputationtiers !== 1) {
        return false;
      }
    }
    return true;
  }

  //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  removeLine(index: number) {
    this.lignes.removeAt(index);
    this.updateTotalMontant();
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.operationForm.controls;
    if (this.operationForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      this.toastr.warning(this.msgErros);
      return;
    }

    /** 2. prepare data */
    //const formValue = this.operationForm.value;
    const formValue = this.operationForm.getRawValue();
    this.closeModal('showModal');

    const _operation: operationModel = {
      ...this.operation,
      ...formValue,
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_operation);
    else this.update(_operation);
    // if (!_caisse.idcaisse) this.create(_caisse);
    // else this.update(_caisse);
  }

  closeModal(modal: string){
    this.showCaisses = false;
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  //Enregistrement de données
  create(_operation: operationModel) {
    const {idoperation, ...dataToSend} = _operation;
    this.loading = true;
    this.operationservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          //this.getAllOperations();
          this.rafreshpage();
          this.reloadData();
          this.toastr.success('Opération enregistrée avec succès');
        } else {
          this.error = "Erreur de création";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    })
  }

  //Impression du reçu
  printRecu(){
    if (!this.operation) return;

    //Recuperationd de l'id
    const id = this.operation.idoperation;
    this.operationservice.getRecuPdf(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
      // next: (blob) => {
      //   const url = URL.createObjectURL(blob);
      //   const iframe = document.createElement('iframe');
      //   iframe.style.display = 'none';
      //   iframe.src = url;
      //   document.body.appendChild(iframe);
      //   iframe.contentWindow?.print();
      },
      error: (err) => {
        this.toastr.error("Erreur d\'impression du reçu");
      }
    });
  }
  
  //Modification de données
  update(_operation: operationModel){
    this.operationservice.update(_operation).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllOperations();
          this.rafreshpage();
          this.toastr.success('Opération modifée avec succès');
        } else {
          this.error = "Erreur de modification";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "échec de Modification";
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    })
  }

  modalUpdate(_object: operationModel){
    this.isUpdated = false;
    this.operation = _object;
    this.actionModal = "update";
    this.operationForm.reset();
    this.initForm();
    //Charger les tiers
    this.getAllTiers();
    //Charger les centres analytiques
    this.getAllcentres();
    this.loadCaissesForm().subscribe({
      next: () => {
        this.dispatchOperation(_object);
        const type = _object.caisses[0]?.codtypeoperation;
        this.operationForm.patchValue({ typepaiement: type });
        this.filtrerNatures(type);
        this.operationForm.get("dateoperation")?.disable();

        // recalcul automatique
        this.caisses.controls.forEach((caisseFG: any) => {
          this.applyAutoCalcul(caisseFG);
        });
      }
    });
  }

  //Modal edit 
  modalEdit(_object: operationModel){
    this.operationdetail = _object;
  }

  onTypePaiementChange(type: string) {
    this.filtrerNatures(type);

    // Réinitialiser les natures déjà choisies
    this.lignes.controls.forEach((ligne: FormGroup) => {
      ligne.patchValue({
        natureop: null,
        centre: null,
        tiers: null,
        montantligne: ""
      });

      ligne.get('centre')?.disable();
      ligne.get('tiers')?.disable();
      ligne.get('montantligne')?.disable();
    });
  }

  //Récuperer le taux de la devise transaction vers la devise du référentiel
  // Si la devise de transaction est égale à l'un des devises de caisse aussi
  private getTauxDeviseTransaction(): number {
    const deviseTransaction = this.operationForm.get('devise')?.value;

    const caisseConversion = this.caisses.controls.find(c =>
      c.get('iddevisecaisse')?.value === deviseTransaction
    );

    return caisseConversion
      ? parseFloat(caisseConversion.get('taux')?.value) || 1
      : 1;
  }

  applyAutoCalcul(caisseFG: FormGroup) {
    const montantCtrl = caisseFG.get('montantcaisse');
    const devisecaisseCtrl = caisseFG.get('iddevisecaisse');
    const tauxCtrl = caisseFG.get('taux');
    const refCtrl = caisseFG.get('montantref');
    const devTransactionCtrl = this.operationForm.get('devise');
    const deviseReference = this.user?.devise_ref_id;

    if (!montantCtrl || !tauxCtrl || !refCtrl) return;

    const updateMontantRef = () => {
      const deviseTransaction = devTransactionCtrl?.value;
      const montant = parseFloat(montantCtrl.value) || 0;
      const taux = parseFloat(tauxCtrl.value) || 1;
  
      const montantRef = montant * taux;
      refCtrl.setValue(montantRef, { emitEvent: false });

      if (deviseTransaction === deviseReference) {
        // même devise → pas de conversion
        this.operationForm.patchValue(
          { montantRefglobal: this.totalLignes },
          { emitEvent: false }
        );
      } else {
        // utiliser le taux de la caisse correspondant à la devise transaction
        const tauxConversion = this.getTauxDeviseTransaction();
        const montantRefGlobal = this.totalLignes * tauxConversion;

        this.operationForm.patchValue(
          { montantRefglobal: montantRefGlobal },
          { emitEvent: false }
        );
      }

      const maxMontantRef = this.operationForm.get('montantRefglobal')?.value || 0;
      //contrôle référentiel paiement dépasse référentiel global
      if (montantRef > maxMontantRef) {
        // montantCtrl.setErrors({ depassementMontant: true });
        // refCtrl.setValue(montantRef, { emitEvent: false });
        // return;
        montantCtrl.setErrors({ depassementMontant: true });
        this.operationForm.setErrors({
          ...(this.operationForm.errors || {}),
          totalCaisseDepasse: true
        });

        refCtrl.setValue(montantRef, { emitEvent: false });
        return;
      }

      // contrôle dépassement montant total
      if (this.isCaisseOverTotal(montantRef, caisseFG)) {
        montantCtrl.setErrors({ depassement: true });
        refCtrl.setValue(0, { emitEvent: false });
        return;
      }

      //OK → retirer l’erreur
      if (montantCtrl.hasError('depassementMontant')) {
        const errors = montantCtrl.errors;
        delete errors?.['depassementMontant'];
        Object.keys(errors || {}).length
          ? montantCtrl.setErrors(errors)
          : montantCtrl.setErrors(null);
      }

      // Nettoyage erreur globale
      if (this.operationForm.hasError('totalCaisseDepasse')) {
        const formErrors = { ...(this.operationForm.errors || {}) };
        delete formErrors['totalCaisseDepasse'];
        Object.keys(formErrors).length
          ? this.operationForm.setErrors(formErrors)
          : this.operationForm.setErrors(null);
      }

      refCtrl.setValue(montantRef, { emitEvent: false });

      //contrôle global après chaque saisie
      this.controlTotalCaisses(maxMontantRef);
    };

    montantCtrl.valueChanges.subscribe(updateMontantRef);
    tauxCtrl.valueChanges.subscribe(updateMontantRef);

    //Calcul initial (pour UPDATE)
    updateMontantRef();
  }

  get resteARepartir(): number {
    const max = this.operationForm.get('montantRefglobal')?.value || 0;
    const total = this.caisses.controls.reduce((s, c) =>
      s + (parseFloat(c.get('montantref')?.value) || 0), 0
    );
    return max - total;
  }

  //La somme de toutes les lignes opérations
  get totalLignes(): number {
    return this.lignes.controls.reduce((sum, l) => {
      return sum + (parseFloat(l.get('montantligne')?.value) || 0);
    }, 0);
  }

  //Total des montants de caisse
  get totalCaisses(): number {
    return this.caisses.controls.reduce((sum, c) => {
      return sum + (parseFloat(c.get('montantref')?.value) || 0);
    }, 0);
  }

  controlTotalCaisses(maxMontantRef: number) {
    const totalRef = this.caisses.controls.reduce((sum, c) =>
      sum + (parseFloat(c.get('montantref')?.value) || 0), 0
    );

    if (totalRef > maxMontantRef) {
      this.operationForm.setErrors({
        ...(this.operationForm.errors || {}),
        totalCaisseDepasse: true
      });
    } else {
      if (this.operationForm.errors?.['totalCaisseDepasse']) {
        const errors = { ...this.operationForm.errors };
        delete errors['totalCaisseDepasse'];
        Object.keys(errors).length
          ? this.operationForm.setErrors(errors)
          : this.operationForm.setErrors(null);
      }
    }
  }

  //Empêcher le dépassement par caisse
  isCaisseOverTotal(montantRef: number, currentCaisse: FormGroup): boolean {
    const totalAutresCaisses = this.caisses.controls
      .filter(c => c !== currentCaisse)
      .reduce((sum, c) => {
        return sum + (parseFloat(c.get('montantref')?.value) || 0);
      }, 0);

    return (totalAutresCaisses + montantRef) > this.totalLignes;
  }

  finaliserModal(){
    const sameDate = this.checkSameDatePeriodes();
    if (sameDate) {
      this.operationForm.patchValue({
        dateoperation: this.formatDateForInput(sameDate)
      });
      this.operationForm.get("dateoperation")?.disable();
    }
  }

  //Recalcule lors de la saisie
  recalculateCaisse(caisseFG: FormGroup) {
    const montant = Number(caisseFG.get('montantcaisse')?.value || 0);
    const taux = Number(caisseFG.get('taux')?.value || 1);

    caisseFG.get('montantref')?.setValue(montant * taux, { emitEvent: false });
  }

  // Recuperer la devise

  modalCreate(){
    this.isUpdated = true;
    this.actionModal = "create";
    //Charger les tiers
    this.getAllTiers();
    //Charger les centres analytiques
    this.getAllcentres();
    //charger les demandes
    this.loadAllDemandes();
    this.loadingModal = true;
    this.initForm();
    this.loadCaissesForm().subscribe({
      next: () => {
        this.finaliserModal();
        this.loadingModal = false;
        //Si la demande est sélectionnée
        this.operationForm.get('demande')?.valueChanges.subscribe(iddemande => {
          if (iddemande) {
            // Désactiver les boutons sur le formulaire de création
            this.isUpdated = false;
            this.onDemandeSelected(iddemande);
            //Verrouiller tout le formulaire
            this.operationForm.disable({ emitEvent: false });
            //Champs autorisés
            this.operationForm.get('demande')?.enable({ emitEvent: false });
            this.operationForm.get('caisses')?.enable({ emitEvent: false });
          }
        });
        // Filtrer les natures quand typepaiement change
        this.operationForm.get("typepaiement")?.valueChanges.subscribe(type => {
          this.onTypePaiementChange(type);
        });

        // recalcul automatique
        this.caisses.controls.forEach((caisseFG: any) => {
          this.applyAutoCalcul(caisseFG);
        });
      }, 
      error: () => {
        this.loadingModal = false;
      }
    });
  }

  formatDateForInput(date: string) {
    return date ? date.substring(0, 10) : "";
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllOperations(); // recharge les données
  }
  
  modalDelete(item: operationModel){
    this.deleteOperation = item;
  }
  
  deleteConfirmed(){
    if(!this.deleteOperation) return ;
    this.operationservice.delete(this.deleteOperation.idoperation).subscribe({
      next: (res) => {
        if (res.success) {
          this.deleteOperation = null;
          this.closeModal('deleteOrder');
          this.getAllOperations();
          this.rafreshpage();
          this.toastr.error('Opération supprimée');
        } else {
          this.error = "Erreur de Suppression";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Suppression échec";
        this.loading = false;
        this.toastr.error(this.error);
      }
    })
  }

  updateButtonState() {
    this.isAnyOpen = this.caisseperiodes.some(
      p => p.statut?.toLowerCase() === "ouverte"
    );
  }

  //Sur la demande selectionnée
  onDemandeSelected(iddemande: string) {
    this.service.getEntete(iddemande).subscribe({
      next: (res) => {
        if(res.success){
          this.fillFormFromDemande(res.data);
        }else{
          this.loadingModal = false;
        }
      },
      error: () => {
        this.loadingModal = false;
      }
    });
  }

  //Création des lignes depuis la demande
  createLigneFromDemande(ligne: any): FormGroup {
    const fg = this.fb.group({
      idligne: [''],
      montantligne: [ligne.montantdemande, Validators.required],
      natureop: [ligne.natureoperation?.idnature],
      centre: [ligne.centreanalytique?.idcentre],
      // centre: [""],
      tiers: [ligne.tiers?.idtiers],
      centres: this.fb.control<any[]>([])
    });

    //charger centres POUR CETTE LIGNE
    this.loadCentresForLigne(fg, ligne.natureoperation?.idnature, false, ligne.centreanalytique?.idcentre);

    return fg;
  }

  //Remplir le formulaire depuis la demande
  fillFormFromDemande(demande: any) {
    /**Patch entête */
    this.operationForm.patchValue({
      libelle: demande.libelledemande,
      devise: demande.devise?.iddevise,
      site: demande.site?.idsite,
      societe: demande.societe?.idsociete,
      typepaiement: demande.typedemande === 'decaissement' ? 'decaissement' : 'encaissement',
      montant: this.getTotalDemande(demande)
    });

    /** Reset lignes */
    const lignesFA = this.operationForm.get('lignes') as FormArray;
    lignesFA.clear();

    /** Recréer lignes */
    demande.lignes.forEach((ligne: any) => {
      const ligneFG = this.createLigneFromDemande(ligne);
      lignesFA.push(ligneFG);
    });

    /** Recalcul auto */
    this.caisses.controls.forEach((caisseFG: any) => {
      this.applyAutoCalcul(caisseFG);
    });
  }

}
