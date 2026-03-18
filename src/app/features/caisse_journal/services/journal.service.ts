import { HttpClient } from "@angular/common/http";
import { APP_JOURNAL_CAISSE_JOURNAL } from "../../../_core/routes/frontend.root";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class JournalService {
    url : string = 'journal' ;

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

  /**
   * create
   * @param _object
   * 
   */
  create(_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/create",
      _object
    );
  }

  /**
   * update
   * @param _object
   */
  update(_object: any): Observable<any> {
    return this.http.put<any>(
      URL_LOCAL.baseUrl + this.url + "/update/" + _object.idjournal,
      _object
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