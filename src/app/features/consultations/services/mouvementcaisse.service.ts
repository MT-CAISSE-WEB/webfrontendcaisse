import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueryResultModel } from '../../../_core/models/query-result.model';
import { URL_LOCAL } from '../../../_core/routes/backend.root';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MouvementsCaisseService {
  url: string = 'mouvements-caisse/caisse-mensuelle';

  constructor(private http: HttpClient) {}

  getMouvementsCaisse(
    idsociete: string,
    idsite: string,
  ): Observable<QueryResultModel> {
    let params = new HttpParams().set('idsociete', idsociete);
    params = params.set('idsite', idsite);

    return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url, {
      params,
    });
  }
}
