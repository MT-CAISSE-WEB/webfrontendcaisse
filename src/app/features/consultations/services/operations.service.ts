import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
    url : string = 'consultation';

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getJournalpaiement(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/journalpaiement', _data);
    }

    /**
   * get operation detail
   * @param params
   */
    getDetailoperation(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/detailoperation', _data);
    }

    /**
   * get Last Operation
   * @param params
   */
    getLastOperation(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/lastoperation', _data);
    }

    /**
   * get Historique
   * @param params
   */
    getHistoryOperation(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/historyoperation', _data);
    }
}