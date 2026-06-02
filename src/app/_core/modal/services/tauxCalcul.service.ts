import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DemandeService } from '../../../features/demande/services/demande.service';
import { tauxdevisemodel } from '../../../features/donnee_base/donnee_base/model/tauxdevise.model';

@Injectable({ providedIn: 'root' })

export class TauxCalculService {
  constructor(private demandeService: DemandeService) {}

  getDernierTaux(payload: any): Observable<tauxdevisemodel | null> {
    return this.demandeService.tauxrecent(payload).pipe(
      map(res => (res.success ? res.data : null))
    );
  }

  buildDernierTauxPayload(iddeviseorigine: any, iddevisedestination: any, datepiece: any) {
    return {
      iddeviseorigine,
      iddevisedestination,
      datepiece
    };
  }

  isReferenceDevise(deviseTransaction: any, deviseReference: any): boolean {
    return deviseTransaction === deviseReference;
  }

  getTauxFromCaisses(caisses: FormArray, deviseTransaction: any): number {
    const matchingCaisses = caisses.controls.filter(c =>
      c.get('iddevisecaisse')?.value !== deviseTransaction
    );

    if (matchingCaisses.length === 0) {
      return 1;
    }

    return parseFloat(matchingCaisses[0].get('taux')?.value) || 1;
  }

  calculateMontantRefGlobal(totalLignes: number, taux: number): number {
    return totalLignes * taux;
  }

  patchTauxTransaction(operationForm: FormGroup, taux: number, emitEvent: boolean = true): void {
    operationForm.patchValue(
      { tauxoperation: taux },
      { emitEvent }
    );
  }
  
}
