import { Injectable } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";

@Injectable({ providedIn: 'root' })

export class CaisseValidationService {

  calculateMontantRef(montant: number, taux: number): number {
    return montant * taux;
  }

  isSoldeInsufficient(montant: number, solde: number, typePaiement?: string): boolean {
    return typePaiement !== 'encaissement' && montant > solde;
  }

  isCaisseOverTotal(caisses: FormArray, currentCaisse: FormGroup, montantRef: number, montantGl: number): boolean {
    const totalAutresCaisses = caisses.controls
      .filter(c => c !== currentCaisse)
      .reduce((sum, c) => sum + (parseFloat(c.get('montantref')?.value) || 0), 0);

    return totalAutresCaisses + montantRef > montantGl;
  }

  calculateTotalCaisses(caisses: FormArray): number {
    return caisses.controls.reduce(
      (sum, c) => sum + (parseFloat(c.get('montantref')?.value) || 0),
      0
    );
  }

  calculateResteARepartir(caisses: FormArray, maxMontantRef: number): number {
    return maxMontantRef - this.calculateTotalCaisses(caisses);
  }

  controlTotalCaisses(caisses: FormArray, operationForm: FormGroup, maxMontantRef: number): void {
    const totalRef = this.calculateTotalCaisses(caisses);

    if (totalRef > maxMontantRef) {
      operationForm.setErrors({
        ...(operationForm.errors || {}),
        totalCaisseDepasse: true
      });
    } else if (operationForm.hasError('totalCaisseDepasse')) {
      const errors = { ...operationForm.errors };
      delete errors['totalCaisseDepasse'];
      Object.keys(errors).length ? operationForm.setErrors(errors) : operationForm.setErrors(null);
    }
  }

}
