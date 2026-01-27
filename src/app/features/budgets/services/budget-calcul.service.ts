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

    // 🔥 SOCIÉTÉ = uniquement les montants société
    if (budget.validesociete === 1 && budget.validesite === 1 && budget.validedept === 1) {
      const lignesSociete = lignes.filter(
        l =>
          l.idbudget === budget.idbudget &&
          l.montantprevisionsociete != null
      );

      return this.sum(lignesSociete, 'montantprevisionsociete');
    }

    // 🔥 SITE
    if (budget.validesite === 1 && budget.validedept === 1 && budget.validesociete === 0) {
      const lignesSite = lignes.filter(
        l =>
          l.idbudget === budget.idbudget &&
          l.montantprevisionsite != null
      );

      return this.sum(lignesSite, 'montantprevisionsite');
    }

    // 🔥 DÉPARTEMENT
    if (budget.validedept === 1 && budget.validesite === 0 && budget.validesociete === 0) {
      const lignesDept = lignes.filter(
        l =>
          l.idbudget === budget.idbudget &&
          l.montantprevisiondept != null
      );

      return this.sum(lignesDept, 'montantprevisiondept');
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
