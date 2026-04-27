import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TiersService {
    url : string = 'tiers' ;

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getAll(): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url);
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
      URL_LOCAL.baseUrl + this.url + "/update/" + _object.idtiers,
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

  importTiers(file: File, _object: any): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('idsociete', _object.idsociete);
    formData.append('createdby', _object.createdby);
    return this.http.post<any>(URL_LOCAL.baseUrl + this.url + '/import', formData);
  }

  exportTiers(data: any) {
    return this.http.post(URL_LOCAL.baseUrl + this.url + '/export',
      data,
      { responseType: 'blob' }
    );
  }
}