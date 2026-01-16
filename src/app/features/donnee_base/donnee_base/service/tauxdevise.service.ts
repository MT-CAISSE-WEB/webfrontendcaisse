import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class tauxdeviseservice {
    url : string = 'Tauxdevise' ;

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getAll(params: any = {}): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url, {
        params,
        });
    }

     getAlldevisesactif (params: any = {}): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url+'/devises');
    }

  /**
   *upsert
   * @param _object
   * 
   */
  upsert(_object: any): Observable<any> {
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

  /**
   *get dernier taux
   * @param _object
   * 
   */
  tauxrecent(_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/recent",
      _object
    );
  }

}