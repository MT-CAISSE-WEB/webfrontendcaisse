import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ConsultationOpService {
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
   * get demande detail
   * @param params
   */
    getdemandeDetail(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/demande_detail', _data);
    }

    // Autor : Richard Toulou
    printJournalCaisse(donnees: any): Observable<Blob> {
        return this.http.post(
            `${URL_LOCAL.baseUrl}${this.url}/journalcaisse/`,
            donnees,
            { responseType: 'blob' }
        );
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

    /**
   * get paiement
   * @param params
   */
    getAllpayment(params: any): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/allpayment', {params});
    }

     /**
   * get All
   * @param params
   */
    getEtatcloture(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/cloture/caisse', _data);
    }

    printEtatcloture(donnees: any): Observable<Blob> {
        return this.http.post(
            `${URL_LOCAL.baseUrl}${this.url}/etat/cloture/pdf`,
            donnees,
            { responseType: 'blob' }
        );
    }

    /**
     * Solde de caisse
     */
    get_soldeAllCaisse(){
        return this.http.get<any>(URL_LOCAL.baseUrl + this.url + "/caisse/solde/");
    }
}