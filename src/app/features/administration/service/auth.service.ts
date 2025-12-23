import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { URL_LOCAL } from "../../../_core/routes/backend.root";
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

    apiUrl = 'User';

    constructor(private http: HttpClient){}

  login(credetials:any){
      return this.http.post(`${URL_LOCAL.baseUrl}${this.apiUrl}/login`,credetials)
      .pipe(
          tap(((res: any) => {
              if (res.token)
              {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('token',res.token);
                  localStorage.setItem('user',JSON.stringify(res.data));
                }
              }
          }),
        ),
      );
  }

  logout() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('client');
      }

  }

  isLogged() {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem('token');
    }
    return false;
  }

  getToken() {
    if (typeof window !== 'undefined') {
       return localStorage.getItem('token');
    }
    return false;
   
  }
}