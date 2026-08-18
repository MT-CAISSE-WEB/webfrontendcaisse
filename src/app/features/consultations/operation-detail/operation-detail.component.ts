import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { ConsultationOpService } from '../services/operations.service';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { CustomFieldSelectComponent } from '../../../_core/custom/custom-field-select/custom-field-select.component';
import {
  COLUMNS_CENTRE,
  COLUMNS_NATURE,
  COLUMNS_TIERS,
} from '../../../_core/constantes/tableau.data';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { ExcelService } from '../../../_core/services/exportExcel.service';
import { PdfService } from '../../../_core/services/pdf.service';

interface OperationDetail {
  site: string;
  piece: string;
  date_operation: string;
  nature_operation: string;
  centrelibelle: string;
  tiers: string;
  montantligne: number;
  devise: string;
}

interface User {
  typeentitesociete: string;
  idsite: string;
}

@Component({
  selector: 'app-operation-detail',
  templateUrl: './operation-detail.component.html',
  styleUrls: ['./operation-detail.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFieldSelectComponent,
  ],
})
export class OperationDetailComponent implements OnInit {
  title = 'Détail des opérations';
  op: OperationDetail[] = [];
  loading = false;
  msgErros = '';

  // Form
  searchForm: FormGroup;

  // Select data
  columnstiers: any[] = COLUMNS_TIERS;
  columnsnature: any[] = COLUMNS_NATURE;
  columnscentre: any[] = COLUMNS_CENTRE;

  // Data
  tiers: tiersModel[] = [];
  filteredTiers: tiersModel[] = [];
  natureoperations: natureoperationModel[] = [];
  natureoperationsFiltered: natureoperationModel[] = [];
  centres: centreanalytiqueModel[] = [];
  centresFiltered: centreanalytiqueModel[] = [];

  // Pagination
  currentPage: number = 1;
  limit = 20;
  totalPages: number = 1;

  // Selected items
  selectedTiers: any = null;
  selectedNature: any = null;
  selectedCentre: any = null;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private centreanalytiqueservice: CentreAnalytiqueService,
    private natureoperationservice: NatureoperationService,
    private tiersservice: TiersService,
    private service: ConsultationOpService,
    private caisseuserservice: AffectationCaisseService,
    private excelservice: ExcelService,
    private pdfservice: PdfService,
  ) {
    this.searchForm = this.createSearchForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ============================================
  // FORM MANAGEMENT
  // ============================================
  private createSearchForm(): FormGroup {
    return this.fb.group({
      numero: [''],
      montantmin: [''],
      montantmax: [''],
      nature: [''],
      centre: [''],
      tiers: [''],
      datedebut: [''],
      datefin: [''],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite],
    });
  }

  resetForm(): void {
    this.searchForm = this.createSearchForm();
    this.op = [];
    this.currentPage = 1;
    this.toastr.success('Formulaire réinitialisé');
  }

  // ============================================
  // DATA LOADING
  // ============================================
  private loadInitialData(): void {
    this.loading = true;

    // Load all data in parallel
    Promise.all([
      this.tiersservice.getAll().toPromise(),
      this.natureoperationservice.getAll().toPromise(),
      this.centreanalytiqueservice.getAll().toPromise(),
    ])
      .then(([tiersRes, natureRes, centreRes]) => {
        if (tiersRes?.success) {
          this.tiers = tiersRes.data;
          this.filteredTiers = [...this.tiers];
        }
        if (natureRes?.success) {
          this.natureoperations = natureRes.data;
          this.natureoperationsFiltered = [...this.natureoperations];
        }
        if (centreRes?.success) {
          this.centres = centreRes.data;
          this.centresFiltered = [...this.centres];
        }
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.toastr.error('Erreur de chargement des données initiales');
      });
  }

  // ============================================
  // SEARCH METHODS
  // ============================================
  searchTiers(event: any): void {
    const search = event.search?.toLowerCase() || '';
    this.filteredTiers = this.tiers.filter(
      (t) =>
        t.designation?.toLowerCase().includes(search) ||
        t.codetiers?.toLowerCase().includes(search),
    );
  }

  searchNature(event: any): void {
    const search = event.search?.toLowerCase() || '';
    this.natureoperationsFiltered = this.natureoperations.filter(
      (t) =>
        t.libelle?.toLowerCase().includes(search) ||
        t.codenature?.toLowerCase().includes(search),
    );
  }

  searchCentre(event: any): void {
    const search = event.search?.toLowerCase() || '';
    this.centresFiltered = this.centres.filter(
      (t) =>
        t.codecentreanalytique?.toLowerCase().includes(search) ||
        t.libelle?.toLowerCase().includes(search),
    );
  }

  // ============================================
  // SELECTION HANDLERS
  // ============================================
  onSelectTiers(tiers: any): void {
    this.selectedTiers = tiers;
  }

  onSelectNature(nature: any): void {
    this.selectedNature = nature;
  }

  onSelectCentre(centre: any): void {
    this.selectedCentre = centre;
  }

  // ============================================
  // MAIN SEARCH
  // ============================================
  onSubmit(): void {
    if (this.searchForm.invalid) {
      this.markAllAsTouched();
      this.toastr.warning(MESSAGE_CHAMPS_OBLIGATOIRE);
      return;
    }

    this.loading = true;
    const formValue = this.searchForm.value;

    this.service.getDetailoperation(formValue).subscribe({
      next: (res) => {
        this.op = res.data || [];
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.op.length / this.limit);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.op = [];
        this.toastr.error(err?.error?.message || 'Erreur lors de la recherche');
      },
    });
  }

  // ============================================
  // PAGINATION
  // ============================================
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  private markAllAsTouched(): void {
    Object.values(this.searchForm.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouchedForGroup(control);
      }
    });
  }

  private markAllAsTouchedForGroup(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouchedForGroup(control);
      }
    });
  }

  get user(): User {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatCFA(montant: number | null | undefined): string {
    if (montant == null) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  }

  Math = Math;
  formatNumber(montant: number | string | null | undefined): string {
    if (montant === null || montant === undefined || montant === '') return '';
    const valeur = Number(montant);
    return isNaN(valeur)
      ? ''
      : valeur.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }

  /**
   * Exporte les données vers un fichier Excel
   */
  exportExcel(): void {
    if (!this.op || this.op.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    const columns = [
      { header: 'Site', field: 'site' },
      { header: 'N° Pièce', field: 'piece' },
      { header: 'Date opération', field: 'date_operation' },
      { header: 'Nature', field: 'nature_operation' },
      { header: 'Centre analytique', field: 'centrelibelle' },
      { header: 'Tiers', field: 'tiers' },
      { header: 'Montant', field: 'montantligne' },
      { header: 'Devise', field: 'devise' },
    ];

    // Vous pouvez utiliser exportToExcel ou exportRawData selon vos besoins
    this.excelservice.exportToExcel(this.op, columns, 'Operations_detail');
    this.toastr.success('Export Excel effectué avec succès');
  }

  /**
   * Exporte les données vers un fichier PDF
   */
  exportPDF(): void {
    if (!this.op || this.op.length === 0) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    const columns = [
      { header: 'Site', field: 'site' },
      { header: 'N° Pièce', field: 'piece' },
      { header: 'Date opération', field: 'date_operation' },
      { header: 'Nature', field: 'nature_operation' },
      { header: 'Centre analytique', field: 'centrelibelle' },
      { header: 'Tiers', field: 'tiers' },
      { header: 'Montant', field: 'montantligne' },
      { header: 'Devise', field: 'devise' },
    ];

    // Utilisation de la méthode standard
    this.pdfservice.exportCustomPDF(
      this.op,
      columns,
      'Operations_detail',
      'Détail des opérations',
    );
    this.toastr.success('Export PDF effectué avec succès');
  }
}
