import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { operationModel } from '../model/operation.model';
import { tauxdevisemodel } from '../../donnee_base/donnee_base/model/tauxdevise.model';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { AffectationNatureCentreService } from '../../donnee_base/services/affectationnaturecentre.service';
import { OperationService } from '../service/operation.service';
import { ToastrService } from 'ngx-toastr';
import { deviseservice } from '../../donnee_base/donnee_base/service/devise.service';
import { devisemodel } from '../../donnee_base/donnee_base/model/devise.model';
import { map, Observable, tap } from 'rxjs';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { DemandeService } from '../../demande/services/demande.service';
import { JustificatifService } from '../service/justificatif.service';
import { detailJustificatifModel, JustificatifModel } from '../model/justificatif.model';

@Component({
  selector: 'app-opration-justifiee',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './opration-justifiee.component.html',
  styleUrl: './opration-justifiee.component.css'
})
export class OprationJustifieeComponent implements OnInit{
  title = "Régularisation";
  params : any = {};

  fb: FormBuilder = new FormBuilder();
  msgErros : string = "";
  loading: Boolean = false;
  operationForm : FormGroup = this.fb.group({});

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  loadingModal = false;
  montantTotaligne: number = 0;

  operations : operationModel[] = [];
  operationsFiltrees : operationModel[] = [];
  operation : operationModel = new operationModel();

  //Le taux de devises
  tauxdevise : tauxdevisemodel = new tauxdevisemodel();
  taux : any;

  //Les datas justificatifs
  justificatifPieces : JustificatifModel[] = [];
  justificatif : JustificatifModel = new JustificatifModel();
  justificatifFiltered : JustificatifModel[] = [];
  loadingPiece = false;

  //Les datas details justificatifs
  justificatifDetail : detailJustificatifModel[] = [];
  justificatifDetailFiltered : detailJustificatifModel[] = [];

  private tauxConversionTransaction = 1;

  showCaisses: Boolean = false;
  caisseperiodes : any[] = [];
  loadingCaisses: boolean = false;

  natureoperations : natureoperationModel[] = [];
  //Liste des tiers
  tiers : tiersModel[] = [];
  devises : devisemodel[] = [];

  //Changement titre modal
  actionModal: string = "create";

  //Bouton active / inactive
  isUpdated: boolean = true;
  error: string = "";

   constructor(private natureoperationservice: NatureoperationService, private tiersservice: TiersService, private toastr : ToastrService,
    private AffectationNatureCentreService: AffectationNatureCentreService, private operationservice: OperationService,
    private ds:deviseservice, private caisseuserservice: AffectationCaisseService, private service: DemandeService, private justificatifservice: JustificatifService
   ){}

  ngOnInit(): void {
    // Initialiser un formulaire
      this.initForm();
      //Recuperer la devise
      this.getalldevises();
      //Afficher toutes les opérations
      this.getAllOperations();
      //Initialisation du formulaire dans la méthode getcaissesPeriodes
      this.getcaissesPeriodes();
      //Charger les natures d'opérations
      this.getAllNatureoperations();
      
      //Récuperer les tiers
      this.getAllTiers();
  
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette opération");
      this.titleMsg = TITLE_DELETE;

      this.operationForm.get('operation')?.valueChanges.subscribe(op => {
      if(op){
        const operation_ = this.operations.find(el => el.idoperation === op);
        this.fillFormFromOperation(operation_);
        //Justificatif 
        this.fillTableJustificatif(operation_);
      }
      });

      //A la selectionner de la devise
      this.operationForm.get('devisejustificatif')?.valueChanges.subscribe(devise => {
        if(devise){
          if (devise === this.user.devise_ref_id) {
            this.operationForm.patchValue({ tauxoperation: 1 });
            return;
          }
          //Charger sur le dernier taux
          this.loadLastdeviseTaux(devise);
        }
      });

      this.operationForm.get('retourcaisse')?.valueChanges.subscribe(value => {
      if (value) {
        // ON
        this.showCaisses = true;
        this.loadCaissesForm().subscribe({
          next: () => {
            // recalcul automatique
            this.caisses.controls.forEach((caisseFG: any) => {
              this.applyAutoCalcul(caisseFG);
            });
          },
          error: () => {
            this.loadingModal = false;
          }
        });
      } else {
        // OFF
        this.showCaisses = false;
        this.clearCaisses();
      }
      });
  }

  fillFormFromOperation(op: any){
    const totalCaissesOperation = op.caisses?.reduce(
        (sum: any, caisse: any) => sum + (parseFloat(caisse.montantref) || 0),0) || 0;
      
    this.operationForm.patchValue({
      dateoperation: this.formatDateForInput(op.dateoperation),
      deviseoperation: op.devise?.iddevise,
      montantoperation: op.montant,
      montantRefglobal: totalCaissesOperation
    });

    this.updateTotalMontant();
  }

  //Remplir le tableau les pièces jsutificatives
  fillTableJustificatif(op: any){
    this.loadingPiece = true;
    const params = {};
    this.justificatifservice.getJustificatifs(params).subscribe({
      next : (res) => {
        if(res.success){
          this.justificatifPieces = res.data;
          this.justificatifFiltered = this.justificatifPieces.filter(el => el.operation.idoperation == op.idoperation);
          this.loadingPiece = false;
        }
      },
      error : (err)  => {
        console.log(err);
        this.loadingPiece = false;
      },
    })
  }

  formatDateForInput(date: string) {
    return date ? date.substring(0, 10) : "";
  }

  //Remplir les lignes details de la piece justificative
  fillTableLigneJustificatif(piece: any){
    const params = {};
    this.justificatifservice.getdetailsJustificatif(params).subscribe({
      next : (res) => {
        if(res.success){
          this.justificatifDetail = res.data;
          this.justificatifDetailFiltered = this.justificatifDetail.filter(el => el.idjustificatif == piece.idjustificatifoperation);
          const _object = {
            justificatif : piece,
            details : this.justificatifDetailFiltered
          }
          this.dispatchDetail(_object);
        }
      },
      error : (err)  => {
        console.log(err);
      },
    })
  }

  dispatchDetail(_object: any){
    // Patch des champs simples
    this.operationForm.patchValue({
      tauxoperation       : _object.justificatif.taux,
      devisejustificatif        : _object.justificatif.iddevise,
      commentaire          : _object.justificatif.commentaire,
      datejustificatif : this.formatDateForInput(_object.justificatif.date),
    });

    this.lignes.clear();
    _object.details.forEach((l: any) => {
      const ligneGroup = this.fb.group({
        idligne: [l.iddetailsjustificatifoperation ?? null],
        idnature: [l.idnature ?? null, Validators.required],
        idcentreanalytique: [{ value: l.idcentreanalytique, disabled: true }],
        idtiers: [{ value: l.idtiers ?? null, disabled: true }],
        montantdetail: [{ value: l.montantdetail ?? "", disabled: false }, Validators.required],

        //centres propres à la ligne
        centres: this.fb.control<any[]>([])
      });

      this.lignes.push(ligneGroup);
    });
  }

  //Charger le dernier taux
  loadLastdeviseTaux(devise: any){
    const datePivot = this.operationForm.get('datejustificatif')?.value;
    const devises = {
      iddeviseorigine: devise,
      iddevisedestination : this.user.devise_ref_id,
      datepiece : datePivot
    };

    this.getderniertaux(devises);
  }

  //Get le taux recent
  getderniertaux (payload: any){
    this.service.tauxrecent(payload).subscribe({
      next : (res) => {
         if(res.success){
            this.tauxdevise = res.data;
            if(!this.tauxdevise){
              this.operationForm.patchValue({ tauxoperation: 1 });
            }else{
              this.operationForm.patchValue({ tauxoperation: this.tauxdevise.coefficient });
            }
         }else{
          this.toastr.error("Erreur serveur", res);
         }
      },
      error: (err) => {
        this.toastr.error("Erreur backend", err.error.message)
      }
    });
  }

  //Initialiser le formulaire
  initForm(){
    this.operationForm = this.fb.group({
      operation : [""],
      commentaire : [""],
      dateoperation : [{ value: null, disabled: false }, [Validators.required]],
      datejustificatif : ["", [Validators.required]],
      retourcaisse: [""], //Justificatif
      lignes: this.fb.array([]),
      deviseoperation : ["", [Validators.required]],
      devisejustificatif : ["", [Validators.required]],
      site : [this.user.idsite ?? null],
      societe : [this.user.idsociete ?? null],
      resteapayerref: [0],
      resteapayeroperation: [0],
      tauxoperation: [1],
      montantRefglobal: [0],
      montantoperation: [0],
      caisses: this.fb.array([]),
    })
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  clearCaisses(): void {
    const caissesArray = this.operationForm.get('caisses') as FormArray;
    caissesArray.clear();
  }

  get form() {
    return this.operationForm.controls;
  }

  get lignes(): FormArray<FormGroup> {
    return this.operationForm.get('lignes') as FormArray<FormGroup>;
  }

  //La somme de toutes les lignes opérations
  get totalLignes(): number {
    return this.lignes.controls.reduce((sum, l) => {
      return sum + (parseFloat(l.get('montantdetail')?.value) || 0);
    }, 0);
  }

  //Total des montants de caisse
  get totalCaisses(): number {
    return this.caisses.controls.reduce((sum, c) => {
      return sum + (parseFloat(c.get('montantref')?.value) || 0);
    }, 0);
  }

  //Total des montants de caisse
  get montantRef(): number {
    return this.operations.reduce((total, operation) => {
      const totalCaissesOperation = operation.caisses?.reduce(
        (sum, caisse) => sum + (parseFloat(caisse.montantref) || 0),
        0
      ) || 0;

      return total + totalCaissesOperation;
    }, 0);
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

  removeLine(index: number) {
    this.lignes.removeAt(index);
    this.updateTotalMontant();
  }

  updateTotalMontant() {
    let total = 0;

    this.lignes.controls.forEach((ctrl: any) => {
      const val = parseFloat(ctrl.get("montantdetail")?.value || 0);
      total += isNaN(val) ? 0 : val;
    });

    const taux = parseFloat(this.operationForm.get("tauxoperation")?.value || 1);
    this.montantTotaligne = total;
    const montantoperation = parseFloat(this.operationForm.get('montantoperation')?.value || 0);
    const c = montantoperation - total;
    const montantreferentiel = parseFloat(this.operationForm.get('montantRefglobal')?.value || 0);
    const mtenref = this.montantTotaligne * taux;
    const d = montantreferentiel - mtenref;

    this.operationForm.patchValue({ resteapayeroperation: c });
    this.operationForm.patchValue({ resteapayerref: d });
  }

  //Ajouter la ligne dans le tableau
  addLine() {
    const ligne = this.fb.group({
      idnature : [{ value: null, disabled: false }, [Validators.required]],
      idcentreanalytique: [{ value: null, disabled: true }, ],
      idtiers: [{ value: null, disabled: true }, ],
      montantdetail: [{ value: "", disabled: true }, [Validators.required]],
      //CENTRES PAR LIGNE
      centres: this.fb.control<any[]>([])
    });

    ligne.get("idnature")?.valueChanges.subscribe(natureId => {
      if (!natureId) {
        ligne.get("idcentreanalytique")?.disable();
        ligne.get("idtiers")?.disable();
        ligne.get("montantdetail")?.disable();
        ligne.get('centres')?.setValue([]);
        return;
      }

      // Champs de base
      ligne.get("idcentreanalytique")?.enable();
      ligne.get("montantdetail")?.enable();

      //charger centres POUR CETTE LIGNE
      this.loadCentresForLigne(ligne, natureId, true, '');
      // Règle métier sur tiers
      this.handleNatureChange(ligne, natureId);
    });

    ligne.get("montantdetail")?.valueChanges.subscribe(() => {
      this.updateTotalMontant();

      //Calcul montant ref aussi
      //.updateMontantRefGlobal();
    });

    this.lignes.push(ligne);
  }

  //Calcul du montant référentiel opération
  private updateMontantRefGlobal() {
    const montantGlobal = this.totalLignes * this.tauxConversionTransaction;
    this.operationForm.patchValue(
      { montantRefglobal: montantGlobal },
      { emitEvent: false }
    );
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

  //Recuperer toutes les opérations
  getAllOperations(){
    this.loading = true;
    this.params = {
      page: 1,
      limit: 10000000,
      search: '',
      date: '',
      status: '',
    };
    this.operationservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.operations = res.data.data;
          if(this.operations.length != 0){
            this.operationsFiltrees = this.operations.filter(op =>
              op.caisses?.some(caisse =>
                caisse.codtypeoperation?.toLowerCase().includes('decaissementaj')
              )
            );
          }
          this.loading = false;
        }
      },
      error : (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      },
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

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  //Charger les caisses sur le formulaires
  loadCaissesForm(): Observable<void> {
    const payload = {
      idutilisateur : this.user.idutilisateur,
      iddeviserefsoc: this.user.devise_ref_id
    };
    this.loadingModal = true;
    return this.caisseuserservice.getCaissesUserPeriode(payload).pipe(
      tap(res => {
        const periodes = res?.data ?? [];
        this.loadingModal = res?.data ? false : true;
        const caissesArray = this.operationForm.get('caisses') as FormArray;
        caissesArray.clear();
        periodes.forEach((p: any) => {
          caissesArray.push(this.fb.group({
            idcaisse: [p.caisse?.idcaisse],
            caisse: [p.caisse?.code],
            statut: [p.periode?.statut ?? null],
            devisecaisse: [p.devise?.code ?? null],
            iddevisecaisse: [p.devise?.iddevise ?? null],
            solde: [this.formatCFA(p.solde?.montant ?? 0)],
            montantcaisse: [0],
            montantref: [0],
            taux: [p.solde?.taux ?? 1],
            idperiode: [p.periode?.idperiode]
          }));
        });
      }),
      map(res => res?.data ?? [])
    );
  }

  get caisses(): FormArray<FormGroup> {
    return this.operationForm.get("caisses") as FormArray<FormGroup>;
  }

  getcaissesPeriodes(){
    this.loadingCaisses = true;
    this.caisseuserservice.getCaissePeriodeByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caisseperiodes = res.data;
          this.loadingCaisses = false;
        }
        this.operationForm.patchValue({
          datejustificatif: this.formatDateForInput(this.caisseperiodes[0].dernierePeriode.dateperiode)
        });
      },
      error : (err) => {
        console.log(err);
        this.toastr.error(err.error.message);
      }
    });
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  parseCFA(valeur: string | null | undefined): number {
    if (!valeur) return 0;
    return Number(valeur.replace(/[^\d]/g, ''));
  }

  // Si la devise de transaction est égale à l'une des devises de caisse aussi
  private getTauxDeviseTransaction(deviseTransaction : any) {
    const deviseReference = this.user.devise_ref_id;

    if (deviseTransaction === deviseReference) {
      this.tauxConversionTransaction = 1;
      this.patchTauxTransaction(this.tauxConversionTransaction);
      return;
    }

    //Récupérer la caisse qui a la même devise que la devise de transaction
    const caisseConversion = this.caisses.controls.filter(c =>
      c.get('iddevisecaisse')?.value !== deviseTransaction
    );

    if(caisseConversion.length != 0){
      caisseConversion.forEach(c => {
        this.tauxConversionTransaction = parseFloat(c.get('taux')?.value) || 1;
      });
    }

    //Charger le taux
    this.loadLastdeviseTaux(deviseTransaction);
  }

  //Centraliser le chargement du taux
  private patchTauxTransaction(taux: number) {
    this.operationForm.patchValue(
      { tauxoperation: taux },
      { emitEvent: true }
    );
  }

  applyAutoCalcul(caisseFG: FormGroup) {
    const soldeCtrl = caisseFG.get('solde');
    const montantCtrl = caisseFG.get('montantcaisse');
    const devisecaisseCtrl = caisseFG.get('devisecaisse');
    const iddevisecaisseCtrl = caisseFG.get('iddevisecaisse');
    const tauxCtrl = caisseFG.get('taux');
    const refCtrl = caisseFG.get('montantref');
    const devTransactionCtrl = this.operationForm.get('devisejustificatif');
    const deviseReference = this.user?.devise_ref_id;

    if (!montantCtrl || !tauxCtrl || !refCtrl || !soldeCtrl) return;

    const updateMontantRef = () => {
      const deviseTransaction = devTransactionCtrl?.value;
      const montant = parseFloat(montantCtrl.value) || 0;
      const taux = parseFloat(tauxCtrl.value) || 1;
      const solde = this.parseCFA(soldeCtrl.value) || 0;
  
      const montantRef = montant * taux;
      refCtrl.setValue(montantRef, { emitEvent: false });

      if (deviseTransaction === deviseReference) {
        // même devise → pas de convedeviseReferencersion
        // this.operationForm.patchValue(
        //   { montantRefglobal: this.totalLignes },
        //   { emitEvent: false }
        // );
      } else {
        // utiliser le taux de la caisse correspondant à la devise transaction
        this.getTauxDeviseTransaction(deviseTransaction);
      }

      const montantglobal = this.operationForm.get('montantRefglobal')?.value || 0;

      //Si le solde caisse devient inférieur au montant saisie
      if (montant > solde) {
        montantCtrl.setErrors({
          ...(montantCtrl.errors || {}),
          soldeInsuffisant: true
        });

        this.operationForm.setErrors({
          ...(this.operationForm.errors || {}),
          soldeCaisseInsuffisant: true
        });

        refCtrl.setValue(0, { emitEvent: false });
        return;
      }

      // Nettoyage erreur solde insuffisant
      if (montantCtrl.hasError('soldeInsuffisant')) {
        const errors = { ...(montantCtrl.errors || {}) };
        delete errors['soldeInsuffisant'];
        Object.keys(errors).length
          ? montantCtrl.setErrors(errors)
          : montantCtrl.setErrors(null);
      }

      // Nettoyage erreur globale solde
      if (this.operationForm.hasError('soldeCaisseInsuffisant')) {
        const formErrors = { ...(this.operationForm.errors || {}) };
        delete formErrors['soldeCaisseInsuffisant'];
        Object.keys(formErrors).length
          ? this.operationForm.setErrors(formErrors)
          : this.operationForm.setErrors(null);
      }

      //contrôle référentiel paiement dépasse référentiel global
      if (montantRef > montantglobal) {
        montantCtrl.setErrors({ depassementMontant: true });
        this.operationForm.setErrors({
          ...(this.operationForm.errors || {}),
          totalCaisseDepasse: true
        });

        refCtrl.setValue(montantRef, { emitEvent: false });
        return;
      }

      // contrôle dépassement montant total
      if (this.isCaisseOverTotal(montantRef, caisseFG, montantglobal)) {
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
      this.controlTotalCaisses(montantglobal);
    };

    montantCtrl.valueChanges.subscribe(updateMontantRef);
    tauxCtrl.valueChanges.subscribe(updateMontantRef);

    //Calcul initial (pour UPDATE)
    updateMontantRef();
  }

  //Empêcher le dépassement par caisse
  isCaisseOverTotal(montantRef: number, currentCaisse: FormGroup, montantGl: number): boolean {
    const totalAutresCaisses = this.caisses.controls
      .filter(c => c !== currentCaisse)
      .reduce((sum, c) => {
        return sum + (parseFloat(c.get('montantref')?.value) || 0);
      }, 0);

    return (totalAutresCaisses + montantRef) > montantGl;
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
    // this.closeModal('showModal');

    const _operation: operationModel = {
      ...this.operation,
      ...formValue,
    };

    const montanttotal = this.totalLignes * formValue.tauxoperation

    const _justificatif: any =  {
      idoperation : formValue.operation,
      iddevise : formValue.devisejustificatif,
      datejustificatif : formValue.datejustificatif,
      montantjustificatif: montanttotal,
      taux : formValue.tauxoperation,
      commentaire : formValue.commentaire,
      details : _operation.lignes,
      idsite : formValue.site,
      idsociete : formValue.societe,
      createdby : _operation.createdby,
      retour_caisse : formValue.retourcaisse,
      caisses : _operation.caisses
    };

    console.log(_justificatif);

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_justificatif);
    else this.update(_operation);
  }

  //Enregistrement de données
  create(_operation: operationModel) {
    const {...dataToSend} = _operation;
    this.loading = true;
    this.justificatifservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          //this.reloadData();
          this.toastr.success('Justificatif enregistrée avec succès');
        } else {
          this.error = "Erreur de création";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.log("Erreur backend")
        this.toastr.error(err.error.message);
      }
    })
  }

  //Modification de données
  update(_operation: operationModel){
    this.operationservice.update(_operation).subscribe({
      next: (res) => {
        if (res.success) {
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
  
}
