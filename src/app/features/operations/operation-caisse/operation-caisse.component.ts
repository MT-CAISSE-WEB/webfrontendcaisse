import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { operationModel } from '../model/operation.model';
import { OperationService } from '../service/operation.service';
import { caissePeriodeModel } from '../../caisse_journal/models/periodecaisse.model';
import { CaissePeriodeService } from '../../caisse_journal/services/caisseperiode.service';
import { debounceTime, distinctUntilChanged, map, Observable, takeUntil, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';

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

  //Faire le check selection **********
  objectsSelected : operationModel[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Changement titre modal
  actionModal: string = "create";

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  caissesAny: any[] = [
    {
      idcaisse : "47FCE466-8123-4DEB-942B-9F0E5BB22FD4",
      codecaisse : "CA001",
      libelle : "Caisse principale",
      devise : "XAF"
    },
    {
      idcaisse : "F1DD7EDE-EB9C-41D2-8EE1-55300B21777C",
      codecaisse : "CA002",
      libelle : "Caisse secondaire",
      devise : "USD"
    }
  ];

  //Liste des natures opérations
  natureOperations: any[] = [
    {
      idnature : "A5E38801-5BCC-43D2-B695-453C2B78B1D3",
      codenature : "NAT004",
      libelle : "Achat consommables bureau",
      imputationtiers : 0,
      avanceajustifier : 0,
      actif : 1,
      typeoperation: "decaissement"
    },
    {
      idnature : "AC0CBD05-D76E-4CB2-BB91-459C6B47C198",
      codenature : "NAT003",
      libelle : "Achat fournitures bureau",
      imputationtiers : 0,
      avanceajustifier : 0,
      actif : 1,
      typeoperation: "decaissement"
    },
    {
      idnature : "DB432B1C-777C-4832-AF53-9CB8DE7681B0",
      codenature : "NAT001",
      libelle : "Achat eau fontaines",
      imputationtiers : 0,
      avanceajustifier : 0,
      actif : 1,
      typeoperation: "decaissement"
    },
    {
      idnature : "783C77AD-E9D7-45CA-83BB-9643255B6F4A",
      codenature : "NAT007",
      libelle : "Approvisionnement caisse",
      imputationtiers : 0,
      avanceajustifier : 0,
      actif : 1,
      typeoperation: "encaissement"
    },
  ];

  //Liste des natures filtrées
  naturesFiltrees: any[] = [];
  natureoperations : natureoperationModel[] = [];

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  //Element à supprimer 
  deleteOperation: any = null;

  //Liste periode 
  caisseperiodes: caissePeriodeModel[] = [];

  showCaisses = false;
  loadingModal = false;
  isAnyOpen: boolean = false;

  caisseStatuses: any = {};

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
    private router : Router, private caissePeriodeservice: CaissePeriodeService,
    private operationservice: OperationService,
    private currencyPipe: CurrencyPipe
  ){}

  ngOnInit(): void {
    //initialiser le formulaire de recherche
    this.initSearchForm();
    //Afficher toutes les opérations
    this.getAllOperations();
    //Initialisation du formulaire
    this.initForm();
    //Charger mes caisses
    this.getCaisseUser();

    // Récupérer les statuts de caisse
    this.caissePeriodeservice.statuses$.subscribe(status => {
      this.caisseStatuses = status;
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

  //Recuperer les natures opérations
  getAllNatureoperations(){
    const params = {
      page: 1,
      limit: 100
    };
    this.natureoperationservice.getAll(params).subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //Recuperer les devises de la societe

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
      codeoperation : [""],
      libelle : [""],
      dateoperation : [{ value: null, disabled: false }, [Validators.required]],
      typepaiement: ["", [Validators.required]],
      lignes: this.fb.array([]),
      devise : ["", [Validators.required]],
      site : ["197D7C37-7180-4DD1-80CC-843B9A6C5B52"],
      societe : [this.user.idsociete ?? null],
      montant: [0],
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
        console.error("Erreur chargement caisses utilisateur");
      }
    });
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
          solde: [this.formatNumber(p.solde) ?? 0],
          montantcaisse: [0],
          taux: [1],
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
    if (!type) {
      this.naturesFiltrees = [];
      return;
    }

    const cleanType = type.toLowerCase().trim();
    this.naturesFiltrees = this.natureoperations.filter(n => 
      n.typeoperation.toLowerCase().trim() === cleanType
    );
  }

  get caisses(): FormArray<FormGroup> {
    return this.operationForm.get("caisses") as FormArray<FormGroup>;
  }

  // toggleCaisses() {
  //   this.showCaisses = !this.showCaisses;
  //   // Charger les caisses UNE SEULE FOIS
  //   if (this.showCaisses && !this.caissesLoaded) {
  //     this.loadCaissesForm();
  //     this.caissesLoaded = true;
  //   }
  // }

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
    return this.caissePeriodeservice.getCaissesPeriodes(this.caissesUser).pipe(
      tap((responses: any[]) => {
        const periodes = responses.map(r => r.data);
        // caisse existante dans l'opération ?
        //const opCaisse = this.operations.get(p.idcaisse);
        // remplir tableau métier
        this.caisseperiodes = periodes;
        // remplir le formulaire
        const caissesArray = this.operationForm.get('caisses') as FormArray;
        caissesArray.clear();
        periodes.forEach(p => {
          caissesArray.push(this.fb.group({
            idcaisse: [p.idcaisse, Validators.required],
            caisse: [p.caisse?.codecaisse || null, Validators.required],
            statut: [p.statut],
            devisecaisse: [p.caisse?.devise?.codedevise || null],
            solde: [this.formatNumber(p.solde) ?? 0],
            montantcaisse: [0],
            taux: [1],
            idperiode : [p.idperiode ? p.idperiode : null, Validators.required]
          }));
        });
      }),
      map(() => void 0)
    );
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.operations.slice();
    else this.objectsSelected = [];
  }

  dispatchOperation(_object: operationModel){
    // Construire les lignes en FormGroup[]
    const lignesFG = _object.lignes.map(l => this.fb.group({
      idligne : [l.idligneoperation ?? null],
      natureop : [l.nature?.idnature ?? null],
      centre   : [l.centre?.idcentreanalytique ?? null],
      tiers    : [l.tiers?.idtiers ?? null],
      montantligne : [l.montantoperation ?? ""]
    }));

    //Construire les caisses en FormGroup[]
    const caisseFG = _object.caisses.map(c => {
      // Trouver la caisse dans caissesAny
      const caisseSource = this.caissesUser?.find(x => x.idcaisse === c.idcaisse);

      return this.fb.group({
        idcaisse: [c.idcaisse],
        caisse : [c.codecaisse ?? ""],
        montantcaisse : [c.montant ?? 0],
        taux : [c.taux ?? 1],
        montantref : [c.montantref ?? (c.montant ?? 0) * (c.taux ?? 1)],
        solde : [c.solde ?? 0],
        devisecaisse : [c.devise ?? null],
        idtypeoperation : [c.idtypeoperation ?? null]
      })
    });

    // Patch des champs simples
    this.operationForm.patchValue({
      codeoperation : _object.codeoperation,
      libelle       : _object.libelle,
      devise        : _object.devise.iddevise,
      site          : _object.site.idsite,
      typepaiement  : _object.caisses[0].codtypeoperation,
      montant       : _object.montant,
      dateoperation : this.formatDateForInput(_object.dateoperation),
      societe       : _object.societe.idsociete,
    });

    //Filtrer les natures quand typeoperation change
    this.filtrerNatures(_object.caisses[0].codtypeoperation,);

    // Mise à jour du FormArray
    this.operationForm.setControl("lignes", this.fb.array(lignesFG));
    this.operationForm.setControl("caisses", this.fb.array(caisseFG));
  }

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
  
  //Ajouter la ligne dans le tableau
  addLine() {
    const ligne = this.fb.group({
      natureop : [{ value: null, disabled: false }, [Validators.required]],
      centre: [{ value: null, disabled: true }, ],
      tiers: [{ value: null, disabled: true }, ],
      montantligne: [{ value: "", disabled: true }, [Validators.required]]
    });

    // Quand natureop change → activer ou désactiver les autres champs
    ligne.get("natureop")?.valueChanges.subscribe(value => {
      if (value) {
        // Activer les champs
        ligne.get("centre")?.enable();
        ligne.get("tiers")?.enable();
        ligne.get("montantligne")?.enable();
      } else {
        // Désactiver les champs
        ligne.get("centre")?.disable();
        ligne.get("tiers")?.disable();
        ligne.get("montantligne")?.disable();
      }
    });

    ligne.get("montantligne")?.valueChanges.subscribe(() => {
      this.updateTotalMontant();
    });

    this.lignes.push(ligne);
  }

  protectionField(ligne: FormGroup, field: string) {
    if (!ligne.get("natureop")?.value) {
      //this.showError("Veuillez renseigner la nature avant de continuer.");
      return false;
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
          this.getAllOperations();
          this.rafreshpage();
        } else {
          this.error = "Erreur de création";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Création échec";
        this.loading = false;
      }
    })
  }
  
  //Modification de données
  update(_operation: operationModel){
    this.operationservice.update(_operation).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllOperations();
          this.rafreshpage();
        } else {
          this.error = "Erreur de modification";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Modification échec";
        this.loading = false;
      }
    })
  }

  applyAutoCalcul(caisseFG: FormGroup) {
    const montantCtrl = caisseFG.get('montantcaisse');
    const tauxCtrl = caisseFG.get('taux');
    const refCtrl = caisseFG.get('montantref');

    const updateMontantRef = () => {
      const montant = Number(montantCtrl?.value || 0);
      const taux = Number(tauxCtrl?.value || 1);
      refCtrl?.patchValue(montant * taux, { emitEvent: false });
    };

    montantCtrl?.valueChanges.subscribe(updateMontantRef);
    tauxCtrl?.valueChanges.subscribe(updateMontantRef);

    // Calcul initial (pour UPDATE)
    updateMontantRef();
  }

  finaliserModal(){
    const sameDate = this.checkSameDatePeriodes();
    if (sameDate) {
      this.operationForm.patchValue({
        dateoperation: this.formatDateForInput(sameDate)
      });
      this.operationForm.get("dateoperation")?.disable();
    }

    // this.operationForm.get("typepaiement")?.valueChanges
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(type => this.filtrerNatures(type));
  }

  modalCreate(){
    this.actionModal = "create";
    this.loadingModal = true;
    this.initForm();
    this.loadCaissesForm().subscribe({
      next: () => {
        this.finaliserModal();
        this.loadingModal = false;
        // Filtrer les natures quand typepaiement change
        this.operationForm.get("typepaiement")?.valueChanges.subscribe(type => {
          this.filtrerNatures(type);
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
  
  modalUpdate(_object: operationModel){
    this.operation = _object;
    this.actionModal = "update";
    this.operationForm.reset();
    //Réinitialiser le formulaire
    this.initForm();
    this.loadCaissesForm();
    this.dispatchOperation(_object);
    // Empêcher modification du champ
    this.operationForm.get("dateoperation")?.disable();
    // Appliquer le calcul automatique sur chaque caisse
    this.caisses.controls.forEach((caisseFG: any) => {
      this.applyAutoCalcul(caisseFG);
    });
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllOperations(); // recharge les données
  }

  // loader(){
  //   this.router.navigateByUrl(APP_caisse_CAISSE_caisse).then();
  // }
  
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
        } else {
          this.error = "Erreur de Suppression";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Suppression échec";
        this.loading = false;
      }
    })
  }

  loadPeriodes() {
    this.caissePeriodeservice.getCaissesPeriodes(this.caissesUser).subscribe({
      next: (responses) => {
        this.caisseperiodes = responses.map(res => res.data);
        this.updateButtonState();   // vérifie les statuts
      },
      error: () => {
        console.error("Erreur chargement périodes");
      }
    });
  }

  updateButtonState() {
    this.isAnyOpen = this.caisseperiodes.some(
      p => p.statut?.toLowerCase() === "ouverte"
    );
  }

}
