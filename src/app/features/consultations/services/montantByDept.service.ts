import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueryResultModel } from '../../../_core/models/query-result.model';
import { URL_LOCAL } from '../../../_core/routes/backend.root';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StatsMontantbyDeptService {
  url: string = 'statsmontant/montant-by-departement';

  constructor(private http: HttpClient) {}

  getMontantByDept(): Observable<QueryResultModel> {
    return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url);
  }
}
