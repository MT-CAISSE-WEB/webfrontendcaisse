import { Injectable } from '@angular/core';
import { BudgetModel } from '../models/budget.model';
import { LigneBudgetModel } from '../models/ligne_budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetPrevisionService {
  /* ==========================
   🔹 PRÉVISION BUDGET ANNUEL
  ========================== */
  calculPrevisionBudgetAnnuel(
    budgetAnnuel: BudgetModel,
    budgets: BudgetModel[],
    lignes: LigneBudgetModel[]
  ): number {
    const budgetsMensuels = budgets.filter(
      (b) =>
        b.typebudget === 'Mensuel' && b.idbudgetparent === budgetAnnuel.idbudget
    );

    // 🔹 Aucun budget mensuel
    if (budgetsMensuels.length === 0) {
      return this.calculPrevisionBudget(budgetAnnuel, lignes);
    }

    // 🔹 Somme des budgets mensuels
    return budgetsMensuels.reduce((total, mensuel) => {
      return total + this.calculPrevisionBudget(mensuel, lignes);
    }, 0);
  }

  /* ==========================
   🔸 PRÉVISION BUDGET (MENSUEL / ANNUEL)
  ========================== */
  calculPrevisionBudget(
    budget: BudgetModel,
    lignes: LigneBudgetModel[]
  ): number {
    const lignesBudget = lignes.filter(
      (l) =>
        l.idbudget === budget.idbudget &&
        (!budget.entite ||
          !l.iddepartement ||
          l.iddepartement === l.iddepartement)
    );

    // 🔥 Priorité SOCIÉTÉ
    if (budget.validesociete === 1) {
      return this.sum(lignesBudget, 'montantprevisionsociete');
    }

    // 🔥 SITE
    if (budget.validedept === 1 && budget.validesite === 1) {
      return this.sum(lignesBudget, 'montantprevisionsite');
    }

    // 🔥 DÉPARTEMENT
    if (budget.validedept === 1) {
      return this.sum(lignesBudget, 'montantprevisiondept');
    }

    return 0;
  }

  /* ==========================
   🧮 UTILITAIRE
  ========================== */
  private sum(
    lignes: LigneBudgetModel[],
    field: keyof LigneBudgetModel
  ): number {
    return lignes.reduce((acc, l) => acc + (Number(l[field]) || 0), 0);
  }
}
