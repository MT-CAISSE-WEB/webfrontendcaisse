import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ConsultationOpService } from '../services/operations.service';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';

interface Operation {
  idoperation: string;
  description: string;
  typeoperation: string;
  montant: number;
  montant_ref: number;
  piece: string;
}

interface Caisse {
  idcaisse: string;
  codecaisse: string;
  caisse: string;
  devise: string;
  solde_ouverture: number;
  solde_fermeture: number;
  operations: Operation[];
}

interface OperationData {
  date: string;
  site: string;
  caisses: Caisse[];
}

interface User {
  idutilisateur: string;
  prenom: string;
  nom: string;
  typeentitesociete: string;
  idsite: string;
  devise_ref_code: string;
}

@Component({
  selector: 'app-operation-periode',
  templateUrl: './operation-periode.component.html',
  styleUrls: ['./operation-periode.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class OperationPeriodeComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private consultationService = inject(ConsultationOpService);
  private caisseUserService = inject(AffectationCaisseService);

  // Data
  title = 'Journal de caisse';
  op: OperationData[] = [];
  caissesUser: AffectationCaisseModel[] = [];
  loading = false;
  msgErros = '';

  // Modal states
  showCriteriaModal = false;
  showPrintModal = false;

  // Forms - Initialisés dans le constructeur
  searchForm: FormGroup;
  printForm: FormGroup;

  // User
  get user(): User {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  constructor() {
    // Initialisation explicite des formulaires
    this.searchForm = this.createSearchForm();
    this.printForm = this.createPrintForm();
  }

  ngOnInit(): void {
    this.loadCaissesUser();
  }

  // ============================================
  // FORM CREATION
  // ============================================
  private createSearchForm(): FormGroup {
    return this.fb.group({
      caisse: [''],
      datedebut: ['', Validators.required],
      datefin: ['', Validators.required],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite],
    });
  }

  private createPrintForm(): FormGroup {
    return this.fb.group({
      caisse: [''],
      datedebut: ['', Validators.required],
      datefin: ['', Validators.required],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite],
    });
  }

  private getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ============================================
  // MODAL MANAGEMENT (100% CSS)
  // ============================================
  openCriteriaModal(): void {
    this.showCriteriaModal = true;
  }

  closeCriteriaModal(): void {
    this.showCriteriaModal = false;
  }

  openPrintModal(): void {
    this.showPrintModal = true;
  }

  closePrintModal(): void {
    this.showPrintModal = false;
  }

  // ============================================
  // CAISSES USER
  // ============================================
  private loadCaissesUser(): void {
    this.loading = true;
    this.caisseUserService
      .getCaisseByUser(this.user.idutilisateur ?? null)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.caissesUser = res.data || [];
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.toastr.error('Erreur de chargement des caisses');
        },
      });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  getTotalOperations(item: OperationData): number {
    if (!item?.caisses) return 0;
    return item.caisses.reduce(
      (total, caisse) => total + (caisse.operations?.length || 0),
      0,
    );
  }

  isValidField(field: string, form: FormGroup = this.searchForm): string {
    const control = form.get(field);
    if (!control) return '';

    if (control.valid && control.touched) return 'is-valid';
    if (control.invalid && control.touched) return 'is-invalid';
    return '';
  }

  formatCFA(amount: number | null | undefined): string {
    if (amount == null) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatNumber(amount: number | string | null | undefined): string {
    if (amount == null || amount === '') return '';
    const value = Number(amount);
    return isNaN(value)
      ? ''
      : value.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }

  // ============================================
  // ACTIONS
  // ============================================
  refreshData(): void {
    if (this.searchForm.valid) {
      this.onSearchSubmit();
    } else {
      this.toastr.warning(MESSAGE_CHAMPS_OBLIGATOIRE);
    }
  }

  onSearchSubmit(): void {
    if (this.searchForm.invalid) {
      this.markAllAsTouched(this.searchForm);
      this.toastr.warning(MESSAGE_CHAMPS_OBLIGATOIRE);
      return;
    }

    this.loading = true;
    this.consultationService
      .getJournalpaiement(this.searchForm.value)
      .subscribe({
        next: (res) => {
          this.op = res.data.data || [];
          this.loading = false;
          this.closeCriteriaModal();

          if (this.op.length === 0) {
            this.toastr.info('Aucune opération trouvée pour cette période');
          }
        },
        error: (err) => {
          this.loading = false;
          this.op = [];
          this.toastr.error(
            err?.error?.message || 'Erreur lors de la recherche',
          );
        },
      });
  }

  onPrintSubmit(): void {
    if (this.printForm.invalid) {
      this.markAllAsTouched(this.printForm);
      this.toastr.warning(MESSAGE_CHAMPS_OBLIGATOIRE);
      return;
    }

    this.loading = true;
    const data = {
      ...this.printForm.value,
      utilisateur: `${this.user.prenom} ${this.user.nom}`,
    };

    this.consultationService.printJournalCaisse(data).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.loading = false;
        this.closePrintModal();
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error("Erreur d'impression du journal de caisse");
      },
    });
  }

  // ============================================
  // HELPERS
  // ============================================
  private markAllAsTouched(form: FormGroup): void {
    Object.values(form.controls).forEach((control: any) => {
      control.markAsTouched();
      if (control.controls) {
        this.markAllAsTouched(control);
      }
    });
  }

  showResetConfirmationModal: boolean = false;
  resetAll(): void {
    this.showResetConfirmationModal = true; // Ajoutez cette propriété dans votre classe
  }

  confirmReset(): void {
    this.showResetConfirmationModal = false;
    this.performReset();
  }

  private performReset(): void {
    this.loading = true;
    this.searchForm = this.createSearchForm();
    this.printForm = this.createPrintForm();
    this.op = [];
    this.msgErros = '';
    this.showCriteriaModal = false;
    this.showPrintModal = false;
    this.loading = false;
    this.toastr.success('Interface réinitialisée avec succès');
  }
}
