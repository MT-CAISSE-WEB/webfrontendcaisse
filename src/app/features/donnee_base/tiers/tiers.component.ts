import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { tiersModel } from '../models/tiers.model';
import { TiersService } from '../services/tiers.service';
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
  selector: 'app-tiers',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tiers.component.html',
  styleUrl: './tiers.component.css',
})
export class TiersComponent implements OnInit {
  title = 'Tiers';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  tiers: tiersModel[] = [];
  tier: tiersModel = new tiersModel();
  msgErros: string = '';
  loading: Boolean = false;
  tiersForm: FormGroup = this.fb.group({});

  //Faire le check selection **********
  objectsSelected: tiersModel[] = [];
  selectedItems: any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow: any;
  error: string = '';

  //Changement titre modal
  actionModal: string = 'create';

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  //Element à supprimer
  deleteTiers: any = null;

  ImportForm: FormGroup = this.fb.group({});

  // Ajout pour fonctions de recherche et pagination
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

  constructor(
    private tiersservice: TiersService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    //Afficher tous les tiers
    this.getAllTiers();
    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('ce tiers');
    this.titleMsg = TITLE_DELETE;
  }

  getAllTiers() {
    this.tiersservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.tiers = res.data;
          this.filteredData = [...this.tiers];
          this.updatePagination();
        }
      },
    });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //création du formulaire
  initForm(): void {
    this.tiersForm = this.fb.group({
      codetiers: ['', [Validators.required]],
      designation: ['', [Validators.required]],
      typetiers: ['', [Validators.required]],
      idsociete: [this.user.idsociete, [Validators.required]],
      actif: [true],
      createdby: [this.user.prenom + ' ' + this.user.nom],
      updatedby: [this.user.prenom + ' ' + this.user.nom],
    });
  }

  get form() {
    return this.tiersForm.controls;
  }

  dispatchTiers(_object: tiersModel) {
    const status = _object.actif === 1;
    this.tiersForm.patchValue({
      codetiers: _object.codetiers,
      designation: _object.designation,
      typetiers: _object.typetiers,
      idsociete: _object.idsociete,
      codesociete: _object.societe.societe_codesociete,
      raisonsociale: _object.societe.societe_raisonsociale,
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

  //vérifie si _id est inclus dans un tableau d'IDs stocké
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
      this.objectsSelected = [...this.paginatedData]; // toutes les données filtrées
    } else {
      this.objectsSelected = [];
    }
  }

  //Soumission du formulaire
  onSubmit() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.tiersForm.controls;
    if (this.tiersForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.tiersForm.value;

    const _tiers: tiersModel = {
      ...this.tier,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
    };

    /** 3. choices action */
    if (this.actionModal == 'create') this.create(_tiers);
    else this.update(_tiers);
    // if (!_tiers.idtiers) this.create(_tiers);
    // else this.update(_tiers);
  }

  //Enregistrement de données
  create(_tiers: tiersModel) {
    const { idtiers, ...dataToSend } = _tiers;
    this.loading = true;
    this.tiersservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllTiers();
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
        this.toastr.error(this.error);
      },
    });
  }

  //Modification de données
  update(_tiers: tiersModel) {
    this.tiersservice.update(_tiers).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllTiers();
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

  modalUpdate(_object: tiersModel) {
    this.tier = _object;
    this.actionModal = 'update';
    this.tiersForm.reset();
    this.dispatchTiers(_object);
  }

  modalview(_object: tiersModel) {
    this.tier = _object;
    this.actionModal = 'view';
    this.tiersForm.reset();
    this.dispatchTiers(_object);
  }

  modalDelete(item: tiersModel) {
    this.deleteTiers = item;
  }

  deleteConfirmed() {
    if (!this.deleteTiers) return;
    this.tiersservice.delete(this.deleteTiers.idtiers).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllTiers();
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
        this.toastr.error(this.error);
      },
    });
  }

  // Suppression multiple
  deleteMultiple() {
    for (let i = 0; i < this.objectsSelected.length; i++) {
      this.tiersservice.delete(this.objectsSelected[i].idtiers).subscribe({});
    }
    this.getAllTiers();
    this.toastr.success('Fiches supprimées');
  }

  exportToExcel(): void {
    const element = document.getElementById('dataTable');

    if (!element) {
      console.error('Table non trouvée');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Evolution Budget': worksheet },
      SheetNames: ['Evolution Budget'],
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
      `Liste_Tiers_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.xlsx`,
    );
  }

  exportToCSV(): void {
    const element = document.getElementById('dataTable');

    if (!element) {
      console.error('Table non trouvée');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);

    // 🔥 forcer le séparateur ;
    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ';',
    });

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    saveAs(
      blob,
      `Liste_Tiers_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.csv`,
    );
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

  //Importation des tiers
  importTiers(event: any) {
    const file = event.target.files[0];

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.ImportForm.patchValue({ file });
      this.ImportForm.get('file')?.updateValueAndValidity();
    }
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

      this.tiersservice.importTiersFormData(formData).subscribe({
        next: (res: any) => {
          this.uploadProgress = 100;
          clearInterval(progressInterval);
          this.successMessage = `${this.fileContent.length || 0} ligne(s) importée(s) avec succès !`;
          this.toastr.success('Import terminé avec succès');
          this.getAllTiers();
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
      'designation',
      'type',
      'désignation',
      'compte',
      'numcompte',
      'statut',
      'status',
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

  //Création du formulaire d'importation
  initImportForm(): void {
    this.ImportForm = this.fb.group({
      file: [null, [Validators.required]],
    });
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

  // 🔎 Filtrer (Affectees)
  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    this.filteredData = this.tiers.filter(
      (item) =>
        item.codetiers?.toLowerCase().includes(term) ||
        item.designation?.toLowerCase().includes(term),
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

    console.log('Données paginées :', this.paginatedData);
  }

  // ▶ Page suivante
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  // ◀ Page précédente
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  actualiser(): void {
    this.getAllTiers();
  }

  exportData = {
    debut: null,
    fin: null,
    typetiers: null,
    format: 'excel',
  };

  exporter() {
    this.tiersservice.exportTiers(this.exportData).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        a.download =
          this.exportData.format === 'pdf'
            ? 'Liste_Tiers.pdf'
            : 'Liste_Tiers.xlsx';

        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Erreur export');
      },
    });
  }
}
