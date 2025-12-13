import { Injectable } from "@angular/core";
import { Router } from "@angular/router";


@Injectable({ providedIn: 'root' })
export class RouteRefresherService {

  constructor(private router: Router) {}

  refresh() {
    const current = this.router.url;

    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([current]);
    });
  }
}
