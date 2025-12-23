import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class utilisateurroleservice {
    url : string = 'Utilisateur_role' ;

    constructor(private http: HttpClient) {}
   
    getAll(): Observable<QueryResultModel> {
        return this.http.get<QueryResultModel>(URL_LOCAL.baseUrl + this.url);
    }

    getutilisateurroles (idutilisateur:any):Observable<any> {
       return this.http.get<any>(URL_LOCAL.baseUrl + this.url +"/"+ idutilisateur +"/roles");
    }


     /**
   *upsert
   * @param _object
   * 
   */
  upsert(_object: any): Observable<any> {

    console.log(_object);
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url,
      _object
    );
  }

   /**
   * delete
   * @param id
   */
  delete(idutilisateur:string,idrole:string): Observable<any> {
    return this.http.delete<any>(
      URL_LOCAL.baseUrl + this.url+"/"+idutilisateur+"/roles/"+idrole
    );
  }

//     /**
//    * get one
//    * @param id
//    */
//   getOne(id: string): Observable<any> {
//     return this.http.get<any>(
//       URL_LOCAL.baseUrl + this.url + "/" + id
//     );
//   }
}