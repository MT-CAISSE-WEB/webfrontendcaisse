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
import { map, Observable, startWith, tap } from 'rxjs';
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

    /** 2. prepare data */
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
      libelle: [''],
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

    console.log('Demandes:', demande);

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

    // Filtrage Tiers pour cette ligne
    const filteredTiers = ligneOf.get('tiers')!.valueChanges.pipe(
      startWith(''),
      map((value) => OperationModalUtils.filterTiers(value || '', this.tiers)),
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
}
