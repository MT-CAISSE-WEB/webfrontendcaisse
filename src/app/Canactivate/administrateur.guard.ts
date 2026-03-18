import { booleanAttribute, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
    isadmin : boolean = false;

  constructor(private router: Router) {}

  canActivate(): boolean {
     if (typeof window !== 'undefined') {
            const user =JSON.parse(localStorage.getItem('user') || '{}') ;

        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];
            if (element['code'] ==='01')
                {
                    this.isadmin = true;  
                }
        }
    }
     return this.isadmin;
   
   }
}