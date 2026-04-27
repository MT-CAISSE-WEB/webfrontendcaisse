import { HttpClient } from "@angular/common/http";
import { APP_AFF_NATURE_CENTRE_DONNEE_BASE } from "../../../_core/routes/frontend.root";
import { Observable } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class AffectationNatureCentreService {
    url : string = 'affectationnaturecentre';

    constructor(private http: HttpClient) {}

  /**
   * get one
   * @param id
   */
  getAll(id: string): Observable<any> {
    return this.http.get<any>(
      URL_LOCAL.baseUrl + this.url + "/" + id
    );
  }


  /**
   * @param id
   */
  saveAffectations(idnature: string, data: any, info: any): Observable<any> {
    const payload = {idsCentres: data, info: info};

    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/" + idnature, payload);
  }


  exportAffectations(data: any) {
    return this.http.post(URL_LOCAL.baseUrl + this.url + '/export/nature',
      data,
      { responseType: 'blob' }
    );
  }


  import_affectations(file: File, info: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idsociete', info.idsociete);
    formData.append('createdby', info.createdby);
    return this.http.post<any>(URL_LOCAL.baseUrl + this.url + '/import/nature', formData);
  }

}