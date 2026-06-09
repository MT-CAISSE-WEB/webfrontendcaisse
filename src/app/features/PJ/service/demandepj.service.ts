// services/demande-pj.service.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { URL_LOCAL } from '../../../_core/routes/backend.root';

@Injectable({
  providedIn: 'root',
})
export class DemandePJService {
  private baseUrl = URL_LOCAL.baseUrl;

  constructor(private http: HttpClient) {}

  getAll(iddemande: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}entete-demande/${iddemande}/demande-pieces-jointes`,
    );
  }

  create(iddemande: string, files: File[], userId: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    return this.http.post(
      `${this.baseUrl}entete-demande/${iddemande}/demande-pieces-jointes`,
      formData,
    );
  }

  delete(iddemande: string, idpiecejointe: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}entete-demande/${iddemande}/demande-pieces-jointes/${idpiecejointe}`,
    );
  }

  downloadFile(urlpiece: string): Observable<Blob> {
    // ⭐ Chemin complet : /api/entete-demande/demandepj-download
    const cleanPath = urlpiece.replace(/\\/g, '/');
    const encodedPath = encodeURIComponent(cleanPath);

    // Version avec le préfixe 'entete-demande'
    const downloadUrl = `${this.baseUrl}entete-demande/demandepj-download?path=${encodedPath}`;

    console.log('URL de téléchargement:', downloadUrl);

    return this.http.get(downloadUrl, {
      responseType: 'blob',
    });
  }
}
