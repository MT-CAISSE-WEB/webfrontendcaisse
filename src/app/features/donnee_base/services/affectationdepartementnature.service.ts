import { HttpClient } from '@angular/common/http';
import { APP_AFF_DEPT_NATURE_DONNEE_BASE } from '../../../_core/routes/frontend.root';
import { Observable } from 'rxjs';
import { QueryResultModel } from '../../../_core/models/query-result.model';
import { URL_LOCAL } from '../../../_core/routes/backend.root';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AffectationDepartementNatureService {
  url: string = 'affectationdepartementnature';

  constructor(private http: HttpClient) {}

  /**
   * get one
   * @param id
   */
  getAll(id: string): Observable<any> {
    return this.http.get<any>(URL_LOCAL.baseUrl + this.url + '/' + id);
  }

  saveAffectations(
    iddepartement: string,
    data: any,
    info: any,
  ): Observable<any> {
    const payload = { idsNatures: data, info: info };
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + '/' + iddepartement,
      payload,
    );
  }

  exportAffectations(data: any) {
    return this.http.post(
      URL_LOCAL.baseUrl + this.url + '/export/departement',
      data,
      { responseType: 'blob' },
    );
  }

  import_affectations(file: File, info: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idsociete', info.idsociete);
    formData.append('createdby', info.createdby);
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + '/import/departement',
      formData,
    );
  }

  // Méthode avec FormData pour l'import
  importAffectationsFormData(formData: FormData): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + '/import/departement',
      formData,
    );
  }
}
