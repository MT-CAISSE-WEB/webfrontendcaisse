import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'; // ← ajouter pour les checkboxes
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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

@Component({
  selector: 'app-comptabilisation',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCheckboxModule, MatRadioModule, MatFormFieldModule,
    MatInputModule, MatAutocompleteModule, MatOptionModule
  ],
  templateUrl: './comptabilisation.component.html',
  styleUrls: ['./comptabilisation.component.css']
})

export class ComptabilisationComponent implements OnInit {
  title = "Consultation des écritures comptables";
  fb = new FormBuilder();

  // Formulaires
  criteriaForm!: FormGroup;
  comptabiliteForm!: FormGroup;

  // Données
  sites: sitemodel[] = [];
  journaux: journalModel[] = [];
  operations: operationModel[] = [];
  ecritures: any[] = [];

  // Filtres et sélection
  filteredSites!: Observable<sitemodel[]>;
  filteredJournaux!: Observable<journalModel[]>;
  selectedRows: Set<any> = new Set();   // ensemble des lignes sélectionnées
  selectAll: boolean = false;

  // Chargement et messages
  loading: boolean = false;
  msgErros: string = "";

  // Pagination
  currentPage: number = 1;
  limit: number = 4000;

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
    { header: 'Centre ana.(2)', field: 'centreanalytiquesecond' }
  ];

  // Nouvelles propriétés
  showComptaModal: boolean = false;
  modeComptabilisation: 'unitaire' | 'critere' = 'unitaire';
  operationsNonComptabilisees: any[] = []; // liste des opérations non comptabilisées
  selectedOperationId: string = '';

  showConfirmModal = false;

  constructor(
    private st: siteservice,
    private journalservice: JournalService,
    private service: ComptabilisationService,
    private operationservice: OperationService,
    private toastr: ToastrService,
    private excelService: ExcelService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadDropdowns();
    this.loadOperations();

    // Filtres pour autocomplete
    this.filteredSites = this.criteriaForm.get('idsite')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterSite(value))
    );

    this.filteredJournaux = this.criteriaForm.get('journal')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterJournal(value))
    );

  }

  initForms() {
    this.criteriaForm = this.fb.group({
      datedebut: [''],
      datefin: [''],
      idsite: [''],
      journal: [''],
      etat: ['en attente']  // par défaut, uniquement les non validées
    });
    this.comptabiliteForm = this.fb.group({
      datedebut: [''],
      datefin: [''],
      operation: [''],
      journal: ['']
    });
  }

  loadDropdowns() {
    this.st.getAll().subscribe(res => { if (res.success) this.sites = res.data; });
    this.journalservice.getAll().subscribe(res => { if (res.success) this.journaux = res.data.data; });
  }

  loadOperations() {
    const params = { page: this.currentPage, limit: this.limit, search: '', date: '', user: this.user.idutilisateur };
    this.operationservice.getAll(params).subscribe(res => {
      if (res.success) {
        this.operations = res.data.data.filter((op: any) => !op.lignes?.every((l: any) => l.comptabilise === 1));
        this.operationsNonComptabilisees = res.data.data.filter((op: any) => !op.lignes?.every((l: any) => l.comptabilise === 1));
      }
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // Recherche des écritures avec les critères
  search(criteria: any) {
    this.loading = true;
    this.service.getAllEcriture(criteria).subscribe({
      next: (res) => {
        this.ecritures = res.data;
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
      }
    });
  }

  applyCriteria() {
    if (this.criteriaForm.invalid) {
      this.msgErros = 'Veuillez renseigner correctement les critères.';
      return;
    }
    const criteria = {
      ...this.criteriaForm.value,
      idsite: this.criteriaForm.value.idsite || null,
      datedebut: this.criteriaForm.value.datedebut ? new Date(this.criteriaForm.value.datedebut).toISOString() : null,
      datefin: this.criteriaForm.value.datefin ? new Date(this.criteriaForm.value.datefin).toISOString() : null,
      etat: this.criteriaForm.value.etat || null,
      journal: this.criteriaForm.value.journal || null
    };
    this.search(criteria);
    this.closeModal('criteriaModal');
  }

  // Comptabilisation (validation) des écritures sélectionnées ou de toutes selon critères
  validateSelected() {
    if (this.selectedRows.size === 0) {
      this.toastr.warning('Veuillez sélectionner au moins une écriture à valider.');
      return;
    }
    // On récupère les identifiants (par exemple idligneecriture) des lignes sélectionnées
    const ids = Array.from(this.selectedRows).map(row => row.idligneecriture);
    this.callValidationApi(ids);
  }

  validateAllDisplayed() {
    if (this.ecritures.length === 0) {
      this.toastr.warning('Aucune écriture à valider.');
      return;
    }
    const ids = this.ecritures.map(ecriture => ecriture.idligneecriture);
    this.callValidationApi(ids);
  }

  // Valider toutes les écritures correspondant aux critères actuels
  validateAll() {
    const criteria = this.buildValidationCriteria();
    if (!criteria) return;
    this.callValidationApi([], criteria);  // null = pas de sélection, on utilise les critères
  }

  private buildValidationCriteria() {
    // On reprend les mêmes filtres que la recherche (sauf l'état, car on veut seulement celles en attente)
    const criteria = {
      idsite: this.criteriaForm.value.idsite || null,
      datedebut: this.criteriaForm.value.datedebut ? new Date(this.criteriaForm.value.datedebut).toISOString() : null,
      datefin: this.criteriaForm.value.datefin ? new Date(this.criteriaForm.value.datefin).toISOString() : null,
      journal: this.criteriaForm.value.journal || null
    };
    if (!criteria.idsite && !criteria.datedebut && !criteria.datefin && !criteria.journal) {
      this.toastr.warning('Veuillez préciser au moins un critère (site, période ou journal) pour la validation en masse.');
      return null;
    }
    return criteria;
  }

  private callValidationApi(ids?: string[], criteria?: any) {
    this.loading = true;
    let request;
    if (ids && ids.length != 0) {
      // Validation par liste d'IDs
      request = this.service.validateByIds(ids);
    } else {
      this.loading = false;
      return;
    }
    request.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Écritures validées avec succès');
          // Recharger les données avec les critères actuels
          this.applyCriteria();
        } else {
          this.toastr.error(res.message || 'Erreur lors de la validation');
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.toastr.error(err.message || 'Erreur technique');
        this.loading = false;
      }
    });
  }

  private validateAllWithExport() {
    const criteria = this.buildValidationCriteria();
    if (!criteria) return;
    this.loading = true;
    this.validateAllDisplayed();
    // Attendre que loading redevienne false
    const checkInterval = setInterval(() => {
      if (!this.loading) {
        clearInterval(checkInterval);
        const exportData = this.prepareExportData();
        this.excelService.exportToExcel(exportData, this.tableau_Ecritures, 'ecritures_comptables');
        this.loading = false;
      }
    }, 200);
  }

  // Gestion des sélections
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.ecritures.forEach(row => this.selectedRows.add(row));
    } else {
      this.selectedRows.clear();
    }
  }

  toggleSelectRow(row: any) {
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    this.selectAll = this.selectedRows.size === this.ecritures.length;
  }

  clearSelection() {
    this.selectedRows.clear();
    this.selectAll = false;
  }

  // Fermer un modal Bootstrap
  private closeModal(modalId: string) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }
  }

  displaySite(site: any): string {
      if (!site) return '';
      const found = this.sites.find(s => s.idsite === site);
      return found ? found.libelle : '';
  }

  displayJournal(journal: any): string {
    if (!journal) return '';
    const found = this.journaux.find(s => s.idjournal === journal);
    return found ? found.designation : '';
  }

  // Méthodes de filtrage pour autocomplete
  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  private _filterSite(value: any): any[] {
    const filterValue = this._normalizeValue(typeof value === 'string' ? value : value?.libelle || '');
    return this.sites.filter(option => this._normalizeValue(option.libelle).includes(filterValue));
  }

  private _filterJournal(value: any): any[] {
    const filterValue = this._normalizeValue(typeof value === 'string' ? value : value?.designation || '');
    return this.journaux.filter(option => this._normalizeValue(option.designation).includes(filterValue));
  }

  formatCFA(montant: number | null): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(montant ?? 0);
  }

  formatDateFR(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', '');
    return `${dayShort} ${date.getDate()} ${new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '')} ${date.getFullYear()}`;
  }

  // Pour le modal de comptabilisation (génération initiale des écritures)
  applyComptability() {
    if (this.comptabiliteForm.invalid) {
      this.msgErros = 'Veuillez renseigner les critères de génération.';
      return;
    }
    const data = {
      ...this.comptabiliteForm.value,
      datedebut: this.comptabiliteForm.value.datedebut ? new Date(this.comptabiliteForm.value.datedebut).toISOString() : null,
      datefin: this.comptabiliteForm.value.datefin ? new Date(this.comptabiliteForm.value.datefin).toISOString() : null
    };
    this.generate(data);
    this.closeModal('comptabiliteModal');
  }

  generate(data: any) {
    this.loading = true;
    this.service.generateEcriture(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Écritures générées avec succès');
          this.applyCriteria(); // recharge la liste
        } else {
          this.toastr.error(res.message);
        }
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error(err.message);
        this.loading = false;
      }
    });
  }

  // Au chargement, récupérer les opérations non comptabilisées
  loadNonComptabilisedOperations() {
    const params = { page: 1, limit: 1000};
    this.operationservice.getAll(params).subscribe(res => {
      if (res.success) {
        this.operationsNonComptabilisees = res.data.data.filter((op: any) => 
          !op.lignes?.every((l: any) => l.comptabilise === 1)
        );
      }
    });
  }

  // Ouvrir le modal de comptabilisation
  openComptabilisationModal() {
    this.loadNonComptabilisedOperations();
    this.showComptaModal = true;
  }

  // Comptabiliser une opération spécifique
  comptabiliserOperationUnitaire() {
    if (!this.selectedOperationId) {
      this.toastr.warning('Veuillez sélectionner une opération');
      return;
    }
    this.service.comptabiliserOperation(this.selectedOperationId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Opération comptabilisée avec succès');
          this.applyCriteria(); // recharge la liste des écritures
          this.selectedOperationId = '';
          this.showComptaModal = false;
        } else {
          this.toastr.error(res.message);
        }
      },
      error: (err: any) => this.toastr.error(err.message)
    });
  }

  // Comptabiliser par critères (période, site, journal)
  comptabiliserParCriteres() {
    const criteria = {
      idsite: this.comptabiliteForm.value.idsite || null,
      datedebut: this.comptabiliteForm.value.datedebut ? new Date(this.comptabiliteForm.value.datedebut).toISOString() : null,
      datefin: this.comptabiliteForm.value.datefin ? new Date(this.comptabiliteForm.value.datefin).toISOString() : null,
      journal: this.comptabiliteForm.value.journal || null
    };

    if (!criteria.idsite && !criteria.datedebut && !criteria.datefin && !criteria.journal) {
      this.toastr.warning('Précisez au moins un critère (site, période, journal)');
      return;
    }

    this.service.comptabiliserParCriteres(criteria).subscribe({
      next: (res: any) => {
        this.toastr.success(res.message);
        this.applyCriteria();
        this.showComptaModal = false;
      },
      error: (err: any) => this.toastr.error(err.message)
    });
  }

  exportExcel(validateBeforeExport: boolean = false) {
    if (this.ecritures.length === 0) {
      this.toastr.warning('Aucune écriture à exporter.');
      return;
    }
    if (validateBeforeExport) {
      this.showConfirmModal = true;
      return;
    }

    const exportData = this.prepareExportData();
    this.excelService.exportToExcel(exportData, this.tableau_Ecritures, 'ecritures_comptables');
  }

  confirmExport() {
    this.showConfirmModal = false;
    this.validateAllWithExport();
  }

  private prepareExportData(): any[] {
    return this.ecritures.map(ecriture => ({
      ...ecriture,
      date_operation: ecriture.date_operation ? this.formatDateForExcel(ecriture.date_operation) : ''
    }));
  }

  private formatDateForExcel(dateInput: string | Date): string {
    const date = new Date(dateInput);
    return date.toLocaleDateString('fr-FR'); // format jj/mm/aaaa
  }

  validateWithExport() {
    if (this.ecritures.length === 0) {
      this.toastr.warning('Aucune écriture à exporter.');
      return;
    }

    this.loading = true;
    this.service.validateByIds(this.ecritures).subscribe({
      next: (res) => {
        this.toastr.success(res.message);
        this.applyCriteria(); // déclenche le rechargement (met loading = true puis false)
        // Attendre que loading redevienne false
        const checkInterval = setInterval(() => {
          if (!this.loading) {
            clearInterval(checkInterval);
            const exportData = this.prepareExportData();
            this.excelService.exportToExcel(exportData, this.tableau_Ecritures, 'ecritures_comptables');
            this.loading = false;
          }
        }, 200);
      },
      error: (err) => {
        this.toastr.error(err.message);
        this.loading = false;
      }
    });
  }

  private getTypeCompte(ecriture: any): string {
      if (ecriture.tiers) {
          return 'X';
      }

      if (ecriture.centreanalytique) {
          return 'A';
      }

      return 'G';
  }

  private getSens(ecriture: any): string {
      if (ecriture.debit > 0) {
          return 'D';
      }

      return 'C';
  }

  private prepareSage1000Data(): any[] {
    const result: any[] = [];
    this.ecritures.forEach(ecriture => {
        const hasAnalytique = !!ecriture.centreanalytique || !!ecriture.centreanalytiquesecond;
        // Ligne G
        result.push({
            'Journal': ecriture.journal,
            'Date': this.formatDateForExcel(ecriture.date_operation),
            'Compte': ecriture.compte,
            'Num piece': ecriture.num_piece,
            'Reference': ecriture.ref_ecriture,
            'Tiers': ecriture.tiers || '',
            'Type compte': ecriture.tiers ? 'X' : 'G',
            'Libellé': ecriture.libelle,
            'Montant ref': ecriture.montantref,
            'Montant devise': ecriture.montantdevise,
            'Type de pièce': 'OD',
            'Sens': ecriture.debit > 0 ? 'D' : 'C',
            'Devise': ecriture.devise,
            'Taux': ecriture.taux,
            'Montant Debit': ecriture.debit,
            'Montant credit': ecriture.credit,
            'Centre analytique': '',
            'Centre analytique 2': ''
        });

        // Ligne A
        if (hasAnalytique) {
            result.push({
                'Journal': ecriture.journal,
                'Date': this.formatDateForExcel(ecriture.date_operation),
                'Compte': ecriture.compte,
                'Num piece': ecriture.num_piece,
                'Reference': ecriture.ref_ecriture,
                'Tiers': ecriture.tiers || '',
                'Type compte': 'A',
                'Libellé': ecriture.libelle,
                'Montant ref': ecriture.montantref,
                'Montant devise': ecriture.montantdevise,
                'Type de pièce': 'OD',
                'Sens': ecriture.debit > 0 ? 'D' : 'C',
                'Devise': ecriture.devise,
                'Taux': ecriture.taux,
                'Montant Debit': ecriture.debit,
                'Montant credit': ecriture.credit,
                'Centre analytique': ecriture.centreanalytique || '',
                'Centre analytique 2': ecriture.centreanalytiquesecond || ''
            });
          }
    });

    return result;
  }

  exportSage1000() {
    if (!this.ecritures.length) {
      this.toastr.warning('Aucune écriture à exporter');
      return;
    }

    const data = this.prepareSage1000Data();
    this.excelService.exportRawData(data, 'sage1000_ecritures');
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
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ecriture);
      return acc;
    }, {});

    Object.keys(groupes).forEach(numPiece => {
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
        entete.libelle || ''
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
          montant
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
            montant
          ]);
        }

        numeroLigne++;

      });

    });

    return rows;
  }

  exportSageX3() {
    if (!this.ecritures.length) {
      this.toastr.warning(
        'Aucune écriture à exporter.'
      );
      return;
    }

    const rows = this.prepareSageX3Data();
    this.excelService.exportSageX3(rows,'sage_x3_ecritures');
  }

}