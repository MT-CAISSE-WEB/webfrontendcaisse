import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private isMenuOpenSubject = new BehaviorSubject<boolean>(false);
  isMenuOpen$ = this.isMenuOpenSubject.asObservable();

  /**
   * Bascule l'état du menu (ouvert/fermé)
   */
  toggleMenu(): void {
    this.isMenuOpenSubject.next(!this.isMenuOpenSubject.value);
  }

  /**
   * Définit l'état du menu
   * @param state true = ouvert, false = fermé
   */
  setMenuState(state: boolean): void {
    this.isMenuOpenSubject.next(state);
  }

  /**
   * Récupère l'état actuel du menu
   */
  getMenuState(): boolean {
    return this.isMenuOpenSubject.value;
  }
}
