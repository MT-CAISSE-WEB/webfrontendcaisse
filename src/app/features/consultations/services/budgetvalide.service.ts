import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueryResultModel } from '../../../_core/models/query-result.model';
import { URL_LOCAL } from '../../../_core/routes/backend.root';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StatsbudgetValideService {
  url: string = 'statsbudget/budget-valide';

  constructor(private http: HttpClient) {}

  getBudgetValide(
    idsociete: string,
    idsite?: string,
  ): Observable<QueryResultModel> {
    let params = new HttpParams().set('idsociete', idsociete);

    if (idsite) {
      params = params.set('idsite', idsite);
    }

    return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url, {
      params,
    });
  }
}
