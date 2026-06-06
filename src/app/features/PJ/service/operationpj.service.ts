// services/operation-pj.service.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { URL_LOCAL } from '../../../_core/routes/backend.root';

@Injectable({
  providedIn: 'root',
})
export class OperationPJService {
  private baseUrl = URL_LOCAL.baseUrl;

  constructor(private http: HttpClient) {}

  getAll(idoperation: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}entete_operation/${idoperation}/operation-pieces-jointes`,
    );
  }

  create(idoperation: string, files: File[], userId: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    return this.http.post(
      `${this.baseUrl}entete_operation/${idoperation}/operation-pieces-jointes`,
      formData,
    );
  }

  delete(idoperation: string, idpiecejointe: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}entete_operation/${idoperation}/operation-pieces-jointes/${idpiecejointe}`,
    );
  }

  downloadFile(urlpiece: string): Observable<Blob> {
    // ⭐ Chemin complet : /api/entete_operation/operationpj-download
    const cleanPath = urlpiece.replace(/\\/g, '/');
    const encodedPath = encodeURIComponent(cleanPath);

    // Version avec le préfixe 'entete_operation'
    const downloadUrl = `${this.baseUrl}entete_operation/operationpj-download?path=${encodedPath}`;

    return this.http.get(downloadUrl, {
      responseType: 'blob',
    });
  }
}
