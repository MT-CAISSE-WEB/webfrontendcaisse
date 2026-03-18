import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class SuiviBudgetByFiltresService {
    url : string = 'suivibudget/recherche' ;

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getEvolBudget (params : any): Observable<any> {
        return this.http.post<any>(URL_LOCAL.baseUrl + this.url , params);
    }

}