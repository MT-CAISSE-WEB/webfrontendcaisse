import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
    url : string = 'suivibudget';

    constructor(private http: HttpClient) {}

    /**
   * get evolution globale budget
   * @param params
   */
    getEvolBudget(data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/evolution', data);
    }
}