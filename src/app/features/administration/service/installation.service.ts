import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class InstallationService {
    url : string = 'Installation' ;

    constructor(private http: HttpClient) {}

    checkInstallation(): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url + "/checkinstallation");
     };

     
     /**
   *upsert
   * @param _object
   * 
   */
  upsert(_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url+"/install",
      _object
    );
  }

}