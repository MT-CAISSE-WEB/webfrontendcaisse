import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { URL_LOCAL } from '../../../_core/routes/backend.root';
import { ImportResult, ImportPreview } from '../model/import-result.model';
import { User, UserFilters } from '../model/user_import.model';

@Injectable({
  providedIn: 'root',
})
export class UserImportExportService {
  private baseUrl = `${URL_LOCAL.baseUrl}import/User`;

  constructor(private http: HttpClient) {}

  /**
   * Exporter les utilisateurs en CSV
   */
  exportUsers(filters?: UserFilters): Observable<Blob> {
    let params = new HttpParams();

    if (filters?.idsociete) {
      params = params.set('idsociete', filters.idsociete);
    }
    if (filters?.idsite) {
      params = params.set('idsite', filters.idsite);
    }

    return this.http
      .get(`${this.baseUrl}/export`, {
        params,
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (!response.body) {
            throw new Error('Aucune donnée reçue');
          }
          return response.body;
        }),
        catchError((error) => {
          console.error('Erreur export:', error);
          return throwError(
            () => new Error("Erreur lors de l'export des utilisateurs"),
          );
        }),
      );
  }

  /**
   * Importer des utilisateurs depuis un CSV
   */
  importUsers(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<any>(`${this.baseUrl}/import`, formData).pipe(
      map((response) => {
        // Extraire directement les details
        const details = response.data?.details || response;

        return {
          success: details.success || [],
          errors: details.errors || [],
          total: details.total || 0,
        };
      }),
      catchError((error) => {
        console.error('Erreur import:', error);
        return throwError(
          () =>
            new Error(
              error.error?.message ||
                "Erreur lors de l'import des utilisateurs",
            ),
        );
      }),
    );
  }

  /**
   * Télécharger le template CSV
   */
  downloadTemplate(): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}/template/download`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (!response.body) {
            throw new Error('Aucune donnée reçue');
          }
          return response.body;
        }),
        catchError((error) => {
          console.error('Erreur téléchargement template:', error);
          return throwError(
            () => new Error('Erreur lors du téléchargement du template'),
          );
        }),
      );
  }

  /**
   * Obtenir le template avec ses instructions
   */
  getTemplateInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/template`).pipe(
      catchError((error) => {
        console.error('Erreur récupération template:', error);
        return throwError(
          () => new Error('Erreur lors de la récupération du template'),
        );
      }),
    );
  }

  /**
   * Lire et analyser un fichier CSV pour l'aperçu
   */
  parseCSVPreview(file: File): Promise<ImportPreview[]> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http
      .post<{ success: boolean; data: any }>(
        `${this.baseUrl}/import/preview`,
        formData,
      )
      .pipe(
        map((res) => {
          if (!res.success) throw new Error("Erreur d'aperçu");

          // Extraire le tableau preview de la réponse
          const previewData = res.data?.preview || [];

          // Transformer les données pour correspondre au format attendu
          return previewData.map((item: any) => ({
            rowNumber: item.rowNumber || 0,
            isValid: item.isValid || false,
            errors: item.errors || [],
            data: {
              codeutilisateur:
                item.validatedData?.codeutilisateur ||
                item.originalData?.codeutilisateur ||
                '',
              nom: item.validatedData?.nom || item.originalData?.nom || '',
              prenom:
                item.validatedData?.prenom || item.originalData?.prenom || '',
              email:
                item.validatedData?.email || item.originalData?.email || '',
              login:
                item.validatedData?.login || item.originalData?.login || '',
              codesociete:
                item.validatedData?.codesociete ||
                item.originalData?.codesociete ||
                '',
              codesite:
                item.validatedData?.codesite ||
                item.originalData?.codesite ||
                '',
            },
          }));
        }),
        catchError((error) => {
          console.error('Erreur preview:', error);
          return throwError(
            () => new Error("Erreur lors de l'aperçu du fichier"),
          );
        }),
      )
      .toPromise() as Promise<ImportPreview[]>;
  }

  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  private isValidPassword(password: string): boolean {
    const re =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  }
}
