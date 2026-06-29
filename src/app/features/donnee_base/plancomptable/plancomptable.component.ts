import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { plancomptableModel } from '../models/plancomptable.model';
import { societeModel } from '../models/societe.model';
import { PlancomptableService } from '../services/plancomptable.service';
import { CommonModule } from '@angular/common';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ADD-INS
declare var $: any;

@Component({
  selector: 'app-plancomptable',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './plancomptable.component.html',
  styleUrl: './plancomptable.component.css',
})
export class PlancomptableComponent implements OnInit {
  title = 'Plan comptable';
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  comptes: plancomptableModel[] = [];
  societes: societeModel[] = [];
  compte: plancomptableModel = new plancomptableModel();
  msgErros: string = '';
  loading: Boolean = false;
  plancomptableForm: FormGroup = this.fb.group({});
  ImportForm: FormGroup = this.fb.group({}); // ✅ Déclaration

  //Faire le check selection **********
  objectsSelected: plancomptableModel[] = [];
  selectedItems: any[] = [];
  checkAllRow: any;
  error: string = '';

  //Changement titre modal
  actionModal: string = 'create';

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  //Element à supprimer
  deleteCompte: any = null;

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;

  // Variables pour l'import
  selectedFile: File | null = null;
  fileContent: any[] = [];
  fileHeaders: string[] = [];
  uploadProgress: number = 0;
  uploadSpeed: string = '';
  successMessage: string = '';
  importErrors: string[] = [];
  isDragover: boolean = false;

  constructor(
    private plancomptableservice: PlancomptableService,
    private toastr: ToastrService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    //Afficher tous les comptes
    this.getAllComptes();
    //Initialisation du formulaire
    this.initForm();
    // ✅ Initialisation du formulaire d'import
    this.initImportForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('ce compte');
    this.titleMsg = TITLE_DELETE;
  }

  // ✅ Création du formulaire d'importation
  initImportForm(): void {
    this.ImportForm = this.fb.group({
      file: [null, [Validators.required]],
    });
  }

  getAllComptes() {
    this.plancomptableservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.comptes = res.data;
          this.filteredData = [...this.comptes];
          this.updatePagination();
        }
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Création du formulaire
  initForm(): void {
    this.plancomptableForm = this.fb.group({
      numcompte: ['', [Validators.required]],
      libelle: ['', [Validators.required]],
      ventillable: [false],
      auxiliaire: [false],
      suivibudgetaire: [true],
      suivibudgetairemensuel: [false],
      idsociete: [this.user.idsociete, [Validators.required]],
      actif: [true],
      createdby: [this.user.prenom + ' ' + this.user.nom],
      updatedby: [this.user.prenom + ' ' + this.user.nom],
    });
  }

  get form() {
    return this.plancomptableForm.controls;
  }

  dispatchComptes(_object: plancomptableModel) {
    const status = _object.actif === 1;
    this.plancomptableForm.patchValue({
      numcompte: _object.numcompte,
      libelle: _object.libelle,
      ventillable: _object.ventillable,
      auxiliaire: _object.auxiliaire,
      suivibudgetaire: _object.suivibudgetaire,
      suivibudgetairemensuel: _object.suivibudgetairemensuel,
      idsociete: _object.idsociete,
      actif: status,
    });
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

  isChecked(id: string): boolean {
    return this.selectedItems.some((x) => x.idcompte === id);
  }

  handleSelectOne(item: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedItems.some((x) => x.idcompte === item.idcompte)) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        (x) => x.idcompte !== item.idcompte,
      );
    }
  }

  handleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checkAllRow = checked;

    if (checked) {
      this.objectsSelected = [...this.paginatedData];
    } else {
      this.objectsSelected = [];
    }
  }

  //Soumission du formulaire
  onSubmit() {
    this.msgErros = '';
    const controls = this.plancomptableForm.controls;
    if (this.plancomptableForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    const formValue = this.plancomptableForm.value;

    const _comptes: plancomptableModel = {
      ...this.compte,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
      ventillable: formValue.ventillable ? 1 : 0,
      auxiliaire: formValue.auxiliaire ? 1 : 0,
      suivibudgetaire: formValue.suivibudgetaire ? 1 : 0,
      suivibudgetairemensuel: formValue.suivibudgetairemensuel ? 1 : 0,
    };

    if (this.actionModal == 'create') this.create(_comptes);
    else this.update(_comptes);
  }

  create(_comptes: plancomptableModel) {
    const { idcompte, ...dataToSend } = _comptes;
    this.loading = true;
    this.plancomptableservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllComptes();
          this.toastr.success('Fiche créée');
        } else {
          this.error = 'Erreur de création';
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Echec de création';
        this.loading = false;
        this.toastr.error(err);
      },
    });
  }

  update(_comptes: plancomptableModel) {
    this.plancomptableservice.update(_comptes).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllComptes();
          this.toastr.success('Fiche modifée');
        } else {
          this.error = 'Erreur de modification';
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Echec de modification';
        this.loading = false;
        this.toastr.error(this.error);
      },
    });
  }

  closeModal(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      // ✅ Retirer la classe show et aria-hidden
      modalEl.classList.remove('show');
      modalEl.setAttribute('aria-hidden', 'true');
      modalEl.style.display = 'none';

      // ✅ Restaurer le focus sur l'élément qui a déclenché la modal
      const triggerElement = document.querySelector(
        '[data-bs-target="#' + modalId + '"]',
      );
      if (triggerElement) {
        (triggerElement as HTMLElement).focus();
      }
    }

    // Supprimer les backdrops
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());

    // Réactiver le scroll du body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  modalCreate() {
    this.actionModal = 'create';
    this.initForm();
  }

  modalview(_object: plancomptableModel) {
    this.compte = _object;
    this.actionModal = 'view';
    this.plancomptableForm.reset();
    this.dispatchComptes(_object);
  }

  modalUpdate(_object: plancomptableModel) {
    this.compte = _object;
    this.actionModal = 'update';
    this.plancomptableForm.reset();
    this.dispatchComptes(_object);
  }

  modalDelete(item: plancomptableModel) {
    this.deleteCompte = item;
  }

  deleteConfirmed() {
    if (!this.deleteCompte) return;
    this.plancomptableservice.delete(this.deleteCompte.idcompte).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.toastr.success('Fiche supprimée');
          this.getAllComptes();
        } else {
          this.error = 'Erreur de Suppression';
        }
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Erreur lors de la suppression');
        this.error = 'Suppression échec';
        this.loading = false;
      },
    });
  }

  deleteMultiple() {
    for (let i = 0; i < this.objectsSelected.length; i++) {
      this.plancomptableservice
        .delete(this.objectsSelected[i].idcompte)
        .subscribe({});
    }
    this.toastr.success('Fiches supprimées');
    this.getAllComptes();
  }

  // Méthode d'import
  submitImportFile(): void {
    if (!this.selectedFile) {
      this.toastr.warning('Veuillez sélectionner un fichier');
      return;
    }

    // Créer un FormData pour l'envoi du fichier
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('idsociete', this.user.idsociete);
    formData.append('createdby', this.user.prenom + ' ' + this.user.nom);

    this.uploadProgress = 0;
    this.importErrors = [];

    // Simuler la progression pour l'UX
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.floor(Math.random() * 8) + 2;
        if (this.uploadProgress > 90) {
          this.uploadProgress = 90;
        }
      }
    }, 300);

    // Envoyer le fichier au backend
    this.plancomptableservice.importPlanComptable(formData).subscribe({
      next: (res) => {
        this.uploadProgress = 100;
        clearInterval(progressInterval);
        this.successMessage = `${this.fileContent.length || 0} ligne(s) importée(s) avec succès !`;
        this.toastr.success('Import terminé avec succès');
        this.getAllComptes();

        // Réinitialiser après 2 secondes
        setTimeout(() => {
          this.uploadProgress = 0;
          this.selectedFile = null;
          this.fileContent = [];
          this.fileHeaders = [];
          this.successMessage = '';
          this.ImportForm.reset();

          const fileInput = document.getElementById(
            'fileInput',
          ) as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }

          this.closeModal('importcsv');
        }, 2500);
      },
      error: (err) => {
        this.uploadProgress = 0;
        clearInterval(progressInterval);
        this.importErrors = [
          err.error?.message || "Erreur lors de l'import du fichier",
        ];
        this.toastr.error(err.error?.message || "Erreur lors de l'import");
        console.error('Import error:', err);
      },
    });
  }

  // Méthode pour l'import via le bouton existant
  importPlanComptable(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      this.previewFile(file);
      this.ImportForm.patchValue({ file });
      this.ImportForm.get('file')?.updateValueAndValidity();
    }
  }

  // 🔎 Filtrer
  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    this.filteredData = this.comptes.filter(
      (item) =>
        item.numcompte?.toLowerCase().includes(term) ||
        item.libelle?.toLowerCase().includes(term),
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  // 📄 Pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedData = this.filteredData.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  actualiser(): void {
    this.getAllComptes();
  }

  exportData = {
    debut: null,
    fin: null,
    format: 'excel',
  };

  exporter() {
    this.plancomptableservice.exportComptes(this.exportData).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          this.exportData.format === 'pdf' ? 'comptes.pdf' : 'comptes.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Erreur export');
      },
    });
  }

  // Méthodes pour l'aperçu du fichier
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.previewFile(file);
      this.ImportForm.patchValue({ file });
      this.ImportForm.get('file')?.updateValueAndValidity();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragover = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedFile = file;
      this.previewFile(file);
      this.ImportForm.patchValue({ file });
      this.ImportForm.get('file')?.updateValueAndValidity();
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileContent = [];
    this.fileHeaders = [];
    this.uploadProgress = 0;
    this.ImportForm.reset();

    // ✅ Réinitialiser l'input file correctement
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Seule valeur autorisée pour un input file
    }
  }

  previewFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter((line) => line.trim());
      if (lines.length > 0) {
        // Détection automatique du séparateur
        const firstLine = lines[0];
        let delimiter = '\t';
        if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes(',')) delimiter = ',';
        else if (firstLine.includes('\t')) delimiter = '\t';

        this.fileHeaders = lines[0].split(delimiter).map((h) => h.trim());
        this.fileContent = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => line.split(delimiter).map((c) => c.trim()));
      }
    };
    reader.readAsText(file);
  }

  getFileIconClass(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv':
        return 'ri-file-excel-2-line';
      case 'xls':
      case 'xlsx':
        return 'ri-file-excel-2-line';
      case 'pdf':
        return 'ri-file-pdf-line';
      default:
        return 'ri-file-text-line';
    }
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toUpperCase() || '';
  }

  formatFileSize(size: number): string {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getProgressStatus(): string {
    if (this.uploadProgress < 30) return 'Lecture du fichier...';
    if (this.uploadProgress < 60) return 'Traitement des données...';
    if (this.uploadProgress < 90) return 'Validation...';
    return 'Finalisation...';
  }

  downloadCsvTemplate(): void {
    const delimiter = ';';
    const csvContent = `compte${delimiter}libelle${delimiter}ventillable${delimiter}auxiliaire${delimiter}suivibudgetaire${delimiter}suivibudgetairemensuel${delimiter}statut
XXXXXX${delimiter}Exemple compte${delimiter}0${delimiter}0${delimiter}0${delimiter}0${delimiter}1
XXXXXX${delimiter}Exemple compte${delimiter}0${delimiter}0${delimiter}0${delimiter}0${delimiter}1
XXXXXX${delimiter}Exemple compte${delimiter}0${delimiter}0${delimiter}0${delimiter}0${delimiter}1`;

    // BOM UTF-8 pour compatibilité Excel
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_plan_de_comptes.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.toastr.success('Modèle CSV téléchargé');
  }
}
