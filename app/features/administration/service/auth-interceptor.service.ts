import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthRedirectService } from './auth-redirect.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private redirectService: AuthRedirectService) {}

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
        if (err.status === 401 || err.status === 403) {
          this.redirectService.redirectToLogin();
        }
        return throwError(() => err);
      })
    );
  }
}
