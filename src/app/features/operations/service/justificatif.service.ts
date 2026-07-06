import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class JustificatifService {
    url : string = 'justificatifs';

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getJustificatifs(params: any = {}): Observable<QueryResultModel> {
      return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url, {
        params,
      });
    }

    /**
   * get All Details justificatifs
   * @param params
   */
    getdetailsJustificatif(params: any = {}): Observable<QueryResultModel> {
      return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + 'justificatifs-details', {
        params,
      });
    }

  /**
   * create
   * @param _object
   * 
   */
  create(_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/full/create",
      _object
    );
  }

  /**
   * update
   * @param _object
   */
  update(_object: any): Observable<any> {
    return this.http.put<any>(
      URL_LOCAL.baseUrl + this.url + "/full/update/" + _object.idoperation,
      _object
    );
  }

  /**
   * delete
   * @param id
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(
      URL_LOCAL.baseUrl + this.url + "/full/delete/" + id
    );
  }


  /**
   * get one
   * @param id
   */
  getOne(id: string): Observable<any> {
    return this.http.get<any>(
      URL_LOCAL.baseUrl + this.url + "/" + id
    );
  }

    /**
     * get one document justificatifs
     */
    getdocJustificatif(idoperation: string): Observable<Blob> {
      return this.http.get(
        `${URL_LOCAL.baseUrl}${this.url}/full/document/${idoperation}`,
        { responseType: 'blob' },
      );
    }

}