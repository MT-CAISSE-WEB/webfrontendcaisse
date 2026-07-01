import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";
import { Correspondance } from "../models/parametrecomptable.model";

@Injectable({
  providedIn: 'root'
})
export class ParametreComptableService {
    url : string = 'parametrecomptable' ;

    constructor(private http: HttpClient) {}

    /**
   * get All
   * @param params
   */
    getAll(params: any = {}): Observable<QueryResultModel> {
        return this.http.post<QueryResultModel>(URL_LOCAL.baseUrl + this.url + "/getall/", params);
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
   * save
   * @param _object
   */
  save(_object: any): Observable<any> {
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/save/",
      _object
    );
  }

  // Récupérer l'état du switch "entité site"
  getEntiteSite(): Observable<{ value: boolean }> {
    return this.http.get<{ value: boolean }>(`${URL_LOCAL.baseUrl}/entite-site`);
  }

  // Mettre à jour l'état du switch "entité site"
  saveAnalytiqueEntiteSite(data: any): Observable<any> {
    return this.http.put(URL_LOCAL.baseUrl + this.url + "/entite-site", data);
  }

  // Mettre à jour l'état du switch "Analytique table correspondance"
  saveAnalytiqueTable(data: any): Observable<any> {
    return this.http.put(URL_LOCAL.baseUrl + this.url + "/table-correspondance", data);
  }

  // Mettre à jour l'état du switch "Analytique axe second"
  saveAxeSecond(data: any): Observable<any> {
    return this.http.put(URL_LOCAL.baseUrl + this.url + "/axesecond", data);
  }

  // Récupérer toutes les correspondances
  getCorrespondances(): Observable<any[]> {
    return this.http.get<any[]>(URL_LOCAL.baseUrl + this.url + "/correspondances");
  }

  // Ajouter une correspondance
  addCorrespondance(data: { idcentreanalytique: string; correspondance: string }): Observable<any> {
    return this.http.post<any>(URL_LOCAL.baseUrl + this.url + "/correspondances", data);
  }

  // Modifier une correspondance
  updateCorrespondance(idcorrespondance: any, data: { idcentreanalytique: string; correspondance: string }): Observable<any> {
    return this.http.put<any>(URL_LOCAL.baseUrl + this.url + `/correspondances/${idcorrespondance}`, data);
  }

  // Supprimer une correspondance
  deleteCorrespondance(id: string): Observable<any> {
    return this.http.delete(URL_LOCAL.baseUrl + this.url + `/correspondances/${id}`);
  }

  
}