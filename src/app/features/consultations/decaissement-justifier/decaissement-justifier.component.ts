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
import { JustificatifPJService } from '../../PJ/service/justificatifpj.service';
import { PieceJointe } from '../../PJ/models/pj.model';
import { catchError, forkJoin, of } from 'rxjs';
import { JustificatifService } from '../../operations/service/justificatif.service';

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
  idjustificatifoperation: string;
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
    private justificatifpjService: JustificatifPJService,
    private justificatifservice: JustificatifService,
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
        // Charger les comptes de pièces jointes
        this.loadJustificatifsPiecesCounts();
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

  showPiecesJustificatifModal: boolean = false;
  selectedJustificatif: any = null;
  justificatifPiecesJointes: PieceJointe[] = [];
  justificatifPiecesCount: number = 0;
  totalJustificatifPiecesCount: number = 0;

  piecesJointesLoading: boolean = false;
  downloadingAll: boolean = false;
  piecesJustificativesCountMap: Map<string, number> = new Map();
  /**
   * Charge toutes les pièces jointes d'un justificatif
   */
  loadAllPiecesJointesJustificatif(idjustificatifoperation: string): void {
    this.piecesJointesLoading = true;
    this.justificatifpjService.getAll(idjustificatifoperation).subscribe({
      next: (res) => {
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
      error: (err) => {
        this.justificatifPiecesJointes = [];
        this.justificatifPiecesCount = 0;
        this.piecesJointesLoading = false;
        this.toastr.error('Erreur lors du chargement des pièces jointes');
      },
    });
  }

  /**
   * Télécharge une pièce jointe
   */
  downloadJustificatifPiece(piece: PieceJointe): void {
    this.justificatifpjService.downloadFile(piece.urlpiece).subscribe({
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

  /**
   * Télécharge toutes les pièces jointes d'un justificatif
   */
  downloadAllJustificatifFiles(): void {
    if (!this.selectedJustificatif) {
      this.toastr.error('Aucun justificatif sélectionné');
      return;
    }

    this.loading = true;
    this.justificatifpjService
      .downloadAllFiles(this.selectedJustificatif.idjustificatifoperation)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const filename = `justificatif_${this.selectedJustificatif!.codejustificatif || 'JUST'}_pieces_jointes.zip`;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastr.success(
            `${this.justificatifPiecesCount} fichier(s) téléchargé(s)`,
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur téléchargement ZIP:', err);
          this.toastr.error(err.error?.message);
          this.loading = false;
        },
      });
  }

  /**
   * Ouvre la modal des pièces jointes d'un justificatif
   */
  openPiecesJustificatifModal(justificatif: any): void {
    this.selectedJustificatif = justificatif;
    this.showPiecesJustificatifModal = true;
    document.body.style.overflow = 'hidden';
    this.loadAllPiecesJointesJustificatif(justificatif.idjustificatifoperation);
  }

  getPiecesCount(idjsutificatifoperation: string): number {
    return this.piecesJustificativesCountMap.get(idjsutificatifoperation) || 0;
  }

  /**
   * Ferme la modal des pièces jointes du justificatif
   */
  closePiecesJustificatifModal(): void {
    this.showPiecesJustificatifModal = false;
    this.selectedJustificatif = null;
    document.body.style.overflow = '';
  }

  loadJustificatifsPiecesCounts(): void {
    if (!this.op || this.op.length === 0) return;

    // 1. Collecter tous les IDs de justificatifs uniques
    const justificatifIds = new Set<string>();
    this.op.forEach((operation) => {
      operation.justificatifs.forEach((just) => {
        justificatifIds.add(just.idjustificatifoperation);
      });
    });

    if (justificatifIds.size === 0) return;

    // 2. Créer un observable pour chaque justificatif
    const requests = Array.from(justificatifIds).map((idjustificatif) =>
      this.justificatifpjService
        .getAll(idjustificatif)
        .pipe(catchError(() => of({ success: false, data: [] }))),
    );

    // 3. Exécuter toutes les requêtes en parallèle
    forkJoin(requests).subscribe({
      next: (responses) => {
        // 4. Mettre à jour la Map avec les résultats
        Array.from(justificatifIds).forEach((id, index) => {
          const count = responses[index].success
            ? responses[index].data.length
            : 0;
          this.piecesJustificativesCountMap.set(id, count);
        });
      },
      error: (err) => {
        console.error('Erreur chargement des comptes PJ:', err);
      },
    });
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

  // Formatage de la taille des fichiers
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printing: boolean = false;
  selectedOperationPJ: any = null; // Déjà présent dans votre code

  printDocumentJustif(operation: any) {
    if (!operation) {
      this.toastr.warning('Aucune opération sélectionnée');
      return;
    }

    this.printing = true;

    const id = operation.idoperation;
    this.justificatifservice
      .getdocJustificatif(id)
      .pipe(
        catchError((err) => {
          this.toastr.error('Erreur de génération du document');
          this.printing = false;
          return of(null);
        }),
      )
      .subscribe({
        next: (blob: Blob | null) => {
          this.printing = false;

          if (!blob) return;

          try {
            const url = window.URL.createObjectURL(blob);
            const win = window.open(url, '_blank');

            // Vérifier si l'ouverture a réussi
            if (!win) {
              this.toastr.error(
                "Impossible d'ouvrir la fenêtre. Vérifiez votre bloqueur de popups.",
              );
              window.URL.revokeObjectURL(url);
              return;
            }

            // Nettoyer l'URL après un délai
            win.onload = () => {
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
              }, 100);
            };
          } catch (error) {
            this.toastr.error("Erreur lors de l'ouverture du document");
          }
        },
      });
  }
}
