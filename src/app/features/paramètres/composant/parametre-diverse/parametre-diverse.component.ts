import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../../_core/constantes/messages.contantes';
import { MotifService } from '../../services/motif.service';

@Component({
  selector: 'app-parametre-diverse',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './parametre-diverse.component.html',
  styleUrl: './parametre-diverse.component.css',
})
export class ParametreDiverseComponent implements OnInit {
  motifs: any[] = [];
  loading = false;
  msgErros = '';
  actionModal: 'create' | 'update' = 'create';
  motifForm!: FormGroup;
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  titleMsg = '';
  msgSup = '';
  selectedItem: any;

  traitementCaisseActif: boolean = true;
  traitementSoldeActif: boolean = false;

  constructor(
    private fb: FormBuilder,
    private motifService: MotifService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMotifs();
  }

  initForm() {
    this.motifForm = this.fb.group({
      idmotif: [null],
      codemotif: ['', Validators.required],
      libellemotif: ['', Validators.required],
    });
  }

  loadMotifs() {
    this.loading = true;

    this.motifService
      .getAll({ page: this.currentPage, limit: this.limit })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // ✅ PaginationModel a la structure: { page, limit, total, totalPages, data }
            this.motifs = res.data.data || []; // Le tableau des motifs
            this.totalPages = res.data.totalPages || 1; // Nombre total de pages
            this.currentPage = res.data.page || 1; // Page courante
          } else {
            this.motifs = [];
            this.totalPages = 1;
          }
          this.loading = false;
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Erreur de chargement');
          this.loading = false;
          this.motifs = [];
          this.totalPages = 1;
        },
      });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadMotifs();
  }

  modalCreate() {
    this.actionModal = 'create';
    this.motifForm.reset();
  }

  modalUpdate(item: any) {
    this.actionModal = 'update';
    this.selectedItem = item;
    this.motifForm.patchValue(item);
  }

  onSubmit() {
    if (this.motifForm.invalid) {
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      this.toastr.warning(this.msgErros);
      return;
    }
    const data = this.motifForm.value;
    // this.selectedItem.idmotif,

    if (this.actionModal === 'create') {
      this.motifService.create(data).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Motif créé');
            this.loadMotifs();
            this.closeModal('showModal');
          }
        },
        error: (err) =>
          this.toastr.error(err.error.message ?? 'Erreur création'),
      });
    } else {
      this.motifService.update(data).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Motif modifié');
            this.loadMotifs();
            this.closeModal('showModal');
          }
        },
        error: () => this.toastr.error('Erreur modification'),
      });
    }
  }

  modalDelete(item: any) {
    this.selectedItem = item;
    this.titleMsg = 'Supprimer le motif';
    this.msgSup = 'Voulez-vous vraiment supprimer ce motif ?';
  }

  deleteConfirmed() {
    this.motifService.delete(this.selectedItem.idmotif).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Motif supprimé');
          this.loadMotifs();
          this.closeModal('deleteOrder');
        }
      },
      error: () => this.toastr.error('Erreur suppression'),
    });
  }

  private closeModal(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const modal = (window as any).bootstrap?.Modal?.getInstance(el);
      if (modal) modal.hide();
    }
  }

  toggleTraitement(type: string) {
    if (type === 'caisse') {
      this.traitementCaisseActif = !this.traitementCaisseActif;
      // appel API si besoin
    } else if (type === 'solde') {
      this.traitementSoldeActif = !this.traitementSoldeActif;
    }
  }

  desactiverToutTraitements() {
    this.traitementCaisseActif = false;
    this.traitementSoldeActif = false;
  }
}
