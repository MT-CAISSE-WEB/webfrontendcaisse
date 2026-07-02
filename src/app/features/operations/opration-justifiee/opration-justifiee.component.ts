import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { operationModel } from '../model/operation.model';
import { tauxdevisemodel } from '../../donnee_base/donnee_base/model/tauxdevise.model';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
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
import {
  detailJustificatifModel,
  JustificatifModel,
} from '../model/justificatif.model';
import { OperationCalculService } from '../service/operation-calcul.service';
import { OperationValidatorService } from '../service/operation-validator.service';
import { CaisseRegleService } from '../service/caisse-regle.service';

@Component({
  selector: 'app-opration-justifiee',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './opration-justifiee.component.html',
  styleUrl: './opration-justifiee.component.css',
})
export class OprationJustifieeComponent implements OnInit {
  title = 'Régularisation';
  params: any = {};

  fb: FormBuilder = new FormBuilder();
  msgErros: string = '';
  loading: Boolean = false;
  operationForm: FormGroup = this.fb.group({});

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  loadingModal = false;
  montantTotaligne: number = 0;
  totalpieceJustificative: number = 0;
  totalpieceJustificativeRef: number = 0;
  totalEncaissements: number = 0;
  totalEncaissementsRef: number = 0;

  operations: operationModel[] = [];
  operationsFiltrees: operationModel[] = [];
  operation: operationModel = new operationModel();
  ope: any;

  //Le taux de devises
  tauxdevise: tauxdevisemodel = new tauxdevisemodel();
  taux: any;

  //Les datas justificatifs
  justificatifPieces: JustificatifModel[] = [];
  justificatif: JustificatifModel = new JustificatifModel();
  justificatifFiltered: JustificatifModel[] = [];
  loadingPiece = false;

  //Les datas details justificatifs
  justificatifDetail: detailJustificatifModel[] = [];
  justificatifDetailFiltered: detailJustificatifModel[] = [];

  private tauxConversionTransaction = 1;

  showCaisses: Boolean = false;
  caisseperiodes: any[] = [];
  loadingCaisses: boolean = false;
  loadingGlobal: boolean = true;
  private loadingRequestsCount = 0;

  /**
   * GESTION DU LOADING GLOBAL
   */
  private startLoading() {
    this.loadingRequestsCount++;
    this.loadingGlobal = true;
  }

  private stopLoading() {
    this.loadingRequestsCount--;
    if (this.loadingRequestsCount <= 0) {
      this.loadingRequestsCount = 0;
      this.loadingGlobal = false;
    }
  }

  natureoperations: natureoperationModel[] = [];
  //Liste des tiers
  tiers: tiersModel[] = [];
  devises: devisemodel[] = [];

  //Changement titre modal
  actionModal: string = 'create';

  //Bouton active / inactive
  isUpdated: boolean = true;
  error: string = '';

  selectedRetour: any = null;

  // États pour le contrôle dynamique des devises
  tauxDevises: { [key: string]: number } = {}; // Cache des taux par devise
  devisesImpliquees: Set<string> = new Set(); // Ensemble des devises utilisées
  loadingTaux: boolean = false;

  constructor(
    private calculService: OperationCalculService,
    private validatorService: OperationValidatorService,
    private caisseRegleService: CaisseRegleService,
    private natureoperationservice: NatureoperationService,
    private tiersservice: TiersService,
    private toastr: ToastrService,
    private AffectationNatureCentreService: AffectationNatureCentreService,
    private operationservice: OperationService,
    private ds: deviseservice,
    private caisseuserservice: AffectationCaisseService,
    private service: DemandeService,
    private justificatifservice: JustificatifService,
  ) {}

  ngOnInit(): void {
    // Démarrer le loading global (dépend seulement des opérations)
    this.loadingGlobal = true;

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
  get form() {
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
  initForm() {
    this.operationForm = this.fb.group({
      operation: [''],
      commentaire: [''],
      dateoperation: [{ value: null, disabled: false }, [Validators.required]],
      datejustificatif: ['', Validators.required],
      deviseoperation: ['', Validators.required],
      devisejustificatif: ['', Validators.required],
      montantoperation: [0],
      montantRefglobal: [0],
      site: [this.user.idsite ?? null],
      societe: [this.user.idsociete ?? null],
      resteapayerref: [0],
      resteapayeroperation: [0],
      tauxoperation: [1],
      tauxoperationinverse: [1],
      retourcaisse: [false],
      lignes: this.fb.array([]),
      caisses: this.fb.array([]),
    });
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
    const resteOperation =
      this.operationForm.get('resteapayeroperation')?.value || 0;
    const resteRef = this.operationForm.get('resteapayerref')?.value || 0;

    //BLOQUER si reste <= 0
    if (resteOperation <= 0 || resteRef <= 0) {
      this.toastr.warning(
        "Impossible d'ajouter une ligne : reste à payer épuisé",
      );
      return;
    }

    const ligne = this.fb.group({
      idnature: [{ value: null, disabled: false }, [Validators.required]],
      idcentreanalytique: [{ value: null, disabled: true }],
      idtiers: [{ value: null, disabled: true }],
      montantdetail: [{ value: '', disabled: true }, [Validators.required]],
      //CENTRES PAR LIGNE
      centres: this.fb.control<any[]>([]),
    });

    ligne.get('idnature')?.valueChanges.subscribe((natureId) => {
      if (!natureId) {
        ligne.get('idcentreanalytique')?.disable();
        ligne.get('idtiers')?.disable();
        ligne.get('montantdetail')?.disable();
        ligne.get('centres')?.setValue([]);
        return;
      }

      // Champs de base
      ligne.get('idcentreanalytique')?.enable();
      ligne.get('montantdetail')?.enable();

      //charger centres POUR CETTE LIGNE
      this.loadCentresForLigne(ligne, natureId, true, '');
      // Règle métier sur tiers
      this.handleNatureChange(ligne, natureId);
    });

    ligne.get('montantdetail')?.valueChanges.subscribe(() => {
      //this.updateTotalMontant();
      this.updateTotalsAndValidate();
    });

    this.lignes.push(ligne);
  }

  clearCaisses(): void {
    const caissesArray = this.operationForm.get('caisses') as FormArray;
    caissesArray.clear();
    this.selectedRetour = null;
  }

  /**
   * SUPPRIMER LIGNE
   */
  removeLine(index: number) {
    this.lignes.removeAt(index);
    this.updateTotals();
  }

  /**
   * METTRE A JOUR LES TOTAUX
   */
  updateTotals() {
    const total = this.calculService.getTotalLignes(this.lignes);
    const taux = this.operationForm.get('tauxoperation')?.value || 1;
    const montantRef = this.calculService.calculMontantReferentiel(total, taux);

    this.operationForm.patchValue(
      {
        montantRefglobal: montantRef,
      },
      { emitEvent: false },
    );
  }

  //Rénitialiser le formulaire
  reset() {
    this.operationForm.reset();
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  updateTotalsAndValidate() {
    const deviseOp = this.operationForm.get('deviseoperation')?.value;
    const deviseJust = this.operationForm.get('devisejustificatif')?.value;
    const deviseRef = this.user.devise_ref_id;

    const montantOperation =
      this.operationForm.get('montantoperation')?.value || 0;
    const montantRef = this.operationForm.get('montantRefglobal')?.value || 0;

    // Total des lignes en devise justificatif
    const totalLignes = this.calculService.getTotalLignes(this.lignes);

    // Conversion du total des lignes vers devise de référence
    const totalLignesRef = this.convertirVersReference(totalLignes, deviseJust);

    // Conversion du total des lignes vers devise opération si nécessaire
    let totalLignesOperation = totalLignes;
    if (deviseJust !== deviseOp) {
      totalLignesOperation = this.convertirDepuisReference(
        totalLignesRef,
        deviseOp,
      );
    }

    // Calcul des justificatifs existants en devise de référence
    const justificatifsExistantsRef = this.calculService.getTotalOperation(
      this.ope,
      'ref',
      this.justificatifPieces,
      this.justificatifDetail,
      deviseRef,
    );

    // Calcul des encaissements en devise de référence
    let encaissementsRef = 0;
    if (this.ope?.caisses) {
      encaissementsRef = this.ope.caisses
        .filter((caisse: any) => caisse.codtypeoperation === 'encaissement')
        .reduce((sum: number, caisse: any) => {
          const montantEncaissement = parseFloat(caisse.montantref) || 0;
          return sum + montantEncaissement; // Déjà en devise de référence
        }, 0);
    }

    // Totaux globaux (justificatifs existants + lignes actuelles + encaissements)
    const totalGlobalRef =
      totalLignesRef + justificatifsExistantsRef + encaissementsRef;
    const totalGlobalOperation = this.convertirDepuisReference(
      totalGlobalRef,
      deviseOp,
    );

    // Reste à payer = montant à justifier - total déjà justifié/encaissé
    const resteOperation = montantOperation - totalGlobalOperation;
    const resteRef = montantRef - totalGlobalRef;

    // Update form
    this.operationForm.patchValue(
      {
        resteapayeroperation: Math.max(0, resteOperation),
        resteapayerref: Math.max(0, resteRef),
      },
      { emitEvent: false },
    );

    // Validation des dépassements
    if (resteOperation < 0) {
      this.toastr.error('Dépassement montant opération');
      this.resetLastMontant();
      return;
    }

    if (resteRef < 0) {
      this.toastr.error('Dépassement montant référentiel');
      this.resetLastMontant();
      return;
    }
  }

  resetLastMontant() {
    const lastIndex = this.lignes.length - 1;
    const lastCtrl = this.lignes.at(lastIndex);

    if (lastCtrl) {
      lastCtrl.get('montantdetail')?.setValue('', { emitEvent: false });
    }
  }

  //A la selection de l'operation
  selectOperation() {
    this.operationForm.get('operation')?.valueChanges.subscribe((opId) => {
      if (!opId) return;

      //Trouver l'opération sélectionnée
      const operation = this.operations.find((op) => op.idoperation === opId);
      if (!operation) return;

      const totalcaissemontantref =
        operation.caisses?.reduce((sum: number, caisse: any) => {
          if (caisse.codtypeoperation === 'decaissementaj') {
            return sum + (parseFloat(caisse.montantref) || 0);
          }
          return sum;
        }, 0) || 0;

      //Remplir le formulaire avec les valeurs de l'opération
      this.operationForm.patchValue({
        dateoperation: this.formatDateForInput(operation.dateoperation),
        deviseoperation: operation.devise?.iddevise,
        montantoperation: operation.montant,
        montantRefglobal: totalcaissemontantref,
      });

      //Charger les details
      this.getDetailJustificatifPiece(operation);

      // Déclencher la gestion dynamique des devises
      this.gererDevisesDynamiquement();
    });
  }

  // A la selection du retour de caisse
  selectRetourCaisse() {
    this.operationForm.get('retourcaisse')?.valueChanges.subscribe((value) => {
      if (value) {
        // ON
        this.showCaisses = true;

        const caissesForm = this.operationForm.get('caisses') as FormArray;
        if (!caissesForm || caissesForm.length === 0) {
          this.loadCaissesForm().subscribe({
            next: () => {
              this.caisses.controls.forEach((caisseFG: any) => {
                this.applyAutoCalcul(caisseFG);
              });
            },
            error: () => {
              this.loadingModal = false;
            },
          });
        }
      } else {
        // OFF
        this.showCaisses = false;
        this.clearCaisses();
      }
    });
  }

  fillCaisseFromRetour(piece: any) {
    const caissesForm = this.operationForm.get('caisses') as FormArray;

    const caisseForm = caissesForm.controls.find(
      (c: any) => c.value.idcaisse === piece.idcaisse,
    );

    if (!caisseForm) {
      console.warn('Aucune caisse correspondante trouvée');
      return;
    }

    const montant = parseFloat(piece.montant) || 0;
    const taux = parseFloat(piece.taux) || 1;

    caisseForm.patchValue({
      montantcaisse: montant,
      taux: taux,
      montantref: montant * taux,
    });
  }

  selectRetour(piece: any) {
    const caissesForm = this.operationForm.get('caisses') as FormArray;
    this.selectedRetour = piece;
    this.operationForm.get('retourcaisse')?.setValue(true);
    // sécurité : si les caisses ne sont pas encore chargées
    if (!caissesForm || caissesForm.length === 0) {
      console.warn('Caisses non chargées, chargement en cours...');

      this.loadCaissesForm().subscribe(() => {
        this.fillCaisseFromRetour(piece);
      });
      return;
    }

    //si déjà chargé
    this.fillCaisseFromRetour(piece);
  }

  //A la selection de la devise de justificatif
  selectDeviseJustificatif() {
    //A la selectionner de la devise
    this.operationForm
      .get('devisejustificatif')
      ?.valueChanges.subscribe((devise) => {
        if (devise) {
          // Déclencher la gestion dynamique des devises
          this.gererDevisesDynamiquement();
          //Charger le dernier taux
          this.loadLastdeviseTaux(devise);
        }
      });
  }

  //Charger les centres de chaque ligne
  loadCentresForLigne(
    ligne: FormGroup,
    idnature: string,
    resetCentre: boolean = true,
    centreId: string,
  ) {
    this.AffectationNatureCentreService.getAll(idnature).subscribe({
      next: (res) => {
        if (res.success) {
          const centres = (res.data.centresaffectes || []).filter(
            (c: any) => c.actif === 1,
          );

          //stocké dans la ligne
          ligne.get('centres')?.setValue(centres);

          // reset centre sélectionné
          if (resetCentre) {
            ligne.get('centre')?.reset();
          }

          // Patch le centre sélectionné si fourni
          if (centreId) {
            const centreTrouve = centres.find(
              (c: any) => c.idcentre === centreId,
            );
            if (centreTrouve) {
              ligne.get('centre')?.setValue(centreTrouve.idcentre);
            }
          }
        }
      },
    });
  }

  //Selection de la nature / Activer ou desactiver imputation tiers
  handleNatureChange(ligne: FormGroup, natureId: string) {
    const nature = this.natureoperations.find((n) => n.idnature === natureId);

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
    return date ? date.substring(0, 10) : '';
  }

  loadJustificatifs(idOperation: string, operation: any) {
    this.loadingPiece = true;
    this.justificatifservice
      .getJustificatifs({ idoperation: idOperation })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.justificatifPieces = res.data;
            // Filtrer uniquement pour cette opération
            this.justificatifFiltered = this.justificatifPieces.filter(
              (j) => j.operation.idoperation === idOperation,
            );
          }
        },
        error: (err) => {
          this.toastr.error('Erreur backend : ' + err.error.message);
          this.loadingPiece = false;
        },
      });
  }

  loadDetailJustificatif(justificatif: any) {
    this.justificatifDetailFiltered = this.justificatifDetail.filter(
      (el) => el.idjustificatif == justificatif.idjustificatifoperation,
    );
    //justificatif.details = this.justificatifDetail.filter(el => el.idjustificatif == justificatif.idjustificatifoperation);
    const _object = {
      justificatif: justificatif,
      details: this.justificatifDetailFiltered,
    };
    // Injecter dans le formulaire pour affichage ou calcul
    this.dispatchDetail(_object);
  }

  //API des détails des pièces justificatives
  getDetailJustificatifPiece(operation: any) {
    this.loadingPiece = true;
    this.ope = operation;
    this.justificatifservice
      .getdetailsJustificatif({})
      .pipe(
        switchMap((res: any) => {
          if (res.success) {
            this.justificatifDetail = res.data;
          }

          // ensuite charger justificatifs
          return this.justificatifservice.getJustificatifs({
            idoperation: operation.idoperation,
          });
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.justificatifPieces = res.data;
            this.justificatifFiltered = this.justificatifPieces.filter(
              (j) => j.operation.idoperation === operation.idoperation,
            );

            /**
             * Calcul des totaux existants (SEULEMENT les justificatifs, pas les encaissements)
             * Conversion automatique vers devise de référence
             */
            this.totalpieceJustificative = this.calculService.getTotalOperation(
              operation,
              'detail',
              this.justificatifPieces,
              this.justificatifDetail,
              this.user.devise_ref_id,
            );
            this.totalpieceJustificativeRef =
              this.calculService.getTotalOperation(
                operation,
                'ref',
                this.justificatifPieces,
                this.justificatifDetail,
                this.user.devise_ref_id,
              );

            /**
             * Calcul des retours de caisse (encaissements) - Ces montants RÉDUISENT le reste à payer
             * Conversion automatique vers devise de référence
             */
            this.totalEncaissements =
              operation.caisses?.reduce((sum: number, caisse: any) => {
                if (caisse.codtypeoperation === 'encaissement') {
                  const montantEncaissement = parseFloat(caisse.montant) || 0;
                  return (
                    sum +
                    this.convertirVersReference(
                      montantEncaissement,
                      caisse.devise?.iddevise,
                    )
                  );
                }
                return sum;
              }, 0) || 0;

            this.totalEncaissementsRef =
              operation.caisses?.reduce((sum: number, caisse: any) => {
                if (caisse.codtypeoperation === 'encaissement') {
                  const montantEncaissementRef =
                    parseFloat(caisse.montantref) || 0;
                  return sum + montantEncaissementRef; // Déjà en devise de référence
                }
                return sum;
              }, 0) || 0;

            /**
             * Calcul reste : Montant opération - Justificatifs existants - Encaissements
             * Tous les calculs sont maintenant en devise de référence
             */
            const montantOperationRef = this.convertirVersReference(
              operation.montant,
              operation.devise?.iddevise,
            );
            const resteRef =
              montantOperationRef -
              this.totalpieceJustificativeRef -
              this.totalEncaissementsRef;
            const resteOperation = this.convertirDepuisReference(
              resteRef,
              operation.devise?.iddevise,
            );

            this.operationForm.patchValue({
              resteapayeroperation: resteOperation,
              resteapayerref: resteRef,
            });

            this.loadingPiece = false;

            //calcul maintenant fiable
            //this.recalculateOperationTotals();
          }
        },
        error: (err) => {
          this.loadingPiece = false;
          this.toastr.error('Erreur backend');
        },
      });
  }

  fillLignesFromDetail(details: any[]) {
    const lignesFA = this.lignes;
    lignesFA.clear(); // vider l’ancien contenu

    details.forEach((d) => {
      const ligne = this.fb.group({
        idnature: [d.idnature, Validators.required],
        idcentreanalytique: [d.idcentreanalytique],
        idtiers: [d.idtiers],
        montantdetail: [d.montantdetail, Validators.required],
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
  selectJustificatif(piece: any) {
    const justificatif = this.justificatifFiltered.find(
      (j) => j.idjustificatifoperation === piece.idjustificatifoperation,
    );

    if (!justificatif) return;
    this.loadDetailJustificatif(justificatif);
  }

  dispatchDetail(_object: any) {
    // Patch des champs simples
    this.operationForm.patchValue({
      tauxoperation: _object.justificatif.taux,
      devisejustificatif: _object.justificatif.iddevise,
      commentaire: _object.justificatif.commentaire,
      datejustificatif: this.formatDateForInput(_object.justificatif.date),
    });

    this.lignes.clear();
    _object.details.forEach((l: any) => {
      const ligneGroup = this.fb.group({
        idligne: [l.iddetailsjustificatifoperation ?? null],
        idnature: [l.idnature ?? null, Validators.required],
        idcentreanalytique: [{ value: l.idcentreanalytique, disabled: true }],
        idtiers: [{ value: l.idtiers ?? null, disabled: true }],
        montantdetail: [
          { value: l.montantdetail ?? '', disabled: false },
          Validators.required,
        ],

        //centres propres à la ligne
        centres: this.fb.control<any[]>([]),
      });

      this.lignes.push(ligneGroup);
    });
  }

  //validation required
  isValidField(label: string): string {
    let status: string = '';
    this.form[label].valid && this.form[label].touched
      ? (status = 'is-valid')
      : this.form[label].invalid && this.form[label].touched
        ? (status = 'is-invalid')
        : (status = '');
    return status;
  }

  //Charger les periodes de la caisse
  getcaissesPeriodes() {
    this.loadingCaisses = true;
    this.caisseuserservice
      .getCaissePeriodeByUser(this.user.idutilisateur ?? null)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.caisseperiodes = res.data;
            this.loadingCaisses = false;
          }
          this.operationForm.patchValue({
            datejustificatif: this.formatDateForInput(
              this.caisseperiodes[0].dernierePeriode.dateperiode,
            ),
          });
        },
        error: (err) => {
          console.log(err);
          this.loadingCaisses = false;
          this.toastr.error(err.error.message);
        },
      });
  }

  //Recuperer toutes les opérations
  getAllOperations() {
    this.loading = true;
    this.params = {
      page: 1,
      limit: 100000,
      search: '',
      date: '',
      user: this.user.idutilisateur,
    };
    this.operationservice.getAll(this.params).subscribe({
      next: (res) => {
        if (res.success) {
          this.operations = res.data.data;
          if (this.operations.length != 0) {
            this.operationsFiltrees = this.operations.filter(
              (op) =>
                op.caisses?.some((caisse) =>
                  caisse.codtypeoperation
                    ?.toLowerCase()
                    .includes('decaissementaj'),
                ) && op.justifiee <= 1,
            );
          }
          this.loading = false;
          // Fin du loading global - dépend seulement des opérations
          this.loadingGlobal = false;

          // Restaurer l'opération sélectionnée après rechargement (pour création justificatif)
          this.restoreSelectedOperation();
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadingGlobal = false;
        this.toastr.error(err.error.message);
      },
    });
  }

  //Recuperer les natures opérations
  getAllNatureoperations() {
    this.natureoperationservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.natureoperations = (res.data || []).filter(
            (n: any) => n.actif === 1,
          );
        }
      },
      error: (err) => {
        this.toastr.error("Erreur lors du chargement des natures d'opérations");
      },
    });
  }

  //Recupérer les tiers
  getAllTiers() {
    this.tiersservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.tiers = (res.data || []).filter((n: any) => n.actif === 1);
        }
      },
      error: (err) => {
        this.toastr.error('Erreur lors du chargement des tiers');
      },
    });
  }

  //Récupérer les devise
  getalldevises() {
    const params = {
      page: 1,
      limit: 20,
    };
    this.ds.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.devises = res.data;
        }
      },
      error: (err) => {
        this.toastr.error('Erreur lors du chargement des devises');
      },
    });
  }

  //Charger le dernier taux
  loadLastdeviseTaux(devise: any) {
    const datePivot = this.operationForm.get('datejustificatif')?.value;
    const devises = {
      iddeviseorigine: devise,
      iddevisedestination: this.user.devise_ref_id,
      datepiece: datePivot,
    };

    this.getderniertaux(devises);
  }

  //Get le taux recent
  getderniertaux(payload: any) {
    this.service.tauxrecent(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.tauxdevise = res.data;
          if (!this.tauxdevise) {
            this.operationForm.patchValue({ tauxoperation: 1 });
          } else {
            this.operationForm.patchValue({
              tauxoperation: this.tauxdevise.coefficient,
            });
          }
        } else {
          this.toastr.error('Erreur serveur', res);
        }
      },
      error: (err) => {
        this.toastr.error('Erreur api', err.error.message);
      },
    });
  }

  // Si la devise de transaction est égale à l'une des devises de caisse aussi
  private getTauxDeviseTransaction(deviseTransaction: any) {
    const deviseReference = this.user.devise_ref_id;

    if (deviseTransaction === deviseReference) {
      this.tauxConversionTransaction = 1;
      this.patchTauxTransaction(this.tauxConversionTransaction);
      return;
    }

    //Récupérer la caisse qui a la même devise que la devise de transaction
    const caisseConversion = this.caisses.controls.filter(
      (c) => c.get('iddevisecaisse')?.value !== deviseTransaction,
    );

    if (caisseConversion.length != 0) {
      caisseConversion.forEach((c) => {
        this.tauxConversionTransaction = parseFloat(c.get('taux')?.value) || 1;
      });
    }

    //Charger le taux
    this.loadLastdeviseTaux(deviseTransaction);
  }

  //Centraliser le chargement du taux
  private patchTauxTransaction(taux: number) {
    this.operationForm.patchValue({ tauxoperation: taux }, { emitEvent: true });
  }

  //Charger les caisses sur le formulaires
  loadCaissesForm(): Observable<void> {
    const payload = {
      idutilisateur: this.user.idutilisateur,
      iddeviserefsoc: this.user.devise_ref_id,
    };
    this.loadingModal = true;
    return this.caisseuserservice.getCaissesUserPeriode(payload).pipe(
      tap((res) => {
        const periodes = res?.data ?? [];
        this.loadingModal = res?.data ? false : true;
        const caissesArray = this.operationForm.get('caisses') as FormArray;
        caissesArray.clear();
        periodes.forEach((p: any) => {
          caissesArray.push(
            this.fb.group({
              idcaisse: [p.caisse?.idcaisse],
              caisse: [p.caisse?.code],
              statut: [p.periode?.statut ?? null],
              devisecaisse: [p.devise?.code ?? null],
              iddevisecaisse: [p.devise?.iddevise ?? null],
              solde: [this.formatCFA(p.solde?.montant ?? 0)],
              montantcaisse: [0],
              montantref: [0],
              taux: [p.solde?.taux ?? 1],
              idperiode: [p.periode?.idperiode],
            }),
          );
        });
      }),
      map((res) => res?.data ?? []),
    );
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant ?? 0);
  }

  applyAutoCalcul(caisseFG: FormGroup) {
    const montantCtrl = caisseFG.get('montantcaisse');
    const tauxCtrl = caisseFG.get('taux');
    const refCtrl = caisseFG.get('montantref');
    const soldeCtrl = caisseFG.get('solde');

    if (!montantCtrl || !tauxCtrl || !refCtrl || !soldeCtrl) return;

    const updateMontantRef = () => {
      const montant = parseFloat(montantCtrl.value) || 0;
      const taux = parseFloat(tauxCtrl.value) || 1;

      const solde = this.caisseRegleService.parseCFA(soldeCtrl.value);

      const montantRef = this.caisseRegleService.calculMontantRef(
        montant,
        taux,
      );

      const montantGlobal =
        this.operationForm.get('montantRefglobal')?.value || 0;

      /**
       * CONTROLE SOLDE
       */
      if (!this.caisseRegleService.checkSoldeCaisse(montant, solde)) {
        montantCtrl.setErrors({ soldeInsuffisant: true });
        return;
      }

      /**
       * CONTROLE DEPASSEMENT REF
       */
      if (
        !this.caisseRegleService.checkDepassementMontantRef(
          montantRef,
          montantGlobal,
        )
      ) {
        montantCtrl.setErrors({ depassementMontant: true });
        return;
      }

      /**
       * CONTROLE DEPASSEMENT GLOBAL
       */
      if (
        this.caisseRegleService.isCaisseOverTotal(
          montantRef,
          caisseFG,
          this.caisses,
          montantGlobal,
        )
      ) {
        montantCtrl.setErrors({ depassement: true });
        return;
      }

      refCtrl.setValue(montantRef, { emitEvent: false });

      /**
       * CONTROLE TOTAL CAISSES
       */
      if (
        !this.caisseRegleService.controlTotalCaisses(
          this.caisses,
          montantGlobal,
        )
      ) {
        this.operationForm.setErrors({ totalCaisseDepasse: true });
      }
    };

    montantCtrl.valueChanges.subscribe(updateMontantRef);
    tauxCtrl.valueChanges.subscribe(updateMontantRef);
    updateMontantRef();
  }

  get totalLignes() {
    /**
     * Total des lignes du justificatif en cours
     */
    const totalLignes = this.lignes.controls.reduce((sum, ctrl: any) => {
      const val = parseFloat(ctrl.get('montantdetail')?.value || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return totalLignes;
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
    const taux = Number(this.operationForm.get('tauxoperation')?.value || 1);

    const totalRefLignes = this.calculService.convertToRef(totalLignes, taux);

    /**
     * Montants opération
     */
    const montantOperation = Number(
      this.operationForm.get('montantoperation')?.value || 0,
    );

    const montantRefGlobal = Number(
      this.operationForm.get('montantRefglobal')?.value || 0,
    );

    /**
     * Totaux des justificatifs existants
     */
    const totalJustificatifs = this.calculService.getTotalJustificatifs(
      this.justificatifDetail,
    );

    const totalJustificatifsRef = this.calculService.getTotalJustificatifsRef(
      this.justificatifDetail,
    );

    /**
     * Calcul des restes
     */
    const resteOperation = this.calculService.calculateResteOperation(
      montantOperation,
      totalJustificatifs + totalLignes,
    );

    const resteRef = this.calculService.calculateResteRef(
      montantRefGlobal,
      totalJustificatifsRef + totalRefLignes,
    );

    /**
     * Mise à jour formulaire
     */
    this.operationForm.patchValue({
      resteapayeroperation: resteOperation,
      resteapayerref: resteRef,
    });

    /**
     * Validation du justificatif courant
     */
    const validation = this.calculService.validateJustificatif(
      totalLignes,
      totalRefLignes,
      montantOperation - totalJustificatifs,
      montantRefGlobal - totalJustificatifsRef,
    );

    if (!validation.valid) {
      if (validation.error === 'DEPASSEMENT_OPERATION') {
        this.toastr.warning(
          "Le justificatif dépasse le montant de l'opération",
        );
      }

      if (validation.error === 'DEPASSEMENT_REFERENTIEL') {
        this.toastr.warning('Le justificatif dépasse le montant référentiel');
      }
    }
  }

  //Soumission du formulaire
  onSubmit() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.operationForm.controls;
    if (this.operationForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
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

    const montanttotal = this.totalLignes;

    const _justificatif: any = {
      idoperation: formValue.operation,
      iddevise: formValue.devisejustificatif,
      datejustificatif: formValue.datejustificatif,
      montantjustificatif: montanttotal,
      taux: formValue.tauxoperation,
      tauxinverse: formValue.tauxoperationinverse,
      commentaire: formValue.commentaire,
      details: _operation.lignes,
      idsite: formValue.site,
      idsociete: formValue.societe,
      createdby: _operation.createdby,
      retour_caisse: formValue.retourcaisse,
      caisses: _operation.caisses,
    };

    /** 3. choices action */
    if (this.actionModal == 'create') this.create(_justificatif);
    else this.update(_operation);
  }

  //Enregistrement de données
  create(_operation: operationModel) {
    const { ...dataToSend } = _operation;
    this.loading = true;
    this.justificatifservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Justificatif enregistrée avec succès');
          // Stocker l'ID de l'opération sélectionnée avant rechargement
          const selectedOperationId =
            this.operationForm.get('operation')?.value;
          if (selectedOperationId) {
            localStorage.setItem(
              'selectedOperationId',
              selectedOperationId.toString(),
            );
          }
          // Recharger la page
          window.location.reload();
        } else {
          this.error = 'Erreur de création';
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.log('Erreur backend');
        this.toastr.error(err.error.message);
      },
    });
  }

  //Modification de données
  update(_operation: operationModel) {
    this.operationservice.update(_operation).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Opération modifée avec succès');
        } else {
          this.error = 'Erreur de modification';
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'échec de Modification';
        this.loading = false;
        this.toastr.error(err.error.message);
      },
    });
  }

  /**
   * RESTAURER L'OPERATION SELECTIONNEE APRES RECHARGEMENT
   */
  restoreSelectedOperation() {
    const selectedOperationId = localStorage.getItem('selectedOperationId');
    if (selectedOperationId) {
      // Attendre que les opérations soient chargées
      const checkOperationsLoaded = () => {
        if (this.operationsFiltrees.length > 0) {
          const operationToSelect = this.operationsFiltrees.find(
            (op) => op.idoperation == selectedOperationId,
          );
          if (operationToSelect) {
            this.operationForm.patchValue({
              operation: operationToSelect.idoperation,
            });
            // Le subscribe de selectOperation() se déclenchera automatiquement
          }
          // Nettoyer le localStorage
          localStorage.removeItem('selectedOperationId');
        } else {
          // Réessayer dans 100ms si les opérations ne sont pas encore chargées
          setTimeout(checkOperationsLoaded, 100);
        }
      };
      checkOperationsLoaded();
    }
  }

  /**
   * GESTION DYNAMIQUE DES DEVISES
   * Détecte et gère automatiquement toutes les devises impliquées
   */
  private gererDevisesDynamiquement() {
    // Collecter toutes les devises impliquées
    this.collecterDevisesImpliquees();

    // Charger les taux manquants de manière asynchrone
    this.chargerTauxManquants()
      .then(() => {
        // Mettre à jour les calculs une fois les taux chargés
        this.updateTotalsAndValidate();
      })
      .catch(() => {
        // En cas d'erreur, utiliser les taux par défaut et continuer
        this.updateTotalsAndValidate();
      });
  }

  /**
   * COLLECTER TOUTES LES DEVISES IMPLIQUEES
   */
  private collecterDevisesImpliquees() {
    this.devisesImpliquees.clear();

    // Devise de l'opération sélectionnée
    const operationSelectionnee = this.operationsFiltrees.find(
      (op) => op.idoperation == this.operationForm.get('operation')?.value,
    );
    if (operationSelectionnee?.devise?.iddevise) {
      this.devisesImpliquees.add(operationSelectionnee.devise.iddevise);
    }

    // Devise du justificatif
    const deviseJustificatif =
      this.operationForm.get('devisejustificatif')?.value;
    if (deviseJustificatif) {
      this.devisesImpliquees.add(deviseJustificatif);
    }

    // Devise de référence utilisateur (toujours incluse)
    this.devisesImpliquees.add(this.user.devise_ref_id);

    // Devises des caisses (encaissements/décaissements)
    if (operationSelectionnee?.caisses) {
      operationSelectionnee.caisses.forEach((caisse: any) => {
        if (caisse.devise?.iddevise) {
          this.devisesImpliquees.add(caisse.devise.iddevise);
        }
      });
    }

    // Devises des justificatifs existants
    if (this.justificatifPieces) {
      this.justificatifPieces.forEach((piece) => {
        if (piece.devise?.iddevise) {
          this.devisesImpliquees.add(piece.devise.iddevise);
        }
      });
    }
  }

  /**
   * CHARGER LES TAUX MANQUANTS
   */
  private chargerTauxManquants(): Promise<void> {
    return new Promise((resolve) => {
      const datePivot = this.operationForm.get('datejustificatif')?.value;
      const deviseRef = this.user.devise_ref_id;

      const tauxACharger: string[] = [];

      // Identifier les taux manquants
      this.devisesImpliquees.forEach((deviseId) => {
        if (deviseId !== deviseRef && !this.tauxDevises[deviseId]) {
          tauxACharger.push(deviseId);
        }
      });

      if (tauxACharger.length === 0) {
        resolve();
        return;
      }

      this.loadingTaux = true;

      // Charger tous les taux manquants en parallèle
      const promises = tauxACharger.map((deviseId) =>
        this.chargerTauxDevise(deviseId, deviseRef, datePivot),
      );

      Promise.all(promises)
        .then(() => {
          this.loadingTaux = false;
          resolve();
        })
        .catch(() => {
          this.loadingTaux = false;
          resolve(); // Résoudre même en cas d'erreur
        });
    });
  }

  /**
   * CHARGER UN TAUX SPECIFIQUE
   */
  private async chargerTauxDevise(
    deviseOrigine: string,
    deviseDestination: string,
    datePivot: string,
  ): Promise<void> {
    return new Promise((resolve) => {
      const payload = {
        iddeviseorigine: deviseOrigine,
        iddevisedestination: deviseDestination,
        datepiece: datePivot,
      };

      this.service.tauxrecent(payload).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.tauxDevises[deviseOrigine] = res.data.coefficient;
          } else {
            // Taux par défaut si non trouvé
            this.tauxDevises[deviseOrigine] = 1;
          }
          resolve();
        },
        error: () => {
          this.tauxDevises[deviseOrigine] = 1; // Taux par défaut
          resolve();
        },
      });
    });
  }

  /**
   * CONVERTIR UN MONTANT VERS LA DEVISE DE REFERENCE
   */
  convertirVersReference(montant: number, deviseOrigine: string): number {
    if (!deviseOrigine || deviseOrigine === this.user.devise_ref_id) {
      return montant;
    }

    const taux = this.tauxDevises[deviseOrigine] || 1;
    return montant * taux;
  }

  /**
   * CONVERTIR UN MONTANT DEPUIS LA DEVISE DE REFERENCE
   */
  convertirDepuisReference(
    montantRef: number,
    deviseDestination: string,
  ): number {
    if (!deviseDestination || deviseDestination === this.user.devise_ref_id) {
      return montantRef;
    }

    const taux = this.tauxDevises[deviseDestination] || 1;
    return montantRef / taux;
  }

  /**
   * Compte les retours en caisse (encaissements)
   */
  getRetoursCaisseCount(): number {
    if (!this.ope?.caisses) return 0;
    return this.ope.caisses.filter(
      (c: any) => c.codtypeoperation === 'encaissement',
    ).length;
  }

  /**
   * Répartit automatiquement le montant du retour sélectionné
   * entre toutes les caisses disponibles
   */
  fillAllCaisses(): void {
    if (!this.selectedRetour) {
      this.toastr.warning('Veuillez sélectionner un retour en caisse');
      return;
    }

    const montantTotal = parseFloat(this.selectedRetour.montant) || 0;
    const idCaisseRetour = this.selectedRetour.idcaisse;

    const caissesDisponibles = this.caisses.controls.filter((c: FormGroup) => {
      return c.get('idcaisse')?.value !== idCaisseRetour;
    });

    if (caissesDisponibles.length === 0) {
      this.toastr.warning('Aucune autre caisse disponible pour la répartition');
      return;
    }

    const montantParCaisse = montantTotal / caissesDisponibles.length;

    caissesDisponibles.forEach((c: FormGroup) => {
      const taux = parseFloat(c.get('taux')?.value) || 1;
      const montant = Math.round(montantParCaisse * 100) / 100;
      c.patchValue({
        montantcaisse: montant,
        montantref: Math.round(montant * taux * 100) / 100,
      });
    });

    this.toastr.success(
      `Répartition automatique effectuée sur ${caissesDisponibles.length} caisse(s)`,
    );
    this.updateTotalsAndValidate();
  }
  /**
   * Vide toutes les caisses
   */
  clearAllCaisses(): void {
    this.caisses.controls.forEach((c: FormGroup) => {
      c.patchValue({
        montantcaisse: 0,
        montantref: 0,
      });
    });
    this.updateTotalsAndValidate();
    this.toastr.info('Tous les montants ont été effacés');
  }

  /**
   * Réinitialise une caisse spécifique
   */
  resetCaisse(caisseFG: FormGroup, index: number): void {
    caisseFG.patchValue({
      montantcaisse: 0,
      montantref: 0,
    });
    this.updateTotalsAndValidate();
  }

  /**
   * Vérifie si au moins une caisse a une valeur
   */
  hasAnyCaisseValue(): boolean {
    return this.caisses.controls.some((c: FormGroup) => {
      return parseFloat(c.get('montantcaisse')?.value) > 0;
    });
  }

  /**
   * Total des retours en devise de référence
   */
  getTotalRetours(): number {
    let total = 0;
    this.caisses.controls.forEach((c: FormGroup) => {
      total += parseFloat(c.get('montantref')?.value) || 0;
    });
    return total;
  }
}