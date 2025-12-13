import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";
import { sitemodel } from "../model/site.model";

@Injectable({
  providedIn: 'root'
})
export class siteservice {
    url : string = 'Site' ;

    constructor(private http: HttpClient) {}

    /**
   * get All
   *
   */
    getAll(): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url);
    }


  /**
   *upsert
   * @param _object
   * 
   */
  upsert(_object : sitemodel): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url,
        _object
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