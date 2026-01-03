import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";
import { circuitvalidationmodel } from "../model/circuitvalidation.model";

@Injectable({
  providedIn: 'root'
})
export class circuitvalidationservice {
    url : string = 'circuitvalidation' ;

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getAll(params: any = {}): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url, {
        params
        });
    }

  /**
   *upsert
   * @param _object
   * 
   */
   create (_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/create",
      _object
    );
  }

    /**
   *upsert
   * @param _object
   * 
   */
   createcomplete (_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/",
      _object
    );
  }

    /**
   *upsert
   * @param _object
   * 
   */
   update (_object : circuitvalidationmodel): Observable< circuitvalidationmodel> {
    return this.http.put < circuitvalidationmodel>(
      URL_LOCAL.baseUrl + this.url+"/update/"+_object.idcircuitvalidation,_object
    );
  }

  /**
   * delete
   * @param id
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(
      URL_LOCAL.baseUrl + this.url + "/delete/" + id
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