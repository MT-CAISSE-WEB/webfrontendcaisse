import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OperationValidatorService {

  checkMontantOperation(
    totalLignes: number,
    totalJustificatif: number,
    montantOperation: number
  ): boolean {

    return (totalLignes + totalJustificatif) <= montantOperation;
  }

  checkMontantReferentiel(
    totalLignesRef: number,
    totalJustificatifRef: number,
    montantRef: number
  ): boolean {

    return (totalLignesRef + totalJustificatifRef) <= montantRef;
  }

}