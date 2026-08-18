import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { ConsultationOpService } from '../services/operations.service';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';
import { ExcelService } from '../../../_core/services/exportExcel.service';

interface CaisseInfo {
  idcaisse: string;
  code: string;
  libelle: string;
}

interface Soldes {
  ouverture: number;
  fermeture: number;
  physique: number;
  ecart: number;
}

interface Validation {
  date: string;
}

interface ClotureItem {
  date: string;
  caisse: CaisseInfo;
  devise: string;
  soldes: Soldes;
  statut: string;
  validation: Validation;
}

interface User {
  idutilisateur: string;
  idsite: string;
}

@Component({
  selector: 'app-cloture-caisse',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './cloture-caisse.component.html',
  styleUrls: ['./cloture-caisse.component.css'],
})
export class ClotureCaisseComponent implements OnInit {
  title = 'État clôture caisse';
  op: ClotureItem[] = [];
  loading = false;
  msgErros = '';

  // Modal state
  showCriteriaModal = false;

  // Form
  searchForm: FormGroup;

  // Data
  caissesUser: AffectationCaisseModel[] = [];

  // Totals
  totalFermeture = 0;
  totalPhysique = 0;
  totalEcart = 0;

  constructor(
    private fb: FormBuilder,
    private service: ConsultationOpService,
    private caisseuserservice: AffectationCaisseService,
    private toastr: ToastrService,
    private excelService: ExcelService,
  ) {
    this.searchForm = this.createSearchForm();
  }

  ngOnInit(): void {
    this.loadAllCaisses();
  }

  // ============================================
  // FORM MANAGEMENT
  // ============================================
  private createSearchForm(): FormGroup {
    return this.fb.group({
      idcaisse: ['', Validators.required],
      datedebut: ['', Validators.required],
      datefin: ['', Validators.required],
    });
  }

  // ============================================
  // MODAL MANAGEMENT
  // ============================================
  openCriteriaModal(): void {
    this.showCriteriaModal = true;
  }

  closeCriteriaModal(): void {
    this.showCriteriaModal = false;
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadAllCaisses(): void {
    this.loading = true;
    const allactif = { page: 1, limit: 1000, search: '', actif: 1 };
    this.caisseuserservice.getAll(allactif).subscribe({
      next: (res) => {
        if (res.success) {
          this.caissesUser = res.data.data || [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(
          err.error.message ?? 'Erreur chargement caisses utilisateur',
        );
      },
    });
  }

  // getCaisseUser(): void {
  //   this.loading = true;
  //   this.caisseuserservice
  //     .getCaisseByUser(this.user.idutilisateur ?? null)
  //     .subscribe({
  //       next: (res) => {
  //         if (res.success) {
  //           this.caissesUser = res.data || [];
  //         }
  //         this.loading = false;
  //       },
  //       error: () => {
  //         this.loading = false;
  //         this.toastr.error('Erreur chargement caisses utilisateur');
  //       },
  //     });
  // }

  search(data: any): void {
    this.loading = true;
    this.service.getEtatcloture(data).subscribe({
      next: (res) => {
        if (res.success) {
          this.op = res.data.data || [];
          console.log('Etat clôture caisse:', this.op);
          this.calculateTotals();
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error('Erreur', err);
      },
    });
  }

  // ============================================
  // TOTAUX CALCULATION
  // ============================================
  calculateTotals(): void {
    this.totalFermeture = this.op.reduce(
      (sum: number, item: ClotureItem) => sum + (item.soldes.fermeture || 0),
      0,
    );

    this.totalPhysique = this.op.reduce(
      (sum: number, item: ClotureItem) => sum + (item.soldes.physique || 0),
      0,
    );

    this.totalEcart = this.op.reduce(
      (sum: number, item: ClotureItem) =>
        sum + ((item.soldes.physique || 0) - (item.soldes.fermeture || 0)),
      0,
    );
  }

  // ============================================
  // SUBMIT
  // ============================================
  onSubmit(): void {
    const controls = this.searchForm.controls;
    if (this.searchForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    const formValue = this.searchForm.value;
    this.closeCriteriaModal();
    this.search(formValue);
  }

  // ============================================
  // EXPORT
  // ============================================
  onExportExcel(): void {
    if (!this.hasData()) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }
    this.excelService.exportToExcel(
      this.op,
      this.getExcelColumns(),
      'etat_cloture',
    );
  }

  onPrintPDF(): void {
    if (!this.hasData()) {
      this.toastr.warning('Aucune donnée à imprimer');
      return;
    }
    this.printJournalCaisse();
  }

  printJournalCaisse(): void {
    const donnees = {
      idcaisse: this.searchForm.get('idcaisse')?.value || null,
      datedebut: this.searchForm.get('datedebut')?.value || null,
      datefin: this.searchForm.get('datefin')?.value || null,
      idsite: this.user.idsite || null,
    };

    this.service.printEtatcloture(donnees).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error("Erreur d'impression de l'état de clôture");
      },
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
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

  hasData(): boolean {
    return Array.isArray(this.op) && this.op.length > 0;
  }

  private getExcelColumns(): any[] {
    return [
      { header: 'Date', field: 'date' },
      { header: 'Caisse', field: 'caisse.libelle' },
      { header: 'Code Caisse', field: 'caisse.codecaisse' },
      { header: 'Devise', field: 'devise' },
      { header: 'Solde Ouverture', field: 'soldes.ouverture' },
      { header: 'Solde Fermeture', field: 'soldes.fermeture' },
      { header: 'Montant Physique', field: 'soldes.physique' },
      { header: 'Écart', field: 'soldes.ecart' },
      { header: 'Statut', field: 'statut' },
      { header: 'Date clôture', field: 'validation.date' },
    ];
  }
}
