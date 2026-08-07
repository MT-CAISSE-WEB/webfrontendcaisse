import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserImportExportService } from '../administration/service/user-import-export.service';
import {
  ImportPreview,
  ImportResult,
} from '../administration/model/import-result.model';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-import.component.html',
  styleUrls: ['./user-import.component.css'],
})
export class UserImportComponent implements OnDestroy {
  @Output() importComplete = new EventEmitter<ImportResult>();
  @Output() close = new EventEmitter<void>();

  // État du composant
  selectedFile: File | null = null;
  isDragging = false;
  isLoading = false;
  isAnalyzing = false;
  showPreview = false;
  importStep: 'upload' | 'preview' | 'result' = 'upload';

  // Données d'aperçu
  previewData: ImportPreview[] = [];
  validRowsCount = 0;
  invalidRowsCount = 0;

  // Résultat de l'import
  importResult: ImportResult | null = null;
  importProgress = 0;

  // Messages d'erreur
  errorMessage = '';
  warningMessage = '';

  showErrors = false; // Pour afficher/masquer les détails des erreurs

  // Abonnements
  private subscriptions: any[] = [];

  constructor(
    private importExportService: UserImportExportService,
    private toastr: ToastrService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Télécharge un modèle CSV avec :
   * - Délimiteur point-virgule (standard français)
   * - BOM UTF-8 pour Excel
   * - Exemples réalistes alignés sous chaque colonne
   */
  downloadCsvTemplate(): void {
    const delimiter = ';';
    const csvContent = `codeutilisateur${delimiter}nom${delimiter}prenom${delimiter}email${delimiter}telephone${delimiter}login${delimiter}password${delimiter}adresse${delimiter}codesociete${delimiter}codesite${delimiter}typeentitesite${delimiter}typeentitedepartement${delimiter}typeentitesociete${delimiter}acheteur${delimiter}roles
XXXXXX${delimiter}Dupont${delimiter}Jean${delimiter}jean.dupont@example.com${delimiter}+242061234567${delimiter}jdupont${delimiter}Password123!${delimiter}123 Rue de la Paix, Brazzaville${delimiter}SOC001${delimiter}SIEGE${delimiter}0${delimiter}0${delimiter}0${delimiter}0${delimiter}04,05`;

    // BOM UTF-8 pour compatibilité Excel
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_import_utilisateurs.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.toastr.success('Modèle CSV téléchargé');
  }

  /**
   * Gérer le glisser-déposer
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelect(files[0]);
    }
  }

  /**
   * Sélectionner un fichier
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelect(input.files[0]);
    }
  }

  private handleFileSelect(file: File): void {
    // Vérifier le type de fichier
    const validTypes = ['text/csv', 'application/vnd.ms-excel'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && fileExtension !== 'csv') {
      this.errorMessage = 'Veuillez sélectionner un fichier CSV valide';
      this.toastr.error(this.errorMessage);
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Le fichier ne doit pas dépasser 5MB';
      this.toastr.error(this.errorMessage);
      return;
    }

    this.selectedFile = file;
    this.errorMessage = '';
    this.warningMessage = '';
    this.analyzeFile(file);
  }

  /**
   * Analyser le fichier pour l'aperçu
   */
  private analyzeFile(file: File): void {
    this.isAnalyzing = true;
    this.importStep = 'preview';

    this.importExportService
      .parseCSVPreview(file)
      .then((preview) => {
        this.previewData = preview;
        this.validRowsCount = preview.filter((p) => p.isValid).length;
        this.invalidRowsCount = preview.filter((p) => !p.isValid).length;
        this.showPreview = true;
        this.isAnalyzing = false;

        if (this.invalidRowsCount > 0) {
          this.warningMessage = `${this.invalidRowsCount} ligne(s) contiennent des erreurs`;
        }
      })
      .catch((error) => {
        this.errorMessage =
          error.message || "Erreur lors de l'analyse du fichier";
        this.toastr.error(this.errorMessage);
        this.isAnalyzing = false;
        this.showPreview = false;
      });
  }

  /**
   * Lancer l'import
   */
  startImport(): void {
    if (!this.selectedFile) {
      this.toastr.warning('Aucun fichier sélectionné');
      return;
    }

    const hasValidRows = this.previewData.some((p) => p.isValid);
    if (!hasValidRows) {
      this.toastr.error('Aucune ligne valide à importer');
      return;
    }

    this.isLoading = true;
    this.importProgress = 0;
    this.importStep = 'result';

    const sub = this.importExportService
      .importUsers(this.selectedFile)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (result) => {
          console.log('Résultat import reçu:', result);

          this.importResult = result;
          this.importProgress = 100;

          const successCount = result.success?.length || 0;
          const errorCount = result.errors?.length || 0;

          if (successCount > 0) {
            this.toastr.success(
              `${successCount} utilisateur(s) importé(s) avec succès`,
            );
          }

          if (errorCount > 0) {
            this.toastr.warning(`${errorCount} ligne(s) en erreur`);
          }

          if (successCount === 0 && errorCount === 0) {
            this.toastr.info('Aucune donnée à importer');
          }

          this.importComplete.emit(result);
        },
        error: (error) => {
          console.error('Erreur import:', error);
          this.toastr.error(error.message || "Erreur lors de l'import");
          this.errorMessage =
            error.message || "Erreur lors de l'import des utilisateurs";
          this.importStep = 'preview';
        },
      });

    this.subscriptions.push(sub);
  }
  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    this.selectedFile = null;
    this.previewData = [];
    this.showPreview = false;
    this.importResult = null;
    this.errorMessage = '';
    this.warningMessage = '';
    this.validRowsCount = 0;
    this.invalidRowsCount = 0;
    this.importStep = 'upload';
    this.importProgress = 0;
    this.showErrors = false; // 🔥 Réinitialiser aussi cette propriété

    // Réinitialiser l'input file
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Fermer le modal
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Obtenir la classe CSS pour une ligne de prévisualisation
   */
  getRowClass(preview: ImportPreview): string {
    return preview.isValid ? 'valid-row' : 'invalid-row';
  }

  /**
   * Obtenir l'icône pour une ligne de prévisualisation
   */
  getRowIcon(preview: ImportPreview): string {
    return preview.isValid
      ? 'ri-checkbox-circle-fill text-success'
      : 'ri-error-warning-fill text-danger';
  }

  /**
   * Formater la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
