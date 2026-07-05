import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocomplete,
} from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ComptabilisationService } from '../services/comptabilisation.service';
import { siteservice } from '../../structure/service/site.service';
import { JournalService } from '../../caisse_journal/services/journal.service';
import { OperationService } from '../../operations/service/operation.service';
import { ExcelService } from '../../../_core/services/exportExcel.service';
import { sitemodel } from '../../structure/model/site.model';
import { journalModel } from '../../caisse_journal/models/journal.model';
import { operationModel } from '../../operations/model/operation.model';

interface Ecriture {
  codesite: string;
  ref_ecriture: string;
  num_piece: string;
  numligne: string;
  journal: string;
  date_operation: string | Date;
  typeecriture: string;
  compte: string;
  tiers: string;
  libelle: string;
  debit: number;
  credit: number;
  montant: number;
  devise: string;
  taux: number;
  montantref: number;
  centreanalytique: string;
  centreanalytiquesecond: string;
  etat: 'en attente' | 'validee';
  idligneecriture: string;
  validation: {
    date: string | Date;
  };
}

interface User {
  idutilisateur: string;
}

@Component({
  selector: 'app-comptabilisation',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
  ],
  templateUrl: './comptabilisation.component.html',
  styleUrls: ['./comptabilisation.component.css'],
})
export class ComptabilisationComponent implements OnInit {
  title = 'Consultation des écritures comptables';
  loading = false;
  msgErros = '';

  // Modal states
  showComptaModal = false;
  showCriteriaModal = false;
  showExportDropdown = false;
  showConfirmModal = false;

  // Formulaires
  criteriaForm: FormGroup;
  comptabiliteForm: FormGroup;

  // Données
  sites: sitemodel[] = [];
  journaux: journalModel[] = [];
  operations: operationModel[] = [];
  ecritures: Ecriture[] = [];
  operationsNonComptabilisees: operationModel[] = [];

  // Sélection
  selectedRows: Set<Ecriture> = new Set();
  selectAll = false;
  selectedOperationId = '';

  // Mode de comptabilisation
  modeComptabilisation: 'unitaire' | 'critere' = 'unitaire';

  // Filtres autocomplete
  filteredSites!: Observable<sitemodel[]>;
  filteredJournaux!: Observable<journalModel[]>;

  // Colonnes pour Excel
  tableau_Ecritures = [
    { header: 'Site', field: 'codesite' },
    { header: 'N° document', field: 'ref_ecriture' },
    { header: 'N° piece', field: 'num_piece' },
    { header: 'N° ecriture', field: 'numligne' },
    { header: 'Journal', field: 'journal' },
    { header: 'Date', field: 'date_operation' },
    { header: 'Type', field: 'typeecriture' },
    { header: 'Compte', field: 'compte' },
    { header: 'Tiers', field: 'tiers' },
    { header: 'Libellé', field: 'libelle' },
    { header: 'Débit', field: 'debit' },
    { header: 'Crédit', field: 'credit' },
    { header: 'Montant', field: 'montant' },
    { header: 'Devise', field: 'devise' },
    { header: 'Taux', field: 'taux' },
    { header: 'Montant réf', field: 'montantref' },
    { header: 'Centre ana.', field: 'centreanalytique' },
    { header: 'Centre ana.(2)', field: 'centreanalytiquesecond' },
  ];

  constructor(
    private fb: FormBuilder,
    private siteService: siteservice,
    private journalService: JournalService,
    private service: ComptabilisationService,
    private operationService: OperationService,
    private toastr: ToastrService,
    private excelService: ExcelService,
  ) {
    this.criteriaForm = this.createCriteriaForm();
    this.comptabiliteForm = this.createComptabiliteForm();
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadOperations();
    this.setupAutocomplete();
  }

  // ============================================
  // FORM INITIALIZATION
  // ============================================
  private createCriteriaForm(): FormGroup {
    return this.fb.group({
      datedebut: [''],
      datefin: [''],
      idsite: [''],
      journal: [''],
      etat: ['en attente'],
    });
  }

  private createComptabiliteForm(): FormGroup {
    return this.fb.group({
      datedebut: [''],
      datefin: [''],
      operation: [''],
      journal: [''],
    });
  }

  private setupAutocomplete(): void {
    this.filteredSites = this.criteriaForm.get('idsite')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterSite(value)),
    );

    this.filteredJournaux = this.criteriaForm.get('journal')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterJournal(value)),
    );
  }

  // ============================================
  // DATA LOADING
  // ============================================
  private loadDropdowns(): void {
    this.siteService.getAll().subscribe({
      next: (res) => {
        if (res.success) this.sites = res.data;
      },
      error: () => {
        this.toastr.error('Erreur de chargement des sites');
      },
    });

    this.journalService.getAll().subscribe({
      next: (res) => {
        if (res.success) this.journaux = res.data.data;
      },
      error: () => {
        this.toastr.error('Erreur de chargement des journaux');
      },
    });
  }

  private loadOperations(): void {
    const params = { page: 1, limit: 1000, user: this.user.idutilisateur };
    this.operationService.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.operations = res.data.data;
          this.operationsNonComptabilisees = res.data.data.filter(
            (op: any) => !op.lignes?.every((l: any) => l.comptabilise === 1),
          );
        }
      },
      error: () => {
        this.toastr.error('Erreur de chargement des opérations');
      },
    });
  }

  // ============================================
  // SEARCH
  // ============================================
  search(criteria: any): void {
    this.loading = true;
    this.service.getAllEcriture(criteria).subscribe({
      next: (res) => {
        this.ecritures = res.data || [];
        // Trier : les "en attente" en premier
        this.ecritures.sort((a, b) => {
          if (a.etat === 'en attente' && b.etat !== 'en attente') return -1;
          if (a.etat !== 'en attente' && b.etat === 'en attente') return 1;
          return 0;
        });
        this.loading = false;
        this.clearSelection();
      },
      error: (err) => {
        this.toastr.error(err.message || 'Erreur de chargement');
        this.loading = false;
      },
    });
  }

  applyCriteria(): void {
    if (this.criteriaForm.invalid) {
      this.msgErros = 'Veuillez renseigner correctement les critères.';
      return;
    }

    const siteId = this.criteriaForm.value.idsite?.idsite;
    const journalId = this.criteriaForm.value.journal?.idjournal;

    const criteria = {
      ...this.criteriaForm.value,
      idsite: siteId || null,
      datedebut: this.criteriaForm.value.datedebut
        ? new Date(this.criteriaForm.value.datedebut).toISOString()
        : null,
      datefin: this.criteriaForm.value.datefin
        ? new Date(this.criteriaForm.value.datefin).toISOString()
        : null,
      etat: this.criteriaForm.value.etat || null,
      journal: journalId || null, // ← Utilise l'ID extrait
    };

    this.search(criteria);
    this.closeCriteriaModal();
  }

  // ============================================
  // SELECTION MANAGEMENT
  // ============================================
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.ecritures.forEach((row) => this.selectedRows.add(row));
    } else {
      this.selectedRows.clear();
    }
  }

  toggleSelectRow(row: Ecriture): void {
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    this.selectAll = this.selectedRows.size === this.ecritures.length;
  }

  clearSelection(): void {
    this.selectedRows.clear();
    this.selectAll = false;
  }

  // ============================================
  // VALIDATION
  // ============================================
  validateSelected(): void {
    if (this.selectedRows.size === 0) {
      this.toastr.warning(
        'Veuillez sélectionner au moins une écriture à valider.',
      );
      return;
    }

    const ids = Array.from(this.selectedRows).map((row) => row.idligneecriture);
    this.callValidationApi(ids);
  }

  private callValidationApi(ids: string[]): void {
    this.loading = true;
    this.service.validateByIds(ids).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Écritures validées avec succès');
          this.applyCriteria();
        } else {
          this.toastr.error(res.message || 'Erreur lors de la validation');
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.toastr.error(err.message || 'Erreur technique');
        this.loading = false;
      },
    });
  }

  // ============================================
  // COMPTABILISATION
  // ============================================
  openComptabilisationModal(): void {
    this.loadOperations();
    this.showComptaModal = true;
  }

  comptabiliserOperationUnitaire(): void {
    if (!this.selectedOperationId) {
      this.toastr.warning('Veuillez sélectionner une opération');
      return;
    }

    this.service.comptabiliserOperation(this.selectedOperationId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Opération comptabilisée avec succès');
          this.applyCriteria();
          this.selectedOperationId = '';
          this.showComptaModal = false;
        } else {
          this.toastr.error(res.message);
        }
      },
      error: (err: any) => this.toastr.error(err.message),
    });
  }

  comptabiliserParCriteres(): void {
    const criteria = {
      idsite: this.comptabiliteForm.value.idsite || null,
      datedebut: this.comptabiliteForm.value.datedebut
        ? new Date(this.comptabiliteForm.value.datedebut).toISOString()
        : null,
      datefin: this.comptabiliteForm.value.datefin
        ? new Date(this.comptabiliteForm.value.datefin).toISOString()
        : null,
      journal: this.comptabiliteForm.value.journal || null,
    };

    if (
      !criteria.idsite &&
      !criteria.datedebut &&
      !criteria.datefin &&
      !criteria.journal
    ) {
      this.toastr.warning(
        'Précisez au moins un critère (site, période, journal)',
      );
      return;
    }

    this.service.comptabiliserParCriteres(criteria).subscribe({
      next: (res: any) => {
        this.toastr.success(res.message);
        this.applyCriteria();
        this.showComptaModal = false;
      },
      error: (err: any) => this.toastr.error(err.message),
    });
  }

  // ============================================
  // EXPORT
  // ============================================
  exportExcel(validateBeforeExport: boolean = false): void {
    if (this.ecritures.length === 0) {
      this.toastr.warning('Aucune écriture à exporter.');
      return;
    }

    if (validateBeforeExport) {
      this.showConfirmModal = true;
      return;
    }

    const exportData = this.prepareExportData();
    this.excelService.exportToExcel(
      exportData,
      this.tableau_Ecritures,
      'ecritures_comptables',
    );
  }

  confirmExport(): void {
    this.showConfirmModal = false;
    this.validateAllWithExport();
  }

  private validateAllWithExport(): void {
    if (this.ecritures.length === 0) {
      this.toastr.warning('Aucune écriture à exporter.');
      return;
    }

    this.loading = true;
    this.service
      .validateByIds(this.ecritures.map((e) => e.idligneecriture))
      .subscribe({
        next: (res) => {
          this.toastr.success(res.message);
          this.applyCriteria();

          // Attendre que loading redevienne false
          const checkInterval = setInterval(() => {
            if (!this.loading) {
              clearInterval(checkInterval);
              const exportData = this.prepareExportData();
              this.excelService.exportToExcel(
                exportData,
                this.tableau_Ecritures,
                'ecritures_comptables',
              );
            }
          }, 200);
        },
        error: (err) => {
          this.toastr.error(err.message);
          this.loading = false;
        },
      });
  }

  private prepareExportData(): any[] {
    return this.ecritures.map((ecriture) => ({
      ...ecriture,
      date_operation: this.formatDateForExcel(ecriture.date_operation),
    }));
  }

  private formatDateForExcel(dateInput: string | Date): string {
    const date = new Date(dateInput);
    return date.toLocaleDateString('fr-FR');
  }

  // ============================================
  // SAGE EXPORTS
  // ============================================
  exportSage1000(): void {
    if (!this.ecritures.length) {
      this.toastr.warning('Aucune écriture à exporter');
      return;
    }

    const data = this.prepareSage1000Data();
    this.excelService.exportRawData(data, 'sage1000_ecritures');
  }

  private prepareSage1000Data(): any[] {
    const result: any[] = [];

    this.ecritures.forEach((ecriture) => {
      const hasAnalytique =
        !!ecriture.centreanalytique || !!ecriture.centreanalytiquesecond;

      result.push({
        Journal: ecriture.journal,
        Date: this.formatDateForExcel(ecriture.date_operation),
        Compte: ecriture.compte,
        'Num piece': ecriture.num_piece,
        Reference: ecriture.ref_ecriture,
        Tiers: ecriture.tiers || '',
        'Type compte': ecriture.tiers ? 'X' : 'G',
        Libellé: ecriture.libelle,
        'Montant ref': ecriture.montantref,
        'Montant devise': ecriture.montant,
        'Type de pièce': 'OD',
        Sens: ecriture.debit > 0 ? 'D' : 'C',
        Devise: ecriture.devise,
        Taux: ecriture.taux,
        'Montant Debit': ecriture.debit,
        'Montant credit': ecriture.credit,
        'Centre analytique': '',
        'Centre analytique 2': '',
      });

      if (hasAnalytique) {
        result.push({
          Journal: ecriture.journal,
          Date: this.formatDateForExcel(ecriture.date_operation),
          Compte: ecriture.compte,
          'Num piece': ecriture.num_piece,
          Reference: ecriture.ref_ecriture,
          Tiers: ecriture.tiers || '',
          'Type compte': 'A',
          Libellé: ecriture.libelle,
          'Montant ref': ecriture.montantref,
          'Montant devise': ecriture.montant,
          'Type de pièce': 'OD',
          Sens: ecriture.debit > 0 ? 'D' : 'C',
          Devise: ecriture.devise,
          Taux: ecriture.taux,
          'Montant Debit': ecriture.debit,
          'Montant credit': ecriture.credit,
          'Centre analytique': ecriture.centreanalytique || '',
          'Centre analytique 2': ecriture.centreanalytiquesecond || '',
        });
      }
    });

    return result;
  }

  exportSageX3(): void {
    if (!this.ecritures.length) {
      this.toastr.warning('Aucune écriture à exporter.');
      return;
    }

    const rows = this.prepareSageX3Data();
    this.excelService.exportSageX3(rows, 'sage_x3_ecritures');
  }

  private formatDateX3(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const jour = String(date.getDate()).padStart(2, '0');
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const annee = date.getFullYear();
    return `${jour}${mois}${annee}`;
  }

  private prepareSageX3Data(): any[][] {
    const rows: any[][] = [];
    const groupes = this.ecritures.reduce((acc: any, ecriture: any) => {
      const key = ecriture.num_piece;
      if (!acc[key]) acc[key] = [];
      acc[key].push(ecriture);
      return acc;
    }, {});

    Object.keys(groupes).forEach((numPiece) => {
      const lignes = groupes[numPiece];
      const entete = lignes[0];

      // Ligne G
      rows.push([
        'G',
        'FF',
        entete.num_piece,
        entete.codesite,
        entete.journal,
        this.formatDateX3(entete.date_operation),
        entete.ref_ecriture,
        entete.devise,
        entete.taux || 1,
        'STDCO',
        entete.libelle || '',
      ]);

      let numeroLigne = 1;
      lignes.forEach((ecriture: any) => {
        const montant =
          Number(ecriture.debit) > 0
            ? Number(ecriture.debit)
            : Number(ecriture.credit);
        const sens = Number(ecriture.debit) > 0 ? 1 : -1;

        // Ligne D
        rows.push([
          'D',
          numeroLigne,
          1,
          numeroLigne,
          ecriture.codesite,
          ecriture.tiers || '',
          ecriture.compte,
          '',
          ecriture.libelle || '',
          sens,
          montant,
        ]);

        // Ligne analytique
        if (ecriture.centreanalytique || ecriture.centreanalytiquesecond) {
          rows.push([
            'A',
            numeroLigne,
            'AXE1',
            ecriture.centreanalytique || '',
            'AXE2',
            ecriture.centreanalytiquesecond || '',
            0,
            montant,
          ]);
        }

        numeroLigne++;
      });
    });

    return rows;
  }

  // ============================================
  // MODAL MANAGEMENT
  // ============================================
  toggleExportDropdown(): void {
    this.showExportDropdown = !this.showExportDropdown;
  }

  openCriteriaModal(): void {
    this.showCriteriaModal = true;
  }

  closeCriteriaModal(): void {
    this.showCriteriaModal = false;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  get user(): User {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatCFA(montant: number | null): string {
    if (montant == null) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  }

  formatDateFR(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(date)
      .replace('.', '');
    return `${dayShort} ${date.getDate()} ${new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '')} ${date.getFullYear()}`;
  }

  // Filtres pour autocomplete
  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  private _filterSite(value: string | sitemodel): sitemodel[] {
    const filterValue = this._normalizeValue(
      typeof value === 'string' ? value : value?.libelle || '',
    );
    return this.sites.filter((option) =>
      this._normalizeValue(option.libelle).includes(filterValue),
    );
  }

  private _filterJournal(value: string | journalModel): journalModel[] {
    const filterValue = this._normalizeValue(
      typeof value === 'string' ? value : value?.designation || '',
    );
    return this.journaux.filter((option) =>
      this._normalizeValue(option.designation).includes(filterValue),
    );
  }

  // ============================================
  // MÉTHODES DISPLAY CORRIGÉES
  // ============================================

  /**
   * Affiche le libellé du site dans l'autocomplete
   * Gère le cas où la valeur est un objet, un ID ou une chaîne
   */
  displaySite(value: any): string {
    if (!value) return '';

    // Si c'est une chaîne (ID), on cherche le site correspondant
    if (typeof value === 'string') {
      const found = this.sites.find((site) => site.idsite === value);
      return found ? found.libelle : value;
    }

    // Si c'est un objet avec un libellé
    if (typeof value === 'object' && value.libelle) {
      return value.libelle;
    }

    // Si c'est un objet avec un idsite
    if (typeof value === 'object' && value.idsite) {
      const found = this.sites.find((site) => site.idsite === value.idsite);
      return found ? found.libelle : value.idsite;
    }

    return String(value);
  }

  /**
   * Affiche le libellé du journal dans l'autocomplete
   * Gère le cas où la valeur est un objet, un ID ou une chaîne
   */
  displayJournal(value: any): string {
    if (!value) return '';

    // Si c'est une chaîne (ID), on cherche le journal correspondant
    if (typeof value === 'string') {
      const found = this.journaux.find(
        (journal) => journal.idjournal === value,
      );
      return found ? found.designation : value;
    }

    // Si c'est un objet avec une désignation
    if (typeof value === 'object' && value.designation) {
      return value.designation;
    }

    // Si c'est un objet avec un idjournal
    if (typeof value === 'object' && value.idjournal) {
      const found = this.journaux.find(
        (journal) => journal.idjournal === value.idjournal,
      );
      return found ? found.designation : value.idjournal;
    }

    return String(value);
  }
}
