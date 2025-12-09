import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DemandeService } from './services/demande.service';

@Component({
  selector: 'app-demande-decaissement',
  templateUrl: './demande-decaissement.component.html',
  styleUrls: ['./demande-decaissement.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class DemandeDecaissementComponent implements OnInit {
  title = 'Demande multi-étapes';
  currentStep = 1;
  loading = false;
  error = '';
  msgErros = '';
  actionModal: 'create' | 'update' = 'create';

  iddemande: string | null = null;

  demandeForm: FormGroup;

  constructor(private fb: FormBuilder, private service: DemandeService) {
    this.demandeForm = this.fb.group({
      // STEP 1
      codedemande: ['', Validators.required],
      iddemandeur: [''],
      typedemande: ['', Validators.required],
      libelledemande: ['', Validators.required],
      datedemande: [this.formatDateInput(new Date()), Validators.required],
      idcircuit: [''],
      idsociete: [''],
      idsite: [''],
      iddepartement: [''],
      iddevise: [''],

      // STEP 2
      lignes: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.addLigne(); // Start with one line
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // ============================
  // LIGNES
  // ============================
  get lignes(): FormArray {
    return this.demandeForm.get('lignes') as FormArray;
  }

  newLigne(): FormGroup {
    return this.fb.group({
      idlignedemande: [''],
      numligne: ['', Validators.required],
      libellelignedemande: ['', Validators.required],
      montantdemande: ['', Validators.required],
      idnature: [''],
      idbudget: [''],
      idcentre: [''],
      idsociete: [''],
      idsite: [''],
      details: this.fb.array([]),
    });
  }

  addLigne() {
    this.lignes.push(this.newLigne());
  }

  removeLigne(i: number) {
    this.lignes.removeAt(i);
  }

  // ============================
  // DETAILS
  // ============================
  getDetailsArray(ligneIndex: number): FormArray {
    return this.lignes.at(ligneIndex).get('details') as FormArray;
  }

  newDetail(): FormGroup {
    return this.fb.group({
      iddetailsdemande: [''],
      description: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(0.000000001)]],
      montant: ['', Validators.required],
      idsociete: [''],
    });
  }

  addDetail(ligneIndex: number) {
    this.getDetailsArray(ligneIndex).push(this.newDetail());
  }

  removeDetail(ligneIndex: number, detailIndex: number) {
    this.getDetailsArray(ligneIndex).removeAt(detailIndex);
  }

  // ============================
  // NAVIGATION
  // ============================
  nextStep() {
    this.msgErros = '';

    if (this.currentStep === 1) {
      if (!this.validateEntete()) return;
      this.createEntete();
      return;
    }

    if (this.currentStep === 2) {
      if (!this.validateLignes()) return;
      this.createLignesThenNext();
      return;
    }
  }

  prevStep() {
    this.msgErros = '';
    this.currentStep = Math.max(1, this.currentStep - 1);
  }

  // ============================
  // VALIDATION
  // ============================
  validateEntete(): boolean {
    const requiredFields = [
      'codedemande',
      'typedemande',
      'libelledemande',
      'datedemande',
    ];

    let valid = true;

    requiredFields.forEach((f) => {
      const ctrl = this.demandeForm.get(f);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valid = false;
    });

    if (!valid) {
      this.msgErros = 'Veuillez remplir tous les champs obligatoires.';
    }

    return valid;
  }

  validateLignes(): boolean {
    if (this.lignes.length === 0) {
      this.msgErros = 'Ajoutez au moins une ligne.';
      return false;
    }

    for (let i = 0; i < this.lignes.length; i++) {
      const grp = this.lignes.at(i) as FormGroup;
      grp.markAllAsTouched();
      if (grp.invalid) {
        this.msgErros = 'Veuillez compléter toutes les lignes.';
        return false;
      }
    }

    return true;
  }

  // ============================
  // STEP 1 : ENTETE
  // ============================
  private createEntete() {
    const payload = {
      ...this.demandeForm.value,
      iddemandeur:
        this.demandeForm.value.iddemandeur === ''
          ? null
          : this.demandeForm.value.iddemandeur,
      statut: 'Pending',
      idcircuit:
        this.demandeForm.value.idcircuit === ''
          ? null
          : this.demandeForm.value.idcircuit,
      idsociete:
        this.demandeForm.value.idsociete === ''
          ? null
          : this.demandeForm.value.idsociete,
      idsite:
        this.demandeForm.value.idsite === ''
          ? null
          : this.demandeForm.value.idsite,
      iddepartement:
        this.demandeForm.value.iddepartement === ''
          ? null
          : this.demandeForm.value.iddepartement,
      iddevise:
        this.demandeForm.value.iddevise === ''
          ? null
          : this.demandeForm.value.iddevise,
      createdby: 'MAF',
    };

    this.loading = true;

    this.service.createEntete(payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        const id =
          res?.data?.iddemande || res?.iddemande || res?.data?.id || null;

        if (!id) {
          this.error = 'ID de la demande non retourné.';
          return;
        }

        this.iddemande = id;
        this.currentStep = 2;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = "Erreur lors de la création de l'entête.";
        this.msgErros = err.error.error;
      },
    });
  }

  // ============================
  // STEP 2 : LIGNES
  // ============================
  private createLignesThenNext() {
    if (!this.iddemande) {
      this.error = 'ID demande introuvable.';
      return;
    }

    const payload = this.lignes.controls.map((g, idx) => ({
      iddemande: this.iddemande,
      numligne: g.get('numligne')?.value || idx + 1,
      libellelignedemande: g.get('libellelignedemande')?.value,
      montantdemande: g.get('montantdemande')?.value,
      idnature: g.get('idnature')?.value,
      idbudget: g.get('idbudget')?.value,
      idcentre: g.get('idcentre')?.value,
      idsociete: g.get('idsociete')?.value,
      idsite: g.get('idsite')?.value,
      createdby: 'MAF',
    }));

    this.loading = true;

    this.service
      .createLignesBatch({ iddemande: this.iddemande, lignes: payload })
      .subscribe({
        next: (res: any) => {
          this.loading = false;

          const created = res?.data ?? res;

          if (!Array.isArray(created)) {
            this.error = 'Format lignes invalide.';
            return;
          }

          created.forEach((ligne, i) => {
            this.lignes.at(i).patchValue({
              idlignedemande: ligne.idlignedemande || ligne.id,
            });
          });

          this.currentStep = 3;
        },
        error: () => {
          this.loading = false;
          this.error = 'Erreur lors de l’enregistrement des lignes.';
        },
      });
  }

  // ============================
  // STEP 3 : DETAILS
  // ============================
  finishProcess() {
    if (!this.iddemande) {
      this.error = 'ID demande manquant.';
      return;
    }

    const allPayloads: any[] = [];

    for (let i = 0; i < this.lignes.length; i++) {
      const grp = this.lignes.at(i) as FormGroup;
      const idlignedemande = grp.get('idlignedemande')?.value;

      const detailsForms = grp.get('details') as FormArray;

      if (detailsForms.length === 0) continue;

      allPayloads.push({
        iddemande: this.iddemande,
        idlignedemande,
        details: detailsForms.controls.map((d) => ({
          ...d.value,
          iddemande: this.iddemande,
          idlignedemande,
          createdby: 'MAF',
        })),
      });
    }

    if (allPayloads.length === 0) {
      this.afterFinish();
      return;
    }

    this.loading = true;
    let idx = 0;

    const nextBatch = () => {
      if (idx >= allPayloads.length) {
        this.loading = false;
        this.afterFinish();
        return;
      }

      this.service.createDetailsBatch(allPayloads[idx]).subscribe({
        next: () => {
          idx++;
          nextBatch();
        },
        error: () => {
          this.loading = false;
          this.error = 'Erreur lors de la création des détails.';
        },
      });
    };

    nextBatch();
  }

  private afterFinish() {
    this.resetProcess();
    this.iddemande = null;
    this.currentStep = 1;
  }

  resetProcess() {
    this.demandeForm.reset();
    while (this.lignes.length) this.lignes.removeAt(0);
    this.addLigne();
  }

  // ============================
  // EDIT
  // ============================
  loadDemandeForEdit(iddemande: string) {
    this.actionModal = 'update';

    this.service.getEntete(iddemande).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        if (!data) return;

        this.demandeForm.patchValue({
          codedemande: data.codedemande,
          iddemandeur: data.iddemandeur,
          typedemande: data.typedemande,
          libelledemande: data.libelledemande,
          datedemande: this.formatDateInput(new Date(data.datedemande)),
          idcircuit: data.idcircuit,
          idsociete: data.idsociete,
          idsite: data.idsite,
          iddepartement: data.iddepartement,
          iddevise: data.iddevise,
        });

        this.iddemande = data.iddemande;

        while (this.lignes.length) this.lignes.removeAt(0);

        this.service.getLignesByDemande(iddemande).subscribe({
          next: (resL: any) => {
            const lignes = resL?.data ?? resL;

            lignes.forEach((l: any) => {
              const grp = this.newLigne();
              grp.patchValue({
                idlignedemande: l.idlignedemande,
                numligne: l.numligne,
                libellelignedemande: l.libellelignedemande,
                montantdemande: l.montantdemande,
                idnature: l.idnature,
                idbudget: l.idbudget,
                idcentre: l.idcentre,
                idsociete: l.idsociete,
                idsite: l.idsite,
              });

              const details = grp.get('details') as FormArray;

              this.service.getDetailsByLigne(l.idlignedemande).subscribe({
                next: (resD: any) => {
                  const dets = resD?.data ?? resD;

                  dets.forEach((d: any) => {
                    const det = this.newDetail();
                    det.patchValue({
                      iddetailsdemande: d.iddetailsdemande,
                      description: d.description,
                      quantite: d.quantite,
                      montant: d.montant,
                      idsociete: d.idsociete,
                    });
                    details.push(det);
                  });
                },
              });

              this.lignes.push(grp);
            });

            this.currentStep = 1;
          },
        });
      },
    });
  }
}
