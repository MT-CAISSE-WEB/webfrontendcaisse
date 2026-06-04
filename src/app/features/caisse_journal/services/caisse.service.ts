import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class CaisseService {
    url : string = 'caisse' ;

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
   * get All
   * @param params
   */
    getAllactif(): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url + "/actif");
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
      URL_LOCAL.baseUrl + this.url + "/update/" + _object.idcaisse,
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

  /**
   * get one
   * @param id
   */
  getRecentCaisse(id: string): Observable<any> {
    return this.http.get<any>(
      URL_LOCAL.baseUrl + this.url + "/periode/" + id
    );
  }

  /**
   * get close caisse
   * @param id
   */
  getCloseCaisse(id: string): Observable<any> {
    return this.http.get<any>(
      URL_LOCAL.baseUrl + this.url + "/close/" + id
    );
  }

  /**
   * open caisse
   * @param _object
   */
  open(id: string, _object: any): Observable<any> {
    return this.http.put<any>(
      URL_LOCAL.baseUrl + this.url + "/open/" + id,
      _object
    );
  }

  /**
   * close caisse
   * @param _object
   */
  close(id: string, _object: any): Observable<any> {
    return this.http.put<any>(
      URL_LOCAL.baseUrl + this.url + "/close/" + id,
      _object
    );
  }

  /**
   * create caisse billetage
   * @param _object
   */
  createBilletage(_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/billetage",
      _object
    );
  }

  /**
   * get solde
   */
  getSolde(): Observable<any> {
    return this.http.get<any>(
      URL_LOCAL.baseUrl + this.url + "/solde/user"
    );
  }

  /**
   * Recalculer le solde des caisses à partir d'une date
   */
  recalculate(body: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/recalculate",
      body
    );
  }


  /**
   * Solde de caisse par date
   */
  get_soldeCaisse(payload: any) {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/tresorerie",
      payload
    );
  }


}