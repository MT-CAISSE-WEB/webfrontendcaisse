import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { natureoperationModel } from '../models/natureoperation.model';
import { NatureoperationService } from '../services/natureoperation.service';
import { PlancomptableService } from '../services/plancomptable.service';
import { plancomptableModel } from '../models/plancomptable.model';
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

declare var $: any;

@Component({
  selector: 'app-natureoperation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './natureoperation.component.html',
  styleUrls: ['./natureoperation.component.css'],
})
export class NatureoperationComponent implements OnInit {
  title = "Natures d'opérations";
  fb: FormBuilder = new FormBuilder();
  natureoperations: natureoperationModel[] = [];
  natureoperation: natureoperationModel = new natureoperationModel();
  comptes: plancomptableModel[] = [];
  msgErros: string = '';
  loading: Boolean = false;
  natureoperationForm: FormGroup = this.fb.group({});
  ImportForm: FormGroup = this.fb.group({});

  // Check selection
  objectsSelected: natureoperationModel[] = [];
  selectedItems: any[] = [];
  checkAllRow: any;
  error: string = '';

  // Modal
  actionModal: string = 'create';
  msgSup: string = '';
  titleMsg: string = '';
  deleteNatureoperation: any = null;

  // Pagination & search
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;

  // Import
  selectedFile: File | null = null;
  fileContent: any[] = [];
  fileHeaders: string[] = [];
  uploadProgress: number = 0;
  uploadSpeed: string = '';
  successMessage: string = '';
  importErrors: string[] = [];
  isDragover: boolean = false;

  exportData = {
    debut: null,
    fin: null,
    format: 'excel',
  };

  constructor(
    private natureoperationservice: NatureoperationService,
    private plancomptableservice: PlancomptableService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getAllNatureoperations();
    this.getAllComptes();
    this.initForm();
    this.initImportForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette nature d'opération");
    this.titleMsg = TITLE_DELETE;
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getAllNatureoperations() {
    this.natureoperationservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.natureoperations = res.data;
          this.filteredData = [...this.natureoperations];
          this.updatePagination();
          console.log(this.natureoperations)
        }
      },
    });
  }

  getAllComptes() {
    this.plancomptableservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.comptes = res.data;
        }
      },
    });
  }

  initForm(): void {
    this.natureoperationForm = this.fb.group({
      codenature: ['', [Validators.required]],
      libelle: ['', [Validators.required]],
      decajustifier: [false],
      imputationtiers: [false],
      typetiers: ['', [Validators.required]],
      demandedecaissement: [true],
      typeoperation: ['Decaissement', [Validators.required]],
      idsociete: [this.user.idsociete, [Validators.required]],
      idcompte: ['', [Validators.required]],
      actif: [true],
      createdby: [this.user.prenom + ' ' + this.user.nom],
      updatedby: [this.user.prenom + ' ' + this.user.nom],
    });
  }

  initImportForm(): void {
    this.ImportForm = this.fb.group({
      file: [null, [Validators.required]],
    });
  }

  get form() {
    return this.natureoperationForm.controls;
  }

  dispatchNatureoperations(_object: natureoperationModel) {
    const status = _object.actif === 1;
    this.natureoperationForm.patchValue({
      codenature: _object.codenature,
      libelle: _object.libelle,
      decajustifier: _object.decajustifier === 1,
      imputationtiers: _object.imputationtiers === 1,
      typetiers: _object.typetiers,
      demandedecaissement: _object.demandedecaissement === 1,
      typeoperation: _object.typeoperation,
      idsociete: _object.idsociete,
      idcompte: _object.idcompte,
      actif: status,
    });
  }

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
    return this.selectedItems.some((x) => x.idnatureoperation === id);
  }

  handleSelectOne(item: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (
        !this.selectedItems.some(
          (x) => x.idnatureoperation === item.idnatureoperation,
        )
      ) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        (x) => x.idnatureoperation !== item.idnatureoperation,
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

  onSubmit() {
    this.msgErros = '';
    const controls = this.natureoperationForm.controls;
    if (this.natureoperationForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    const formValue = this.natureoperationForm.value;
    const _nature: natureoperationModel = {
      ...this.natureoperation,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
      decajustifier: formValue.decajustifier ? 1 : 0,
      imputationtiers: formValue.imputationtiers ? 1 : 0,
      demandedecaissement: formValue.demandedecaissement ? 1 : 0,
    };

    if (this.actionModal == 'create') this.create(_nature);
    else this.update(_nature);
  }

  create(_nature: natureoperationModel) {
    const { idnature, ...dataToSend } = _nature;
    this.loading = true;
    this.natureoperationservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllNatureoperations();
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

  update(_nature: natureoperationModel) {
    this.natureoperationservice.update(_nature).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllNatureoperations();
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

  modalUpdate(_object: natureoperationModel) {
    this.natureoperation = _object;
    this.actionModal = 'update';
    this.natureoperationForm.reset();
    this.dispatchNatureoperations(_object);
  }

  modalview(_object: natureoperationModel) {
    this.natureoperation = _object;
    this.actionModal = 'view';
    this.natureoperationForm.reset();
    this.dispatchNatureoperations(_object);
  }

  modalDelete(item: natureoperationModel) {
    this.deleteNatureoperation = item;
  }

  deleteConfirmed() {
    if (!this.deleteNatureoperation) return;
    this.natureoperationservice
      .delete(this.deleteNatureoperation.idnature)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal('delete');
            this.getAllNatureoperations();
            this.toastr.success('Fiche supprimée avec succès');
          } else {
            this.error = 'Erreur de Suppression';
            this.toastr.error(this.error);
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Suppression échec';
          this.loading = false;
          this.toastr.error(this.error);
        },
      });
  }

  deleteMultiple() {
    for (let i = 0; i < this.objectsSelected.length; i++) {
      this.natureoperationservice
        .delete(this.objectsSelected[i].idnature)
        .subscribe({});
    }
    this.toastr.success('Fiches supprimées');
    this.getAllNatureoperations();
  }

  // Import methods
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

      //  Détecter si le fichier a une entête
      const hasHeader = this.detectHeader(lines);
      console.log('Entête détectée ?', hasHeader);

      //  Construire le contenu à envoyer
      let dataToSend: string;
      if (hasHeader) {
        // Avec entête : ignorer la première ligne
        dataToSend = lines.slice(1).join('\n');
        console.log('Lignes à importer (sans entête):', lines.slice(1).length);
      } else {
        // Sans entête : envoyer toutes les lignes
        dataToSend = lines.join('\n');
        console.log('Lignes à importer (toutes):', lines.length);
      }

      //  Créer le fichier nettoyé
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

      this.natureoperationservice
        .importNatureOperationFormData(formData)
        .subscribe({
          next: (res: any) => {
            this.uploadProgress = 100;
            clearInterval(progressInterval);
            this.successMessage = `${this.fileContent.length || 0} ligne(s) importée(s) avec succès !`;
            this.toastr.success('Import terminé avec succès');
            this.getAllNatureoperations();
            this.cdr.detectChanges();

            setTimeout(() => {
              this.resetImportState();
            }, 3000);
          },
          error: (err: any) => {
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

  //  Détecter si la première ligne est une entête
  detectHeader(lines: string[]): boolean {
    if (lines.length < 2) return true; // Si une seule ligne, on considère que c'est une entête

    const firstLine = lines[0];
    const secondLine = lines[1];

    //  Vérifier le nombre de colonnes
    const firstCols = firstLine.split(';').map((c) => c.trim());
    const secondCols = secondLine.split(';').map((c) => c.trim());

    // Si les deux lignes n'ont pas le même nombre de colonnes, c'est probablement une entête
    if (firstCols.length !== secondCols.length) {
      return true;
    }

    //  Vérifier si la première ligne contient des mots clés d'entête
    const headerKeywords = [
      'code',
      'libelle',
      'nature',
      'type',
      'operation',
      'compte',
      'numcompte',
      'statut',
      'status',
      'nom',
      'compte',
    ];
    const firstLineLower = firstLine.toLowerCase();

    let keywordCount = 0;
    for (const keyword of headerKeywords) {
      if (firstLineLower.includes(keyword)) {
        keywordCount++;
      }
    }

    // Si au moins 2 mots clés trouvés, c'est une entête
    if (keywordCount >= 2) {
      return true;
    }

    //  Vérifier si la première ligne contient des nombres (indicateur de données)
    const firstHasNumbers = firstCols.some((c) => /^[0-9]/.test(c));
    const secondHasNumbers = secondCols.some((c) => /^[0-9]/.test(c));

    // Si la première ligne n'a pas de nombres mais la deuxième en a, c'est une entête
    if (!firstHasNumbers && secondHasNumbers) {
      return true;
    }

    //  Vérifier si la première ligne est une entête avec des guillemets
    const firstHasQuotes = firstLine.includes('"');
    const secondHasQuotes = secondLine.includes('"');

    if (firstHasQuotes && !secondHasQuotes) {
      return true;
    }

    //  Par défaut, si la première ligne ressemble à des données, on l'importe
    return false;
  }

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

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.natureoperations.filter(
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

  actualiser(): void {
    this.getAllNatureoperations();
  }

  exporter() {
    this.natureoperationservice.exportNatures(this.exportData).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          this.exportData.format === 'pdf'
            ? 'Liste_natures.pdf'
            : 'Liste_natures.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Erreur export');
      },
    });
  }

  // Télécharger le modèle
  downloadCsvTemplate(): void {
    const delimiter = ';';
    const csvContent = `code${delimiter}libelle${delimiter}typeoperation${delimiter}decajustifier${delimiter}imputationtiers${delimiter}demandedecaissement${delimiter}Compte${delimiter}Statut
XXXXXX${delimiter}Exemple nature${delimiter}0${delimiter}0${delimiter}0${delimiter}0${delimiter}XXXXXX${delimiter}1
XXXXXX${delimiter}Exemple nature${delimiter}0${delimiter}0${delimiter}0${delimiter}0${delimiter}XXXXXX${delimiter}1
XXXXXX${delimiter}Exemple nature${delimiter}0${delimiter}0${delimiter}0${delimiter}0${delimiter}XXXXXX${delimiter}1`;

    // BOM UTF-8 pour compatibilité Excel
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_nature_operation.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.toastr.success('Modèle CSV téléchargé');
  }
}
