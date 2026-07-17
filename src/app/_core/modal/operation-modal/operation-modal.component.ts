import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NatureoperationService } from '../../../features/donnee_base/services/natureoperation.service';
import { AffectationCaisseService } from '../../../features/caisse_journal/services/affectationcaisse.service';
import { CentreAnalytiqueService } from '../../../features/donnee_base/services/centreanalytique.service';
import { societeservice } from '../../../features/structure/service/societe.service';
import { deviseservice } from '../../../features/donnee_base/donnee_base/service/devise.service';
import { CaissePeriodeService } from '../../../features/caisse_journal/services/caisseperiode.service';
import { TiersService } from '../../../features/donnee_base/services/tiers.service';
import { OperationService } from '../../../features/operations/service/operation.service';
import { ToastrService } from 'ngx-toastr';
import { DemandeService } from '../../../features/demande/services/demande.service';
import { AffectationNatureCentreService } from '../../../features/donnee_base/services/affectationnaturecentre.service';
import { devisemodel } from '../../../features/donnee_base/donnee_base/model/devise.model';
import { AsyncPipe, CommonModule } from '@angular/common';
import { combineLatest, map, Observable, startWith, tap } from 'rxjs';
import { tauxdevisemodel } from '../../../features/donnee_base/donnee_base/model/tauxdevise.model';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { natureoperationModel } from '../../../features/donnee_base/models/natureoperation.model';
import { caissePeriodeModel } from '../../../features/caisse_journal/models/periodecaisse.model';
import { centreanalytiqueModel } from '../../../features/donnee_base/models/centreanalytique.model';
import { tiersModel } from '../../../features/donnee_base/models/tiers.model';
import { EnteteDemande } from '../../../features/demande/models/entete-demande.model';
import { OperationModalUtils } from '../utils/number-format.utils';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { operationModel } from '../../../features/operations/model/operation.model';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../constantes/messages.contantes';
import { PieceJointe } from '../../../features/PJ/models/pj.model';
import { OperationPJService } from '../../../features/PJ/service/operationpj.service';
import { DemandePJService } from '../../../features/PJ/service/demandepj.service';

@Component({
  selector: 'app-operation-modal',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './operation-modal.component.html',
  styleUrl: './operation-modal.component.css',
})
export class OperationModalComponent implements OnInit {
  @Input() title = '';
  @Input() iddemande: string | null = null;

  //Le taux de devises
  tauxdevise: tauxdevisemodel = new tauxdevisemodel();
  taux: any;

  //Changement titre modal
  actionModal: string = 'create';

  //Ramener la devise
  devises: devisemodel[] = [];
  devise: devisemodel = new devisemodel();

  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  msgErros: string = '';
  loading: Boolean = false;
  operationForm: FormGroup = this.fb.group({});

  //Liste des natures filtrées
  naturesFiltrees: natureoperationModel[] = [];
  natureoperations: natureoperationModel[] = [];
  filteredNatureoperations: Observable<natureoperationModel[]> =
    new Observable();

  //caisseSolde
  caisseSolde: any = [];
  caisseSoldeMap = new Map<string, number>();

  //Liste periode
  caisseperiodes: caissePeriodeModel[] = [];

  caisseStatuses: any = {};

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 200;

  //Les demandes
  entetesDmd: EnteteDemande[] = [];

  private tauxConversionTransaction = 1;

  //Demande selectionnée
  isSelectedDemande: boolean = false;

  //Liste des tiers
  tiers: tiersModel[] = [];
  tiersFiltrees: tiersModel[] = [];
  filteredTiers: Observable<tiersModel[]> = new Observable();

  //Liste des centres analytiques
  centres: centreanalytiqueModel[] = [];
  centresFiltrees: centreanalytiqueModel[] = [];
  filteredCentres: Observable<centreanalytiqueModel[]> = new Observable();

  //Map to store ligne observables
  ligneFilteredMap: Map<
    number,
    {
      natures: Observable<any[]>;
      tiers: Observable<any[]>;
      centres: Observable<any[]>;
    }
  > = new Map();

  loadingModal = false;
  isAnyOpen: boolean = false;
  //Bouton active / inactive
  isUpdated: boolean = true;

  operation: operationModel = new operationModel();

  // gestion des PJ
  uploadedFiles: File[] = [];
  existingPieces: PieceJointe[] = [];
  filesToDelete: string[] = [];
  pjUploading = false;
  pjDeleting: string | null = null;
  piecesCountMap: Map<string, number> = new Map();
  modalPJVisible = false;
  selectedOperationPJ: operationModel | null = null;
  piecesJointes: PieceJointe[] = [];
  piecesJointesLoading = false;
  // pièces jointes associées à la demande
  demandePiecesJointes: PieceJointe[] = [];
  demandePiecesJointesLoading = false;

  // import des natures d'opérations
  // ==================== NOUVEAU: Propriétés pour l'import CSV ====================
  csvFile: File | null = null;
  csvPreview: any[] = [];
  showCsvPreview = false;
  csvErrors: string[] = [];
  detectedDelimiter: string = ';';
  isImportingCsv = false;

  // Set contenant les indices des lignes en erreur (montant <= 0)
  ligneErrors: Set<number> = new Set()

  constructor(
    private natureoperationservice: NatureoperationService,
    private caisseuserservice: AffectationCaisseService,
    private caissePeriodeservice: CaissePeriodeService,
    private operationservice: OperationService,
    private tiersservice: TiersService,
    private AffectationNatureCentreService: AffectationNatureCentreService,
    private centreanalytiqueservice: CentreAnalytiqueService,
    private toastr: ToastrService,
    private service: DemandeService,
    private ds: deviseservice,
    public activeModal: NgbActiveModal,
    private pjService: OperationPJService,
    private pjDemandeService: DemandePJService,
  ) {}

  ngOnInit(): void {
    //Recuperer la devise
    this.getalldevises();
    //Charger les tiers
    this.getAllTiers();
    //Charger les centres analytiques
    this.getAllcentres();
    //charger les demandes
    this.loadAllDemandes();
    // Si une demande est passée en paramètre, la sélectionner automatiquement
    if (this.iddemande) {
      const checkInterval = setInterval(() => {
        if (this.entetesDmd.length > 0) {
          clearInterval(checkInterval);
          // Sélectionne la demande dans le formulaire
          this.operationForm.get('demande')?.setValue(this.iddemande);
          // Le reste est géré automatiquement par le valueChanges subscriber existant
        }
      }, 100); // Vérifie toutes les 100ms si les demandes sont chargées
    }
    //Initialisation du formulaire
    this.initForm();
    //Charger les natures d'opérations
    this.getAllNatureoperations();
    //Charger les caisses et les périodes en une seule opération
    this.loadCaissesForm().subscribe({
      next: () => {
        this.loadingModal = false;

        const sameDate = OperationModalUtils.checkSameDatePeriodes(
          this.caisseperiodes,
        );
        this.operationForm.patchValue({
          dateoperation: OperationModalUtils.formatDateForInput(
            sameDate || new Date().toISOString(),
          ),
        });
        if (sameDate) {
          this.operationForm.get('dateoperation')?.disable();
        }

        //Si la demande est sélectionnée
        this.operationForm
          .get('demande')
          ?.valueChanges.subscribe((iddemande) => {
            if (iddemande) {
              // charger les pj de la demande
              this.loadDemandePiecesJointes(iddemande);

              // Désactiver les boutons sur le formulaire de création

              this.isUpdated = false;
              this.onDemandeSelected(iddemande);
              //Verrouiller tout le formulaire
              this.operationForm.disable({ emitEvent: false });
              //Champs autorisés
              this.operationForm.get('libelle')?.enable({ emitEvent: false });
              this.operationForm.get('demande')?.enable({ emitEvent: false });
              this.operationForm.get('caisses')?.enable({ emitEvent: false });
            }
          });

        // Filtrer la devise de transaction pour ramener le taux
        this.operationForm.get('devise')?.valueChanges.subscribe((devise) => {
          this.getTauxDeviseTransaction(devise);
        });

        // Filtrer les natures quand typepaiement change
        this.operationForm
          .get('typepaiement')
          ?.valueChanges.subscribe((type) => {
            this.onTypePaiementChange(type);
          });

        // Recalcul des montants après le taux appliqué
        this.operationForm
          .get('tauxoperation')
          ?.valueChanges.subscribe((taux) => {
            const numericTaux = Number(taux);
            if (!isNaN(numericTaux)) {
              this.updateMontantRefGlobalchange(taux);
            }
          });

        // recalcul automatique
        this.caisses.controls.forEach((caisseFG: any) => {
          this.applyAutoCalcul(caisseFG);
        });
      },
      error: () => {
        this.loadingModal = false;
      },
    });
    //Récuperer les soldes de caisses
    this.getSoldeCaisse();

    // Récupérer les statuts de caisse
    this.caissePeriodeservice.statuses$.subscribe((status) => {
      this.caisseStatuses = status;
    });
  }

  // Variables
  demandeSelectionnee: any = null;

  // Méthode appelée lors de la sélection d'une demande
  onDemandeSelect(event: any): void {
    const demandeId = event.target.value;
    if (demandeId) {
      // Récupérer la demande sélectionnée
      this.demandeSelectionnee = this.entetesDmd.find(
        (d) => d.iddemande === demandeId,
      );

      // Charger les pièces jointes de la demande
      this.loadDemandePiecesJointes(demandeId);

      // Remplir automatiquement les champs
      this.autoFillDemandeFields(this.demandeSelectionnee);
    } else {
      this.demandeSelectionnee = null;
      this.demandePiecesJointes = [];
    }
  }

  // Remplir automatiquement les champs
  autoFillDemandeFields(demande: any): void {
    if (demande) {
      // Remplir la devise
      if (demande.devise) {
        this.operationForm.patchValue({
          devise: demande.devise.iddevise,
        });
      }

      // Remplir le bénéficiaire si disponible
      if (demande.demandeur) {
        this.operationForm.patchValue({
          beneficiaire: demande.demandeur.nom + ' ' + demande.demandeur.prenom,
        });
      }

      // Remplir le type de paiement par défaut
      this.operationForm.patchValue({
        typepaiement: 'decaissement',
      });

      // Ajouter une ligne avec le montant
      const montantTotal = this.getTotalDemande(demande);
      this.operationForm.patchValue({
        montant: montantTotal,
      });

      // Ajouter une ligne avec le montant
      this.addLineWithMontant(montantTotal);
    }
  }

  // Ajouter une ligne avec le montant
  addLineWithMontant(montant: number): void {
    if (this.lignes.controls.length > 0) {
      const firstLine = this.lignes.controls[0];
      firstLine.patchValue({
        montantligne: montant,
      });
    } else {
      const newLine = this.newLigne();
      newLine.patchValue({
        montantligne: montant,
      });
      this.lignes.push(newLine);
    }
  }

  // Compter le total des pièces jointes
  getTotalPiecesCount(): number {
    return (
      this.demandePiecesJointes.length +
      this.existingPieces.length +
      this.uploadedFiles.length
    );
  }

  // Déterminer le texte du bouton de téléchargement

  cancel() {
    this.activeModal.dismiss(false);
  }

  //Soumission du formulaire
  confirm() {
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

    // 2. Récupération des lignes
    const rawLignes = this.operationForm.getRawValue().lignes || [];

    // 3. Vérification : au moins une ligne
    if (rawLignes.length === 0) {
      this.toastr.warning('Veuillez ajouter au moins une ligne avant de valider.');
      return;
    }

    // 4. Vérification des montants (chaque ligne doit avoir un montant > 0)
    this.ligneErrors.clear();
    let hasLigneError = false;
    rawLignes.forEach((l: any, index: number) => {
      if (l.montantligne == null || l.montantligne <= 0) {
        this.ligneErrors.add(index);
        hasLigneError = true;
      }
    });

    if (hasLigneError) {
      this.toastr.warning('Veuillez saisir un montant valide (supérieur à 0) pour chaque ligne en erreur.');
      return;
    }

    // 5. Préparation des données
    const formValue = this.operationForm.getRawValue();

    const baseoperation: operationModel = {
      ...this.operation,
      ...formValue,
      lignes: formValue.lignes.map((ligne: any) => ({
        natureop: ligne.natureop?.idnature,
        centre: ligne.centre?.idcentreanalytique,
        tiers: ligne.tiers?.idtiers,
        montantligne: ligne?.montantligne,
      })),
    };

    // Ajouter les informations utilisateur selon l'action
    const _operation =
      this.actionModal === 'create'
        ? {
            ...baseoperation,
            createdby: this.getUserFullName(),
            updatedby: this.getUserFullName(),
          }
        : {
            ...baseoperation,
            updatedby: this.getUserFullName(),
          };

    // Stocker les fichiers à uploader pour traitement après création
    const pendingFiles = [...this.uploadedFiles];

    // Renvoie les données au composant parent
    this.activeModal.close({
      operation: _operation,
      files: pendingFiles, // ← Transmission des fichiers au parent
    });
  }

  // Ajoute cette méthode après la méthode confirm()
  /**
   * Upload des fichiers après création de l'opération
   */
  async uploadPendingFiles(idoperation: string): Promise<void> {
    if (this.uploadedFiles.length === 0) return Promise.resolve();

    this.pjUploading = true;
    const userId = this.user.idutilisateur;

    return new Promise((resolve, reject) => {
      this.pjService.create(idoperation, this.uploadedFiles, userId).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success(`${res.data.length} fichier(s) uploadé(s)`);
            this.uploadedFiles = [];
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
          this.pjUploading = false;
        },
        error: (err: any) => {
          this.pjUploading = false;
          reject(err);
        },
      });
    });
  }

  /**
   * Formatage de la taille des fichiers
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Récupère l'icône selon le type MIME
   */
  getFileIcon(pj: any): string {
    let mimeType = pj?.mimeType || pj?.mimetype;
    if (!mimeType) return 'ri-file-line';

    const mime = mimeType.toLowerCase();
    if (mime.includes('pdf')) return 'ri-file-pdf-line text-danger';
    if (mime.includes('word')) return 'ri-file-word-line text-primary';
    if (
      mime.includes('excel') ||
      mime.includes('csv') ||
      mime.includes(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
    )
      return 'ri-file-excel-line text-success';
    if (mime.includes('image')) return 'ri-image-line text-warning';
    return 'ri-file-line';
  }

  /**
   * Supprime un fichier de la liste de sélection
   */
  removeSelectedFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  /**
   * Sélection des fichiers
   */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.uploadedFiles.push(...newFiles);
    }
  }

  //Recupérer les tiers
  getAllTiers() {
    this.tiersservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.tiers = (res.data || []).filter((n: any) => n.actif === 1);
        }
      },
    });
  }

  //Recupérer les centres analytiques
  getAllcentres() {
    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.centres = (res.data || []).filter((n: any) => n.actif === 1);
        }
      },
    });
  }

  displayNature(nature: any): string {
    return OperationModalUtils.displayNature(nature, this.naturesFiltrees);
  }

  displayTiers(tiers: any): string {
    return OperationModalUtils.displayTiers(tiers, this.tiers);
  }

  displayCentre(centre: any): string {
    return OperationModalUtils.displayCentre(centre, this.centresFiltrees);
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
    });
  }

  //Initialiser le formulaire
  initForm() {
    this.operationForm = this.fb.group({
      demande: [''],
      codeoperation: [''],
      beneficiaire: [''],
      libelle: ['', [Validators.required]],
      dateoperation: [{ value: null, disabled: false }, [Validators.required]],
      typepaiement: ['', [Validators.required]],
      lignes: this.fb.array([]),
      devise: ['', [Validators.required]],
      site: [this.user.idsite ?? null],
      societe: [this.user.idsociete ?? null],
      montant: [0],
      tauxoperation: [1],
      montantRefglobal: [0],
      caisses: this.fb.array([]),
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
    });
  }

  //chargement des demandes
  loadAllDemandes() {
    const params = {
      page: this.currentPage,
      limit: 100,
      search: '',
      date: '',
      user: this.user.idutilisateur,
    };
    this.service.getAllEntetes(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.entetesDmd = (res.data.data || []).filter(
            (n: any) => n.decaisse === 0 && n.statut === 3,
          );
        }
      },
      error: (err) => {
        this.toastr.error('Erreur backend');
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  get lignes(): FormArray<FormGroup> {
    return this.operationForm.get('lignes') as FormArray<FormGroup>;
  }

  get typePaiement() {
    return this.operationForm.get('typepaiement')?.value;
  }

  filtrerNatures(type: string) {
    if (!type || !this.natureoperations.length) {
      this.naturesFiltrees = [];
      return;
    }

    const cleanType = type.toLowerCase().trim();
    if (this.isSelectedDemande) {
      this.naturesFiltrees = [...this.natureoperations];
    } else {
      this.naturesFiltrees = this.natureoperations.filter((n) => {
        //Cas encaissement / décaissement normal
        if (cleanType !== 'decaissementaj') {
          return (
            n.typeoperation?.toLowerCase().trim() === cleanType &&
            n.demandedecaissement === 0
          );
        }
        //Cas décaissement avec ajustement
        return (
          n.typeoperation?.toLowerCase().trim() === 'decaissement' &&
          n.decajustifier === 1 &&
          n.demandedecaissement === 0
        );
      });
    }
  }

  get caisses(): FormArray<FormGroup> {
    return this.operationForm.get('caisses') as FormArray<FormGroup>;
  }

  //Champ caisse
  addCaisse(_caisse: any) {
    const periode = this.caisseperiodes.find(
      (p) => p.idcaisse === _caisse.idcaisse,
    );
    const caisseFG = this.fb.group({
      idcaisse: [_caisse.idcaisse, Validators.required],
      caisse: [_caisse.caisse?.codecaisse, Validators.required],
      solde: [OperationModalUtils.formatNumber(_caisse.caisse?.solde) ?? 0],
      devisecaisse: [_caisse.caisse?.devise],
      idperiode: [
        periode?.idperiode ? periode.idperiode : null,
        Validators.required,
      ],
    });

    this.caisses.push(caisseFG);
    //Calcul automatique
    this.applyAutoCalcul(caisseFG);
  }

  //Charger les caisses sur le formulaires
  loadCaissesForm(): Observable<void> {
    const payload = {
      idutilisateur: this.user.idutilisateur,
      iddeviserefsoc: this.user.devise_ref_id,
    };

    return this.caisseuserservice.getCaissesUserPeriode(payload).pipe(
      tap((res) => {
        const periodes = res?.data ?? [];
        this.caisseperiodes = periodes;

        const caissesArray = this.operationForm.get('caisses') as FormArray;
        caissesArray.clear();
        periodes.forEach((p: any) => {
          caissesArray.push(
            this.fb.group({
              idcaisse: [p.caisse?.idcaisse, Validators.required],
              caisse: [p.caisse?.code, Validators.required],
              statut: [p.periode?.statut ?? null],
              devisecaisse: [p.devise?.code ?? null],
              iddevisecaisse: [p.devise?.iddevise ?? null],
              solde: [OperationModalUtils.formatCFA(p.solde?.montant ?? 0)],
              montantcaisse: [0, [Validators.required, Validators.min(0)]],
              montantref: [0],
              taux: [p.solde?.taux ?? 1],
              idperiode: [p.periode?.idperiode, Validators.required],
            }),
          );
        });
      }),
      map(() => void 0),
    );
  }

  //Récuperer les soldes
  getSoldeCaisse() {
    this.operationservice.getSoldeCaisse().subscribe({
      next: (res) => {
        if (res.success) {
          this.caisseSolde = res.data.data;
        }
      },
    });
  }

  formatDateFR(dateInput: string | Date | null | undefined): string {
    return OperationModalUtils.formatDateFR(dateInput);
  }

  onTypePaiementChange(type: string) {
    this.filtrerNatures(type);

    // Réinitialiser les natures déjà choisies
    this.lignes.controls.forEach((ligne: FormGroup) => {
      ligne.patchValue({
        natureop: null,
        centre: null,
        tiers: null,
        montantligne: '',
      });

      ligne.get('centre')?.disable();
      ligne.get('tiers')?.disable();
      ligne.get('montantligne')?.disable();
    });
  }

  //Sur la demande selectionnée
  onDemandeSelected(iddemande: string) {
    this.service.getEntete(iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.isSelectedDemande = true;
          this.fillFormFromDemande(res.data);
        } else {
          this.loadingModal = false;
        }
      },
      error: () => {
        this.loadingModal = false;
      },
    });
  }

  //Remplir le formulaire depuis la demande
  fillFormFromDemande(demande: any) {
    /**Patch entête */
    this.operationForm.patchValue({
      libelle: demande.libelledemande,
      tauxoperation: demande.taux,
      devise: demande.devise?.iddevise,
      site: demande.site?.idsite,
      societe: demande.societe?.idsociete,
      typepaiement:
        demande.typedemande === 'decaissement'
          ? 'decaissement'
          : 'encaissement',
      montant: this.getTotalDemande(demande),
      beneficiaire: demande.demandeur.nom + ' ' + demande.demandeur.prenom,
    });

    /** Reset lignes */
    const lignesFA = this.operationForm.get('lignes') as FormArray;
    lignesFA.clear();

    /** Recréer lignes */
    demande.lignes.forEach((ligne: any) => {
      const ligneFG = this.newLigne(ligne);
      lignesFA.push(ligneFG);

      //charger centres + positionner centre
      this.getallCentresDispatch(
        ligne.natureoperation.idnature,
        ligneFG,
        ligne.centreanalytique.idcentre,
      );
    });

    /** Recalcul auto */
    this.caisses.controls.forEach((caisseFG: any) => {
      this.applyAutoCalcul(caisseFG);
    });
  }

  //Affectation natures centre for modify
  getallCentresDispatch(natureId: string, ligne: FormGroup, centreId?: string) {
    this.AffectationNatureCentreService.getAll(natureId).subscribe((res) => {
      if (res.success) {
        const centres = (res.data.centresaffectes || []).filter(
          (c: any) => c.actif === 1,
        );

        //stocker dans la ligne
        ligne.get('centres')?.setValue(centres);

        //IMPORTANT : MAJ du filtrage par ligne
        this.centresFiltrees = centres;

        // activer sans déclencher valueChanges
        ligne.get('centre')?.enable({ emitEvent: false });

        //mettre l'objet complet (PAS juste l'id)
        if (centreId) {
          const selected = centres.find(
            (c: { idcentreanalytique: string }) =>
              c.idcentreanalytique === centreId,
          );
          ligne.get('centre')?.setValue(selected || null, { emitEvent: false });
        }
      }
    });
  }

  calculateMontantRefGlobal(totalLignes: number, taux: number): number {
    return totalLignes * taux;
  }

  private updateMontantRefGlobal() {
    const montantGlobal = this.calculateMontantRefGlobal(
      this.totalLignes,
      this.tauxConversionTransaction,
    );
    this.operationForm.patchValue(
      { montantRefglobal: montantGlobal },
      { emitEvent: false },
    );
  }

  private updateMontantRefGlobalchange(taux: any) {
    const montantGlobal = this.calculateMontantRefGlobal(
      this.totalLignes,
      Number(taux),
    );
    this.operationForm.patchValue(
      { montantRefglobal: montantGlobal },
      { emitEvent: false },
    );
  }

  //Récuperer le taux de la devise transaction vers la devise du référentiel
  getderniertaux(payload: any) {
    this.getDernierTaux(payload).subscribe({
      next: (tauxdevise) => {
        if (!tauxdevise) {
          this.tauxdevise = new tauxdevisemodel();
          this.tauxConversionTransaction = 1;
          this.toastr.warning('Pas de taux recent trouvé');
        } else {
          this.tauxdevise = tauxdevise;
          this.tauxConversionTransaction = this.tauxdevise.coefficient;
        }
        this.patchTauxTransaction(
          this.operationForm,
          this.tauxConversionTransaction,
        );
        this.updateMontantRefGlobal();
      },
      error: (err) => {
        //this.toastr.error("Erreur backend", err.error.message)
      },
    });
  }

  buildDernierTauxPayload(
    iddeviseorigine: any,
    iddevisedestination: any,
    datepiece: any,
  ) {
    return {
      iddeviseorigine,
      iddevisedestination,
      datepiece,
    };
  }

  //Charger le dernier taux
  loadLastdeviseTaux(iddevise: any) {
    const datePivot = this.operationForm.get('dateoperation')?.value;
    const devises = this.buildDernierTauxPayload(
      iddevise,
      this.user.devise_ref_id,
      datePivot,
    );

    this.getderniertaux(devises);
  }

  isReferenceDevise(deviseTransaction: any, deviseReference: any): boolean {
    return deviseTransaction === deviseReference;
  }

  patchTauxTransaction(
    operationForm: FormGroup,
    taux: number,
    emitEvent: boolean = true,
  ): void {
    operationForm.patchValue({ tauxoperation: taux }, { emitEvent });
  }

  getDernierTaux(payload: any): Observable<tauxdevisemodel | null> {
    return this.service
      .tauxrecent(payload)
      .pipe(map((res) => (res.success ? res.data : null)));
  }

  getTauxFromCaisses(caisses: FormArray, deviseTransaction: any): number {
    const matchingCaisses = caisses.controls.filter(
      (c) => c.get('iddevisecaisse')?.value !== deviseTransaction,
    );

    if (matchingCaisses.length === 0) {
      return 1;
    }

    return parseFloat(matchingCaisses[0].get('taux')?.value) || 1;
  }

  // Si la devise de transaction est égale à l'une des devises de caisse aussi
  private getTauxDeviseTransaction(deviseTransaction: any) {
    const deviseReference = this.user.devise_ref_id;

    if (this.isReferenceDevise(deviseTransaction, deviseReference)) {
      this.tauxConversionTransaction = 1;
      this.patchTauxTransaction(
        this.operationForm,
        this.tauxConversionTransaction,
      );
      return;
    }

    this.tauxConversionTransaction = this.getTauxFromCaisses(
      this.caisses,
      deviseTransaction,
    );

    //Charger le taux
    this.loadLastdeviseTaux(deviseTransaction);
  }

  calculateMontantRef(montant: number, taux: number): number {
    return montant * taux;
  }

  isSoldeInsufficient(
    montant: number,
    solde: number,
    typePaiement?: string,
  ): boolean {
    return typePaiement !== 'encaissement' && montant > solde;
  }

  isCaisseOverTotal(
    caisses: FormArray,
    currentCaisse: FormGroup,
    montantRef: number,
    montantGl: number,
  ): boolean {
    const totalAutresCaisses = caisses.controls
      .filter((c) => c !== currentCaisse)
      .reduce(
        (sum, c) => sum + (parseFloat(c.get('montantref')?.value) || 0),
        0,
      );

    return totalAutresCaisses + montantRef > montantGl;
  }

  applyAutoCalcul(caisseFG: FormGroup) {
    const soldeCtrl = caisseFG.get('solde');
    const montantCtrl = caisseFG.get('montantcaisse');
    const devisecaisseCtrl = caisseFG.get('devisecaisse');
    const iddevisecaisseCtrl = caisseFG.get('iddevisecaisse');
    const tauxCtrl = caisseFG.get('taux');
    const refCtrl = caisseFG.get('montantref');
    const devTransactionCtrl = this.operationForm.get('devise');
    const deviseReference = this.user?.devise_ref_id;

    if (!montantCtrl || !tauxCtrl || !refCtrl || !soldeCtrl) return;

    const updateMontantRef = () => {
      const deviseTransaction = devTransactionCtrl?.value;
      const montant = parseFloat(montantCtrl.value) || 0;
      const taux = parseFloat(tauxCtrl.value) || 1;
      const solde = OperationModalUtils.parseCFA(soldeCtrl.value) || 0;

      const montantRef = this.calculateMontantRef(montant, taux);
      refCtrl.setValue(montantRef, { emitEvent: false });

      if (deviseTransaction === deviseReference) {
        // même devise → pas de convedeviseReferencersion
        this.operationForm.patchValue(
          { montantRefglobal: this.totalLignes },
          { emitEvent: false },
        );
      } else {
        // utiliser le taux de la caisse correspondant à la devise transaction
        this.getTauxDeviseTransaction(deviseTransaction);
      }

      const maxMontantRef =
        this.operationForm.get('montantRefglobal')?.value || 0;

      //Si le solde caisse devient inférieur au montant saisie
      if (this.isSoldeInsufficient(montant, solde, this.typePaiement)) {
        montantCtrl.setErrors({
          ...(montantCtrl.errors || {}),
          soldeInsuffisant: true,
        });

        this.operationForm.setErrors({
          ...(this.operationForm.errors || {}),
          soldeCaisseInsuffisant: true,
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
      if (montantRef > maxMontantRef) {
        montantCtrl.setErrors({ depassementMontant: true });
        this.operationForm.setErrors({
          ...(this.operationForm.errors || {}),
          totalCaisseDepasse: true,
        });

        refCtrl.setValue(montantRef, { emitEvent: false });
        return;
      }

      // contrôle dépassement montant total
      if (
        this.isCaisseOverTotal(
          this.caisses,
          caisseFG,
          montantRef,
          maxMontantRef,
        )
      ) {
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
      this.controlTotalCaisses(this.caisses, this.operationForm, maxMontantRef);
    };

    montantCtrl.valueChanges.subscribe(updateMontantRef);
    tauxCtrl.valueChanges.subscribe(updateMontantRef);

    //Calcul initial (pour UPDATE)
    updateMontantRef();
  }

  controlTotalCaisses(
    caisses: FormArray,
    operationForm: FormGroup,
    maxMontantRef: number,
  ): void {
    const totalRef = this.calculateTotalCaisses(caisses);

    if (totalRef > maxMontantRef) {
      operationForm.setErrors({
        ...(operationForm.errors || {}),
        totalCaisseDepasse: true,
      });
    } else if (operationForm.hasError('totalCaisseDepasse')) {
      const errors = { ...operationForm.errors };
      delete errors['totalCaisseDepasse'];
      Object.keys(errors).length
        ? operationForm.setErrors(errors)
        : operationForm.setErrors(null);
    }
  }

  calculateTotalCaisses(caisses: FormArray): number {
    return caisses.controls.reduce(
      (sum, c) => sum + (parseFloat(c.get('montantref')?.value) || 0),
      0,
    );
  }

  calculateResteARepartir(caisses: FormArray, maxMontantRef: number): number {
    return maxMontantRef - this.calculateTotalCaisses(caisses);
  }

  get resteARepartir(): number {
    const max = this.operationForm.get('montantRefglobal')?.value || 0;
    return this.calculateResteARepartir(this.caisses, max);
  }

  get form() {
    return this.operationForm.controls;
  }

  //Modification du taux de devise de la caisse référentiel
  updateTauxCaisse(devise: any) {
    //Récupérer la ou les caisses dont la devise egale à la devise de référence
    const caisseConversion = this.caisses.controls.find(
      (c) => c.get('iddevisecaisse')?.value !== devise,
    );

    if (caisseConversion) {
      //recuperer celle dont la devise
      const tauxCtrl = caisseConversion.get('taux');
      if (!tauxCtrl) return;
      tauxCtrl.setValue(this.tauxConversionTransaction, { emitEvent: false });

      this.updateMontantRefGlobal();
      return;
    }
  }

  //La somme de toutes les lignes opérations
  get totalLignes(): number {
    return this.lignes.controls.reduce((sum, l) => {
      return sum + (parseFloat(l.get('montantligne')?.value) || 0);
    }, 0);
  }

  //Total des montants de caisse
  get totalCaisses(): number {
    return this.calculateTotalCaisses(this.caisses);
  }

  //Calculer la somme des lignes de la demande
  getTotalDemande(demande: EnteteDemande): number {
    return demande.lignes.reduce((sum, l) => sum + l.montantdemande, 0);
  }

  //Ajouter la ligne dans le tableau
  addLine() {
    this.lignes.push(this.newLigne());
  }

  newLigne(ligne?: any): FormGroup<any> {
    const ligneOf = this.fb.group({
      idligneoperation: [ligne?.idligneoperation || null],
      numligne: [ligne?.numligne || null],
      natureop: [
        ligne?.nature ?? ligne?.natureoperation ?? '',
        Validators.required,
      ],
      centre: [
        {
          value: ligne?.centre ?? ligne?.centreanalytique ?? null,
          disabled: true,
        },
      ],
      tiers: [{ value: ligne?.tiers || null, disabled: true }],
      montantligne: [
        {
          value: ligne?.montantdemande ?? ligne?.montantoperation ?? 0,
          disabled: true,
        },
        Validators.required,
      ],
      details: this.fb.array([]),
      //CENTRES PAR LIGNE
      centres: this.fb.control<any[]>([]),
      filteredNatureoperations: this.fb.control<any[]>([]),
      filteredTiers: this.fb.control<any[]>([]),
      filteredCentres: this.fb.control<any[]>([]),
      filteredCodebudget: this.fb.control<any[]>([]),
    });

    // Filtrage NatureOperations pour cette ligne
    const filteredNatureoperations = ligneOf.get('natureop')!.valueChanges.pipe(
      startWith(''),
      map((value) =>
        OperationModalUtils.filterNature(value || '', this.naturesFiltrees),
      ),
    );

    // Observables pour la nature et la saisie du tiers
    const nature$ = ligneOf.get('natureop')!.valueChanges.pipe(
      startWith(ligneOf.get('natureop')?.value ?? null)
    );
    const tiersValue$ = ligneOf.get('tiers')!.valueChanges.pipe(
      startWith(ligneOf.get('tiers')?.value ?? '')
    );

    // Filtrage combiné : type de tiers + texte saisi
    const filteredTiers = combineLatest([nature$, tiersValue$]).pipe(
      map(([nature, tiersValue]) => OperationModalUtils.filterTiersByNature(tiersValue, nature, this.tiers))
    );

    // Filtrage Centres pour cette ligne
    const filteredCentres = ligneOf.get('centre')!.valueChanges.pipe(
      startWith(''),
      map((value) =>
        OperationModalUtils.filterCentre(
          value || '',
          ligneOf.get('centres')?.value || [],
        ),
      ),
    );

    // Store observables in the map for template access
    const ligneIndex = this.lignes.length;
    this.ligneFilteredMap.set(ligneIndex, {
      natures: filteredNatureoperations,
      tiers: filteredTiers,
      centres: filteredCentres, // vide pour l’instant
    });

    ligneOf.get('natureop')?.valueChanges.subscribe((nature) => {
      if (!nature) return;

      ligneOf.get('centre')?.enable();
      ligneOf.get('montantligne')?.enable();

      //Charger les centres de chaque lignes
      this.loadCentresForLigne(ligneOf, nature);

      // Appliquer les règles métiers
      this.handleNatureChange(ligneOf, nature);
    });

    ligneOf.get('montantligne')?.valueChanges.subscribe(() => {
      this.updateTotalMontant();

      //Calcul montant ref aussi
      this.updateMontantRefGlobal();
    });

    return ligneOf;
  }

  //Charger les centres de chaque ligne
  loadCentresForLigne(ligne: FormGroup, nature: any) {
    this.AffectationNatureCentreService.getAll(nature.idnature).subscribe({
      next: (res) => {
        if (res.success) {
          const centres = (res.data.centresaffectes || []).filter(
            (c: any) => c.actif === 1,
          );

          //stocké dans la ligne
          ligne.get('centres')?.setValue(centres);

          // reset centre sélectionné
          ligne.get('centre')?.reset();
          this.centresFiltrees = centres;
        }
      },
    });
  }

  protectionField(ligne: FormGroup, field: string) {
    if (!ligne.get('natureop')?.value) {
      this.toastr.error('Veuillez renseigner la nature avant de continuer.');
      return false;
    }
    // return true;
    if (field === 'tiers') {
      const natureId = ligne.get('natureop')?.value;
      const nature = this.natureoperations.find((n) => n.idnature === natureId);
      if (!nature || nature.imputationtiers !== 1) {
        return false;
      }
    }
    return true;
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

  removeLine(index: number) {
    this.lignes.removeAt(index);
    this.updateTotalMontant();
  }

  //Méthode helper pour obtenir le nom complet de l'utilisateur
  getUserFullName(): string {
    const user = this.user;
    if (user && user.nom && user.prenom) {
      return `${user.nom} ${user.prenom}`;
    }
    return user?.nom || user?.prenom || 'Systeme';
  }

  //Selection de la nature / Activer ou desactiver imputation tiers
  handleNatureChange(ligne: FormGroup, natureId: any) {
    const nature = this.natureoperations.find(
      (n) => n.idnature === natureId.idnature,
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

  updateTotalMontant() {
    let total = 0;

    this.lignes.controls.forEach((ctrl: any) => {
      const val = parseFloat(ctrl.get('montantligne')?.value || 0);
      total += isNaN(val) ? 0 : val;
    });

    this.operationForm.patchValue({ montant: total });
  }

  //Recalcule lors de la saisie
  recalculateCaisse(caisseFG: FormGroup) {
    const montant = Number(caisseFG.get('montantcaisse')?.value || 0);
    const taux = Number(caisseFG.get('taux')?.value || 1);

    caisseFG.get('montantref')?.setValue(montant * taux, { emitEvent: false });
  }

  formatNumber(value: number): string {
    return OperationModalUtils.formatNumber(value);
  }

  loadDemandePiecesJointes(iddemande: string): void {
    this.demandePiecesJointesLoading = true;
    this.pjDemandeService.getAll(iddemande).subscribe({
      next: (res) => {
        if (res.success) {
          this.demandePiecesJointes = res.data;
        } else {
          this.demandePiecesJointes = [];
        }
        this.demandePiecesJointesLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement PJ demande:', err);
        this.demandePiecesJointes = [];
        this.demandePiecesJointesLoading = false;
      },
    });
  }

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

  // operation-modal.component.ts - Version corrigée

  /**
   * Télécharge toutes les pièces jointes
   * - Si une demande est sélectionnée : opération + demande
   * - Sinon : uniquement les pièces jointes de l'opération
   */
  downloadingAll = false;
  // operation-modal.component.ts

  /**
   * Détermine le texte du bouton selon ce qui est disponible
   */
  getDownloadButtonText(): string {
    const hasDemandePJ = this.demandePiecesJointes.length > 0;
    const hasOperationPJ = this.existingPieces.length > 0;
    const hasDemande = this.operationForm.get('demande')?.value;

    if (hasDemandePJ && hasOperationPJ) {
      return 'Tout télécharger (opération + demande)';
    } else if (hasDemandePJ && !hasOperationPJ) {
      return 'Télécharger les pièces de la demande';
    } else if (!hasDemandePJ && hasOperationPJ) {
      return "Télécharger les pièces de l'opération";
    }
    return 'Tout télécharger';
  }

  /**
   * Détermine le tooltip du bouton
   */
  getDownloadTooltip(): string {
    const hasDemandePJ = this.demandePiecesJointes.length > 0;
    const hasOperationPJ = this.existingPieces.length > 0;

    if (hasDemandePJ && hasOperationPJ) {
      return "Télécharger les pièces jointes de l'opération et de la demande";
    } else if (hasDemandePJ && !hasOperationPJ) {
      return 'Télécharger les pièces jointes de la demande sélectionnée';
    } else if (!hasDemandePJ && hasOperationPJ) {
      return "Télécharger les pièces jointes de l'opération";
    }
    return 'Aucune pièce jointe disponible';
  }

  /**
   * Télécharge toutes les pièces jointes
   * - Si une demande est sélectionnée avec des PJ : opération + demande
   * - Si seule l'opération a des PJ : uniquement l'opération
   * - Si seule la demande a des PJ : uniquement la demande
   */

  downloadAllFiles(): void {
    const idoperation = this.operation.idoperation;
    const iddemande = this.operationForm.get('demande')?.value;

    const hasOperationPJ = this.existingPieces.length > 0;
    const hasDemandePJ = this.demandePiecesJointes.length > 0;

    const totalFiles =
      (hasDemandePJ ? this.demandePiecesJointes.length : 0) +
      (hasOperationPJ ? this.existingPieces.length : 0);

    if (totalFiles === 0) {
      this.toastr.warning('Aucune pièce jointe à télécharger');
      return;
    }

    // Cas 1: Seulement la demande a des PJ
    if (hasDemandePJ && !hasOperationPJ) {
      console.log('📥 Téléchargement uniquement des PJ de la demande');
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
        const filename = `operation${this.operation.codeoperation}_${timestamp}.zip`;
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

  // Import des natures
  /**
   * Sélection d'un fichier CSV
   */
  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.csvFile = input.files[0];
      this.parseCsvFile();
      // Réinitialiser la valeur de l'input pour permettre la sélection du même fichier
      input.value = '';
    }
  }
  /**
   * Parse le fichier CSV sélectionné
   */
  parseCsvFile(): void {
    if (!this.csvFile) return;

    this.isImportingCsv = true;
    this.showCsvPreview = false;
    this.csvPreview = [];
    this.csvErrors = [];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result as string;
      this.processCsvContent(content);
      this.isImportingCsv = false;
    };
    reader.onerror = () => {
      this.toastr.error('Erreur de lecture du fichier CSV');
      this.isImportingCsv = false;
    };
    // UTF-8 pour gérer les accents
    reader.readAsText(this.csvFile, 'UTF-8');
  }

  processCsvContent(content: string): void {
    content = this.removeBOM(content);
    const delimiter = this.detectDelimiter(content);
    this.detectedDelimiter = delimiter;
    const lines = content.split('\n');
    const dataLines = lines.slice(1);

    // Réinitialiser
    this.csvPreview = [];
    this.csvErrors = [];

    dataLines.forEach((line, index) => {
      line = line.trim();
      if (!line) return;

      const columns = this.parseCsvLine(line, delimiter);

      // --- Validation du format ---
      if (columns.length < 5) {
        const errorMsg = `Ligne ${index + 2}: Format invalide (5 colonnes attendues, ${columns.length} trouvées)`;
        this.csvPreview.push({
          natureCode: '',
          natureLibelle: '',
          tiersCode: '',
          tiersLibelle: '',
          montant: 0,
          nature: null,
          tiers: null,
          originalNatureCode: columns[0] || '',
          originalNatureLibelle: columns[1] || '',
          originalTiersCode: columns[2] || '',
          originalTiersLibelle: columns[3] || '',
          originalMontant: columns[4] || '',
          isValid: false,
          error: errorMsg,
        });
        this.csvErrors.push(errorMsg);
        return;
      }

      const [natureCode, natureLibelle, tiersCode, tiersLibelle, montantStr] =
        columns;

      // --- Validation de la NATURE (CODE UNIQUEMENT) ---
      const nature = this.findNatureByCodeExact(natureCode?.trim() || '');
      if (!nature) {
        const errorMsg = `Ligne ${index + 2}: Nature avec code "${natureCode?.trim()}" introuvable`;
        this.csvPreview.push({
          natureCode: natureCode?.trim() || '',
          natureLibelle: natureLibelle?.trim() || '',
          tiersCode: '',
          tiersLibelle: '',
          montant: 0,
          nature: null,
          tiers: null,
          originalNatureCode: natureCode || '',
          originalNatureLibelle: natureLibelle || '',
          originalTiersCode: tiersCode || '',
          originalTiersLibelle: tiersLibelle || '',
          originalMontant: montantStr || '',
          // 👆 FIN DE L'AJOUT
          isValid: false,
          error: errorMsg,
        });
        this.csvErrors.push(errorMsg);
        return;
      }

      // --- Validation du TIERS (CODE UNIQUEMENT) ---
      const tiers = this.findTiersByCodeExact(tiersCode?.trim() || '');
      if (!tiers) {
        const errorMsg = `Ligne ${index + 2}: Tiers avec code "${tiersCode?.trim()}" introuvable`;
        this.csvPreview.push({
          natureCode: natureCode?.trim() || '',
          natureLibelle: natureLibelle?.trim() || '',
          tiersCode: tiersCode?.trim() || '',
          tiersLibelle: tiersLibelle?.trim() || '',
          montant: 0,
          nature: nature,
          tiers: null,
          originalNatureCode: natureCode || '',
          originalNatureLibelle: natureLibelle || '',
          originalTiersCode: tiersCode || '',
          originalTiersLibelle: tiersLibelle || '',
          originalMontant: montantStr || '',
          isValid: false,
          error: errorMsg,
        });
        this.csvErrors.push(errorMsg);
        return;
      }

      // --- Validation du MONTANT (DOIT ÊTRE > 0) ---
      const montant = this.parseMontant(montantStr);
      if (isNaN(montant)) {
        const errorMsg = `Ligne ${index + 2}: Montant "${montantStr}" invalide`;
        this.csvPreview.push({
          natureCode: natureCode?.trim() || '',
          natureLibelle: natureLibelle?.trim() || '',
          tiersCode: tiersCode?.trim() || '',
          tiersLibelle: tiersLibelle?.trim() || '',
          montant: 0,
          nature: nature,
          tiers: tiers,
          originalNatureCode: natureCode || '',
          originalNatureLibelle: natureLibelle || '',
          originalTiersCode: tiersCode || '',
          originalTiersLibelle: tiersLibelle || '',
          originalMontant: montantStr || '',
          isValid: false,
          error: errorMsg,
        });
        this.csvErrors.push(errorMsg);
        return;
      }

      if (montant <= 0) {
        const errorMsg = `Ligne ${index + 2}: Montant doit être > 0 (valeur: ${montant})`;
        this.csvPreview.push({
          natureCode: natureCode?.trim() || '',
          natureLibelle: natureLibelle?.trim() || '',
          tiersCode: tiersCode?.trim() || '',
          tiersLibelle: tiersLibelle?.trim() || '',
          montant: montant,
          nature: nature,
          tiers: tiers,
          originalNatureCode: natureCode || '',
          originalNatureLibelle: natureLibelle || '',
          originalTiersCode: tiersCode || '',
          originalTiersLibelle: tiersLibelle || '',
          originalMontant: montantStr || '',
          isValid: false,
          error: errorMsg,
        });
        this.csvErrors.push(errorMsg);
        return;
      }

      // ✅ LIGNE VALIDE
      this.csvPreview.push({
        natureCode: natureCode?.trim() || '',
        natureLibelle: natureLibelle?.trim() || '',
        tiersCode: tiersCode?.trim() || '',
        tiersLibelle: tiersLibelle?.trim() || '',
        montant: montant,
        nature: nature,
        tiers: tiers,
        originalNatureCode: natureCode || '',
        originalNatureLibelle: natureLibelle || '',
        originalTiersCode: tiersCode || '',
        originalTiersLibelle: tiersLibelle || '',
        originalMontant: montantStr || '',
        isValid: true,
        error: null,
      });
    });

    if (this.csvPreview.length > 0) {
      this.showCsvPreview = true;
    }
  }

  /**
   * Détecte le délimiteur utilisé dans le CSV (virgule ou point-virgule)
   */
  private detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;

    // Si plus de points-virgules, utiliser ;
    if (semicolonCount > commaCount) {
      return ';';
    }
    // Sinon utiliser la virgule
    return ',';
  }

  /**
   * Supprime le BOM (Byte Order Mark) si présent
   */
  private removeBOM(content: string): string {
    // BOM UTF-8 (caractère invisible ﻿)
    if (content.charCodeAt(0) === 0xfeff) {
      return content.slice(1);
    }
    // BOM UTF-8 avec espace
    if (
      content.charCodeAt(0) === 0xef &&
      content.charCodeAt(1) === 0xbb &&
      content.charCodeAt(2) === 0xbf
    ) {
      return content.slice(3);
    }
    return content;
  }

  /**
   * Parse une ligne CSV avec délimiteur personnalisé
   */
  parseCsvLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Trouve une nature par CODE EXACT (ignore le libellé)
   */
  private findNatureByCodeExact(code: string): natureoperationModel | null {
    if (!code) return null;
    code = code.toLowerCase().trim();
    return (
      this.natureoperations.find(
        (n) => n.codenature?.toLowerCase().trim() === code,
      ) || null
    );
  }

  /**
   * Trouve un tiers par CODE EXACT (ignore la designation)
   */
  private findTiersByCodeExact(code: string): tiersModel | null {
    if (!code) return null;
    code = code.toLowerCase().trim();
    return (
      this.tiers.find((t) => t.codetiers?.toLowerCase().trim() === code) || null
    );
  }

  /**
   * Parse un montant (gère les virgules et espaces)
   */
  parseMontant(value: string): number {
    if (!value) return 0;
    // Supprimer tous les caractères non numériques sauf . et - et ,
    let cleaned = value.replace(/[^\d.,-]/g, '');
    // Remplacer la virgule par un point
    cleaned = cleaned.replace(',', '.');
    return parseFloat(cleaned);
  }

  /**
   * Vérifie si toutes les lignes CSV sont valides
   */
  allCsvRowsValid(): boolean {
    return this.csvPreview.every((row) => row.isValid);
  }

  /**
   * Compte le nombre de lignes valides
   */
  getValidCsvRowsCount(): number {
    return this.csvPreview.filter((row) => row.isValid).length;
  }

  /**
   * Confirme l'import CSV et ajoute les lignes au formulaire
   */
  confirmCsvImport(): void {
    if (this.csvPreview.length === 0) return;

    const validRows = this.csvPreview.filter((row) => row.isValid);

    if (validRows.length === 0) {
      this.toastr.error(
        '❌ Aucune ligne valide à importer. Veuillez corriger les erreurs.',
      );
      return;
    }

    validRows.forEach((row) => {
      const newLine = this.newLigne();
      newLine.patchValue({
        natureop: row.nature,
        tiers: row.tiers,
        montantligne: row.montant,
        centre: null,
      });
      newLine.get('centre')?.disable({ emitEvent: false });
      newLine.get('montantligne')?.enable({ emitEvent: false });
      this.lignes.push(newLine);
    });

    this.cancelCsvImport();
    this.toastr.success(`${validRows.length} ligne(s) importée(s) avec succès`);
    this.updateTotalMontant();
    this.updateMontantRefGlobal();
  }

  /**
   * Annule l'import CSV
   */
  cancelCsvImport(): void {
    this.csvFile = null;
    this.csvPreview = [];
    this.showCsvPreview = false;
    this.csvErrors = [];
    this.isImportingCsv = false;
  }

  /**
   * Échappe une valeur pour le format CSV (ajoute des guillemets si nécessaire)
   */
  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Échapper les guillemets existants et entourer de guillemets si nécessaire
    if (
      str.includes(this.detectedDelimiter) ||
      str.includes('"') ||
      str.includes('\n')
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Exporte TOUTES les lignes EXACTEMENT comme importées,
   * avec une colonne "Erreur" supplémentaire
   */
  exportCsvWithErrors(): void {
    if (this.csvPreview.length === 0) {
      this.toastr.warning('Aucune ligne à exporter');
      return;
    }

    // En-têtes du CSV
    const headers = [
      'Code Nature',
      'Libellé Nature',
      'Code Tiers',
      'Libellé Tiers',
      'Montant',
      'Erreur',
    ];

    // Générer le contenu CSV avec les VALEURS ORIGINALES
    let csvContent =
      headers.map((h) => this.escapeCsvValue(h)).join(this.detectedDelimiter) +
      '\n';

    this.csvPreview.forEach((row) => {
      const line = [
        this.escapeCsvValue(row.originalNatureCode), // 👈 Valeur originale
        this.escapeCsvValue(row.originalNatureLibelle), // 👈 Valeur originale
        this.escapeCsvValue(row.originalTiersCode), // 👈 Valeur originale
        this.escapeCsvValue(row.originalTiersLibelle), // 👈 Valeur originale
        this.escapeCsvValue(row.originalMontant), // 👈 Valeur originale
        this.escapeCsvValue(row.error || ''), // Colonne Erreur
      ].join(this.detectedDelimiter);

      csvContent += line + '\n';
    });

    // Téléchargement
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.toastr.success(`Export de ${this.csvPreview.length} ligne(s) terminé`);
  }

  // Compte les lignes invalides (pour afficher/masquer le bouton)
  getInvalidCsvRowsCount(): number {
    return this.csvPreview.filter((row) => !row.isValid).length;
  }

  /**
   * Vide toutes les lignes de l'opération
   */
  clearAllLines(): void {
    if (this.lignes.controls.length === 0) {
      this.toastr.warning('Aucune ligne à vider');
      return;
    }

    this.lignes.clear();
    this.updateTotalMontant();
    this.updateMontantRefGlobal();
    this.toastr.success('Toutes les lignes ont été vidées');
  }

  /**
   * Télécharge un modèle CSV vide
   */
  /**
   * Télécharge un modèle CSV avec :
   * - Délimiteur point-virgule (standard français)
   * - BOM UTF-8 pour Excel
   * - Exemples réalistes alignés sous chaque colonne
   */
  downloadCsvTemplate(): void {
    const delimiter = ';';
    const csvContent = `Code Nature${delimiter}Libellé Nature${delimiter}Code Tiers${delimiter}Libellé Tiers${delimiter}Montant
XXXXXX${delimiter}Exemple nature${delimiter}XXXXXX${delimiter}Exemple tiers${delimiter}0
XXXXXX${delimiter}Exemple nature${delimiter}XXXXXX${delimiter}Exemple tiers${delimiter}0
XXXXXX${delimiter}Exemple nature${delimiter}XXXXXX${delimiter}Exemple tiers${delimiter}0`;

    // BOM UTF-8 pour compatibilité Excel
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_import_lignes_operation.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.toastr.success('Modèle CSV téléchargé');
  }
}
