import { HttpClient } from '@angular/common/http';
// import { APP_AFF_DEPT_NATURE_DONNEE_BASE } from "../../../_core/routes/frontend.root";
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

  /**
   * @param id
   */
  saveAffectations(id: string, data: any): Observable<any> {
    return this.http.post<any>(URL_LOCAL.baseUrl + this.url + '/' + id, data);
  }
}
