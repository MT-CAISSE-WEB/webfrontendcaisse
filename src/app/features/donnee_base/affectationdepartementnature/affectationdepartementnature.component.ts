import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { affectationdepartementnatureModel } from '../models/affectationdepartementnature.model';
import { AffectationDepartementNatureService } from '../services/affectationdepartementnature.service';
import { CommonModule } from '@angular/common';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { departementmodel } from '../../structure/model/departement.model';
import { departementservice } from '../../structure/service/departement.service';
import { ToastrService } from 'ngx-toastr';

// ADD-INS
declare var $: any;

@Component({
  selector: 'app-affectationdepartementnature',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './affectationdepartementnature.component.html',
  styleUrls: ['./affectationdepartementnature.component.css'],
})
export class AffectationDepartementNatureComponent implements OnInit {
  title = 'Affectation département nature';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  affectationdepartementnatures: affectationdepartementnatureModel[] = [];
  affectationdepartementnature: affectationdepartementnatureModel =
    new affectationdepartementnatureModel();
  msgErros: string = '';
  loading: Boolean = false;
  affectationdepartementnatureForm: FormGroup = this.fb.group({});

  //Faire le check selection
  objectsSelected: affectationdepartementnatureModel[] = [];
  selectedItems: any[] = [];
  checkAllRow: any;
  error: string = '';

  //Changement titre modal
  actionModal: string = 'create';

  departements: departementmodel[] = [];

  nonAffectees: any[] = [];
  affectees: any[] = [];

  selectedLeft: any[] = [];
  selectedRight: any[] = [];
  departementForm!: FormGroup;

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';

  filteredDataNA: any[] = [];
  paginatedDataNA: any[] = [];
  searchTermNA: string = '';

  currentPage: number = 1;
  currentPageNA: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;

  ImportForm: FormGroup = this.fb.group({});
  ExportForm: FormGroup = this.fb.group({});

  selectedDeptCode: string = '';

  exportData = {
    debut: this.selectedDeptCode || '',
    fin: this.selectedDeptCode || '',
    format: 'excel',
  };

  // ============================================
  //  AJOUTS POUR L'IMPORT AVEC PRÉVISUALISATION
  // ============================================
  selectedFile: File | null = null;
  fileContent: any[] = [];
  fileHeaders: string[] = [];
  uploadProgress: number = 0;
  uploadSpeed: string = '';
  successMessage: string = '';
  importErrors: string[] = [];
  isDragover: boolean = false;

  constructor(
    private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private departementservice: departementservice,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.departementForm = this.fb.group({
      iddepartement: ['', Validators.required],
      idsociete: [this.user.idsociete, [Validators.required]],
      idsNatures: [[]],
    });

    this.getAllDepartements();

    // Écoute du changement de departement
    this.departementForm
      .get('iddepartement')
      ?.valueChanges.subscribe((iddepartement) => {
        if (iddepartement) {
          this.getallAffectations(iddepartement);
          this.getOneDepartement(iddepartement);
        } else {
          this.affectees = [];
          this.nonAffectees = [];
        }
      });

    //Initialiser le formulaire du fichier d'import
    this.initImportForm();
  }

  getAllDepartements() {
    this.departementservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.departements = res.data;
        }
      },
    });
  }

  getallAffectations(iddepartement: string) {
    this.AffectationDepartementNatureService.getAll(iddepartement).subscribe({
      next: (res) => {
        if (res.success) {
          this.affectees = res.data.naturesaffectes;
          this.nonAffectees = res.data.naturesnonaffectes;

          this.filteredData = [...this.affectees];
          this.updatePagination();

          this.filteredDataNA = [...this.nonAffectees];
          this.updatePaginationNA();
        }
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // ============================================
  //  SÉLECTION TOUS (Checkbox "Tout sélectionner")
  // ============================================

  isAllLeftSelected(): boolean {
    return (
      this.paginatedDataNA.length > 0 &&
      this.paginatedDataNA.every((item) => this.isSelectedLeft(item))
    );
  }

  isAllRightSelected(): boolean {
    return (
      this.paginatedData.length > 0 &&
      this.paginatedData.every((item) => this.isSelectedRight(item))
    );
  }

  isSelectedLeft(item: any): boolean {
    return this.selectedLeft.some((x) => x.idnature === item.idnature);
  }

  isSelectedRight(item: any): boolean {
    return this.selectedRight.some((x) => x.idnature === item.idnature);
  }

  toggleAllLeft(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.paginatedDataNA.forEach((item) => {
        if (!this.isSelectedLeft(item)) {
          this.selectedLeft.push(item);
        }
      });
    } else {
      const ids = new Set(this.paginatedDataNA.map((item) => item.idnature));
      this.selectedLeft = this.selectedLeft.filter((x) => !ids.has(x.idnature));
    }
  }

  toggleAllRight(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.paginatedData.forEach((item) => {
        if (!this.isSelectedRight(item)) {
          this.selectedRight.push(item);
        }
      });
    } else {
      const ids = new Set(this.paginatedData.map((item) => item.idnature));
      this.selectedRight = this.selectedRight.filter(
        (x) => !ids.has(x.idnature),
      );
    }
  }

  toggleSelection(list: any[], item: any, event: Event): any[] {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!list.some((x) => x.idnature === item.idnature)) {
        return [...list, item];
      }
      return list;
    } else {
      return list.filter((x) => x.idnature !== item.idnature);
    }
  }

  toggleLeft(item: any, event: Event): void {
    this.selectedLeft = this.toggleSelection(this.selectedLeft, item, event);
  }

  toggleRight(item: any, event: Event): void {
    this.selectedRight = this.toggleSelection(this.selectedRight, item, event);
  }

  add(): void {
    if (!this.selectedLeft.length) return;

    const idsExistants = new Set(this.affectees.map((a) => a.idnature));
    const nouveaux = this.selectedLeft.filter(
      (item) => !idsExistants.has(item.idnature),
    );

    this.affectees = [...this.affectees, ...nouveaux];
    const idsAjoutes = new Set(nouveaux.map((i) => i.idnature));
    this.nonAffectees = this.nonAffectees.filter(
      (x) => !idsAjoutes.has(x.idnature),
    );

    this.selectedLeft = [];

    this.filteredData = [...this.affectees];
    this.currentPage = 1;
    this.updatePagination();

    this.filteredDataNA = [...this.nonAffectees];
    this.currentPageNA = 1;
    this.updatePaginationNA();
  }

  remove(): void {
    if (!this.selectedRight.length) return;

    const idsExistants = new Set(this.nonAffectees.map((n) => n.idnature));
    const nouveaux = this.selectedRight.filter(
      (item) => !idsExistants.has(item.idnature),
    );

    this.nonAffectees = [...this.nonAffectees, ...nouveaux];
    const idsSupprimes = new Set(nouveaux.map((i) => i.idnature));
    this.affectees = this.affectees.filter(
      (x) => !idsSupprimes.has(x.idnature),
    );

    this.selectedRight = [];

    this.filteredData = [...this.affectees];
    this.currentPage = 1;
    this.updatePagination();

    this.filteredDataNA = [...this.nonAffectees];
    this.currentPageNA = 1;
    this.updatePaginationNA();
  }

  addAll(): void {
    const idsExistants = new Set(this.affectees.map((a) => a.idnature));
    const nouveaux = this.nonAffectees.filter(
      (item) => !idsExistants.has(item.idnature),
    );

    this.affectees = [...this.affectees, ...nouveaux];
    this.nonAffectees = [];

    this.selectedLeft = [];
    this.selectedRight = [];

    this.filteredData = [...this.affectees];
    this.filteredDataNA = [...this.nonAffectees];
    this.currentPage = 1;
    this.updatePagination();
    this.updatePaginationNA();
  }

  removeAll(): void {
    const idsExistants = new Set(this.nonAffectees.map((n) => n.idnature));
    const nouveaux = this.affectees.filter(
      (item) => !idsExistants.has(item.idnature),
    );

    this.nonAffectees = [...this.nonAffectees, ...nouveaux];
    this.filteredDataNA = [...this.nonAffectees];
    this.updatePaginationNA();

    this.affectees = [];
    this.selectedLeft = [];
    this.selectedRight = [];

    this.filteredData = [];
    this.paginatedData = [];
    this.currentPage = 1;
    this.totalPages = 1;
  }

  save() {
    const iddepartement = this.departementForm.get('iddepartement')?.value;

    const info = {
      idsociete: this.user.idsociete,
      createdby: this.user.prenom + ' ' + this.user.nom,
    };

    if (!iddepartement) {
      this.toastr.warning('Veuillez sélectionner un département');
      return;
    }

    const idsNatures = this.affectees;

    this.AffectationDepartementNatureService.saveAffectations(
      iddepartement,
      idsNatures,
      info,
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Affectations enregistrées avec succès');
          this.getallAffectations(iddepartement);
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error("Erreur lors de l'enregistrement des affectations");
      },
    });
  }

  // 🔎 Filtrer (Non affectées)
  applyFilterNA() {
    const term = this.searchTermNA.toLowerCase();

    this.filteredDataNA = this.nonAffectees.filter(
      (item) =>
        item.codenature?.toLowerCase().includes(term) ||
        item.libelle?.toLowerCase().includes(term),
    );

    this.currentPageNA = 1;
    this.updatePaginationNA();
  }

  updatePaginationNA() {
    this.totalPages = Math.ceil(this.filteredDataNA.length / this.pageSize);
    const start = (this.currentPageNA - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedDataNA = this.filteredDataNA.slice(start, end);
  }

  nextPageNA() {
    if (this.currentPageNA < this.totalPages) {
      this.currentPageNA++;
      this.updatePaginationNA();
    }
  }

  prevPageNA() {
    if (this.currentPageNA > 1) {
      this.currentPageNA--;
      this.updatePaginationNA();
    }
  }

  // 🔎 Filtrer (Affectees)
  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    this.filteredData = this.affectees.filter(
      (item) =>
        item.codenature?.toLowerCase().includes(term) ||
        item.libelle?.toLowerCase().includes(term),
    );

    this.currentPage = 1;
    this.updatePagination();
  }

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

  abandonner(): void {
    const iddepartement = this.departementForm.get('iddepartement')?.value;
    if (iddepartement) {
      this.getallAffectations(iddepartement);
    } else {
      this.affectees = [];
      this.nonAffectees = [];
      this.filteredData = [];
      this.paginatedData = [];
      this.filteredDataNA = [];
      this.paginatedDataNA = [];
    }
    this.selectedLeft = [];
    this.selectedRight = [];
    this.toastr.info('Modifications annulées');
  }

  actualiser(): void {
    this.getAllDepartements();
    this.paginatedDataNA = [];
    this.paginatedData = [];
    this.selectedLeft = [];
    this.selectedRight = [];
    this.departementForm.reset();
    this.toastr.info('Données actualisées');
  }

  // ============================================
  //  AJOUTS POUR L'IMPORT AVEC PRÉVISUALISATION
  // ============================================

  //Création du formulaire d'importation
  initImportForm(): void {
    this.ImportForm = this.fb.group({
      file: [null, [Validators.required]],
    });
  }

  //  Sélection de fichier
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

  //  Drag & Drop
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

  //  Supprimer le fichier
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

  //  Prévisualisation du fichier
  previewFile(file: File): void {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const cleanContent = content.replace(/^\uFEFF/, '');
      const lines = cleanContent
        .split('\n')
        .filter((line) => line.trim() !== '');
      if (lines.length > 0) {
        const firstLine = lines[0];
        let delimiter = this.detectDelimiter(firstLine);
        this.fileHeaders = firstLine.split(delimiter).map((h) => h.trim());
        this.fileContent = lines
          .slice(1)
          .filter((line) => line.trim() !== '')
          .map((line) => line.split(delimiter).map((c) => c.trim()));
        this.cdr.detectChanges();
      }
    };
  }

  //  Détection du séparateur
  detectDelimiter(line: string): string {
    const separators = [';', ',', '\t', '|'];
    let maxCount = 0;
    let detected = ';';
    for (const sep of separators) {
      const count = (line.match(new RegExp(sep, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detected = sep;
      }
    }
    return detected;
  }

  // Détection de l'entête
  detectHeader(lines: string[]): boolean {
    if (lines.length < 2) return true;
    const firstLine = lines[0].toLowerCase();
    const headerKeywords = [
      'code',
      'libelle',
      'nature',
      'departement',
      'actif',
      'département',
    ];
    for (const keyword of headerKeywords) {
      if (firstLine.includes(keyword)) {
        return true;
      }
    }
    return false;
  }

  //  Utilitaires
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

  //  Soumission de l'import
  submitImportFile(): void {
    if (!this.selectedFile) {
      this.toastr.warning('Veuillez sélectionner un fichier');
      return;
    }

    const reader = new FileReader();
    reader.readAsText(this.selectedFile, 'UTF-8');

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const cleanContent = content.replace(/^\uFEFF/, '');
      const lines = cleanContent
        .split('\n')
        .filter((line) => line.trim() !== '');

      if (lines.length === 0) {
        this.toastr.warning('Le fichier est vide');
        return;
      }

      const hasHeader = this.detectHeader(lines);
      const dataToSend = hasHeader
        ? lines.slice(1).join('\n')
        : lines.join('\n');

      const blob = new Blob([dataToSend], { type: 'text/csv;charset=utf-8' });
      const fileToSend = new File([blob], this.selectedFile!.name, {
        type: 'text/csv',
      });

      const formData = new FormData();
      formData.append('file', fileToSend);
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

      this.AffectationDepartementNatureService.importAffectationsFormData(
        formData,
      ).subscribe({
        next: (res) => {
          this.uploadProgress = 100;
          clearInterval(progressInterval);
          this.successMessage = `${this.fileContent.length || 0} lignes importées avec succès !`;
          this.toastr.success('Import terminé avec succès');
          this.cdr.detectChanges();

          setTimeout(() => {
            this.resetImportState();
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
    };
  }

  //  Réinitialisation de l'import
  resetImportState(): void {
    this.uploadProgress = 0;
    this.selectedFile = null;
    this.fileContent = [];
    this.fileHeaders = [];
    this.successMessage = '';
    this.importErrors = [];
    this.ImportForm.reset();

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
    this.closeModal('importcsv');
  }

  //  Fermeture de modal
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

  // ============================================
  //  MÉTHODES EXISTANTES (conservées)
  // ============================================

  getOneDepartement(id: string) {
    this.departementservice.getOne(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedDeptCode = res.data.codedept;
          this.exportData = {
            debut: this.selectedDeptCode || '',
            fin: this.selectedDeptCode || '',
            format: 'excel',
          };
        }
      },
    });
  }

  exporter() {
    this.AffectationDepartementNatureService.exportAffectations(
      this.exportData,
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          this.exportData.format === 'pdf'
            ? 'Affectations_departements.pdf'
            : 'Affectations_departements.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Erreur export');
      },
    });
  }

  //  Import via le bouton (legacy)
  importAffectation(event: any) {
    const file = event.target.files[0];
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.ImportForm.patchValue({ file });
      this.ImportForm.get('file')?.updateValueAndValidity();
    }
  }
}
