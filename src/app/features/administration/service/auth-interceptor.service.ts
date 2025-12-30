import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem("token");

    let clone = req;
    if (token) {
      clone = req.clone({
        headers: req.headers.set("Authorization", `Bearer ${token}`)
      });
    }

    return next.handle(clone).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('HTTP Error:', err);
        if (err.status === 401 ) {
          //alert(' Vous n’êtes pas authentifié ou votre session a expiré.');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        if (err.status === 403)
        {
         //alert(' Accès refusé : vous n’avez pas les droits nécessaires.'); 
         //this.router.navigate(['/login']);
        }
      
        return throwError(() => err);
      })
    );
  }
}
