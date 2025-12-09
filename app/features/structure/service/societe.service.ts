import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class societeservice {
    url : string = 'Societe' ;

    constructor(private http: HttpClient) {}

    /**
   * get All
   *
   */
    getAll(): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url);
    }

    
    /**
   * get All
   *
   */
    getAlldevisesactif(): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url+'/devises');
    }


  /**
   *upsert
   * @param _object
   * 
   */
  upsert(formdata : FormData): Observable<any> {
    console.log(formdata);
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url,
      formdata
    );
  }

  /**
   * delete
   * @param id
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(
      URL_LOCAL.baseUrl + this.url + "/" + id
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

}