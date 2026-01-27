import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { LigneBudgetModel } from '../models/ligne_budget.model';
import { LigneBudgetService } from '../services/ligne_budget.service';
import { BudgetModel } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';
import { departementservice } from '../../structure/service/departement.service';
import { departementmodel } from '../../structure/model/departement.model';
import { AffectationDepartementNatureService } from '../../donnee_base/services/affectationdepartementnature.service';
import { affectationdepartementnatureModel } from '../../donnee_base/models/affectationdepartementnature.model';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';
import { utilisateurdepartementservice } from '../../administration/service/userdepartement.service';
import { MotifService } from '../services/motif.service';
import { Motif } from '../models/motif.model';
import { ValidateursBudget } from '../models/validateursbudget.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-ligne-budget',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ligne-budget.component.html',
  styleUrl: './ligne-budget.component.css',
})
export class LigneBudgetComponent implements OnInit {
  title = 'Lignes du budget';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  ligneBudgets: LigneBudgetModel[] = [];
  ligneBudgetsGrouped: Array<{
    budget: BudgetModel;
    lignes: LigneBudgetModel[];
  }> = [];
  budgets: BudgetModel[] = [];
  departements: departementmodel[] = [];
  appartenanceDepartement: departementmodel[] = [];
  ligneBudget: LigneBudgetModel = new LigneBudgetModel();
  lignesBudgetsFiltered: LigneBudgetModel[] = [];
  msgErros: string = '';
  loading: Boolean = false;
  ligneBudgetForm: FormGroup = this.fb.group({});

  availableNatures: natureoperationModel[] = [];
  motifs: Motif[] = [];


  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected: LigneBudgetModel[] = [];
  selectedItems: { [id: string]: boolean } = {};
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow: any;
  error: string = '';

  //Changement titre modal
  actionModal: string = 'create';
  showRejectComment = false;
  rejectComment = '';
  rejectForm!: FormGroup;

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  //Element à supprimer
  deleteLigneBudget: any = null;

  searchCtrl = new FormControl('');
  ligneBudgetsSource: LigneBudgetModel[] = [];

  // savoir l'entité du budget
  selectedBudget?: BudgetModel;
  selectedDept?: departementmodel;


  // MODE DE SAISIE
  modeSaisie = '';

  // Gestion progressive des natures

  allNatures: Array<{
    idnature: string;
    libelle: string;
    iddepartement: string;
  }> = [];
  currentNatureIndex: number = 0;
  validationLines: Array<{
    departement: string;
    nature: string;
    montantDept: number;
    montantSite: number;
    montantSociete: number;
  }> = [];


  constructor(
    private lignebudgetservice: LigneBudgetService,
    private budgetservice: BudgetService,
    private departementservice: departementservice,
    private affectationService: AffectationDepartementNatureService,
    private utilisateurdepartementservice: utilisateurdepartementservice,
    private motifservice: MotifService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    //Afficher toutes les lignes budgétaires

    this.ligneBudgetsGrouped = [];
    this.selectedBudgetId = null;
    this.getAllBudgets();
    this.getAllDepartements();
    this.getAllLigneBudgets();
    this.getUserDepartement();
    this.getAllMotifs();

    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('cette ligne budgétaire');
    this.titleMsg = TITLE_DELETE;

    this.rejectForm = this.fb.group({
      motif: [null, Validators.required],
    });
  }

  naturesSource: Array<{
    idnature: string;
    libelle: string;
    iddepartement: string;
  }> = [];

  natureGrid: Array<{
    idnature: string;
    libelle: string;

    // ID de la ligne budgétaire existante (si présente)
    idbudgetdepartementnature?: string;

    montantDept: number;
    montantSite: number;
    montantSociete: number;

  }> = [];

  validateursBudget: ValidateursBudget[] = [];

  isDeptReadonly(): boolean {
    return true; // toujours grisé
  }

  isSiteReadonly(): boolean {
    if (!this.selectedBudget) return true;

    // Utilisateur SITE peut saisir tant que site non validé
    return !(
      this.user.typeentitesite === 1 &&
      this.selectedBudget.validesite !== 1
    );
  }

  isSocieteReadonly(): boolean {
    if (!this.selectedBudget) return true;

    // Utilisateur SOCIETE peut saisir seulement si site validé
    return !(
      this.user.typeentitesociete === 1 &&
      this.selectedBudget.validesite === 1
    );
  }

  motifOfBudgetRejected?: string;

  getMotifLibelle(id: string) {
    this.motifOfBudgetRejected = this.motifs.find(m => m.idmotif === id)?.libellemotif
  }

  // Obtenir la liste de tous les motifs
  getAllMotifs() {
    this.params = { page: 1, limit: 1000 };

    this.motifservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.motifs = res.data.data as Motif[];
        }
      },
      error: (err) => {
        console.error('Erreur récupération motifs', err);
        this.msgErros = err.error.error;
      },
    });
  }

  // Obtenir tous les validateurs du budget
  getAllValidateursBudget(idbudget: string) {

    this.budgetservice.getValidateursBudget(idbudget).subscribe({

      next: (res: any) => {
        if (res.success) {
          this.validateursBudget = res.data as ValidateursBudget[];
          this.getMotifLibelle(this.validateursBudget.find(v => v.decision === 'rejete')?.idmotif as string)
        }
      },
      error: (err) => {
        console.error('Erreur récupération des validateurs du budget', err);
        this.msgErros = err.error.error;
      },
    });
  }


  // Obtenir la liste de tous les budgets
  getAllBudgets() {
    this.params = { page: 1, limit: 1000 };

    this.budgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          const lesbudgets = res.data as BudgetModel[];
          this.budgets = lesbudgets.filter(
            (b) =>
              b.idsite === this.user.idsite &&
              b.idsociete === this.user.idsociete
          );
        }
      },
      error: (err) => {
        console.error('Erreur récupération budgets', err);
        this.msgErros = err.error.error;
      },
    });
  }

  // 
  isValidateur(): boolean {
    return this.validateursBudget.some(u => u.idutilisateur === this.user.idutilisateur && u.decision === 'en attente')
  }

  isRejected(): boolean {
    return this.validateursBudget.some(u => u.decision === "rejete")
  }

  groupLigneBudgetsByBudget() {
    const map = new Map<
      string,
      { budget: BudgetModel; lignes: LigneBudgetModel[] }
    >();

    for (const ligne of this.ligneBudgets) {
      if (!ligne.budget) continue;

      const idBudget = ligne.budget.idbudget;

      if (!map.has(idBudget)) {
        map.set(idBudget, {
          budget: ligne.budget,
          lignes: [],
        });
      }

      map.get(idBudget)!.lignes.push(ligne);
    }

    this.ligneBudgetsGrouped = Array.from(map.values());
  }

  // Obtenir les départements
  getAllDepartements() {
    this.departementservice.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.departements = res.data;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }

  getUserDepartement() {
    this.utilisateurdepartementservice
      .getutilisateurdepartement(this.user.idutilisateur)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const userDepartements: any[] = res.data[0];

            const allowedIds = new Set(
              userDepartements.map((item) => item.iddepartement)
            );
            // Filtrage du tableau complet
            const filteredDepartments = this.departements.filter((dept) =>
              allowedIds.has(dept.iddepartement)
            );
            this.appartenanceDepartement = filteredDepartments;

            console.log(filteredDepartments);
          }
        },
        error: (err: any) => {
          this.msgErros = err.error.error;
        },
      });
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }



  // onSelectionDepartementChange(event: Event) {
  //   const id = (event.target as HTMLSelectElement).value;
  //   this.selectedDept = this.departements.find((d) => d.iddepartement === id);
  // }

  onSelectionDepartementChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;

    // 1. Département sélectionné
    this.selectedDept = this.departements.find(
      d => d.iddepartement === id
    );

    if (!this.selectedDept) {
      this.resetNatureSaisie();
      return;
    }

    // 2. Synchroniser le formulaire (si utilisé ailleurs)
    this.ligneBudgetForm.patchValue({
      iddepartement: id,
    });

    // 3. Déclencher la logique métier centrale
    this.onDepartementChange();
  }

  private resetNatureSaisie() {
    this.allNatures = [];
    this.natureGrid = [];
    this.selectedNatureId = null;
  }

  onDepartementChange(event?: any) {
    const idDept = this.ligneBudgetForm.get('iddepartement')?.value;
    if (!idDept) return;

    // Charger les natures du département
    this.allNatures = this.naturesSource.filter(
      n => n.iddepartement === idDept
    );

    // Reset
    this.natureGrid = [];
    this.selectedNatureId = null;

    // Mode ALL → on ajoute tout automatiquement
    if (this.modeSaisie === 'ALL') {
      this.allNatures.forEach(nature => {
        this.addNatureToGrid(nature);
      });
    }
  }

  get naturesDisponibles() {
    return this.natureGrid;
  }

  addSelectedNature() {
    if (!this.selectedNatureId) return;

    const index = this.availableNatures.findIndex(
      n => n.idnature === this.selectedNatureId
    );

    if (index === -1) return;

    const nature = this.availableNatures.splice(index, 1)[0];
    const ligne = {
      idnature: nature.idnature,
      libelle: nature.libelle,
      montantDept: 0,
      montantSite: 0,
      montantSociete: 0,
    }

    this.natureGrid.push(ligne);

    this.selectedNatureId = null;
  }

  canValidateCurrentLine(): boolean {
    if (this.natureGrid.length === 0) return false;

    const line = this.natureGrid[this.natureGrid.length - 1];

    return (
      (line.montantDept ?? 0) > 0 ||
      (line.montantSite ?? 0) > 0 ||
      (line.montantSociete ?? 0) > 0
    );
  }


  validateCurrentStep() {
    if (!this.selectedBudget || !this.selectedDept) return;
    if (this.natureGrid.length === 0) return;

    const line = this.natureGrid[this.natureGrid.length - 1];

    const hasMontant =
      (line.montantDept ?? 0) > 0 ||
      (line.montantSite ?? 0) > 0 ||
      (line.montantSociete ?? 0) > 0;

    if (!hasMontant) return;

    const idBudget = this.selectedBudget.idbudget;
    const idDept = this.selectedDept.iddepartement;

    // 1️⃣ Mise à jour de la source
    this.ligneBudgetsSource.push({
      idbudget: idBudget,
      iddepartement: idDept,
      idnature: line.idnature,
      montantprevisiondept: line.montantDept,
      montantprevisionsite: line.montantSite,
      montantprevisionsociete: line.montantSociete,
      nature_operation: { libelle: line.libelle },
    } as LigneBudgetModel);

    // 2️⃣ Passage en ALL SANS RECHARGER
    this.modeSaisie = 'ALL';

    // 3️⃣ Injection directe dans la vue
    this.natureGrid = [
      {
        idnature: line.idnature,
        libelle: line.libelle,
        montantDept: line.montantDept,
        montantSite: line.montantSite,
        montantSociete: line.montantSociete,
      },
    ];
  }







  private addNatureToGrid(nature: any) {
    const idDept = this.ligneBudgetForm.getRawValue().iddepartement;

    const ligne = {
      idnature: nature.idnature,
      libelle: nature.libelle,
      montantDept: 0,
      montantSite: 0,
      montantSociete: 0,
    } as any;

    const existing = this.ligneBudgetsSource.find(
      l =>
        l.idbudget === this.selectedBudget!.idbudget &&
        l.iddepartement === idDept &&
        l.idnature === nature.idnature
    );

    if (existing) {
      ligne.idbudgetdepartementnature = existing.idbudgetdepartementnature;
      ligne.montantDept = existing.montantprevisiondept ?? 0;
      ligne.montantSite = existing.montantprevisionsite ?? 0;
      ligne.montantSociete = existing.montantprevisionsociete ?? 0;
    }

    this.natureGrid.push(ligne);
  }


  onSelectionChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedBudget = this.budgets.find((b) => b.idbudget === id);

    this.ligneBudgetForm.patchValue({ idbudget: id });

    if (!this.selectedBudget) return;

    if (this.selectedBudget.entite === 'Site') {
      // Département NON obligatoire
      this.ligneBudgetForm.get('iddepartement')?.clearValidators();
      this.ligneBudgetForm.get('iddepartement')?.updateValueAndValidity();

      // Montants département NON obligatoires
      this.ligneBudgetForm.get('montantprevisiondept')?.clearValidators();
      this.ligneBudgetForm
        .get('montantprevisiondept')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.updateValueAndValidity();

      this.natureGrid = [];
    } else {
      // Budget Département
      this.ligneBudgetForm
        .get('iddepartement')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm.get('iddepartement')?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisiondept')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisiondept')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsite')
        ?.updateValueAndValidity();

      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.setValidators([Validators.required]);
      this.ligneBudgetForm
        .get('montantprevisionsociete')
        ?.updateValueAndValidity();
    }
  }

  getAllLigneBudgets() {
    this.params = {
      page: this.currentPage,
      limit: this.limit,
    };

    this.lignebudgetservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ligneBudgetsSource = res.data;
          this.lignesBudgetsFiltered = [...this.ligneBudgetsSource];
          this.totalPages = res.totalPages;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
      },
    });
  }


  onBudgetChange(event: any) {
    const id = event.target.value;
    this.selectedBudget = this.budgets.find((b) => b.idbudget === id);
    this.natureGrid = [];
    this.ligneBudgetForm.patchValue({ iddepartement: '' });
  }

  // onDepartementChange(event: any) {
  //   const idDept = event.target.value;
  //   this.onSelectionDepartementChange(event);

  //   // Reset STRICT
  //   this.natureGrid = [];

  //   if (!idDept || !this.selectedBudget) return;

  //   this.loadNatureGrid(idDept);
  // }

  // loadNatureGrid(idDepartement: string) {
  //   if (!idDepartement) return;
  //   this.affectationService.getAll(idDepartement).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.natureGrid = res.data.naturesaffectes
  //           .sort((a: natureoperationModel, b: natureoperationModel) =>
  //             a.libelle.localeCompare(b.libelle)
  //           )
  //           .map((item: natureoperationModel) => ({
  //             idnature: item.idnature,
  //             libelle: item.libelle,
  //             montantDept: 0,
  //             montantSite: 0,
  //             montantSociete: 0,
  //           }));
  //         this.prefillNatureGrid();
  //       }
  //     },
  //   });
  // }

  stepNatures: Array<{ idnature: string; libelle: string; montantDept: number; montantSite: number; montantSociete: number }> = [];

  loadNextNature() {
    if (this.currentNatureIndex >= this.stepNatures.length) return;

    const next = this.stepNatures[this.currentNatureIndex];

    // Ajouter la nature suivante à la grille
    this.natureGrid.push(next);

    this.prefillNatureGrid(); // si tu veux pré-remplir avec des valeurs existantes
    this.currentNatureIndex++;
  }

  onClickNextNature() {
    this.loadNextNature();
  }

  // au cas où
  // loadNatureGrid(idDepartement: string) {
  //   if (!idDepartement || !this.selectedBudget) return;

  //   this.natureGrid = [];
  //   this.currentNatureIndex = 0;

  //   this.affectationService.getAll(idDepartement).subscribe({
  //     next: (res: any) => {
  //       if (!res.success) return;

  //       this.allNatures = res.data.naturesaffectes.sort((a: any, b: any) =>
  //         a.libelle.localeCompare(b.libelle)
  //       );

  //       if (this.modeSaisie === 'ALL') {
  //         this.natureGrid = this.allNatures.map((n: any) => ({
  //           idnature: n.idnature,
  //           libelle: n.libelle,
  //           idbudgetdepartementnature: undefined,
  //           montantDept: 0,
  //           montantSite: 0,
  //           montantSociete: 0,
  //         }));
  //         this.prefillNatureGrid();
  //       } else {
  //         // STEP mode → table vide au départ
  //         this.stepNatures = this.allNatures.map((n: any) => ({
  //           idnature: n.idnature,
  //           libelle: n.libelle,
  //           idbudgetdepartementnature: undefined,
  //           montantDept: 0,
  //           montantSite: 0,
  //           montantSociete: 0,
  //         }));
  //         this.loadNextNature(); // optionnel : charge la 1ère si tu veux
  //       }
  //     },
  //   });
  // }
  loadNatureGrid(idDepartement: string) {
    if (!this.selectedBudget || !idDepartement) return;

    this.natureGrid = [];
    this.availableNatures = [];
    this.selectedNatureId = null;

    this.affectationService.getAll(idDepartement).subscribe({
      next: (res: any) => {
        if (!res.success) return;

        const allNatures = res.data.naturesaffectes;

        const existingLines = this.ligneBudgetsSource.filter(
          l => l.idbudget === this.selectedBudget!.idbudget && l.iddepartement === idDepartement
        );

        if (this.modeSaisie === 'ALL') {
          // 🔵 Mode complet : afficher toutes les natures + montants
          this.natureGrid = allNatures.map((n: any) => {
            const existing = existingLines.find(l => l.idnature === n.idnature);
            return {
              idnature: existing?.idnature ?? n.idnature ?? '', // <-- fix TS
              libelle: n.libelle,
              idbudgetdepartementnature: existing?.idbudgetdepartementnature,
              montantDept: existing?.montantprevisiondept ?? 0,
              montantSite: existing?.montantprevisionsite ?? 0,
              montantSociete: existing?.montantprevisionsociete ?? 0,
            };
          });

          return;
        }

        // 🟢 Mode STEP : lignes existantes
        const usedIds = new Set(existingLines.map(l => l.idnature));

        this.natureGrid = existingLines.map(l => ({
          idnature: l.idnature!, // assurance non-null
          libelle: l.nature_operation?.libelle ?? '',
          idbudgetdepartementnature: l.idbudgetdepartementnature,
          montantDept: l.montantprevisiondept ?? 0,
          montantSite: l.montantprevisionsite ?? 0,
          montantSociete: l.montantprevisionsociete ?? 0,
        }));

        // natures encore disponibles pour ajout
        this.availableNatures = allNatures.filter((n: any) => !usedIds.has(n.idnature));
      },
    });
  }



  // Nature choisie par l'utilisateur
  selectedNatureId: string | null = null;

  addEmptyLine() {
    if (this.availableNatures.length === 0) return;

    const nature = this.availableNatures.shift()!;

    this.natureGrid.push({
      idnature: nature.idnature,
      libelle: nature.libelle,
      idbudgetdepartementnature: undefined,
      montantDept: 0,
      montantSite: 0,
      montantSociete: 0,
    });
  }


  setMode(mode: 'ALL' | 'STEP') {
    this.modeSaisie = mode;

    const idDept = this.ligneBudgetForm.getRawValue().iddepartement;
    if (idDept) {
      this.loadNatureGrid(idDept);
    }
  }



  // ajoutons un ligne à chaque clic
  addNextNature() {
    if (
      this.currentNatureIndex >= this.allNatures.length ||
      !this.selectedBudget
    ) {
      return;
    }

    const nature = this.allNatures[this.currentNatureIndex];

    // Nouvelle ligne conforme à ton type natureGrid
    const nouvelleLigne = {
      idnature: nature.idnature,
      libelle: nature.libelle,
      idbudgetdepartementnature: '', // optionnelle
      montantDept: 0,
      montantSite: 0,
      montantSociete: 0,
    };

    // Préremplissage si une ligne existe déjà
    const idDept = this.ligneBudgetForm.getRawValue().iddepartement;

    const existing = this.ligneBudgetsSource.find(
      (l) =>
        l.idbudget === this.selectedBudget!.idbudget &&
        l.iddepartement === idDept &&
        l.idnature === nature.idnature
    );

    if (existing) {
      nouvelleLigne.idbudgetdepartementnature =
        existing.idbudgetdepartementnature;
      nouvelleLigne.montantDept = existing.montantprevisiondept ?? 0;
      nouvelleLigne.montantSite = existing.montantprevisionsite ?? 0;
      nouvelleLigne.montantSociete = existing.montantprevisionsociete ?? 0;
    }

    this.natureGrid.push(nouvelleLigne);
    this.updateMontantsSelonValidation();
    this.currentNatureIndex++;
  }



  // prefillNatureGrid() {
  //   if (!this.selectedBudget) return;

  //   const idDept = this.ligneBudgetForm.value.iddepartement;

  //   this.natureGrid.forEach((ligne) => {
  //     const existing = this.ligneBudgets.find(
  //       (l) =>
  //         l.idbudget === this.selectedBudget!.idbudget &&
  //         l.iddepartement === idDept &&
  //         l.idnature === ligne.idnature
  //     );

  //     if (existing) {
  //       ligne.montantDept = existing.montantprevisiondept ?? 0;
  //       ligne.montantSite = existing.montantprevisionsite ?? 0;
  //       ligne.montantSociete = existing.montantprevisionsociete ?? 0;
  //     } else {
  //       // Reset explicite (évite toute pollution mémoire)
  //       ligne.montantDept = 0;
  //       ligne.montantSite = 0;
  //       ligne.montantSociete = 0;
  //     }
  //   });

  //   this.updateMontantsSelonValidation();
  // }

  // prefillNatureGrid() {
  //   if (!this.selectedBudget) return;

  //   const idDept = this.ligneBudgetForm.value.iddepartement;

  //   this.natureGrid.forEach((ligne) => {
  //     const existing = this.ligneBudgets.find(
  //       (l) =>
  //         l.idbudget === this.selectedBudget!.idbudget &&
  //         l.iddepartement === idDept &&
  //         l.idnature === ligne.idnature
  //     );

  //     if (existing) {
  //       ligne.idbudgetdepartementnature = existing.idbudgetdepartementnature;

  //       ligne.montantDept = existing.montantprevisiondept ?? 0;
  //       ligne.montantSite = existing.montantprevisionsite ?? 0;
  //       ligne.montantSociete = existing.montantprevisionsociete ?? 0;
  //     } else {
  //       // IMPORTANT : reset si aucune ligne existante
  //       ligne.idbudgetdepartementnature = undefined;
  //       ligne.montantDept = 0;
  //       ligne.montantSite = 0;
  //       ligne.montantSociete = 0;
  //     }
  //   });
  // }

  // prefillNatureGrid() {
  //   if (!this.selectedBudget) return;

  //   const idDept = this.ligneBudgetForm.value.iddepartement;

  //   this.natureGrid.forEach((ligne) => {
  //     const lignesExistantes = this.ligneBudgets.filter(
  //       (l) =>
  //         l.idbudget === this.selectedBudget!.idbudget &&
  //         l.iddepartement === idDept &&
  //         l.idnature === ligne.idnature
  //     );

  //     if (lignesExistantes.length > 0) {
  //       ligne.idbudgetdepartementnature =
  //         lignesExistantes[
  //           lignesExistantes.length - 1
  //         ].idbudgetdepartementnature;

  //       ligne.montantDept = lignesExistantes.reduce(
  //         (sum, l) => sum + (l.montantprevisiondept ?? 0),
  //         0
  //       );

  //       ligne.montantSite = lignesExistantes.reduce(
  //         (sum, l) => sum + (l.montantprevisionsite ?? 0),
  //         0
  //       );

  //       ligne.montantSociete = lignesExistantes.reduce(
  //         (sum, l) => sum + (l.montantprevisionsociete ?? 0),
  //         0
  //       );
  //     } else {
  //       ligne.idbudgetdepartementnature = undefined;
  //       ligne.montantDept = 0;
  //       ligne.montantSite = 0;
  //       ligne.montantSociete = 0;
  //     }
  //   });

  //   this.updateMontantsSelonValidation();
  // }

  prefillNatureGrid() {
    if (!this.selectedBudget) return;

    const idDept = this.ligneBudgetForm.getRawValue().iddepartement;

    if (!idDept) return;

    this.natureGrid.forEach((ligne) => {
      const lignesExistantes = this.ligneBudgetsSource.filter(
        (l) =>
          l.idbudget === this.selectedBudget!.idbudget &&
          l.iddepartement === idDept &&
          l.idnature === ligne.idnature
      );

      if (lignesExistantes.length > 0) {
        const last = lignesExistantes[lignesExistantes.length - 1];

        ligne.idbudgetdepartementnature = last.idbudgetdepartementnature;
        ligne.montantDept = last.montantprevisiondept ?? 0;
        ligne.montantSite = last.montantprevisionsite ?? 0;
        ligne.montantSociete = last.montantprevisionsociete ?? 0;
      } else {
        ligne.idbudgetdepartementnature = undefined;
        ligne.montantDept = 0;
        ligne.montantSite = 0;
        ligne.montantSociete = 0;
      }
    })

    this.updateMontantsSelonValidation();
  }

  selectedBudgetId: string | null = null;

  onClickAfficher(): void {
    // Sécurité : aucun budget sélectionné
    if (!this.selectedBudgetId) {
      this.ligneBudgetsGrouped = [];
      return;
    }

    const budget = this.budgets.find(
      b => b.idbudget === this.selectedBudgetId
    );

    if (!budget) {
      this.ligneBudgetsGrouped = [];
      return;
    }

    this.selectedBudget = budget;

    // ✅ UTILISER LA BONNE SOURCE
    const lignes = this.ligneBudgetsSource.filter(
      l => l.idbudget === budget.idbudget
    );

    this.ligneBudgetsGrouped = [
      {
        budget,
        lignes
      }
    ];
  }



  private propagateMontantsOnValidationOpen(): void {
    if (!this.selectedBudget) return;

    const vDept = Number(this.selectedBudget.validedept) === 1;
    const vSite = Number(this.selectedBudget.validesite) === 1;

    this.validationLines = this.validationLines.map((l: any) => {
      const dept = Number(l.montantDept ?? 0);
      const site = Number(l.montantSite ?? 0);
      const soc = Number(l.montantSociete ?? 0);

      const newSite = vDept && site === 0 ? dept : site;
      const newSoc = vSite && soc === 0 ? newSite : soc;

      return {
        ...l,
        montantSite: newSite,
        montantSociete: newSoc,
      };
    });
  }





  updateMontantsSelonValidation() {
    if (!this.selectedBudget) return;
    const vDept = this.selectedBudget.validedept === 1;
    const vSite = this.selectedBudget.validesite === 1;
    this.natureGrid = this.natureGrid.map((l) => {
      if (vDept && !vSite) {
        return { ...l, montantSite: l.montantDept };
      }
      if (vSite) {
        return { ...l, montantSociete: l.montantSite };
      }
      return l;
    });
  }

  onMontantChange(
    ligne: any,
    field: 'montantDept' | 'montantSite' | 'montantSociete',
    value: number
  ) {
    ligne[field] = value;
    if (
      field === 'montantDept' &&
      this.selectedBudget?.validedept === 1 &&
      !this.selectedBudget?.validesite
    )
      ligne.montantSite = value;
    if (field === 'montantSite' && this.selectedBudget?.validesite === 1)
      ligne.montantSociete = value;
  }

  //création du formulaire
  initForm(): void {
    this.ligneBudgetForm = this.fb.group({
      idbudget: ['', [Validators.required]],
      iddepartement: [''],
      // montantprevisiondept: [''],
      montantprevisionsite: ['', [Validators.required]],
      montantprevisionsociete: ['', [Validators.required]],
      // totalconsocloture: ['', [Validators.required]],
      // soldecloture: ['', [Validators.required]],
    });
  }

  get form() {
    return this.ligneBudgetForm.controls;
  }

  dispatchLigneBudget(_object: LigneBudgetModel) {
    this.ligneBudgetForm.patchValue({
      idbudget: _object.idbudget,
      iddepartement: _object.iddepartement,
      idnature: _object.idnature,
      montantprevisiondept: _object.montantprevisiondept,
      montantprevisionsite: _object.montantprevisionsite,
      montantprevisionsociete: _object.montantprevisionsociete,
    });
  }

  //validation required
  isValidField(label: string): string {
    let status: string = '';
    this.form[label].valid && this.form[label].touched
      ? (status = 'is-valid')
      : this.form[label].invalid && this.form[label].touched
        ? (status = 'is-invalid')
        : (status = '');
    return status;
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map(
      (el) => el.idbudgetdepartementnature
    );
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(ligneBudget: LigneBudgetModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) =>
        el.idbudgetdepartementnature == ligneBudget.idbudgetdepartementnature
    );
    if (index == -1 && actif) this.objectsSelected.push(ligneBudget);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow =
      this.objectsSelected?.length == this.ligneBudgets?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.ligneBudgets.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllBudgets();
    this.getAllLigneBudgets(); // recharge les données
  }

  //Soumission du formulaire

  // onSubmit() {
  //   this.msgErros = '';

  //   const formValue = this.ligneBudgetForm.value;

  //   // ============================
  //   // MODE GRILLE (prioritaire)
  //   // ============================
  //   if (
  //     this.natureGrid?.length > 0 &&
  //     this.selectedBudget &&
  //     formValue.iddepartement
  //   ) {
  //     const payload = this.natureGrid.map((l) => ({
  //       idbudget: this.selectedBudget!.idbudget,
  //       iddepartement: formValue.iddepartement,
  //       idnature: l.idnature,
  //       montantprevisiondept: l.montantDept || 0,
  //       montantprevisionsite: l.montantSite || 0,
  //       montantprevisionsociete: l.montantSociete || 0,
  //       createdby: 'MAF',
  //     }));

  //     this.lignebudgetservice.createMultiple(payload).subscribe({
  //       next: () => {
  //         this.getAllLigneBudgets();
  //         this.resetAfterSubmit();
  //       },
  //       error: (err) => (this.msgErros = err.error?.error || 'Erreur serveur'),
  //     });

  //     return;
  //   }

  //   // ============================
  //   // MODE MODAL (une seule ligne)
  //   // ============================
  //   if (this.ligneBudgetForm.invalid) {
  //     Object.values(this.ligneBudgetForm.controls).forEach((c) =>
  //       c.markAsTouched()
  //     );
  //     this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
  //     return;
  //   }

  //   const ligne: LigneBudgetModel = {
  //     ...this.ligneBudget,
  //     ...formValue,
  //     createdby: 'MAF',
  //   };

  //   this.actionModal === 'create' ? this.create(ligne) : this.update(ligne);
  // }

  private lockBudgetAndDepartement(): void {
    this.ligneBudgetForm.get('idbudget')?.disable({ emitEvent: false });
    this.ligneBudgetForm.get('iddepartement')?.disable({ emitEvent: false });
  }

  private unlockBudgetAndDepartement(): void {
    this.ligneBudgetForm.get('idbudget')?.enable({ emitEvent: false });
    this.ligneBudgetForm.get('iddepartement')?.enable({ emitEvent: false });
  }

  updateBudget(_budget: any) {
    _budget.updatedby = this.user.nom + ' ' + this.user.prenom;
    this.budgetservice.update(_budget).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
        } else {
          this.error = 'Erreur de modification';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
        this.loading = false;
      },
    });
  }

  openValidationBudget(budget: BudgetModel) {
    this.selectedBudget = budget;
    this.showRejectComment = false;
    this.rejectComment = '';
    this.msgErros = '';

    const lignes = this.ligneBudgetsSource.filter(
      l => l.idbudget === budget.idbudget
    );

    this.validationLines = lignes.map(l => ({
      idbudgetdepartementnature: l.idbudgetdepartementnature,
      iddepartement: l.iddepartement,
      idnature: l.idnature,

      departement: l.departement?.libelle ?? '-',
      nature: l.nature_operation?.libelle ?? '-',

      montantDept: Number(l.montantprevisiondept ?? 0),
      montantSite: Number(l.montantprevisionsite ?? 0),
      montantSociete: Number(l.montantprevisionsociete ?? 0),
    }));

    // ✅ SI dept pas encore validé => on force le front à 1
    if (Number(this.selectedBudget.validedept) !== 1) {
      this.selectedBudget.validedept = 1; // ✅ IMPORTANT (résout l'intermittence)

      this.updateBudget({
        idbudget: budget.idbudget,
        libelle: budget.libelle,
        entite: budget.entite,
        datedebut: budget.datedebut,
        datefin: budget.datefin,
        idcircuitvalidation: budget.idcircuitvalidation,
        idsite: budget.idsite,
        idsociete: budget.idsociete,
        actif: budget.actif,
        validedept: 1,
        datevalidedept: new Date(),
      });
    }

    // ✅ Maintenant vDept sera toujours true
    this.propagateMontantsOnValidationOpen();

    // ✅ force le refresh dans la vue (très important avec modals Bootstrap)
    this.validationLines = [...this.validationLines];
  }


  private updateMontantsBudgetFromValidationModal() {
    if (!this.selectedBudget) return;

    // Ici on met à jour uniquement les champs qui ont été modifiés dans la modale
    const payload = this.validationLines
      .filter((l: any) => !!l.idbudgetdepartementnature)
      .map((l: any) => ({
        idbudgetdepartementnature: l.idbudgetdepartementnature,
        idbudget: this.selectedBudget!.idbudget,
        iddepartement: l.iddepartement,
        idnature: l.idnature,

        // ✅ On push les montants de la modale
        montantprevisiondept: Number(l.montantDept ?? 0),
        montantprevisionsite: Number(l.montantSite ?? 0),
        montantprevisionsociete: Number(l.montantSociete ?? 0),

        updatedby: this.user.nom + ' ' + this.user.prenom,
      }));

    if (payload.length === 0) return;

    return this.lignebudgetservice.updateMultiple(payload);
  }

  onClickValidateBudget() {
    if (!this.selectedBudget) return;

    this.msgErros = '';
    this.loading = true;

    // 1) Sauvegarder les montants de la modale en DB
    const update$ = this.updateMontantsBudgetFromValidationModal();

    // Si aucune ligne à mettre à jour → on valide directement
    if (!update$) {
      this.validationBudget(this.selectedBudget.idbudget);
      return;
    }

    update$.subscribe({
      next: () => {
        // 2) Recharge les lignes pour être clean
        this.getAllBudgets();
        this.getAllLigneBudgets();

        // 3) Ensuite validation du workflow
        this.validationBudget(this.selectedBudget!.idbudget);
      },
      error: (err: any) => {
        this.loading = false;
        this.msgErros =
          err?.error?.error ||
          err?.error?.message ||
          "Erreur lors de la mise à jour des montants";
        this.toastr.error(this.msgErros);
      },
    });
  }




  onSubmit() {
    this.msgErros = '';
    const formValue = this.ligneBudgetForm.getRawValue();

    if (!this.selectedBudget) {
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    if (
      this.selectedBudget.entite === 'Département' &&
      !formValue.iddepartement
    ) {
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    // Payload commun

    this.loading = true;

    const toCreate = this.natureGrid.filter(
      (l) => !l.idbudgetdepartementnature
    );
    const toUpdate = this.natureGrid.filter((l) => l.idbudgetdepartementnature);

    const requests$ = [];

    if (toCreate.length) {
      requests$.push(
        this.lignebudgetservice.createMultiple(
          toCreate.map((l) => ({
            idbudget: this.selectedBudget!.idbudget,
            iddepartement: formValue.iddepartement,
            idnature: l.idnature,
            montantprevisiondept: l.montantDept ?? 0,
            montantprevisionsite: l.montantSite ?? 0,
            montantprevisionsociete: l.montantSociete ?? 0,
            createdby: 'MAF',
          }))
        )
      );
    }

    if (toUpdate.length) {
      requests$.push(
        this.lignebudgetservice.updateMultiple(
          toUpdate.map((l) => ({
            idbudgetdepartementnature: l.idbudgetdepartementnature!,
            idbudget: this.selectedBudget!.idbudget,
            iddepartement: formValue.iddepartement,
            idnature: l.idnature,

            montantprevisiondept: l.montantDept ?? 0,
            montantprevisionsite: l.montantSite ?? 0,
            montantprevisionsociete: l.montantSociete ?? 0,

            updatedby: 'MAF',
          }))
        )
      );
    }

    forkJoin(requests$).subscribe({
      next: () => {
        this.getAllLigneBudgets();
        // this.resetAfterSubmit();
        this.loading = false;
        if (this.actionModal === 'update') this.closeModal('showModal')
      },
      error: (err) => { this.msgErros = err.error?.error || 'Erreur serveur' },
    });

    // ============================
    // CAS BUDGET ENTITÉ SITE
    // ============================
    if (this.selectedBudget.entite === 'Site') {
      if (this.ligneBudgetForm.invalid) {
        Object.values(this.ligneBudgetForm.controls).forEach((c) =>
          c.markAsTouched()
        );
        this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
        return;
      }

      const payload = {
        idbudget: this.selectedBudget.idbudget,
        iddepartement: null,
        idnature: null,
        montantprevisiondept: formValue.montantprevisiondept ?? 0,
        montantprevisionsite: formValue.montantprevisionsite ?? 0,
        montantprevisionsociete: formValue.montantprevisionsociete ?? 0,
        createdby: 'MAF',
      };

      this.loading = true;

      this.lignebudgetservice.create(payload).subscribe({
        next: () => {
          this.getAllLigneBudgets();
          // this.resetAfterSubmit();
          this.loading = false;
          if (this.actionModal === 'update') this.closeModal('showModal')
        },
        error: (err) => {
          this.msgErros = err.error?.error || 'Erreur serveur';
          this.loading = false;
        },
      });

      return;
    }
  }

  resetAfterSubmit(modalId: string = 'showModal') {
    // Reset formulaire
    this.ligneBudgetForm.reset();

    // Reset état métier
    this.ligneBudget = new LigneBudgetModel();
    this.selectedBudget = undefined;
    this.natureGrid = [];
    this.actionModal = 'create';
    this.msgErros = '';

    // Reset validations visuelles
    this.ligneBudgetForm.markAsPristine();
    this.ligneBudgetForm.markAsUntouched();

    this.modeSaisie = '';

    // Fermer la modale
    this.closeModal(modalId);
  }

  //Enregistrement de données
  create(_ligneBudget: LigneBudgetModel) {
    const { idbudgetdepartementnature, ...dataToSend } = _ligneBudget;

    this.loading = true;
    this.lignebudgetservice.create(dataToSend).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.resetAfterSubmit();
        } else {
          this.msgErros = 'Erreur de création';
          alert(this.error);
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.msgErros = err.error.error;
        this.loading = false;
      },
    });
  }

  validationBudget(id: string) {
    const data = {
      idbudget: id,
      iduser: this.user.idutilisateur,
      decision: "accepter",
      motif: null,
      comment: null
    }

    this.loading = true;
    this.budgetservice.validationBudget(id, data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.toastr.success('Décision enrégistrée');
          this.closeModal('validateBudgetModal')
        } else {
          this.msgErros = 'Erreur lors de la validation';
          this.toastr.error('Erreur lors de la validation');
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.msgErros = err.error.message;
        this.toastr.error(err.error.message ?? 'Erreur lors de la validation');
        this.loading = false;
      },
    });
  }

  //Modification de données
  update(_ligneBudget: any) {
    _ligneBudget.updatedby = 'admin';
    this.lignebudgetservice.update(_ligneBudget).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.resetAfterSubmit();
        } else {
          this.error = 'Erreur de modification';
        }
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = 'Modification échec';
        this.loading = false;
      },
    });
  }

  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  modalCreate() {
    this.actionModal = 'create';
    this.unlockBudgetAndDepartement();
    this.initForm();
  }

  // modalUpdate(_object: LigneBudgetModel) {
  //   this.ligneBudget = _object;
  //   this.actionModal = 'update';
  //   this.ligneBudgetForm.reset();
  //   this.dispatchLigneBudget(_object);
  // }

  onRejectClick() {
    if (!this.selectedBudget) return;
    this.showRejectComment = true;
    this.confirmRejectBudget(this.selectedBudget!.idbudget)
  }

  confirmRejectBudget(id: string) {
    const motifId = this.rejectForm.get('motif')?.value;
    const commentaire = this.rejectComment;

    if (!this.rejectComment.trim()) {
      this.msgErros = 'Le motif de rejet est obligatoire';
      return;
    }

    const data = {
      idbudget: id,
      iduser: this.user.idutilisateur,
      decision: "refuser",
      motif: motifId,
      comment: commentaire
    }

    this.loading = true;


    // 👉 appel API rejet budget
    this.budgetservice.validationBudget(id, data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getAllBudgets();
          this.getAllLigneBudgets();
          this.toastr.error('Décision de refus enrégistrée');
          this.closeModal('validateBudgetModal')
        } else {
          this.msgErros = 'Erreur lors du refus du budget';
          this.toastr.error('Erreur lors du refus du budget');
        }
        this.loading = false;
      },

      error: (err: any) => {
        this.msgErros = err.error.message;
        this.toastr.error(err.error.message ?? 'Erreur lors du refus du budget');
        this.loading = false;
      },
    });

    this.loading = false;
    this.resetValidationModal();
  }

  resetValidationModal() {
    this.validationLines = [];
    this.selectedBudget = undefined;
    this.rejectComment = '';
    this.showRejectComment = false;
    this.msgErros = '';

    this.closeModal('validateBudgetModal');
  }


  onValidateClick() {
    if (!this.selectedBudget) return;

    // 👉 appel service validation
    // budgetService.validateBudget(this.selectedBudget.idbudget)

    this.resetAfterSubmit();
  }


  modalUpdate(ligne: LigneBudgetModel) {
    this.actionModal = 'update';

    this.modeSaisie = 'ALL'
    this.ligneBudgetForm.reset();
    this.msgErros = '';


    // Sélection du budget
    this.selectedBudget = this.budgets.find(
      (b) => b.idbudget === ligne.idbudget
    );

    if (!this.selectedBudget) return;

    // ============================
    // CAS BUDGET ENTITÉ DÉPARTEMENT
    // ============================
    if (this.selectedBudget.entite === 'Département') {
      this.ligneBudgetForm.patchValue({
        idbudget: ligne.idbudget,
        iddepartement: ligne.iddepartement,
      });

      this.lockBudgetAndDepartement();

      // IMPORTANT : on ne reset plus après
      this.natureGrid = [];

      // Ceci déclenche prefillNatureGrid()
      this.loadNatureGrid(ligne.iddepartement!);

      return;
    }

    // ============================
    // CAS BUDGET ENTITÉ SITE
    // ============================
    this.ligneBudget = ligne;

    this.ligneBudgetForm.patchValue({
      idbudget: ligne.idbudget,
      iddepartement: ligne.iddepartement,
      montantprevisiondept: ligne.montantprevisiondept,
      montantprevisionsite: ligne.montantprevisionsite,
      montantprevisionsociete: ligne.montantprevisionsociete,
    });

    this.lockBudgetAndDepartement();
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: LigneBudgetModel) {
    this.deleteLigneBudget = item;
  }

  deleteConfirmed() {
    if (!this.deleteLigneBudget) return;
    this.lignebudgetservice
      .delete(this.deleteLigneBudget.idbudgetdepartementnature)
      .subscribe({
        next: (res: any) => {
          console.log('Suppression:', res);
          if (res.success) {
            this.deleteLigneBudget = null;
            this.closeModal('deleteOrder');
            this.getAllBudgets();
            this.getAllLigneBudgets();
          } else {
            this.msgErros = 'Erreur lors de la suppression';
          }
          this.loading = false;
        },
        error: (err: any) => {
          this.msgErros = err.error.error;
          this.loading = false;
        },
      });
  }
}
