import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";
import { dataTool } from "echarts";

@Injectable({
  providedIn: 'root'
})
export class ComptabilisationService {
    url : string = 'comptabilisation';

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getComptabilisation(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/journalpaiement', _data);
    }


    /**
   * get Last Operation
   * @param params
   */
    getLastOperation(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/lastoperation', _data);
    }

    /**
   * get toutes les ecritures
   * @param params
   */
    getAllEcriture(_data: any): Observable<QueryResultModel> {
        console.log(_data);
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/Ecriture/LigneEcriture', _data);
    }

    /**
   * get toutes les ecritures
   * @param params
   */
    Comptabilisationdefinitive(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/Ecriture/LigneEcriture/comptabilisationdefinitive', _data);
    }

     /**
   * get generate ecriture
   * @param params
   */
    generateEcriture(_data: any): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + '/' + _data.operation, _data);
    }

}