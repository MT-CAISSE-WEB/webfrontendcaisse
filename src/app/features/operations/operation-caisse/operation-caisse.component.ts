import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { operationModel } from '../model/operation.model';
import { OperationService } from '../service/operation.service';
import { caissePeriodeModel } from '../../caisse_journal/models/periodecaisse.model';
import { CaissePeriodeService } from '../../caisse_journal/services/caisseperiode.service';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  takeUntil,
  tap,
} from 'rxjs';
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
import { tauxdevisemodel } from '../../donnee_base/donnee_base/model/tauxdevise.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../../_core/modal/confirm-modal/confirm-modal.component';
import { OperationModalComponent } from '../../../_core/modal/operation-modal/operation-modal.component';
import { PieceJointe } from '../../PJ/models/pj.model';
import { OperationPJService } from '../../PJ/service/operationpj.service';

@Component({
  selector: 'app-operation-caisse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './operation-caisse.component.html',
  styleUrls: ['./operation-caisse.component.css'],
  providers: [CurrencyPipe],
})
export class OperationCaisseComponent implements OnInit {
  title = 'Opération';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  msgErros: string = '';
  loading: Boolean = false;
  operationForm: FormGroup = this.fb.group({});
  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;
  operations: operationModel[] = [];
  operation: operationModel = new operationModel();
  operationdetail: operationModel | null = new operationModel();
  operationecriture: operationModel | null = new operationModel();

  //Faire le check selection **********
  objectsSelected: operationModel[] = [];
  selectedItems: any[] = [];

  // Détermine si toutes les lignes sont selectionnées
  checkAllRow: any;
  error: string = '';

  //Le taux de devises
  tauxdevise: tauxdevisemodel = new tauxdevisemodel();
  taux: any;

  //Changement titre modal
  actionModal: string = 'create';

  //Ramener la devise
  devises: devisemodel[] = [];
  devise: devisemodel = new devisemodel();

  //Bouton active / inactive
  isUpdated: boolean = true;

  //Demande selectionnée
  isSelectedDemande: boolean = false;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];

  //Liste des centres analytiques des natures opérations
  centresBynatures: any[] = [];

  //Societé de l'utilisateur connecté
  societe: societemodel = new societemodel();

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  private tauxConversionTransaction = 1;

  //Element à supprimer
  deleteOperation: any = null;

  //Element à annuler
  cancelOperation: any = null;

  //Element statistiques
  stats: any = null;

  //caisseSolde
  caisseSolde: any = [];
  caisseSoldeMap = new Map<string, number>();

  //Liste periode
  caisseperiodes: caissePeriodeModel[] = [];

  showCaisses = false;
  loadingModal = false;
  isAnyOpen: boolean = false;

  private periodeDateMap = new Map<string, string>();
  maxDecaissementJour: any = {};
  minDecaissementJour: any = {};
  nbrDecaissementJour = 0;
  totalDecaissementJour = 0;
  //resteARepartir: number = 0;

  //Les demandes
  entetesDmd: EnteteDemande[] = [];

  caisseStatuses: any = {};

  //Formulaire de recherche
  searchForm: FormGroup = this.fb.group({});
  //initialiser le filtre
  filters = {
    search: '',
    date: '',
    status: '',
    typepaiement: '',
    devise: '',
    nature: '',
    tiers: '',
    montantMin: '',
    montantMax: '',
    page: 1,
  };

  // Mode d'affichage: 'table' | 'details'
  viewMode: 'table' | 'details' = 'table';

  //Liste des natures filtrées
  naturesFiltrees: natureoperationModel[] = [];
  natureoperations: natureoperationModel[] = [];
  filteredNatureoperations: Observable<natureoperationModel[]> =
    new Observable();

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

  // Propriétés pour les pièces jointes
  piecesJointes: PieceJointe[] = [];
  piecesJointesLoading = false;
  selectedFiles: File[] = [];
  selectedOperationPJ: operationModel | null = null;
  pjUploading = false;
  pjDeleting: string | null = null;
  piecesCountMap: Map<string, number> = new Map(); // Cache pour les compteurs
  newlyCreatedOperation: operationModel | null = null;

  constructor(
    private natureoperationservice: NatureoperationService,
    private caisseuserservice: AffectationCaisseService,
    private router: Router,
    private caissePeriodeservice: CaissePeriodeService,
    private centreanalytiqueservice: CentreAnalytiqueService,
    private operationservice: OperationService,
    private tiersservice: TiersService,
    private sc: societeservice,
    private AffectationNatureCentreService: AffectationNatureCentreService,
    private currencyPipe: CurrencyPipe,
    private toastr: ToastrService,
    private service: DemandeService,
    private ds: deviseservice,
    private modalService: NgbModal,
    private pjService: OperationPJService,
  ) {}

  ngOnInit(): void {
    //initialiser le formulaire de recherche
    this.initSearchForm();
    // charger options pour filtres
    this.getAllNatureoperations();
    this.getalldevises();
    this.getAllTiers();
    //Afficher toutes les opérations
    this.getAllOperations();
    //Charger mes caisses
    this.getCaisseUser();
    //Récuperer le max operation
    this.getMaxOperations();

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('cette opération');
    this.titleMsg = TITLE_DELETE;

    this.searchForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((values) => {
        this.currentPage = 1;
        this.applyFilters(values);
      });
  }

  /**
   * Charge les compteurs de pièces jointes pour toutes les opérations
   * Utilise des appels parallèles pour optimiser les performances
   */
  loadPiecesCountsForAllOperations(): void {
    if (!this.operations || this.operations.length === 0) return;

    // Créer un tableau de promesses pour toutes les opérations
    const requests = this.operations.map((op) =>
      this.pjService
        .getAll(op.idoperation)
        .pipe(catchError(() => of({ success: false, data: [] }))),
    );

    // Exécuter toutes les requêtes en parallèle
    forkJoin(requests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          const operation = this.operations[index];
          if (response.success && response.data) {
            this.piecesCountMap.set(
              operation.idoperation,
              response.data.length,
            );
          } else {
            this.piecesCountMap.set(operation.idoperation, 0);
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement compteurs PJ:', err);
        // En cas d'erreur, initialiser à 0 pour toutes
        this.operations.forEach((operation) => {
          this.piecesCountMap.set(operation.idoperation, 0);
        });
      },
    });
  }

  creationOperation() {
    const modalRef = this.modalService.open(OperationModalComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });

    modalRef.componentInstance.title = 'Création operation';

    modalRef.result
      .then((data) => {
        if (data) {
          this.create(data.operation, data.files);
        }
      })
      .catch(() => {});
  }

  //Recuperer toutes les opérations
  getAllOperations() {
    // Use applyFilters to ensure same params as filter view
    this.applyFilters();
  }

  //Affectation natures centre
  getallAffectationCentres(idnature: string) {
    this.AffectationNatureCentreService.getAll(idnature).subscribe({
      next: (res) => {
        if (res.success) {
          this.centresBynatures = (res.data.centresaffectes || []).filter(
            (n: any) => n.actif === 1,
          );
        }
      },
    });
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      search: [''],
      date: [''],
      status: [''],
      typepaiement: [''],
      devise: [''],
      nature: [''],
      tiers: [''],
      montantMin: [''],
      montantMax: [''],
    });
  }

  applyFilters(filters?: any) {
    const vals = filters || this.searchForm.getRawValue() || {};
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.limit,
      search: vals.search || '',
      date: vals.date || '',
      status: vals.status || '',
      typepaiement: vals.typepaiement || '',
      devise: vals.devise || '',
      nature: vals.nature || '',
      tiers: vals.tiers || '',
      montantMin: vals.montantMin || '',
      montantMax: vals.montantMax || '',
      user: this.user.idutilisateur,
    };

    this.operationservice.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.operations = res.data.data;
          this.totalPages = res.data.totalPages;
          // Charger les compteurs de pièces jointes pour les opérations affichées
          this.loadPiecesCountsForAllOperations();
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(
          err?.error?.message || 'Erreur chargement opérations',
        );
      },
    });
  }

  // basculer le mode d'affichage (table / details)
  setViewMode(mode: 'table' | 'details') {
    this.viewMode = mode;
  }

  // Récupérer devises pour filtre
  getalldevises() {
    const params = { page: 1, limit: 50 };
    this.ds.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.devises = res.data;
        }
      },
    });
  }

  // Récupérer natures
  getAllNatureoperations() {
    this.natureoperationservice.getAll().subscribe({
      next: (res) => {
        if (res.success) this.natureoperations = res.data || [];
      },
    });
  }

  // Récupérer tiers
  getAllTiers() {
    this.tiersservice.getAll().subscribe({
      next: (res) => {
        if (res.success)
          this.tiers = (res.data || []).filter((n: any) => n.actif === 1);
      },
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

    const decaissements = this.stats.filter(
      (op: any) =>
        op.codtypeoperation !== 'encaissement' &&
        this.toDateOnly(op.dateperiode) === jour,
    );

    const nombreOperationsUniques = new Set(
      decaissements.map((op: any) => op.codeoperation),
    ).size;

    if (decaissements.length === 0) return 0;

    const maxDecaissement =
      decaissements.length > 0
        ? decaissements.reduce((acc: any, curr: any) =>
            curr.montantref > acc.montantref ? curr : acc,
          )
        : null;

    const minDecaissement =
      decaissements.length > 0
        ? decaissements.reduce((acc: any, curr: any) =>
            curr.montantref < acc.montantref ? curr : acc,
          )
        : null;

    const totalDecaissements = decaissements.reduce((sum: number, op: any) => {
      return sum + Number(op.montantref || 0);
    }, 0);

    return {
      opmin: minDecaissement,
      opmax: maxDecaissement,
      taille: nombreOperationsUniques,
      total: totalDecaissements,
    };
  }

  private toDateOnly(value: string | Date): string {
    const d = new Date(value);
    return d.toISOString().split('T')[0];
  }

  //Recuperer le Max des operations
  getMaxOperations() {
    this.operationservice.getMaxOperation().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
          this.tryComputeMaxDecaissement();
        }
      },
    });
  }

  //Calcul solde de caisse
  calculerSoldeCaisse(idcaisse: string, operations: any[]): number {
    let solde = 0;
    operations.forEach((op) => {
      op.caisses.forEach((c: any) => {
        if (c.idcaisse === idcaisse) {
          if (c.codtypeoperation === 'encaissement') {
            solde += Number(c.montant);
          } else if (c.codtypeoperation === 'decaissement') {
            solde -= Number(c.montant);
          }
        }
      });
    });

    return solde;
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant ?? 0);
  }

  parseCFA(valeur: string | null | undefined): number {
    if (!valeur) return 0;
    return Number(valeur.replace(/[^\d]/g, ''));
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  rafreshpage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  checkSameDatePeriodes() {
    if (!this.caisseperiodes || this.caisseperiodes.length === 0) return null;

    const firstDate = this.caisseperiodes[0].dateperiode;

    const allSame = this.caisseperiodes.every(
      (p) => p.dateperiode === firstDate,
    );

    return allSame ? firstDate : null;
  }

  afficheMontant(item: any) {
    if (item.devise.codedevise != 'USD') {
      return this.formatCFA(item.montant);
    } else {
      return this.formatNumber(item.montant);
    }
  }

  formatNumber(montant: number | string): string {
    if (montant === null || montant === undefined || montant === '') return '';
    const valeur = Number(montant);
    if (isNaN(valeur)) return '';

    return valeur.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  getCaisseUser() {
    this.loading = true;
    this.caisseuserservice
      .getCaisseByUser(this.user.idutilisateur ?? null)
      .subscribe({
        next: (res) => {
          if (res.success) {
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
        },
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
        this.caisseperiodes = responses.map((res) => res.data);
        //logique métier
        this.updateButtonState();
        this.tryComputeMaxDecaissement();
      },
      error: () => {
        console.error('Erreur chargement caisses / périodes');
      },
    });
  }

  formatMontant(montant: number, devise: string) {
    if (!montant && montant !== 0) return '';

    let formatDevise = devise;

    //Normalisation des devises CFA
    if (devise === 'XOF' || devise === 'XAF') {
      formatDevise = 'XOF'; // Angular ne connaît pas XAF
      return this.currencyPipe
        .transform(montant, formatDevise, 'symbol', '1.0-2')
        ?.replace('XOF', 'CFA') // remplacer XOF par CFA
        .replace('CFA', 'FCFA'); // finition OHADA
    }

    //USD, EUR, etc. (Angular sait gérer nativement)
    return this.currencyPipe.transform(montant, devise, 'symbol', '1.0-2');
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.idoperation);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(operation: operationModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idoperation == operation.idoperation,
    );
    if (index == -1 && actif) this.objectsSelected.push(operation);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.operations?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.operations.slice();
    else this.objectsSelected = [];
  }

  // Formater la date ( mer, 13-jan 2025)
  formatDatePreview(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);

    // Formatter jour abrégé FR : lun, mar, mer, jeu, ven, sam, dim
    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(date)
      .replace('.', '');
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

    return `${day} ${month} ${year}`;
  }

  closeModal(modal: string) {
    this.showCaisses = false;
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  //Enregistrement de données
  create(_operation: operationModel, files?: File[]) {
    const { idoperation, ...dataToSend } = _operation;
    this.loading = true;
    this.operationservice.create(dataToSend).subscribe({
      next: async (res) => {
        if (res.success) {
          // Upload des fichiers après création
          const newId = res.idoperation || res.data?.idoperation;
          if (files && files.length > 0 && newId) {
            await this.uploadPendingFiles(newId, files);
          } else if (files && files.length > 0 && !newId) {
            this.toastr.warning(
              "Opération créée mais impossible d'uploader les fichiers",
            );
          }
          // Recharger la page
          window.location.reload();
          this.toastr.success('Opération enregistrée avec succès');
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

  // Méthode d'upload après création
  async uploadPendingFiles(idoperation: string, files: File[]): Promise<void> {
    if (!files || files.length === 0) return;

    const userId = this.user.idutilisateur;

    return new Promise((resolve, reject) => {
      this.pjService.create(idoperation, files, userId).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success(`${res.data.length} fichier(s) uploadé(s)`);
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        },
        error: (err) => {
          console.error('Erreur upload:', err);
          reject(err);
        },
      });
    });
  }

  //Impression du reçu
  printRecu(_object: operationModel) {
    this.operation = _object;
    if (!this.operation) return;

    //Recuperationd de l'id
    const id = this.operation.idoperation;
    this.operationservice.getRecuPdf(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
      },
      error: (err) => {
        this.toastr.error("Erreur d\'impression du reçu");
      },
    });
  }

  //Modification de données
  update(_operation: operationModel) {
    this.operationservice.update(_operation).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllOperations();
          this.rafreshpage();
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

  //Modal edit
  modalEdit(_object: operationModel) {
    this.operationdetail = _object;
  }

  formatDateForInput(date: string) {
    return date ? date.substring(0, 10) : '';
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllOperations(); // recharge les données
  }

  modalDelete(item: operationModel) {
    this.deleteOperation = item;
  }

  deleteConfirmed() {
    if (!this.deleteOperation) return;
    this.operationservice.delete(this.deleteOperation.idoperation).subscribe({
      next: (res) => {
        if (res.success) {
          this.deleteOperation = null;
          this.closeModal('deleteOrder');
          this.getAllOperations();
          window.location.reload();
          this.toastr.success('Opération supprimée');
        } else {
          this.error = 'Erreur de Suppression';
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Suppression échec';
        this.loading = false;
        this.toastr.error(this.error);
      },
    });
  }

  updateButtonState() {
    this.isAnyOpen = this.caisseperiodes.some(
      (p) => p.statut?.toLowerCase() === 'ouverte',
    );
  }

  modalCancel(item: any) {
    item.dateoperation = this.getDatePeriodeDuJour();
    this.cancelOperation = item;
  }

  //Annulation de l'opération
  cancelConfirmed() {
    if (!this.cancelOperation) return;
    this.loading = true;
    this.operationservice.cancel(this.cancelOperation).subscribe({
      next: (res) => {
        if (res.success) {
          this.modalService.dismissAll();
          this.rafreshpage();
          // Recharger la page
          window.location.reload();
          this.toastr.success('Opération annulée avec succès');
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

  getTotalDebit(ecritures: any[]): number {
    return (
      ecritures?.reduce((total, ecriture) => {
        const sousTotal =
          ecriture.lignes?.reduce(
            (sum: number, ligne: any) => sum + Number(ligne.debit || 0),
            0,
          ) || 0;

        return total + sousTotal;
      }, 0) || 0
    );
  }

  getTotalCredit(ecritures: any[]): number {
    return (
      ecritures?.reduce((total, ecriture) => {
        const sousTotal =
          ecriture.lignes?.reduce(
            (sum: number, ligne: any) => sum + Number(ligne.credit || 0),
            0,
          ) || 0;

        return total + sousTotal;
      }, 0) || 0
    );
  }

  modalEcriture(item: any) {
    this.operationecriture = item;
  }

  private getModalContainer(item: any): HTMLElement | null {
    const detailCard = document.querySelector<HTMLElement>(
      `#card-${item.idoperation}`,
    );

    return detailCard || document.querySelector<HTMLElement>('.card');
  }

  openEditModal(template: TemplateRef<any>, item: any) {
    this.operationdetail = item;
    const container = this.getModalContainer(item);
    const options: any = { centered: true, size: 'lg' };
    if (container) {
      options.container = container;
    }
    this.modalService.open(template, options);
  }

  openEcritureModal(template: TemplateRef<any>, item: any) {
    this.operationecriture = item;
    const container = this.getModalContainer(item);
    const options: any = { centered: true, size: 'lg' };
    if (container) {
      options.container = container;
    }
    this.modalService.open(template, options);
  }

  openCancelModal(template: TemplateRef<any>, item: any) {
    item.dateoperation = this.getDatePeriodeDuJour();
    this.cancelOperation = item;
    const container = this.getModalContainer(item);
    const options: any = { centered: true };
    if (container) {
      options.container = container;
    }
    this.modalService.open(template, options);
  }

  // Récupère le nombre de pièces jointes (avec cache)
  getPiecesCount(idoperation: string): number {
    return this.piecesCountMap.get(idoperation) || 0;
  }

  modalPJVisible = false;
  // Ouvre le modal des pièces jointes
  openPiecesJointesModal(op: operationModel): void {
    this.selectedOperationPJ = op;
    this.selectedFiles = [];
    this.loadPiecesJointes(op.idoperation);
    this.modalPJVisible = true;
    document.body.style.overflow = 'hidden'; // Empêche le scroll
  }

  closePiecesJointesModal(): void {
    this.modalPJVisible = false;
    this.selectedOperationPJ = null;
    this.piecesJointes = [];
    this.selectedFiles = [];
    this.pjUploading = false;
    this.pjDeleting = null;
    document.body.style.overflow = ''; // Restaure le scroll
  }

  // Charge les pièces jointes d'une demande
  loadPiecesJointes(idoperation: string): void {
    this.piecesJointesLoading = true;
    this.pjService.getAll(idoperation).subscribe({
      next: (res) => {
        if (res.success) {
          this.piecesJointes = res.data;
          console.log('PJ chargées:', this.piecesJointes);
          this.piecesCountMap.set(idoperation, this.piecesJointes.length);
        } else {
          this.piecesJointes = [];
        }
        this.piecesJointesLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement PJ:', err);
        this.piecesJointes = [];
        this.piecesJointesLoading = false;
        this.toastr.error('Erreur lors du chargement des pièces jointes');
      },
    });
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
    if (!this.selectedOperationPJ || this.selectedFiles.length === 0) return;

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
            this.loadPiecesJointes(this.selectedOperationPJ!.idoperation);
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
            this.loadPiecesJointes(this.selectedOperationPJ!.idoperation);
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
<<<<<<< HEAD
=======

  downloadAllFiles(): void {
    if (!this.selectedOperationPJ) {
      this.toastr.error('Aucune opération sélectionnée');
      return;
    }

    const idoperation = this.selectedOperationPJ?.idoperation;
    const codeoperation = this.selectedOperationPJ?.codeoperation;

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

        // Extraire le nom du fichier des headers ou utiliser un nom par défaut
        const contentDisposition = blob.type;
        const filename = `operation__${this.selectedOperationPJ?.codeoperation}_${this.selectedOperationPJ?.libelle}__pieces_jointes.zip`;

        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toastr.success('Téléchargement démarré');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur téléchargement ZIP:', err);
        this.toastr.error(err.error?.message);
        this.loading = false;
      },
    });
  }
>>>>>>> origin/richard
}
