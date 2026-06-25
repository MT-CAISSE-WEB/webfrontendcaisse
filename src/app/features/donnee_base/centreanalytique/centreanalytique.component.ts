import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { centreanalytiqueModel } from '../models/centreanalytique.model';
import { CentreAnalytiqueService } from '../services/centreanalytique.service';
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
  selector: 'app-centreanalytique',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './centreanalytique.component.html',
  styleUrls: ['./centreanalytique.component.css'],
})
export class CentreanalytiqueComponent implements OnInit {
  title = 'Centres analytiques';
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  centres: centreanalytiqueModel[] = [];
  centre: centreanalytiqueModel = new centreanalytiqueModel();
  msgErros: string = '';
  loading: Boolean = false;
  centreanalytiqueForm: FormGroup = this.fb.group({});
  ImportForm: FormGroup = this.fb.group({});

  //Faire le check selection
  objectsSelected: centreanalytiqueModel[] = [];
  selectedItems: any[] = [];
  checkAllRow: any;
  error: string = '';

  //Changement titre modal
  actionModal: string = 'create';

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  //Element à supprimer
  deletecentre: any = null;

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;

  //  Variables pour l'import
  selectedFile: File | null = null;
  fileContent: any[] = [];
  fileHeaders: string[] = [];
  uploadProgress: number = 0;
  uploadSpeed: string = '';
  successMessage: string = '';
  importErrors: string[] = [];
  isDragover: boolean = false;

  constructor(
    private centreanalytiqueservice: CentreAnalytiqueService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef, //  Injecter ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    //Afficher tous les centres
    this.getAllcentres();
    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('ce centre analytique');
    this.titleMsg = TITLE_DELETE;
    //  Initialisation du formulaire d'import
    this.initImportForm();
  }

  getAllcentres() {
    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.centres = res.data;
          this.filteredData = [...this.centres];
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
    this.centreanalytiqueForm = this.fb.group({
      codecentreanalytique: ['', [Validators.required]],
      libelle: ['', [Validators.required]],
      idsociete: [this.user.idsociete, [Validators.required]],
      actif: [true],
      createdby: [this.user.prenom + ' ' + this.user.nom],
      updatedby: [this.user.prenom + ' ' + this.user.nom],
    });
  }

  //  Création du formulaire d'importation
  initImportForm(): void {
    this.ImportForm = this.fb.group({
      file: [null, [Validators.required]],
    });
  }

  get form() {
    return this.centreanalytiqueForm.controls;
  }

  dispatchcentres(_object: centreanalytiqueModel) {
    const status = _object.actif === 1;
    this.centreanalytiqueForm.patchValue({
      codecentreanalytique: _object.codecentreanalytique,
      libelle: _object.libelle,
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
    return this.selectedItems.some((x) => x.idcentreanalytique === id);
  }

  handleSelectOne(item: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (
        !this.selectedItems.some(
          (x) => x.idcentreanalytique === item.idcentreanalytique,
        )
      ) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        (x) => x.idcentreanalytique !== item.idcentreanalytique,
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
    const controls = this.centreanalytiqueForm.controls;
    if (this.centreanalytiqueForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    const formValue = this.centreanalytiqueForm.value;

    const _centres: centreanalytiqueModel = {
      ...this.centre,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
    };

    if (this.actionModal == 'create') this.create(_centres);
    else this.update(_centres);
  }

  create(_centres: centreanalytiqueModel) {
    const { idcentreanalytique, ...dataToSend } = _centres;
    this.loading = true;
    this.centreanalytiqueservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcentres();
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

  update(_centres: centreanalytiqueModel) {
    this.centreanalytiqueservice.update(_centres).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcentres();
          this.toastr.success('Fiche modifiée');
        } else {
          this.error = 'Erreur de modification';
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Echec de modification';
        this.loading = false;
        this.toastr.error(err);
      },
    });
  }

  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    if (modalEl) {
      modalEl.classList.remove('show');
      modalEl.setAttribute('aria-hidden', 'true');
      modalEl.style.display = 'none';
    }
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  modalCreate() {
    this.actionModal = 'create';
    this.initForm();
  }

  modalUpdate(_object: centreanalytiqueModel) {
    this.centre = _object;
    this.actionModal = 'update';
    this.centreanalytiqueForm.reset();
    this.dispatchcentres(_object);
  }

  modalview(_object: centreanalytiqueModel) {
    this.centre = _object;
    this.actionModal = 'view';
    this.centreanalytiqueForm.reset();
    this.dispatchcentres(_object);
  }

  modalDelete(item: centreanalytiqueModel) {
    this.deletecentre = item;
  }

  deleteConfirmed() {
    if (!this.deletecentre) return;
    this.centreanalytiqueservice
      .delete(this.deletecentre.idcentreanalytique)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal('delete');
            this.getAllcentres();
            this.toastr.success('Fiche supprimée');
          } else {
            this.error = 'Erreur de Suppression';
            this.toastr.error(this.error);
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Suppression échec';
          this.loading = false;
          this.toastr.error(err);
        },
      });
  }

  deleteMultiple() {
    for (let i = 0; i < this.objectsSelected.length; i++) {
      this.centreanalytiqueservice
        .delete(this.objectsSelected[i].idcentreanalytique)
        .subscribe({});
    }
    this.toastr.success('Fiches supprimées');
    this.getAllcentres();
  }

  //  Méthodes pour l'import avec prévisualisation
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.previewFile(file);
      this.ImportForm.patchValue({ file });
      this.ImportForm.get('file')?.updateValueAndValidity();
      this.cdr.detectChanges();
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
      this.cdr.detectChanges();
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileContent = [];
    this.fileHeaders = [];
    this.uploadProgress = 0;
    this.successMessage = '';
    this.importErrors = [];
    this.ImportForm.reset();

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
  }

  previewFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter((line) => line.trim());
      if (lines.length > 0) {
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
        this.cdr.detectChanges();
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
    if (this.uploadProgress < 90) return 'Validation des données...';
    return 'Finalisation...';
  }

  //  Méthode d'import améliorée avec FormData et progression
  submitImportFile(): void {
    if (!this.selectedFile) {
      this.toastr.warning('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('idsociete', this.user.idsociete);
    formData.append('createdby', this.user.prenom + ' ' + this.user.nom);

    this.uploadProgress = 0;
    this.importErrors = [];
    this.successMessage = '';

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.floor(Math.random() * 8) + 2;
        if (this.uploadProgress > 90) {
          this.uploadProgress = 90;
        }
        this.cdr.detectChanges();
      }
    }, 300);

    this.centreanalytiqueservice
      .importCentreAnalytiqueFormData(formData)
      .subscribe({
        next: (res) => {
          this.uploadProgress = 100;
          clearInterval(progressInterval);
          this.successMessage = `${this.fileContent.length || 0} ligne(s) importée(s) avec succès !`;
          this.toastr.success('Import terminé avec succès');
          this.getAllcentres();
          this.cdr.detectChanges();

          setTimeout(() => {
            this.uploadProgress = 0;
            this.selectedFile = null;
            this.fileContent = [];
            this.fileHeaders = [];
            this.successMessage = '';
            this.importErrors = [];
            this.ImportForm.reset();

            const fileInput = document.getElementById(
              'fileInput',
            ) as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
            this.cdr.detectChanges();
            this.closeModal('importcsv');
          }, 3000);
        },
        error: (err) => {
          this.uploadProgress = 0;
          clearInterval(progressInterval);
          this.importErrors = [
            err.error?.message || "Erreur lors de l'import du fichier",
          ];
          this.toastr.error("Erreur lors de l'import");
          console.error('Import error:', err);
          this.cdr.detectChanges();
        },
      });
  }

  // 🔎 Filtrer
  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    this.filteredData = this.centres.filter(
      (item) =>
        item.codecentreanalytique?.toLowerCase().includes(term) ||
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
    this.getAllcentres();
  }

  exportData = {
    debut: null,
    fin: null,
    format: 'excel',
  };

  exporter() {
    this.centreanalytiqueservice.exportCentres(this.exportData).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          this.exportData.format === 'pdf'
            ? 'centres_analytiques.pdf'
            : 'centres_analytiques.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Erreur export');
      },
    });
  }

  exportToExcel(): void {
    const element = document.getElementById('dataTable');
    if (!element) {
      console.error('Table non trouvée');
      return;
    }
    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Centres Analytiques': worksheet },
      SheetNames: ['Centres Analytiques'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const data: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });
    saveAs(
      data,
      `centres_analytiques_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.xlsx`,
    );
  }

  exportToCSV(): void {
    const element = document.getElementById('dataTable');
    if (!element) {
      console.error('Table non trouvée');
      return;
    }
    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ';',
    });
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });
    saveAs(
      blob,
      `centres_analytiques_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.csv`,
    );
    this.toastr.success('Fiches exportées avec succès');
  }
}
