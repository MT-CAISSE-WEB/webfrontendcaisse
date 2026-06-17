// centreanalytique.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { QueryResultModel } from '../../../_core/models/query-result.model';
import { URL_LOCAL } from '../../../_core/routes/backend.root';

@Injectable({
  providedIn: 'root',
})
export class CentreAnalytiqueService {
  url: string = 'centreanalytique';

  constructor(private http: HttpClient) {}

  getAll(): Observable<QueryResultModel> {
    return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url);
  }

  create(_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + '/create',
      _object,
    );
  }

  update(_object: any): Observable<any> {
    return this.http.put<any>(
      URL_LOCAL.baseUrl + this.url + '/update/' + _object.idcentreanalytique,
      _object,
    );
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(
      URL_LOCAL.baseUrl + this.url + '/delete/' + id,
    );
  }

  getOne(id: string): Observable<any> {
    return this.http.get<any>(URL_LOCAL.baseUrl + this.url + '/' + id);
  }

  // ✅ Méthode avec FormData (pour la nouvelle modal)
  importCentreAnalytiqueFormData(formData: FormData): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + '/import',
      formData,
    );
  }

  // ✅ Méthode legacy (à conserver pour compatibilité)
  importCentreAnalytique(file: File, _object: any): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('idsociete', _object.idsociete);
    formData.append('createdby', _object.createdby);
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + '/import',
      formData,
    );
  }

  exportCentres(data: any) {
    return this.http.post(URL_LOCAL.baseUrl + this.url + '/export', data, {
      responseType: 'blob',
    });
  }
}
