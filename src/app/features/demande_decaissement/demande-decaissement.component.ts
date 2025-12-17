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
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { DemandeComplet } from './models/demande-complet.model';
import { EnteteDemande } from './models/entete-demande.model';
import { LigneDemande } from './models/ligne-demande.model';
import { DetailsDemande } from './models/details-demande.model';
import { BudgetModel } from '../budgets/models/budget.model';
import { BudgetService } from '../budgets/services/budget.service';

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
  msgSuccess = '';
  actionModal: 'create' | 'update' = 'create';
  budgets: BudgetModel[] = [];

  demandes: DemandeComplet[] = [];
  entetesDmd: EnteteDemande[] = [];
  lignesDmd: LigneDemande[] = [];
  detailsDmd: DetailsDemande[] = [];
  selectedDemande?: DemandeComplet;

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  // Etapes du formulaire
  step1Mode: 'create' | 'update' = 'create';
  step2Mode: 'create' | 'update' = 'create';
  step3Mode: 'create' | 'update' = 'create';

  iddemande: string | null = null;

  demandeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: DemandeService,
    private budgetservice: BudgetService
  ) {
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
    this.loadAllDemandes();
    this.getAllBudgets();
  }

  private resetLignes(): void {
    while (this.lignes.length) {
      const detailsArray = this.lignes.at(0).get('details') as FormArray;
      while (detailsArray.length) detailsArray.removeAt(0);
      this.lignes.removeAt(0);
    }
  }

  private fillFormFromDemande(demande: DemandeComplet): void {
    // Reset complet du formulaire
    this.demandeForm.reset();
    this.resetLignes();

    // =====================
    // ENTÊTE
    // =====================
    this.demandeForm.patchValue({
      codedemande: demande.entete.codedemande,
      iddemandeur: demande.entete.iddemandeur,
      typedemande: demande.entete.typedemande,
      libelledemande: demande.entete.libelledemande,
      datedemande: demande.entete.datedemande?.split('T')[0],
      idcircuit: demande.entete.idcircuit,
      idsociete: demande.entete.idsociete,
      idsite: demande.entete.idsite,
      iddepartement: demande.entete.iddepartement,
      iddevise: demande.entete.iddevise,
    });

    // =====================
    // LIGNES + DÉTAILS
    // =====================
    demande.lignes.forEach((lc) => {
      const ligneGroup = this.newLigne();

      // Patch données ligne
      ligneGroup.patchValue({
        idlignedemande: lc.ligne.idlignedemande,
        numligne: lc.ligne.numligne,
        libellelignedemande: lc.ligne.libellelignedemande,
        montantdemande: lc.ligne.montantdemande,
        idnature: lc.ligne.idnature,
        idbudget: lc.ligne.idbudget,
        idcentre: lc.ligne.idcentre,
        idsociete: lc.ligne.idsociete,
        idsite: lc.ligne.idsite,
      });

      // Patch détails
      const detailsArray = ligneGroup.get('details') as FormArray;
      lc.details.forEach((d) => {
        detailsArray.push(
          this.fb.group({
            iddetailsdemande: d.iddetailsdemande,
            description: d.description,
            quantite: d.quantite,
            montant: d.montant,
            idsociete: d.idsociete,
          })
        );
      });

      // Ajout de la ligne au formulaire
      this.lignes.push(ligneGroup);
    });
  }

  openViewModal(iddemande: string): void {
    this.loading = true;

    this.service.getDemandeComplet(iddemande).subscribe({
      next: (demande: DemandeComplet) => {
        this.loading = false;

        this.selectedDemande = demande;
        this.iddemande = demande.entete.iddemande!;

        // Modes
        this.actionModal = 'update';
        this.step1Mode = 'update';
        this.step2Mode = 'update';
        this.step3Mode = 'update';
        this.currentStep = 1;

        // Remplissage du formulaire
        this.fillFormFromDemande(demande);

        // ===== OUVERTURE MODAL BOOTSTRAP (manuelle) =====
        const modal = document.getElementById('showModal');
        if (!modal) return;

        modal.style.display = 'block';
        modal.classList.add('show');
        modal.removeAttribute('aria-hidden');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('role', 'dialog');

        document.body.classList.add('modal-open');

        // Ajout backdrop si pas déjà présent
        if (!document.querySelector('.modal-backdrop')) {
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          document.body.appendChild(backdrop);
        }
      },
      error: () => {
        this.loading = false;
        this.msgErros = 'Erreur lors du chargement de la demande.';
      },
    });
  }

  deleteDemande() {
    if (!this.iddemande) return;

    if (!confirm('Confirmer la suppression de cette demande ?')) return;

    this.loading = true;

    this.service.deleteEntete(this.iddemande).subscribe({
      next: () => {
        this.loading = false;
        this.closeModal('showModal');
        this.loadAllDemandes();
        this.resetProcess();
      },
      error: (err: any) => {
        this.loading = false;
        this.msgErros = err.error.error;
      },
    });
  }

  // fermeture du modal
  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getAllBudgets() {
    const params = {
      page: 1,
      limit: 1000,
    };
    this.budgetservice.getAll(params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.budgets = res.data;
        }
      },
    });
  }

  // afficher toutes les demandes
  loadAllDemandes() {
    forkJoin({
      entetes: this.service.getAllEntetes(this.currentPage, this.limit),
      lignes: this.service.getAllLigne(),
      details: this.service.getAllDetails(),
    }).subscribe({
      next: ({ entetes, lignes, details }) => {
        this.entetesDmd = entetes.data ?? entetes;
        this.lignesDmd = lignes.data ?? lignes;
        this.detailsDmd = details.data ?? details;

        // Obtenir le nombre de pages à partir des entêtes
        this.totalPages = entetes.totalPages;

        this.demandes = this.entetesDmd
          .map((entete) => {
            const lignesPourEntete = this.lignesDmd
              .filter((l) => l.iddemande === entete.iddemande)
              .map((ligne) => ({
                ligne,
                details: this.detailsDmd.filter(
                  (d) =>
                    d.iddemande === entete.iddemande &&
                    d.idlignedemande === ligne.idlignedemande
                ),
              }));

            return {
              entete,
              lignes: lignesPourEntete,
            } as DemandeComplet;
          })
          .filter((d) => d.lignes.length > 0);
      },
      error: (err: any) => {
        console.error('Erreur chargement des données', err);
      },
    });
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.loadAllDemandes(); // recharge les données
  }

  // ============================
  // LIGNES
  // ============================
  get lignes(): FormArray {
    return this.demandeForm.get('lignes') as FormArray;
  }

  newLigne(): FormGroup {
    return this.fb.group({
      idlignedemande: [null],
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

  removeLigne(ligneIndex: number) {
    const ligneGroup = this.lignes.at(ligneIndex) as FormGroup;
    const id = ligneGroup.get('idlignedemande')?.value;

    // Ligne jamais persistée
    if (!id) {
      this.lignes.removeAt(ligneIndex);
      return;
    }

    this.loading = true;

    this.service
      .deleteDetailsByLigne(id)
      .pipe(
        catchError(() => of(null)), // Pas de détails → on continue
        switchMap(() => this.service.deleteLigne(id)),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: () => this.lignes.removeAt(ligneIndex),
        error: (err: any) =>
          (this.msgErros =
            err.error.error ?? 'Erreur lors de la suppression de la ligne'),
      });
  }

  // ============================
  // DETAILS
  // ============================
  getDetailsArray(ligneIndex: number): FormArray {
    return this.lignes.at(ligneIndex).get('details') as FormArray;
  }

  newDetail(): FormGroup {
    return this.fb.group({
      iddetailsdemande: [null], // ✅ OBLIGATOIRE
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
    const detailsArray = this.getDetailsArray(ligneIndex);
    const detailGroup = detailsArray.at(detailIndex) as FormGroup;
    const id = detailGroup.get('iddetailsdemande')?.value;

    // Déjà en base → suppression backend
    if (id) {
      this.service.deleteDetail(id).subscribe({
        next: () => detailsArray.removeAt(detailIndex),
        error: () =>
          (this.msgErros = 'Erreur lors de la suppression du détail'),
      });
    } else {
      // Jamais persisté → suppression locale
      detailsArray.removeAt(detailIndex);
    }
  }

  // ============================
  // NAVIGATION
  // ============================
  nextStep() {
    this.msgErros = '';

    if (this.currentStep === 1) {
      if (!this.validateEntete()) return;

      if (this.step1Mode === 'create') {
        this.createEntete();
      } else {
        this.updateEntete();
      }
      return;
    }

    if (this.currentStep === 2) {
      if (!this.validateLignes()) return;

      if (this.step2Mode === 'create') {
        this.createLignesThenNext();
      } else {
        this.updateLignesThenNext();
      }
      return;
    }
  }

  prevStep() {
    this.msgErros = '';
    const newStep = Math.max(1, this.currentStep - 1);

    if (newStep === 1) {
      this.step1Mode = 'update';
    }

    if (newStep === 2) {
      this.step2Mode = 'update';
    }

    this.currentStep = newStep;
  }

  private updateEntete() {
    if (!this.iddemande) return;

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
      updatedby: 'MAF',
    };

    this.loading = true;

    this.service.updateEntete(this.iddemande, payload).subscribe({
      next: () => {
        this.loading = false;
        this.currentStep = 2;
      },
      error: (err: any) => {
        this.loading = false;
        this.msgErros = err.error.error;
      },
    });
  }

  private updateLignesThenNext() {
    if (!this.iddemande) return;

    this.loading = true;

    const operations$ = this.lignes.controls.map((g, idx) => {
      const idlignedemande = g.get('idlignedemande')?.value;

      const payloadBase = {
        iddemande: this.iddemande,
        numligne: g.get('numligne')?.value || idx + 1,
        libellelignedemande: g.get('libellelignedemande')?.value,
        montantdemande: g.get('montantdemande')?.value,
        idnature: g.get('idnature')?.value || null,
        idbudget: g.get('idbudget')?.value,
        idcentre: g.get('idcentre')?.value || null,
        idsociete: g.get('idsociete')?.value || null,
        idsite: g.get('idsite')?.value || null,
      };

      return idlignedemande
        ? this.service.updateLigne(idlignedemande, {
            ...payloadBase,
            updatedby: 'MAF',
          })
        : this.service
            .createLigne({
              ...payloadBase,
              iddemande: this.iddemande,
              createdby: 'MAF',
            })
            .pipe(
              map((res: any) => {
                const ligneCreated = res?.data ?? res;
                g.patchValue({
                  idlignedemande:
                    ligneCreated.idlignedemande || ligneCreated.id,
                });
                return ligneCreated;
              })
            );
    });

    forkJoin(operations$).subscribe({
      next: () => {
        this.loading = false;
        this.currentStep = 3;
      },
      error: (err) => {
        this.loading = false;
        this.msgErros = err.error?.error ?? 'Erreur mise à jour lignes';
      },
    });
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

    this.loading = true;

    const lignes = this.lignes.controls.map((g, idx) => ({
      iddemande: this.iddemande,
      numligne: g.get('numligne')?.value || idx + 1,
      libellelignedemande: g.get('libellelignedemande')?.value,
      montantdemande: g.get('montantdemande')?.value,
      idnature:
        g.get('idnature')?.value === '' ? null : g.get('idnature')?.value,
      idbudget: g.get('idbudget')?.value,
      idcentre:
        g.get('idcentre')?.value === '' ? null : g.get('idcentre')?.value,
      idsociete:
        g.get('idsociete')?.value === '' ? null : g.get('idsociete')?.value,
      idsite: g.get('idsite')?.value === '' ? null : g.get('idsite')?.value,
      createdby: 'MAF',
    }));

    let idx = 0;

    const createNext: any = () => {
      if (idx >= lignes.length) {
        this.loading = false;
        this.currentStep = 3; // passer à l'étape suivante
        return;
      }

      this.service.createLigne(lignes[idx]).subscribe({
        next: (res: any) => {
          const ligneCreated = res?.data ?? res;
          // On patch l'id retourné
          this.lignes.at(idx).patchValue({
            idlignedemande: ligneCreated.idlignedemande || ligneCreated.id,
          });
          idx++;
          createNext();
        },
        error: (err) => {
          this.loading = false;
          this.msgErros = err.error?.error ?? 'Erreur création ligne';
        },
      });
    };

    createNext();
  }

  // ============================
  // STEP 3 : DETAILS
  // ============================
  finishProcess() {
    if (!this.iddemande) {
      this.msgErros = 'ID demande manquant.';
      return;
    }

    this.loading = true;
    let ligneIndex = 0;

    const processNextLigne = () => {
      if (ligneIndex >= this.lignes.length) {
        // Tous les détails traités
        this.loading = false;
        this.afterFinish();
        return;
      }

      const ligneGroup = this.lignes.at(ligneIndex) as FormGroup;
      const idlignedemande = ligneGroup.get('idlignedemande')?.value;
      const detailsForms = ligneGroup.get('details') as FormArray;

      let detailIndex = 0;

      const processNextDetail = () => {
        if (detailIndex >= detailsForms.length) {
          ligneIndex++;
          processNextLigne();
          return;
        }

        const detailGroup = detailsForms.at(detailIndex) as FormGroup;
        const { iddetailsdemande, ...rawValues } = detailGroup.value;

        const payloadBase = {
          ...rawValues,
          iddemande: this.iddemande,
          idsociete: null,
          idlignedemande,
        };

        const obs$ = iddetailsdemande
          ? this.service.updateDetail(iddetailsdemande, {
              ...payloadBase,
              updatedby: 'MAF',
            })
          : this.service.createDetail({
              ...payloadBase,
              createdby: 'MAF',
            });

        obs$.subscribe({
          next: (res) => {
            const detailCreated = res?.data ?? res;
            // Patch l'ID si nouveau
            if (!iddetailsdemande && detailCreated.iddetailsdemande) {
              detailGroup.patchValue({
                iddetailsdemande: detailCreated.iddetailsdemande,
              });
            }
            detailIndex++;
            processNextDetail();
          },
          error: (err) => {
            this.loading = false;
            this.msgErros = err.error?.error ?? 'Erreur traitement détail';
          },
        });
      };

      processNextDetail();
    };

    processNextLigne();
  }

  private afterFinish() {
    this.closeModal('showModal');
    this.loadAllDemandes();
    this.resetProcess();
    this.iddemande = null;
    this.currentStep = 1;
  }

  resetProcess() {
    this.demandeForm.reset();
    while (this.lignes.length) this.lignes.removeAt(0);
    this.addLigne();
  }
}
