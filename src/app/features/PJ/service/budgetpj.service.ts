// services/operation-pj.service.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { URL_LOCAL } from '../../../_core/routes/backend.root';

@Injectable({
  providedIn: 'root',
})
export class BudgetPJService {
  private baseUrl = URL_LOCAL.baseUrl;

  constructor(private http: HttpClient) {}

  getAll(idbudget: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}budget/${idbudget}/budget-pieces-jointes`,
    );
  }

  create(idbudget: string, files: File[], userId: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    return this.http.post(
      `${this.baseUrl}budget/${idbudget}/budget-pieces-jointes`,
      formData,
    );
  }

  delete(idbudget: string, idpiecejointe: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}budget/${idbudget}/budget-pieces-jointes/${idpiecejointe}`,
    );
  }

  downloadFile(urlpiece: string): Observable<Blob> {
    // ⭐ Chemin complet : /api/entete_operation/operationpj-download
    const cleanPath = urlpiece.replace(/\\/g, '/');
    const encodedPath = encodeURIComponent(cleanPath);

    // Version avec le préfixe 'entete_operation'
    const downloadUrl = `${this.baseUrl}budget/budgetpj-download?path=${encodedPath}`;

    return this.http.get(downloadUrl, {
      responseType: 'blob',
    });
  }

  /**
   * Télécharge toutes les pièces jointes d'un budget
   * @param idbudget - ID du budget
   */
  downloadAllFiles(idbudget: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}budget/${idbudget}/budget-pieces-jointes/download-all`,
      {
        responseType: 'blob',
      },
    );
  }
}
