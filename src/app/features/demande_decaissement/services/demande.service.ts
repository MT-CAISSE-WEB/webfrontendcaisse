import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { URL_LOCAL } from '../../../_core/routes/backend.root';

@Injectable({
  providedIn: 'root',
})
export class DemandeService {
  base = URL_LOCAL.baseUrl; // adapte si nécessaire

  constructor(private http: HttpClient) {}

  // obtenir le tout à partir de iddemande

  getDemandeComplet(iddemande: string): Observable<any> {
    return forkJoin({
      entete: this.getEntete(iddemande),
      lignes: this.getAllLigne(),
      details: this.getAllDetails(),
    }).pipe(
      map(({ entete, lignes, details }) => {
        const lignesFiltrees = lignes.data.filter(
          (l: any) => l.iddemande === iddemande
        );

        const lignesCompletes = lignesFiltrees.map((l: any) => ({
          ligne: l,
          details: details.data.filter(
            (d: any) => d.idlignedemande === l.idlignedemande
          ),
        }));

        return {
          entete: entete.data ?? entete,
          lignes: lignesCompletes,
        };
      })
    );
  }

  getAllEntetes(_page: number, _limit: number): Observable<any> {
    return this.http.get<any>(`${this.base}entete-demande`, {
      params: { page: _page, limit: _limit },
    });
  }

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

  getAllLigne(params: any = { page: 1, limit: 1000 }): Observable<any> {
    return this.http.get<any>(`${this.base}ligne-demande`, { params });
  }

  updateLigne(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(
      `${this.base}ligne-demande/update/${id}`,
      payload
    );
  }

  deleteLigne(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}ligne-demande/delete/${id}`);
  }

  // DetailsDemande
  createDetail(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}details-demande/create`, payload);
  }

  getAllDetails(params: any = { page: 1, limit: 1000 }): Observable<any> {
    return this.http.get<any>(`${this.base}details-demande`, { params });
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

  // delete by ligne
  deleteDetailsByLigne(idlignedemande: string) {
    return this.http.delete<any>(
      `${this.base}details-demande/delete-by-ligne/${idlignedemande}`
    );
  }
}
