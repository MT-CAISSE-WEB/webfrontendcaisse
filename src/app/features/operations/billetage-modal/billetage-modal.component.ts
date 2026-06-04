import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DENOMINATION_BILLETAGE } from '../../../_core/constantes/tableau.data';

@Component({
  selector: 'app-billetage-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './billetage-modal.component.html',
  styleUrl: './billetage-modal.component.css'
})
export class BilletageModalComponent implements OnInit {

  @Input() caisses: any[] = [];
  @Input() caisseSolde: any[] = [];

  billetageForm!: FormGroup;

  activeTab: number = 0;
  loading: boolean = false;

  denominations = DENOMINATION_BILLETAGE;

  billetageValidatedIndexes: number[] = [];
  billetageValidated = false;
  validatedCaisseIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.billetageForm = this.fb.group({
      caissesBillet: this.fb.array([])
    });

    this.initBilletageForm(this.caisses);
  }

  get caissesBilletArray(): FormArray {
    return this.billetageForm.get('caissesBillet') as FormArray;
  }

  getBillets(i: number): FormArray {
    return this.caissesBilletArray.at(i)?.get('billets') as FormArray || this.fb.array([]);
  }

  getPieces(i: number): FormArray {
    return this.caissesBilletArray.at(i)?.get('pieces') as FormArray || this.fb.array([]);
  }

  initBilletageForm(caisses: any[]) {
    const caissesArray = this.caissesBilletArray;
    caissesArray.clear();

    caisses.forEach(c => {
      const deviseData = this.denominations[c.caisse.codedevise];
      const billetsArray = this.fb.array<FormGroup>([]);
      const piecesArray = this.fb.array<FormGroup>([]);

      deviseData.billets.forEach((v: number) => {
        billetsArray.push(
          this.fb.group({
            valeur: [v],
            quantite: [0]
          })
        );
      });

      deviseData.pieces.forEach((v: number) => {
        piecesArray.push(
          this.fb.group({
            valeur: [v],
            quantite: [0]
          })
        );
      });

      caissesArray.push(
        this.fb.group({
          idperiode: [c.idperiode],
          idcaisse: [c.idcaisse],
          caisse: [c.caisse.codecaisse],
          devise: [c.caisse.codedevise],
          billets: billetsArray,
          pieces: piecesArray,
          totalPhysique: [0],
          ecart: [0]
        })
      );
    });
  }

  selectTab(i: number) {
    this.activeTab = i;
  }

  getTotalBillets(i: number) {
    const billets = this.getBillets(i).value;
    return billets.reduce((sum: any, b: any) => sum + (b.valeur * b.quantite), 0);
  }

  getTotalPieces(i: number) {
    const pieces = this.getPieces(i).value;
    return pieces.reduce((sum: any, p: any) => sum + (p.valeur * p.quantite), 0);
  }

  getTotalPhysique(i: number) {
    return this.getTotalBillets(i) + this.getTotalPieces(i);
  }

  validateBilletage(i: number) {
    if (!this.billetageValidatedIndexes.includes(i)) {
      this.billetageValidatedIndexes.push(i);
    }

    this.billetageValidated = true;
    this.validatedCaisseIndex = i;

    const totalPhysique = this.getTotalPhysique(i);
    const caisseId = this.caissesBilletArray.at(i).value.idcaisse;
    const soldeCaisse = this.caisseSolde.find(
      (s: any) => s.idcaisse === caisseId
    );

    const totalAttendu = soldeCaisse ? soldeCaisse.solde : 0;
    const ecart = totalPhysique - totalAttendu;
    (this.caissesBilletArray.at(i) as FormGroup).patchValue({
      ecart: ecart,
      totalPhysique: totalPhysique
    });
  }

  submitBilletage() {
    const caissesToSubmit = this.caissesBilletArray.controls
      .filter((_, i) => this.billetageValidatedIndexes.includes(i))
      .map(c => c.value);
    this.activeModal.close(caissesToSubmit);
  }

  cancelBilletage() {
    this.activeModal.dismiss();
  }

}