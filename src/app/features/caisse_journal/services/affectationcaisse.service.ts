import { HttpClient } from "@angular/common/http";
import { APP_JOURNAL_CAISSE_JOURNAL } from "../../../_core/routes/frontend.root";
import { Observable, catchError, shareReplay, tap, throwError } from "rxjs";
import { QueryResultModel } from "../../../_core/models/query-result.model";
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class AffectationCaisseService {
    url : string = 'utilisateur_caisse' ;
    private readonly caissesByUserCache = new Map<string, Observable<any>>();
    private readonly caissesPeriodeByUserCache = new Map<string, Observable<any>>();

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
    ).pipe(tap(() => this.clearCaissesByUserCache()));
  }

  /**
   * update
   * @param _object
   */
  update(_object: any): Observable<any> {
    return this.http.put<any>(
      URL_LOCAL.baseUrl + this.url + "/update/" + _object.idutilisateurcaisse,
      _object
    ).pipe(tap(() => this.clearCaissesByUserCache()));
  }

  /**
   * delete
   * @param id
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(
      URL_LOCAL.baseUrl + this.url + "/delete/" + id
    ).pipe(tap(() => this.clearCaissesByUserCache()));
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
  getCaisseByUser(id: string | null): Observable<any> {
    const cacheKey = String(id ?? '');
    const cachedCaisses = this.caissesByUserCache.get(cacheKey);

    if (cachedCaisses) {
      return cachedCaisses;
    }

    const request$ = this.http
      .get<any>(URL_LOCAL.baseUrl + this.url + '/user/' + cacheKey)
      .pipe(
        // Un seul appel HTTP est exécuté, même si plusieurs composants se chargent en parallèle.
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((error) => {
          this.caissesByUserCache.delete(cacheKey);
          return throwError(() => error);
        }),
      );

    this.caissesByUserCache.set(cacheKey, request$);
    return request$;
  }

  /** Force le prochain chargement des caisses utilisateur à interroger le backend. */
  clearCaissesByUserCache(id?: string | null): void {
    if (id === undefined) {
      this.caissesByUserCache.clear();
      this.caissesPeriodeByUserCache.clear();
      return;
    }

    this.caissesByUserCache.delete(String(id));
    this.caissesPeriodeByUserCache.delete(String(id));
  }

  /**
   * get one
   * @param id
   */
  getCaissePeriodeByUser(id: string | null): Observable<any> {
    const cacheKey = String(id ?? '');
    const cachedCaissesPeriode = this.caissesPeriodeByUserCache.get(cacheKey);

    if (cachedCaissesPeriode) {
      return cachedCaissesPeriode;
    }

    const request$ = this.http
      .get<any>(URL_LOCAL.baseUrl + this.url + '/periode/user/' + cacheKey)
      .pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((error) => {
          this.caissesPeriodeByUserCache.delete(cacheKey);
          return throwError(() => error);
        }),
      );

    this.caissesPeriodeByUserCache.set(cacheKey, request$);
    return request$;
  }

  getCaissesUserPeriode(payload: any){
    return this.http.post<any>(
      URL_LOCAL.baseUrl + this.url + "/periode/caisse/",
      payload
    );
  }

}
