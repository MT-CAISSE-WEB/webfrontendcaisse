import { HttpClient } from '@angular/common/http';
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

  getBudgetValide(idsociete: string): Observable<QueryResultModel> {
    return this.http.get<QueryResultModel>(
      URL_LOCAL.baseUrl + this.url + '/' + idsociete,
    );
  }
}
