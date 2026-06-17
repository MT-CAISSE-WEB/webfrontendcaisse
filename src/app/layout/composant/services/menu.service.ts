import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private isMenuOpenSubject = new BehaviorSubject<boolean>(false);
  isMenuOpen$ = this.isMenuOpenSubject.asObservable();

  private isMobileSubject = new BehaviorSubject<boolean>(
    window.innerWidth <= 768,
  );
  isMobile$ = this.isMobileSubject.asObservable();

  constructor() {
    window.addEventListener('resize', () => {
      const isMobile = window.innerWidth <= 768;
      this.isMobileSubject.next(isMobile);
      // Sur desktop, le menu est toujours visible
      if (!isMobile) {
        this.isMenuOpenSubject.next(true);
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpenSubject.next(!this.isMenuOpenSubject.value);
  }

  setMenuState(isOpen: boolean): void {
    this.isMenuOpenSubject.next(isOpen);
  }
}
