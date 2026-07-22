import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CaisseSelectionService {
  private selectedCaisseId = new BehaviorSubject<string | null>(null);
  selectedCaisseId$ = this.selectedCaisseId.asObservable();

  selectCaisse(id: string | null): void {
    this.selectedCaisseId.next(id);
  }
}
