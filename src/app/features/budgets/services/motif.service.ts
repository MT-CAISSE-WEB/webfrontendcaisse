import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueryResultModel } from '../../../_core/models/query-result.model';
import { URL_LOCAL } from '../../../_core/routes/backend.root';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MotifService {
    url: string = 'motif';

  constructor(private http: HttpClient) {}

  /**
   * get All
   * @param params
   */
  getAll(params: any = {}): Observable<QueryResultModel> {
    return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url, {
      params,
    });
  }
}