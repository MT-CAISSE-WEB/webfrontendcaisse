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
import { map, Observable, switchMap, tap } from 'rxjs';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { DemandeService } from '../../demande/services/demande.service';
import { JustificatifService } from '../service/justificatif.service';
import { detailJustificatifModel, JustificatifModel } from '../model/justificatif.model';
import { OperationCalculService } from '../service/operation-calcul.service';
import { OperationValidatorService } from '../service/operation-validator.service';
import { CaisseRegleService } from '../service/caisse-regle.service';

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
  totalpieceJustificative: number = 0;
  totalpieceJustificativeRef: number = 0;

  operations : operationModel[] = [];
  operationsFiltrees : operationModel[] = [];
  operation : operationModel = new operationModel();
  ope : any;

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

   constructor(private calculService: OperationCalculService, private validatorService: OperationValidatorService, private caisseRegleService: CaisseRegleService,
    private natureoperationservice: NatureoperationService, private tiersservice: TiersService, private toastr : ToastrService,
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
    //Charger la période
    this.getcaissesPeriodes();
    //Charger les natures d'opérations
    this.getAllNatureoperations();
    //Lors de la selection de operation
    this.selectOperation();
    //Lors de la selection de la devise de justificatio
    this.selectDeviseJustificatif();
    //lors du retour de caisse
    this.selectRetourCaisse();
    //Récuperer les tiers
    this.getAllTiers();
  }

   /**
   * GET FORM CONTROLS
   */
  get form(){
    return this.operationForm.controls;
  }

  /**
   * LIGNES FORM ARRAY
   */
  get lignes(): FormArray<FormGroup> {
    return this.operationForm.get('lignes') as FormArray<FormGroup>;
  }

   /**
   * INITIALISER FORMULAIRE
   */
  initForm(){
    this.operationForm = this.fb.group({
      operation : [""],
      commentaire : [""],
      dateoperation : [{ value: null, disabled: false }, [Validators.required]],
      datejustificatif : ["", Validators.required],
      deviseoperation : ["", Validators.required],
      devisejustificatif : ["", Validators.required],
      montantoperation : [0],
      montantRefglobal : [0],
      site : [this.user.idsite ?? null],
      societe : [this.user.idsociete ?? null],
      resteapayerref: [0],
      resteapayeroperation: [0],
      tauxoperation : [1],
      tauxoperationinverse: [1],
      retourcaisse : [false],
      lignes : this.fb.array([]),
      caisses : this.fb.array([])
    })
  }

  /**
   * CAISSES FORM ARRAY
   */
  get caisses(): FormArray<FormGroup> {
    return this.operationForm.get('caisses') as FormArray<FormGroup>;
  }

  /**
   * AJOUT LIGNE
   */
  addLine() {

    const resteOperation = this.operationForm.get('resteapayeroperation')?.value || 0;
    const resteRef = this.operationForm.get('resteapayerref')?.value || 0;

    //BLOQUER si reste <= 0
    if (resteOperation <= 0 || resteRef <= 0) {
      this.toastr.warning("Impossible d'ajouter une ligne : reste à payer épuisé");
      return;
    }

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
      //this.updateTotalMontant();
      this.updateTotalsAndValidate();
    });

    this.lignes.push(ligne);
  }

  clearCaisses(): void {
    const caissesArray = this.operationForm.get('caisses') as FormArray;
    caissesArray.clear();
  }

  /**
   * SUPPRIMER LIGNE
   */
  removeLine(index:number){
    this.lignes.removeAt(index);
    this.updateTotals();
  }

  /**
   * METTRE A JOUR LES TOTAUX
   */
  updateTotals(){
    const total = this.calculService.getTotalLignes(this.lignes);
    const taux = this.operationForm.get('tauxoperation')?.value || 1;
    const montantRef = this.calculService.calculMontantReferentiel(total, taux);

    this.operationForm.patchValue({
      montantRefglobal : montantRef
    },{emitEvent:false});
  }

  //Rénitialiser le formulaire
  reset(){
    this.operationForm.reset();
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  updateTotalsAndValidate(){
    const deviseOp = this.operationForm.get('deviseoperation')?.value;
    const deviseJust = this.operationForm.get('devisejustificatif')?.value;

    const taux = this.operationForm.get('tauxoperation')?.value || 1;

    const montantOperation = this.operationForm.get('montantoperation')?.value || 0;
    const montantRef = this.operationForm.get('montantRefglobal')?.value || 0;

    //total lignes (devise justificatif)
    const totalLignes = this.calculService.getTotalLignes(this.lignes);

    //conversion vers référentiel
    const totalLignesRef = this.calculService.convertToRef(totalLignes, taux);

    //conversion vers devise opération si nécessaire
    let totalLignesOperation = totalLignes;

    if (deviseJust !== deviseOp) {
      totalLignesOperation = this.user.devise_ref_id === deviseOp ? totalLignesRef : totalLignesRef / taux;
    }

    //totaux globaux
    const totalGlobal = totalLignesOperation + (this.totalpieceJustificative || 0);
    const totalGlobalRef = totalLignesRef + (this.totalpieceJustificativeRef || 0);

    //reste
    const resteOperation = montantOperation - totalGlobal;
    const resteRef = montantRef - totalGlobalRef;

    //update form
    this.operationForm.patchValue({
      resteapayeroperation: Math.max(0, resteOperation),
      resteapayerref: Math.max(0, resteRef)
    }, { emitEvent: false });

    //dépassement opération
    if (resteOperation < 0) {
      this.toastr.error("Dépassement montant opération");
      this.resetLastMontant();
      return;
    }

    //dépassement référentiel
    if (resteRef < 0) {
      this.toastr.error("Dépassement montant référentiel");
      this.resetLastMontant();
      return;
    }

  }

  // updateTotalsAndValidate(){
  //   //Calcul des totaux
  //   const totalLignes = this.calculService.getTotalLignes(this.lignes);
  //   const totalLignesRef = this.calculService.calculMontantReferentiel(
  //     totalLignes,
  //     this.operationForm.get('tauxoperation')?.value || 1
  //   );

  //   //Récupérer les montants de l'opération et du référentiel
  //   const montantOperation = this.operationForm.get('montantoperation')?.value || 0;
  //   const montantRef = this.operationForm.get('montantRefglobal')?.value || 0;

  //   // Totaux existants
  //   const totalGlobal = totalLignes + (this.totalpieceJustificative || 0);
  //   const totalGlobalRef = totalLignesRef + (this.totalpieceJustificativeRef || 0);

  //   // Calcul reste
  //   const resteOperation = montantOperation - totalGlobal;
  //   const resteRef = montantRef - totalGlobalRef;

  //   // mise à jour du formulaire
  //   this.operationForm.patchValue({
  //     resteapayeroperation: Math.max(0, resteOperation),
  //     resteapayerref: Math.max(0, resteRef)
  //   }, { emitEvent: false });

  //   // BLOQUER dépassement OPERATION
  //   if (resteOperation < 0) {
  //     this.toastr.error("Dépassement du montant de l'opération");

  //     // annuler la dernière saisie
  //     const lastIndex = this.lignes.length - 1;
  //     const lastCtrl = this.lignes.at(lastIndex);

  //     if (lastCtrl) {
  //       lastCtrl.get('montantdetail')?.setValue('', { emitEvent: false });
  //     }

  //     return;
  //   }

  //   //Contrôle total lignes vs montant opération
  //   if(!this.validatorService.checkMontantOperation(
  //     totalLignes,
  //     this.totalpieceJustificative,
  //     montantOperation
  //   )){
  //     this.toastr.warning("Le total des lignes dépasse le montant de l'opération !");
  //     // on peut marquer toutes les lignes comme invalides
  //     this.lignes.controls.forEach(ctrl => ctrl.get('montantdetail')?.setErrors({ depassement: true }));
  //   } else {
  //     // retirer l'erreur si tout est OK
  //     this.lignes.controls.forEach(ctrl => ctrl.get('montantdetail')?.setErrors(null));
  //   }

  //   // BLOQUER dépassement REFERENTIEL
  //   if (resteRef < 0) {

  //     this.toastr.error("Dépassement du montant référentiel");
  //     const lastIndex = this.lignes.length - 1;
  //     const lastCtrl = this.lignes.at(lastIndex);

  //     if (lastCtrl) {
  //       lastCtrl.get('montantdetail')?.setValue('', { emitEvent: false });
  //     }

  //     return;
  //   }

  //   //Contrôle total lignes référentiel vs montant ref
  //   if(!this.validatorService.checkMontantReferentiel(
  //     totalLignesRef,
  //     this.totalpieceJustificativeRef,
  //     montantRef
  //   )){
  //     this.toastr.warning("Le montant référentiel dépasse le montant autorisé !");
  //   }
  // }

  resetLastMontant(){
    const lastIndex = this.lignes.length - 1;
    const lastCtrl = this.lignes.at(lastIndex);

    if(lastCtrl){
      lastCtrl.get('montantdetail')?.setValue('', { emitEvent:false });
    }
  }

  //A la selection de l'operation
  selectOperation(){
    this.operationForm.get('operation')?.valueChanges.subscribe(opId => {
      if(!opId) return;

      //Trouver l'opération sélectionnée
      const operation = this.operations.find(op => op.idoperation === opId);
      if(!operation) return;

      const totalcaissemontantref = operation.caisses?.reduce((sum: any, caisse: any) => sum + (parseFloat(caisse.montantref) || 0),0) || 0;

      //Remplir le formulaire avec les valeurs de l'opération
      this.operationForm.patchValue({
        dateoperation: this.formatDateForInput(operation.dateoperation),
        deviseoperation: operation.devise?.iddevise,
        montantoperation: operation.montant,
        montantRefglobal: totalcaissemontantref
      });

      //Charger les details
      this.getDetailJustificatifPiece(operation);
    });
  }

  // A la selection du retour de caisse
  selectRetourCaisse(){
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

  //A la selection de la devise de justificatif
  selectDeviseJustificatif(){
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

  formatDateForInput(date: string) {
    return date ? date.substring(0, 10) : "";
  }

  loadJustificatifs(idOperation: string, operation: any) {
    this.loadingPiece = true;
    this.justificatifservice.getJustificatifs({ idoperation: idOperation }).subscribe({
      next: res => {
        if(res.success) {
          this.justificatifPieces = res.data;
          // Filtrer uniquement pour cette opération
          this.justificatifFiltered = this.justificatifPieces.filter(
            j => j.operation.idoperation === idOperation
          );
        }
      },
      error: err => {
        this.toastr.error("Erreur backend : " + err.error.message);
        this.loadingPiece = false;
      }
    });
  }

  loadDetailJustificatif(justificatif: any) {
    this.justificatifDetailFiltered = this.justificatifDetail.filter(el => el.idjustificatif == justificatif.idjustificatifoperation);
    //justificatif.details = this.justificatifDetail.filter(el => el.idjustificatif == justificatif.idjustificatifoperation);
    const _object = {justificatif: justificatif, details: this.justificatifDetailFiltered }
    // Injecter dans le formulaire pour affichage ou calcul
    this.dispatchDetail(_object);
  }

  //API des détails des pièces justificatives
  getDetailJustificatifPiece(operation: any){
    this.ope = operation;

    this.justificatifservice.getdetailsJustificatif({}).pipe(
      switchMap((res: any) => {

        if(res.success){
          this.justificatifDetail = res.data;
        }

        // ensuite charger justificatifs
        return this.justificatifservice.getJustificatifs({idoperation: operation.idoperation});
      })
    ).subscribe({
      next: (res: any) => {
        if(res.success){
          this.justificatifPieces = res.data;
          this.justificatifFiltered =
          this.justificatifPieces.filter(j => j.operation.idoperation === operation.idoperation);

          /**
         * Calcul des totaux existants
         */
          this.totalpieceJustificative = this.calculService.getTotalOperation(operation,'detail', this.justificatifPieces, this.justificatifDetail, this.user.devise_ref_id);
          this.totalpieceJustificativeRef = this.calculService.getTotalOperation(operation, 'ref', this.justificatifPieces, this.justificatifDetail, this.user.devise_ref_id);

          
          /**
         * Calcul reste à payer
         */
          const resteOperation =
          this.calculService.calculateResteOperation(
            operation.montant,
            this.totalpieceJustificative 
          );

          const totalcaissemontantref = operation.caisses?.reduce((sum: any, caisse: any) => sum + (parseFloat(caisse.montantref) || 0),0) || 0;

          const resteRef =
          this.calculService.calculateResteRef(
            totalcaissemontantref,
            this.totalpieceJustificativeRef
          );

          this.operationForm.patchValue({
            resteapayeroperation: resteOperation,
            resteapayerref: resteRef
          });

          this.loadingPiece = false;

          //calcul maintenant fiable
          //this.recalculateOperationTotals();
        }
      },
      error: (err) => {
        this.toastr.error("Erreur backend");
      }
    });
  }

  fillLignesFromDetail(details: any[]) {
    const lignesFA = this.lignes;
    lignesFA.clear(); // vider l’ancien contenu

    details.forEach(d => {
      const ligne = this.fb.group({
        idnature: [d.idnature, Validators.required],
        idcentreanalytique: [d.idcentreanalytique],
        idtiers: [d.idtiers],
        montantdetail: [d.montantdetail, Validators.required]
      });

      // Ajout du contrôle dynamique pour vérification immédiate
      ligne.get('montantdetail')?.valueChanges.subscribe(() => {
        this.updateTotalsAndValidate();
      });

      lignesFA.push(ligne);
    });

    // Mettre à jour les totaux après chargement
    this.updateTotalsAndValidate();
  }

  //Selectionner le justificatif
  selectJustificatif(piece: any){
    const justificatif =
    this.justificatifFiltered.find(
      j => j.idjustificatifoperation === piece.idjustificatifoperation
    );

    if(!justificatif) return;
    this.loadDetailJustificatif(justificatif);
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

  // //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  //Charger les periodes de la caisse
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

  //Recuperer toutes les opérations
  getAllOperations(){
    this.loading = true;
    this.params = {
      page: 1,
      limit: 100000,
      search: '',
      date: '',
      user: this.user.idutilisateur,
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
        this.toastr.error("Erreur api", err.error.message)
      }
    });
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

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  applyAutoCalcul(caisseFG: FormGroup) {
    const montantCtrl = caisseFG.get('montantcaisse');
    const tauxCtrl = caisseFG.get('taux');
    const refCtrl = caisseFG.get('montantref');
    const soldeCtrl = caisseFG.get('solde');

    if(!montantCtrl || !tauxCtrl || !refCtrl || !soldeCtrl) return;

    const updateMontantRef = () => {

      const montant = parseFloat(montantCtrl.value) || 0;
      const taux = parseFloat(tauxCtrl.value) || 1;

      const solde = this.caisseRegleService.parseCFA(soldeCtrl.value);

      const montantRef = this.caisseRegleService.calculMontantRef(montant, taux);

      const montantGlobal = this.operationForm.get('montantRefglobal')?.value || 0;

      /**
       * CONTROLE SOLDE
       */
      if(!this.caisseRegleService.checkSoldeCaisse(montant, solde)){
        montantCtrl.setErrors({ soldeInsuffisant: true });
        return;
      }

      /**
       * CONTROLE DEPASSEMENT REF
       */
      if(!this.caisseRegleService.checkDepassementMontantRef(montantRef, montantGlobal)){
        montantCtrl.setErrors({ depassementMontant: true });
        return;
      }

      /**
       * CONTROLE DEPASSEMENT GLOBAL
       */
      if(this.caisseRegleService.isCaisseOverTotal(
          montantRef,
          caisseFG,
          this.caisses,
          montantGlobal
      )){
        montantCtrl.setErrors({ depassement: true });
        return;
      }

      refCtrl.setValue(montantRef, { emitEvent:false });

      /**
       * CONTROLE TOTAL CAISSES
       */
      if(!this.caisseRegleService.controlTotalCaisses(this.caisses, montantGlobal)){
        this.operationForm.setErrors({ totalCaisseDepasse: true });
      }

    };

    montantCtrl.valueChanges.subscribe(updateMontantRef);
    tauxCtrl.valueChanges.subscribe(updateMontantRef);
    updateMontantRef();
  }

  get totalLignes(){
    /**
     * Total des lignes du justificatif en cours
     */
    const totalLignes = this.lignes.controls.reduce((sum, ctrl: any) => {
      const val = parseFloat(ctrl.get('montantdetail')?.value || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return totalLignes
  }

  updateTotalMontant() {
    /**
     * Total des lignes du justificatif en cours
     */
    const totalLignes = this.lignes.controls.reduce((sum, ctrl: any) => {
      const val = parseFloat(ctrl.get('montantdetail')?.value || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    /**
     * Récupération taux et conversion référentielle
     */
    const taux =
    Number(this.operationForm.get('tauxoperation')?.value || 1);

    const totalRefLignes =
    this.calculService.convertToRef(totalLignes, taux);

    /**
     * Montants opération
     */
    const montantOperation =
    Number(this.operationForm.get('montantoperation')?.value || 0);

    const montantRefGlobal =
    Number(this.operationForm.get('montantRefglobal')?.value || 0);

    /**
     * Totaux des justificatifs existants
     */
    const totalJustificatifs =
    this.calculService.getTotalJustificatifs(this.justificatifDetail);

    const totalJustificatifsRef =
    this.calculService.getTotalJustificatifsRef(this.justificatifDetail);

    /**
     * Calcul des restes
     */
    const resteOperation =
    this.calculService.calculateResteOperation(
      montantOperation,
      totalJustificatifs + totalLignes
    );

    const resteRef =
    this.calculService.calculateResteRef(
      montantRefGlobal,
      totalJustificatifsRef + totalRefLignes
    );

    /**
     * Mise à jour formulaire
     */
    this.operationForm.patchValue({
      resteapayeroperation: resteOperation,
      resteapayerref: resteRef
    });

    /**
     * Validation du justificatif courant
     */
    const validation =
    this.calculService.validateJustificatif(
      totalLignes,
      totalRefLignes,
      montantOperation - totalJustificatifs,
      montantRefGlobal - totalJustificatifsRef
    );

    if(!validation.valid){

      if(validation.error === 'DEPASSEMENT_OPERATION'){
        this.toastr.warning("Le justificatif dépasse le montant de l'opération");
      }

      if(validation.error === 'DEPASSEMENT_REFERENTIEL'){
        this.toastr.warning("Le justificatif dépasse le montant référentiel");
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
    const formValue = this.operationForm.getRawValue();
    const _operation: operationModel = {
      ...this.operation,
      ...formValue,
    };

    const montanttotal = this.totalLignes

    const _justificatif: any =  {
      idoperation : formValue.operation,
      iddevise : formValue.devisejustificatif,
      datejustificatif : formValue.datejustificatif,
      montantjustificatif: montanttotal,
      taux : formValue.tauxoperationinverse,
      tauxinverse : formValue.tauxinverse,
      commentaire : formValue.commentaire,
      details : _operation.lignes,
      idsite : formValue.site,
      idsociete : formValue.societe,
      createdby : _operation.createdby,
      retour_caisse : formValue.retourcaisse,
      caisses : _operation.caisses
    };

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



  // applyAutoCalcul(caisseFG: FormGroup) {
  //   const soldeCtrl = caisseFG.get('solde');
  //   const montantCtrl = caisseFG.get('montantcaisse');
  //   const devisecaisseCtrl = caisseFG.get('devisecaisse');
  //   const iddevisecaisseCtrl = caisseFG.get('iddevisecaisse');
  //   const tauxCtrl = caisseFG.get('taux');
  //   const refCtrl = caisseFG.get('montantref');
  //   const devTransactionCtrl = this.operationForm.get('devisejustificatif');
  //   const deviseReference = this.user?.devise_ref_id;

  //   if (!montantCtrl || !tauxCtrl || !refCtrl || !soldeCtrl) return;

  //   const updateMontantRef = () => {
  //     const deviseTransaction = devTransactionCtrl?.value;
  //     const montant = parseFloat(montantCtrl.value) || 0;
  //     const taux = parseFloat(tauxCtrl.value) || 1;
  //     const solde = this.parseCFA(soldeCtrl.value) || 0;
  
  //     const montantRef = montant * taux;
  //     refCtrl.setValue(montantRef, { emitEvent: false });

  //     if (deviseTransaction === deviseReference) {
  //       // même devise → pas de convedeviseReferencersion
  //       // this.operationForm.patchValue(
  //       //   { montantRefglobal: this.totalLignes },
  //       //   { emitEvent: false }
  //       // );
  //     } else {
  //       // utiliser le taux de la caisse correspondant à la devise transaction
  //       this.getTauxDeviseTransaction(deviseTransaction);
  //     }

  //     const montantglobal = this.operationForm.get('montantRefglobal')?.value || 0;

  //     //Si le solde caisse devient inférieur au montant saisie
  //     if (montant > solde) {
  //       montantCtrl.setErrors({
  //         ...(montantCtrl.errors || {}),
  //         soldeInsuffisant: true
  //       });

  //       this.operationForm.setErrors({
  //         ...(this.operationForm.errors || {}),
  //         soldeCaisseInsuffisant: true
  //       });

  //       refCtrl.setValue(0, { emitEvent: false });
  //       return;
  //     }

  //     // Nettoyage erreur solde insuffisant
  //     if (montantCtrl.hasError('soldeInsuffisant')) {
  //       const errors = { ...(montantCtrl.errors || {}) };
  //       delete errors['soldeInsuffisant'];
  //       Object.keys(errors).length
  //         ? montantCtrl.setErrors(errors)
  //         : montantCtrl.setErrors(null);
  //     }

  //     // Nettoyage erreur globale solde
  //     if (this.operationForm.hasError('soldeCaisseInsuffisant')) {
  //       const formErrors = { ...(this.operationForm.errors || {}) };
  //       delete formErrors['soldeCaisseInsuffisant'];
  //       Object.keys(formErrors).length
  //         ? this.operationForm.setErrors(formErrors)
  //         : this.operationForm.setErrors(null);
  //     }

  //     //contrôle référentiel paiement dépasse référentiel global
  //     if (montantRef > montantglobal) {
  //       montantCtrl.setErrors({ depassementMontant: true });
  //       this.operationForm.setErrors({
  //         ...(this.operationForm.errors || {}),
  //         totalCaisseDepasse: true
  //       });

  //       refCtrl.setValue(montantRef, { emitEvent: false });
  //       return;
  //     }

  //     // contrôle dépassement montant total
  //     if (this.isCaisseOverTotal(montantRef, caisseFG, montantglobal)) {
  //       montantCtrl.setErrors({ depassement: true });
  //       refCtrl.setValue(0, { emitEvent: false });
  //       return;
  //     }

  //     //OK → retirer l’erreur
  //     if (montantCtrl.hasError('depassementMontant')) {
  //       const errors = montantCtrl.errors;
  //       delete errors?.['depassementMontant'];
  //       Object.keys(errors || {}).length
  //         ? montantCtrl.setErrors(errors)
  //         : montantCtrl.setErrors(null);
  //     }

  //     // Nettoyage erreur globale
  //     if (this.operationForm.hasError('totalCaisseDepasse')) {
  //       const formErrors = { ...(this.operationForm.errors || {}) };
  //       delete formErrors['totalCaisseDepasse'];
  //       Object.keys(formErrors).length
  //         ? this.operationForm.setErrors(formErrors)
  //         : this.operationForm.setErrors(null);
  //     }

  //     refCtrl.setValue(montantRef, { emitEvent: false });

  //     //contrôle global après chaque saisie
  //     this.controlTotalCaisses(montantglobal);
  //   };

  //   montantCtrl.valueChanges.subscribe(updateMontantRef);
  //   tauxCtrl.valueChanges.subscribe(updateMontantRef);

  //   //Calcul initial (pour UPDATE)
  //   updateMontantRef();
  // }

  //Empêcher le dépassement par caisse
  // isCaisseOverTotal(montantRef: number, currentCaisse: FormGroup, montantGl: number): boolean {
  //   const totalAutresCaisses = this.caisses.controls
  //     .filter(c => c !== currentCaisse)
  //     .reduce((sum, c) => {
  //       return sum + (parseFloat(c.get('montantref')?.value) || 0);
  //     }, 0);

  //   return (totalAutresCaisses + montantRef) > montantGl;
  // }

  // controlTotalCaisses(maxMontantRef: number) {
  //   const totalRef = this.caisses.controls.reduce((sum, c) =>
  //     sum + (parseFloat(c.get('montantref')?.value) || 0), 0
  //   );

  //   if (totalRef > maxMontantRef) {
  //     this.operationForm.setErrors({
  //       ...(this.operationForm.errors || {}),
  //       totalCaisseDepasse: true
  //     });
  //   } else {
  //     if (this.operationForm.errors?.['totalCaisseDepasse']) {
  //       const errors = { ...this.operationForm.errors };
  //       delete errors['totalCaisseDepasse'];
  //       Object.keys(errors).length
  //         ? this.operationForm.setErrors(errors)
  //         : this.operationForm.setErrors(null);
  //     }
  //   }
  // }

  

  // onSubmit(){
  //   this.msgErros = '';
  //   const controls = this.operationForm.controls;

  //   if (this.operationForm.invalid) {
  //     Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
  //     this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
  //     this.toastr.warning(this.msgErros);
  //     return;
  //   }

  //   const formValue = this.operationForm.getRawValue();

  //   const montantoperation = parseFloat(formValue.montantoperation || 0);
  //   const montantRef = parseFloat(formValue.montantRefglobal || 0);

  //   const totalLignes = this.totalLignes;
  //   const totalJustificatif = this.totalpieceJustificative;

  //   const totalLignesRef = totalLignes * formValue.tauxoperation;
  //   const totalJustificatifRef = this.totalpieceJustificativeRef;

  //   /**
  //    * CONTROLE 1
  //    * Total lignes + justificatifs ne doit pas dépasser l'opération
  //    */
  //   if ((totalLignes + totalJustificatif) > montantoperation) {
  //     this.toastr.error("Le total des lignes dépasse le montant de l'opération.");
  //     return;
  //   }

  //   /**
  //    * CONTROLE 2
  //    * Total référentiel
  //    */
  //   if ((totalLignesRef + totalJustificatifRef) > montantRef) {
  //     this.toastr.error("Le montant référentiel dépasse le montant de l'opération.");
  //     return;
  //   }

  //   /**
  //    * CONTROLE 3
  //    * Vérifier les caisses si retour caisse activé
  //    */
  //   if (formValue.retourcaisse && this.totalCaisses > montantRef) {
  //     this.toastr.error("Le total des montants caisse dépasse le montant référentiel.");
  //     return;
  //   }

  //   /** PREPARATION DATA */
  //   const _operation: operationModel = {
  //     ...this.operation,
  //     ...formValue,
  //   };

  //   const montanttotal = this.totalLignes * formValue.tauxoperation;

  //   const _justificatif: any = {
  //     idoperation : formValue.operation,
  //     iddevise : formValue.devisejustificatif,
  //     datejustificatif : formValue.datejustificatif,
  //     montantjustificatif: montanttotal,
  //     taux : formValue.tauxoperation,
  //     commentaire : formValue.commentaire,
  //     details : _operation.lignes,
  //     idsite : formValue.site,
  //     idsociete : formValue.societe,
  //     createdby : _operation.createdby,
  //     retour_caisse : formValue.retourcaisse,
  //     caisses : _operation.caisses
  //   };

  //   if(this.actionModal == "create") this.create(_justificatif);
  //   else this.update(_operation);
  // }
  
}
