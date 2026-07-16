// services/demande-pj.service.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { URL_LOCAL } from '../../../_core/routes/backend.root';

@Injectable({
  providedIn: 'root',
})
export class JustificatifPJService {
  private baseUrl = URL_LOCAL.baseUrl;

  constructor(private http: HttpClient) {}

  getAll(idjustificatifoperation: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}justificatifs/${idjustificatifoperation}/justificatif-pieces-jointes`,
    );
  }

  create(
    idjustificatifoperation: string,
    files: File[],
    userId: string,
  ): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    return this.http.post(
      `${this.baseUrl}justificatifs/${idjustificatifoperation}/justificatif-pieces-jointes`,
      formData,
    );
  }

  delete(
    idjustificatifoperation: string,
    idpiecejointe: string,
  ): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}justificatifs/${idjustificatifoperation}/justificatif-pieces-jointes/${idpiecejointe}`,
    );
  }

  downloadFile(urlpiece: string): Observable<Blob> {
    // Chemin complet : /api/entete-demande/demandepj-download
    const cleanPath = urlpiece.replace(/\\/g, '/');
    const encodedPath = encodeURIComponent(cleanPath);

    // Version avec le préfixe 'entete-demande'
    const downloadUrl = `${this.baseUrl}justificatifs/justificatifpj-download?path=${encodedPath}`;

    console.log('URL de téléchargement:', downloadUrl);

    return this.http.get(downloadUrl, {
      responseType: 'blob',
    });
  }

  /**
   * Télécharge toutes les pièces jointes d'une demande
   * @param idjustificatifoperation - ID du budget
   */
  downloadAllFiles(idjustificatifoperation: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}justificatifs/${idjustificatifoperation}/justificatif-pieces-jointes/download-all`,
      {
        responseType: 'blob',
      },
    );
  }
}
