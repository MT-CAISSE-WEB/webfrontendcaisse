import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_LOCAL } from '../../../_core/routes/backend.root';

@Injectable({
  providedIn: 'root',
})
export class DemandeService {
  base = URL_LOCAL.baseUrl; // adapte si nécessaire

  constructor(private http: HttpClient) {}

  // EnteteDemande
  createEntete(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}entete-demande/create`, payload);
  }

  updateEntete(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(
      `${this.base}entete-demande/update/${id}`,
      payload
    );
  }

  getEntete(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}entete-demande/${id}`);
  }

  deleteEntete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}entete-demande/delete/${id}`);
  }

  // LigneDemande
  createLigne(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}ligne-demande/create`, payload);
  }

  createLignesBatch(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}ligne-demande/batch`, payload);
  }

  updateLigne(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(
      `${this.base}ligne/ligne-demande/${id}`,
      payload
    );
  }

  getLignesByDemande(iddemande: string): Observable<any> {
    const params = {
      iddemande,
      limit: 1000, // Pour récupérer largement toutes les lignes
      page: 1,
    };

    return this.http.get<any>(`${URL_LOCAL.baseUrl}ligne-demande`, { params });
  }

  deleteLigne(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}ligne-demande/delete/${id}`);
  }

  // DetailsDemande
  createDetail(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}details-demande/create`, payload);
  }

  createDetailsBatch(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/details-demande/batch`, payload);
  }

  getDetailsByLigne(idlignedemande: string): Observable<any> {
    const params = {
      idlignedemande,
      limit: 1000,
      page: 1,
    };

    return this.http.get<any>(`${URL_LOCAL.baseUrl}details-demande`, {
      params,
    });
  }

  updateDetail(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(
      `${this.base}details-demande/update/${id}`,
      payload
    );
  }

  deleteDetail(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}details-demande/delete/${id}`);
  }
}
