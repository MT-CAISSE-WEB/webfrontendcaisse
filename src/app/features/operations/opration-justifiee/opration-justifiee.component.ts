import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
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
import { OperationPJService } from '../../PJ/service/operationpj.service';
import { PieceJointe } from '../../PJ/models/pj.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { JustificatifPJService } from '../../PJ/service/justificatifpj.service';

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
  idoperation: any;
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
  skipRecalcul: boolean = false; // Flag pour éviter les recalculs redondants

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
    private pjService: OperationPJService,
    private modalService: NgbModal,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private justificatifpjService: JustificatifPJService
  ) {}

  ngOnInit(): void {
    // Démarrer le loading global (dépend seulement des opérations)
    this.loadingGlobal = true;

    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.idoperation = id;
      if (id && id != '0') {
        this.idoperation = id;
      }
    });

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
    // this.selectOperation();
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

    if (!this.skipRecalcul) {
      ligne.get('montantdetail')?.valueChanges.subscribe(() => {
        this.updateTotalsAndValidate();
      });
    }

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
    this.lignes.clear();
    this.ope = null;
    this.justificatifFiltered = [];

    // Vider les pièces jointes
    this.resetPiecesData();
    this.selectedFiles = [];
    // réinitialiser l'onglet actif
    this.activePjTab = 'saisie';

    // Message de confirmation
    this.toastr.info('Formulaire réinitialisé avec succès');
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  updateTotalsAndValidate() {
    if (this.skipRecalcul) return; // Empêcher les recalculs redondants pendant cette opération

    const deviseOp = this.operationForm.get('deviseoperation')?.value;
    const deviseJust = this.operationForm.get('devisejustificatif')?.value;
    const deviseRef = this.user.devise_ref_id;

    const montantOperation = this.operationForm.get('montantoperation')?.value || 0;
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
    const totalGlobalRef = totalLignesRef + justificatifsExistantsRef + encaissementsRef;
    const totalGlobalOperation = this.convertirDepuisReference(totalGlobalRef, deviseOp );

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

  fillFormByOperation(opId: string) {
    //Trouver l'opération sélectionnée
    const operation = this.operations.find((op) => op.idoperation === opId);
    if (!operation) return;

    // l'opération sélectionnée
    this.selectedOperationPJ = operation;

    const totalcaissemontantref =
      operation.caisses?.reduce((sum: number, caisse: any) => {
        if (caisse.codtypeoperation === 'decaissementaj') {
          return sum + (parseFloat(caisse.montantref) || 0);
        }
        return sum;
      }, 0) || 0;

    //Remplir le formulaire avec les valeurs de l'opération
    this.operationForm.patchValue({
      operation: this.idoperation || opId,
      dateoperation: this.formatDateForInput(operation.dateoperation),
      deviseoperation: operation.devise?.iddevise,
      montantoperation: operation.montant,
      montantRefglobal: totalcaissemontantref,
    });

    //Charger les details
    this.getDetailJustificatifPiece(operation);

    // Déclencher la gestion dynamique des devises
    this.gererDevisesDynamiquement();

    // Charger les pièces jointes de l'opération sélectionnée
    // this.loadAllPiecesJointes(operation.idoperation);
  }

  //A la selection de l'operation
  selectOperation() {
    this.operationForm.get('operation')?.valueChanges.subscribe((opId) => {
      if (!opId) return;
      this.fillFormByOperation(opId);
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

    // Trouver la caisse correspondante - caster en FormGroup
    const caisseForm = caissesForm.controls.find(
      (c: any) => c.value.idcaisse === piece.idcaisse,
    ) as FormGroup;

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

    // Forcer le calcul du montant de référence
    this.applyAutoCalcul(caisseForm);
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

            this.loadJustificatifPiecesCounts();

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

            if (!this.skipRecalcul) {
              this.operationForm.patchValue({
                resteapayeroperation: resteOperation,
                resteapayerref: resteRef,
              });
            }

            this.loadingPiece = false;
          }
        },
        error: (err) => {
          this.loadingPiece = false;
          this.toastr.error('Erreur backend');
        },
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
            // Initialiser selectedOperationPJ avec la première opération filtrée
            if (this.operationsFiltrees.length > 0) {
              this.selectedOperationPJ = this.operationsFiltrees[0];
            }
            this.fillFormByOperation(this.idoperation);
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

    console.log("date justificatif ", formValue.datejustificatif);

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
    //this.updateTotalsAndValidate();
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

  // ============================================
  // MÉTHODES MODIFIÉES
  // ============================================

  /**
   * Sélectionne un retour en caisse
   * - Remplit la saisie du justificatif avec les infos du retour
   * - Désélectionne la pièce justificative si elle était sélectionnée
   */
  selectRetour(piece: any) {
    // Désélectionner la pièce justificative
    this.selectedJustificatif = null;
    this.selectedRetour = piece;
    this.operationForm.get('retourcaisse')?.setValue(true);

    this.lignes.clear();

    // Récupérer l'ID de la devise à partir du code
    const deviseCode = piece.caisse?.devise; // "CDF"
    let deviseId = null;

    if (deviseCode) {
      // Chercher la devise dans la liste
      const devise = this.devises.find((d) => d.codedevise === deviseCode);
      if (devise) {
        deviseId = devise.iddevise;
      } else {
        // Si pas trouvé, essayer en majuscule
        const deviseMaj = this.devises.find(
          (d) => d.codedevise === deviseCode.toUpperCase(),
        );
        if (deviseMaj) {
          deviseId = deviseMaj.iddevise;
        }
      }
    }

    // Remplir le formulaire
    this.operationForm.patchValue({
      devisejustificatif: deviseId,
      datejustificatif: this.formatDateForInput(new Date().toISOString()),
      tauxoperation: piece.taux || 1,
      commentaire: `Retour caisse - ${piece.caisse?.codecaisse || ''}`,
    });

    // Charger le taux si devise trouvée
    if (deviseId) {
      this.loadLastdeviseTaux(deviseId);
    }

    // Gérer les caisses
    const caissesForm = this.operationForm.get('caisses') as FormArray;
    if (!caissesForm || caissesForm.length === 0) {
      this.loadCaissesForm().subscribe({
        next: () => {
          this.fillCaisseFromRetour(piece);
          this.updateTotalsAndValidate();
        },
        error: () => (this.loadingModal = false),
      });
      return;
    }

    this.fillCaisseFromRetour(piece);
    this.updateTotalsAndValidate();
  }

  /**
   * Sélectionne une pièce justificative
   * - Remplit la saisie du justificatif avec les infos de la pièce
   * - Désélectionne le retour en caisse
   * - Réinitialise le retour caisse
   */
  selectJustificatif(piece: any) {
    // 1. Désélectionner le retour en caisse
    this.selectedRetour = null;

    // 2. Désactiver le retour caisse
    this.operationForm.get('retourcaisse')?.setValue(false);
    this.showCaisses = false;

    // 3. Vider les caisses
    this.clearAllCaisses();

    // 4. Marquer la pièce justificative comme sélectionnée
    this.selectedJustificatif = piece;

    // 5. Récupérer le justificatif complet
    const justificatif = this.justificatifFiltered.find(
      (j) => j.idjustificatifoperation === piece.idjustificatifoperation,
    );

    if (!justificatif) return;

    // 6. Charger les détails du justificatif
    this.skipRecalcul = true; // Empêcher le recalcul automatique pendant le patch
    this.loadDetailJustificatif(justificatif);
    setTimeout(() => (this.skipRecalcul = false), 0);
  }

  /**
   * Remplit le formulaire avec les détails d'un justificatif
   */
  dispatchDetail(_object: any) {
    this.skipRecalcul = true;
    // Patch des champs simples
    this.operationForm.patchValue(
      {
        tauxoperation: _object.justificatif.taux,
        devisejustificatif: _object.justificatif.iddevise,
        commentaire: _object.justificatif.commentaire,
        datejustificatif: this.formatDateForInput(_object.justificatif.date),
      },
      { emitEvent: false },
    );

    // Déclencher le chargement du taux si la devise est définie
    if (_object.justificatif.iddevise) {
      this.loadLastdeviseTaux(_object.justificatif.iddevise);
    }

    // Vider les lignes existantes
    this.lignes.clear();

    // Ajouter les lignes du justificatif
    _object.details.forEach(
      (l: any) => {
        const ligneGroup = this.fb.group({
          idligne: [l.iddetailsjustificatifoperation ?? null],
          idnature: [l.idnature ?? null, Validators.required],
          idcentreanalytique: [
            { value: l.idcentreanalytique ?? null, disabled: true },
          ],
          idtiers: [{ value: l.idtiers ?? null, disabled: true }],
          montantdetail: [
            { value: l.montantdetail ?? '', disabled: false },
            Validators.required,
          ],
          centres: this.fb.control<any[]>([]),
        });
        //charger centres POUR CETTE LIGNE
        this.loadCentresForLigne(ligneGroup, l.idnature, true, '');

        this.lignes.push(ligneGroup);
      },
      { emitEvent: false },
    );

    setTimeout(() => (this.skipRecalcul = false), 0);
  }

  // ============================================
  // NOUVELLE PROPRIÉTÉ
  // ============================================

  // Pièce justificative sélectionnée
  selectedJustificatif: any = null;

  // Propriétés pour les pièces jointes
  operationPiecesJointes: PieceJointe[] = [];
  demandePiecesJointes: PieceJointe[] = [];
  piecesJointes: PieceJointe[] = [];
  piecesJointesLoading = false;
  selectedFiles: File[] = [];
  selectedOperationPJ: operationModel | null = null;
  pjUploading = false;
  pjDeleting: string | null = null;
  piecesCountMap: Map<string, number> = new Map(); // Cache pour les compteurs
  newlyCreatedOperation: operationModel | null = null;
  operationPiecesCount = 0;
  demandePiecesCount = 0;
  totalPiecesCount = 0;
  hasDemande = false;
  demandeInfo: any = null;
  activePjTab: 'saisie' | 'pieces' = 'saisie';
  isDragOver = false;
  /**
   * Gestion du drag over pour les fichiers
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Gestion du drag leave pour les fichiers
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Gestion du drop de fichiers
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const allowedExtensions = [
        '.pdf',
        '.jpg',
        '.jpeg',
        '.png',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.csv',
      ];
      const validFiles = newFiles.filter((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedExtensions.includes(ext) && file.size <= 10 * 1024 * 1024;
      });
      this.selectedFiles.push(...validFiles);
    }
  }

  /**
   * Charge toutes les pièces jointes (opération + demande associée)
   */
  loadAllPiecesJointes(idoperation: string): void {
    this.piecesJointesLoading = true;
    this.pjService.getOperationWithDemandePieces(idoperation).subscribe({
      next: (res) => {
        if (res.success) {
          this.operationPiecesJointes = res.data.operationPJ || [];
          this.demandePiecesJointes = res.data.demandePJ || [];
          this.operationPiecesCount = res.data.operationCount || 0;
          this.demandePiecesCount = res.data.demandeCount || 0;
          this.totalPiecesCount = res.data.totalCount || 0;
          this.hasDemande = res.data.hasDemande || false;
          this.demandeInfo = res.data.demandeInfo;

          // METTRE À JOUR LE CACHE
          this.piecesCountMap.set(idoperation, this.totalPiecesCount);
        } else {
          this.resetPiecesData();
        }
        this.piecesJointesLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement PJ:', err);
        this.resetPiecesData();
        this.piecesJointesLoading = false;
        this.toastr.error('Erreur lors du chargement des pièces jointes');
      },
    });
  }

  /**
   * Réinitialise les données des pièces jointes
   */
  resetPiecesData(): void {
    this.operationPiecesJointes = [];
    this.demandePiecesJointes = [];
    this.operationPiecesCount = 0;
    this.demandePiecesCount = 0;
    this.totalPiecesCount = 0;
    this.hasDemande = false;
    this.demandeInfo = null;
  }

  /**
   * Ferme le modal des pièces jointes
   */
  closePiecesJointesModal(): void {
    this.modalService.dismissAll();
    this.selectedOperationPJ = null;
    this.resetPiecesData();
    this.selectedFiles = [];
    this.pjUploading = false;
    this.pjDeleting = null;
  }

  // Sélection des fichiers
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  // Supprime un fichier de la liste de sélection
  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  // Upload des fichiers
  uploadPieces(): void {
    if (!this.selectedOperationPJ) {
      this.toastr.error('Aucune opération sélectionnée');
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.toastr.warning('Aucun fichier sélectionné');
      return;
    }

    this.pjUploading = true;
    const userId = this.user.idutilisateur;

    this.pjService
      .create(this.selectedOperationPJ.idoperation, this.selectedFiles, userId)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success(
              `${res.data.length} fichier(s) uploadé(s) avec succès`,
            );
            this.selectedFiles = [];
            // this.loadPiecesJointes(this.selectedOperationPJ!.idoperation);
            this.loadAllPiecesJointes(this.selectedOperationPJ!.idoperation);
          } else {
            this.toastr.error("Erreur lors de l'upload");
          }
          this.pjUploading = false;
        },
        error: (err) => {
          console.error('Erreur upload:', err);
          this.toastr.error(err.error?.message || "Erreur lors de l'upload");
          this.pjUploading = false;
        },
      });
  }

  // Téléchargement d'un fichier
  downloadPiece(piece: PieceJointe): void {
    this.pjService.downloadFile(piece.urlpiece).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = piece.nomfichier;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Téléchargement démarré');
      },
      error: (err) => {
        console.error('Erreur téléchargement:', err);
        this.toastr.error('Erreur lors du téléchargement');
      },
    });
  }

  // Suppression d'un fichier
  deletePiece(piece: PieceJointe): void {
    if (!confirm(`Supprimer "${piece.nomfichier}" ?`)) return;

    this.pjDeleting = piece.idpiecejointe;
    const userId = this.user.idutilisateur;

    this.pjService
      .delete(this.selectedOperationPJ!.idoperation, piece.idpiecejointe)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Fichier supprimé');
            // this.loadPiecesJointes(this.selectedOperationPJ!.idoperation);
            this.loadAllPiecesJointes(this.selectedOperationPJ!.idoperation);
          } else {
            this.toastr.error('Erreur lors de la suppression');
          }
          this.pjDeleting = null;
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.toastr.error(
            err.error?.message || 'Erreur lors de la suppression',
          );
          this.pjDeleting = null;
        },
      });
  }

  // Formatage de la taille des fichiers
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Récupère l'icône selon le type MIME (version 100% sécurisée)
  getFileIcon(pj: any): string {
    // Essaie plusieurs possibilités
    let mimeType = pj?.mimeType || pj?.mimetype || pj?.MimeType || pj?.MIMETYPE;

    if (!mimeType || typeof mimeType !== 'string') {
      return 'ri-file-line text-secondary';
    }

    const mime = mimeType.toLowerCase();

    if (mime.includes('pdf')) return 'ri-file-pdf-line text-danger';
    if (mime.includes('word')) return 'ri-file-word-line text-primary';
    if (mime.includes('excel') || mime.includes('csv'))
      return 'ri-file-excel-line text-success';
    if (mime.includes('image')) return 'ri-profile-line text-warning';
    if (mime.includes('text')) return 'ri-file-text-line';
    if (
      mime.includes(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
    )
      return 'ri-file-excel-line text-success';

    return 'ri-file-line text-secondary';
  }

  downloadAllFiles(): void {
    if (!this.selectedOperationPJ) {
      this.toastr.error('Aucune opération sélectionnée');
      return;
    }

    const idoperation = this.selectedOperationPJ?.idoperation;
    const codeoperation =
      this.selectedOperationPJ?.codeoperation || 'operation';

    if (!idoperation) {
      this.toastr.error('ID opération non trouvé');
      return;
    }

    this.loading = true;
    this.pjService.downloadAllFiles(idoperation).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, '-');
        const filename = `operation_${codeoperation}_${timestamp}.zip`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toastr.success('Téléchargement démarré');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur téléchargement ZIP:', err);
        this.toastr.error(
          err.error?.message || 'Erreur lors du téléchargement',
        );
        this.loading = false;
      },
    });
  }

  downloadingAll: boolean = false;

  downloadAllFiles2(): void {
    const idoperation = this.selectedOperationPJ?.idoperation;
    const iddemande = this.selectedOperationPJ?.iddemande;
    const codeoperation =
      this.selectedOperationPJ?.codeoperation || 'operation';

    const hasOperationPJ = this.operationPiecesJointes.length > 0;
    const hasDemandePJ = this.demandePiecesJointes.length > 0;

    const totalFiles =
      (hasDemandePJ ? this.demandePiecesJointes.length : 0) +
      (hasOperationPJ ? this.operationPiecesJointes.length : 0);

    if (totalFiles === 0) {
      this.toastr.warning('Aucune pièce jointe à télécharger');
      return;
    }

    // Cas 1: Seulement la demande a des PJ
    if (hasDemandePJ && !hasOperationPJ) {
      this.downloadingAll = true;

      this.pjService.downloadAllOperationFiles(undefined, iddemande).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/:/g, '-');
          const filename = `demande_${iddemande}_${timestamp}.zip`;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.toastr.success(
            `${this.demandePiecesJointes.length} fichier(s) téléchargé(s)`,
          );
          this.downloadingAll = false;
        },
        error: (err) => {
          this.toastr.error(
            err.error?.message || 'Erreur lors du téléchargement',
          );
          this.downloadingAll = false;
        },
      });
      return;
    }

    // Cas 2: Opération avec ou sans demande
    if (!idoperation) {
      this.toastr.error("ID de l'opération non trouvé");
      return;
    }

    this.downloadingAll = true;

    this.pjService.downloadAllOperationFiles(idoperation, iddemande).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, '-');
        const filename = `operation_${codeoperation}_${timestamp}.zip`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toastr.success(`${totalFiles} fichier(s) téléchargé(s)`);
        this.downloadingAll = false;
      },
      error: (err) => {
        this.toastr.error(
          err.error?.message || 'Erreur lors du téléchargement',
        );
        this.downloadingAll = false;
      },
    });
  }

  //Impression du reçu
  printDocumentJustif() {
    if (!this.selectedOperationPJ) return;

    //Recuperationd de l'id
    const id = this.selectedOperationPJ.idoperation;
    this.justificatifservice.getdocJustificatif(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
      },
      error: (err) => {
        this.toastr.error("Erreur d\'impression du document");
      },
    });
  }

  clearJustificatifFields() {
    this.skipRecalcul = true;

    this.lignes.clear({ emitEvent: false });

    this.operationForm.patchValue(
      {
        commentaire: '',
        tauxoperation: 1,
        devisejustificatif: '',
        datejustificatif: this.formatDateForInput(
          new Date().toISOString().slice(0, 10),
        ), // ← date du jour
      },
      { emitEvent: false },
    );

    this.selectedJustificatif = null;
    this.justificatifDetailFiltered = [];

    setTimeout(() => (this.skipRecalcul = false), 0);
  }

  justificatifPiecesJointes: PieceJointe[] = [];
  selectedJustificatifPJ: JustificatifModel | null = null;
  piecesJustificativesCountMap: Map<string, number> = new Map(); // Cache pour les compteurs
  justificatifPiecesCount = 0;
  totalJustificatifPiecesCount = 0;
  @ViewChild('piecesJointesJustificatifModalTpl')
  piecesJointesJustificatifModalTpl!: TemplateRef<any>;

  // Récupère le nombre de pièces jointes (avec cache)
  getPiecesCount(idjsutificatifoperation: string): number {
    return this.piecesJustificativesCountMap.get(idjsutificatifoperation) || 0;
  }

  private getModalContainer(item: any): HTMLElement | null {
    const detailCard = document.querySelector<HTMLElement>(
      `#card-${item.idoperation}`,
    );

    return detailCard || document.querySelector<HTMLElement>('.card');
  }

  /**
   * Ouvre le modal des pièces jointes avec ng-template
   */
  openJustificatifPiecesJointesModal(justificatif: JustificatifModel): void {
    console.log('Justificatif selected:', justificatif);
    this.selectedJustificatifPJ = justificatif;
    this.selectedFiles = [];
    this.loadAllPiecesJointesJustificatif(justificatif.idjustificatifoperation);

    const container = this.getModalContainer(justificatif);
    const options: any = {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    };
    if (container) {
      options.container = container;
    }

    const modalRef = this.modalService.open(
      this.piecesJointesJustificatifModalTpl,
      options,
    );

    // Gérer la fermeture de la modale
    modalRef.result.then(
      () => {
        this.closePiecesJointesJustificatifModal();
      },
      () => {
        this.closePiecesJointesJustificatifModal();
      },
    );
  }
  /**
  // ============================================
// MÉTHODES ADAPTÉES POUR LES JUSTIFICATIFS
// ============================================

/**
 * Charge toutes les pièces jointes d'un justificatif
 */
  loadAllPiecesJointesJustificatif(idjustificatifoperation: string): void {
    this.piecesJointesLoading = true;
    this.justificatifpjService.getAll(idjustificatifoperation).subscribe({
      next: (res: any) => {
        console.log('res.data', res.data);
        if (res.success) {
          this.justificatifPiecesJointes = res.data || [];
          this.justificatifPiecesCount = this.justificatifPiecesJointes.length;
          this.totalJustificatifPiecesCount = this.justificatifPiecesCount;
          // Mettre à jour le cache
          this.piecesJustificativesCountMap.set(
            idjustificatifoperation,
            this.justificatifPiecesCount,
          );
        } else {
          this.justificatifPiecesJointes = [];
          this.justificatifPiecesCount = 0;
          this.totalJustificatifPiecesCount = 0;
        }
        this.piecesJointesLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement PJ:', err);
        this.justificatifPiecesJointes = [];
        this.justificatifPiecesCount = 0;
        this.piecesJointesLoading = false;
        this.toastr.error('Erreur lors du chargement des pièces jointes');
      },
    });
  }

  /**
   * Ferme le modal des pièces jointes
   */
  closePiecesJointesJustificatifModal(): void {
    this.modalService.dismissAll();
    this.selectedJustificatifPJ = null;
    this.justificatifPiecesJointes = [];
    this.justificatifPiecesCount = 0;
    this.totalJustificatifPiecesCount = 0;
    this.selectedFiles = [];
    this.pjUploading = false;
    this.pjDeleting = null;
  }

  /**
   * Upload des fichiers pour un justificatif
   */
  uploadJustificatifPieces(): void {
    if (!this.selectedJustificatifPJ || this.selectedFiles.length === 0) {
      this.toastr.warning(
        'Aucun fichier sélectionné ou justificatif non défini',
      );
      return;
    }

    this.pjUploading = true;
    const userId = 'SYSTEM';

    this.justificatifpjService
      .create(
        this.selectedJustificatifPJ.idjustificatifoperation,
        this.selectedFiles,
        userId,
      )
      .subscribe({
        next: (res: any) => {
          console.log('Upload:', res);
          if (res.success) {
            this.toastr.success(
              `${res.data.length} fichier(s) uploadé(s) avec succès`,
            );
            this.selectedFiles = [];
            this.loadAllPiecesJointesJustificatif(
              this.selectedJustificatifPJ!.idjustificatifoperation,
            );
          } else {
            this.toastr.error("Erreur lors de l'upload");
          }
          this.pjUploading = false;
        },
        error: (err: any) => {
          console.error('Erreur upload:', err);
          this.toastr.error(err.error?.message || "Erreur lors de l'upload");
          this.pjUploading = false;
        },
      });
  }

  /**
   * Télécharge une pièce jointe
   */
  downloadJustificatifPiece(piece: PieceJointe): void {
    this.justificatifpjService.downloadFile(piece.urlpiece).subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = piece.nomfichier;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Téléchargement démarré');
      },
      error: (err: any) => {
        console.error('Erreur téléchargement:', err);
        this.toastr.error('Erreur lors du téléchargement');
      },
    });
  }

  /**
   * Supprime une pièce jointe
   */
  deleteJustificatifPiece(piece: PieceJointe): void {
    if (!confirm(`Supprimer "${piece.nomfichier}" ?`)) return;
    if (!this.selectedJustificatifPJ) return;

    this.pjDeleting = piece.idpiecejointe;

    this.justificatifpjService
      .delete(
        this.selectedJustificatifPJ.idjustificatifoperation,
        piece.idpiecejointe,
      )
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toastr.success('Fichier supprimé');
            this.loadAllPiecesJointesJustificatif(
              this.selectedJustificatifPJ!.idjustificatifoperation,
            );
          } else {
            this.toastr.error('Erreur lors de la suppression');
          }
          this.pjDeleting = null;
        },
        error: (err: any) => {
          console.error('Erreur suppression:', err);
          this.toastr.error(
            err.error?.message || 'Erreur lors de la suppression',
          );
          this.pjDeleting = null;
        },
      });
  }

  /**
   * Télécharge toutes les pièces jointes d'un justificatif
   */
  downloadAllJustificatifFiles(): void {
    if (!this.selectedJustificatifPJ) {
      this.toastr.error('Aucun justificatif sélectionné');
      return;
    }

    this.loading = true;
    this.justificatifpjService
      .downloadAllFiles(this.selectedJustificatifPJ.idjustificatifoperation)
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const filename = `justificatif_${this.selectedJustificatifPJ!.codejustificatif || 'JUST'}_pieces_jointes.zip`;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastr.success(
            `${this.justificatifPiecesCount} fichier(s) téléchargé(s)`,
          );
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Erreur téléchargement ZIP:', err);
          this.toastr.error(err.error?.message);
          this.loading = false;
        },
      });
  }

  loadJustificatifPiecesCounts(): void {
    if (!this.justificatifFiltered || this.justificatifFiltered.length === 0)
      return;

    const requests: Observable<any>[] = [];

    this.justificatifFiltered.forEach((justificatif) => {
      // Vérifier si le compteur existe déjà
      if (
        !this.piecesJustificativesCountMap.has(
          justificatif.idjustificatifoperation,
        )
      ) {
        requests.push(
          this.justificatifpjService
            .getAll(justificatif.idjustificatifoperation)
            .pipe(catchError(() => of({ success: false, data: [] }))),
        );
      }
    });

    if (requests.length === 0) return; // Pas de requête si tout est déjà chargé

    forkJoin(requests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          const justificatif = this.justificatifFiltered[index];
          const count = response.success ? response.data.length : 0;
          this.piecesJustificativesCountMap.set(
            justificatif.idjustificatifoperation,
            count,
          );
        });
      },
    });
  }

}
