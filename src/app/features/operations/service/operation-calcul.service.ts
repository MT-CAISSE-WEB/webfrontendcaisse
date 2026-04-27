import { Injectable } from '@angular/core';
import { FormArray } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class OperationCalculService {

  getTotalLignes(lignes: FormArray): number {
    return lignes.controls.reduce((sum, l: any) => {
      return sum + (parseFloat(l.get('montantdetail')?.value) || 0);
    }, 0);
  }

  getTotalCaisses(caisses: FormArray): number {
    return caisses.controls.reduce((sum, c: any) => {
      return sum + (parseFloat(c.get('montantref')?.value) || 0);
    }, 0);
  }

  calculMontantReferentiel(total: number, taux: number): number {
    return total * taux;
  }

  /**
   * Calcul des totaux d'une opération
   */
  calculateOperationTotals(
    operation: any,
    justificatifPieces: any[],
    justificatifDetails: any[],
    devise: string
  ): { totalDetail: number, totalRef: number } {

    let totalDetail = 0;
    let totalRef = 0;

    const justificatifs = justificatifPieces.filter(
      j => j.operation.idoperation === operation.idoperation
    );

    justificatifs.forEach(just => {

      // Ici appliquer le taux inverse pour convertir en devise
      if (devise === just.iddevise) {
        // totalDetail = just.tauxinverse * just.montantjustificatif
      }else {
        // totalDetail += just.montantjustificatif
      }

      const details = justificatifDetails.filter(
        d => d.idjustificatif === just.idjustificatifoperation
      );
      
      details.forEach(det => {
        totalDetail += Number(det.montantdetail) || 0;
        totalRef += Number(det.montantref) || 0;
      });

    });

    return { totalDetail, totalRef };
  }

  /**
   * Récupérer un total spécifique
   */
  getTotalOperation(
    operation: any,
    field: 'detail' | 'ref',
    justificatifPieces: any[],
    justificatifDetails: any[],
    devise: string
  ): number {

    const totals = this.calculateOperationTotals(
      operation,
      justificatifPieces,
      justificatifDetails,
      devise
    );

    return field === 'detail'
      ? totals.totalDetail
      : totals.totalRef;
  }

  /**
   * Total des justificatifs existants
   */
  getTotalJustificatifs(justificatifs: any[]): number {
    return justificatifs.reduce((sum, j) => {
      return sum + (parseFloat(j.montantdetail) || 0);
    }, 0);
  }

  /**
   * Total référentiel
   */
  getTotalJustificatifsRef(justificatifs: any[]): number {
    return justificatifs.reduce((sum, j) => {
      return sum + (parseFloat(j.montantref) || 0);
    }, 0);
  }

  /**
   * Conversion vers devise référentielle
   */
  convertToRef(montant: number, taux: number): number {
    return montant * taux;
  }

  /**
   * Calcul reste opération
   */
  calculateResteOperation(
    montantOperation: number,
    totalJustificatifs: number
  ): number {
    return Math.max(0, montantOperation - totalJustificatifs);
  }

  /**
   * Calcul reste référentiel
   */
  calculateResteRef(
    montantRefGlobal: number,
    totalJustificatifsRef: number
  ): number {
    return Math.max(0, montantRefGlobal - totalJustificatifsRef);
  }

  /**
   * Validation justificatif courant
   */
  validateJustificatif(
    montant: number,
    montantRef: number,
    resteOperation: number,
    resteRef: number
  ): { valid: boolean; error?: string } {

    if (montant > resteOperation) {
      return { valid: false, error: 'DEPASSEMENT_OPERATION' };
    }

    if (montantRef > resteRef) {
      return { valid: false, error: 'DEPASSEMENT_REFERENTIEL' };
    }
    
    return { valid: true };
  }


}