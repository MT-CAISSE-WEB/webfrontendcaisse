import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConsultationDecaissementaj } from '../services/decaissementaj.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { ToastrService } from 'ngx-toastr';

interface TypeOperation {
  codecaisse: string;
  caisse: string;
  codtypeoperation: string;
  montant: number;
  montantref: number;
  codedevise: string;
}

interface LigneOperation {
  libellenature: string;
  libellecentre: string;
  designationtiers: string;
  montantoperation: number;
}

interface JustificatifDetail {
  libellenature: string;
  libellecentre: string;
  designationtiers: string;
  montantdetail: number;
}

interface Justificatif {
  codejustificatif: string;
  date: string;
  montantjustificatif: number;
  codedevise: string;
  details: JustificatifDetail[];
}

interface Operation {
  codeoperation: string;
  dateoperation: string;
  codedevise: string;
  typeOperations: TypeOperation[];
  lignesOperation: LigneOperation[];
  justificatifs: Justificatif[];
}

interface User {
  devise_ref_code: string;
}

@Component({
  selector: 'app-decaissement-justifier',
  templateUrl: './decaissement-justifier.component.html',
  styleUrls: ['./decaissement-justifier.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class DecaissementJustifierComponent implements OnInit {
  title = 'Consultation des justificatifs';
  op: Operation[] = [];
  loading = false;
  msgErros = '';

  // Form
  searchForm: FormGroup;

  // Modal state
  showCriteriaModal = false;

  // Data
  tiers: tiersModel[] = [];
  activeAccordion: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: ConsultationDecaissementaj,
    private tiersservice: TiersService,
    private toastr: ToastrService,
  ) {
    this.searchForm = this.createSearchForm();
  }

  currentPage: number = 1;
  ngOnInit(): void {
    this.loadInitialData();
  }

  // ============================================
  // FORM MANAGEMENT
  // ============================================
  private createSearchForm(): FormGroup {
    return this.fb.group({
      typeoperation: ['decaissementaj'],
      tiers: [null],
      codeoperation: [null],
      datedebut: [null],
      datefin: [null],
    });
  }

  resetForm(): void {
    this.searchForm = this.createSearchForm();
    this.op = [];
    this.currentPage = 1;
    this.toastr.success('Formulaire réinitialisé');
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
  // ACCORDION MANAGEMENT
  // ============================================
  toggleAccordion(index: number): void {
    this.activeAccordion = this.activeAccordion === index ? null : index;
  }

  // ============================================
  // DATA LOADING
  // ============================================
  private loadInitialData(): void {
    this.loading = true;
    this.tiersservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.tiers = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Erreur de chargement des tiers');
      },
    });
  }

  // ============================================
  // SEARCH
  // ============================================
  onSubmit(): void {
    if (this.searchForm.invalid) {
      this.markAllAsTouched();
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      this.toastr.warning(this.msgErros);
      return;
    }

    this.loading = true;
    const formValue = this.searchForm.value;

    this.service.getAlldecaissemenaj(formValue).subscribe({
      next: (res) => {
        this.op = res.data || [];
        this.loading = false;
        this.closeCriteriaModal();
      },
      error: (err) => {
        this.loading = false;
        this.op = [];
        this.toastr.error(err?.error?.message || 'Erreur lors de la recherche');
      },
    });
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

  formatNumber(montant: number | string): string {
    if (montant === null || montant === undefined || montant === '') return '';
    const valeur = Number(montant);
    return isNaN(valeur)
      ? ''
      : valeur.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }
}
