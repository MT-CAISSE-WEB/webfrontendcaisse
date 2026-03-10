import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ConsultationDecaissementaj {
    url : string = 'consultation';

    constructor(private http: HttpClient) {}

   /**
   * get Consultation des decaissements A justifier
   * @param params
   */
    getAlldecaissemenaj(data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/decaissement_justificatif', data);
    }
}