import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class CaisseRegleService {

  parseCFA(valeur: string | null | undefined): number {
    if (!valeur) return 0;
    return Number(valeur.replace(/[^\d]/g, ''));
  }

  calculMontantRef(montant: number, taux: number): number {
    return montant * taux;
  }

  checkSoldeCaisse(montant: number, solde: number): boolean {
    return montant <= solde;
  }

  checkDepassementMontantRef(montantRef: number, montantGlobal: number): boolean {
    return montantRef <= montantGlobal;
  }

  isCaisseOverTotal(
    montantRef: number,
    currentCaisse: FormGroup,
    caisses: FormArray,
    montantGlobal: number
  ): boolean {

    const totalAutresCaisses = caisses.controls
      .filter(c => c !== currentCaisse)
      .reduce((sum, c: any) => {
        return sum + (parseFloat(c.get('montantref')?.value) || 0);
      }, 0);

    return (totalAutresCaisses + montantRef) > montantGlobal;
  }

  controlTotalCaisses(caisses: FormArray, maxMontantRef: number): boolean {

    const totalRef = caisses.controls.reduce((sum, c: any) =>
      sum + (parseFloat(c.get('montantref')?.value) || 0), 0
    );

    return totalRef <= maxMontantRef;
  }

}