import { Routes } from '@angular/router';
import {
  APP,
  APP_TAUX_DONNEE_BASE,
  APP_TAUX,
  APP_PLAN_COMPTABLE_DONNEE_BASE,
  APP_CENTRE_ANALYTIQUE_DONNEE_BASE,
  APP_NATURE_OPERATION_DONNEE_BASE,
  APP_JOURNAL_CAISSE_JOURNAL,
  APP_CAISSE_CAISSE_JOURNAL,
  APP_BUDGETS_BUDGET,
  APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL,
  APP_OPERATION,
  APP_OPERATION_GENERAL,
  APP_BUDGETS_LIGNE_BUDGET,
  APP_ROOT_DMD_DECAISSEMENT,
} from './_core/routes/frontend.root';
import { LayoutMainComponent } from './layout/layout-main/layout-main.component';
import { LayoutContentComponent } from './layout/composant/layout-content/layout-content.component';
import { TauxdeviseComponent } from './features/donnee_base/donnee_base/tauxdevise/tauxdevise.component';
import { CentreanalytiqueComponent } from './features/donnee_base/centreanalytique/centreanalytique.component';
import { PlancomptableComponent } from './features/donnee_base/plancomptable/plancomptable.component';
import { NatureoperationComponent } from './features/donnee_base/natureoperation/natureoperation.component';
import { JournalComponent } from './features/caisse_journal/journal/journal.component';
import { CaisseComponent } from './features/caisse_journal/caisse/caisse.component';
import { AffectationCaissierComponent } from './features/caisse_journal/affectation-caissier/affectation-caissier.component';
import { OperationCaisseComponent } from './features/operations/operation-caisse/operation-caisse.component';
import { BudgetComponent } from './features/budgets/budget/budget.component';
import { LigneBudgetComponent } from './features/budgets/ligne-budget/ligne-budget.component';
import { DemandeDecaissementComponent } from './features/demande_decaissement/demande-decaissement.component';

export const routes: Routes = [
  {
    path: APP,
    component: LayoutMainComponent,
    children: [
      {
        path: APP_TAUX_DONNEE_BASE,
        component: TauxdeviseComponent,
      },
      {
        path: APP_CENTRE_ANALYTIQUE_DONNEE_BASE,
        component: CentreanalytiqueComponent,
      },
      {
        path: APP_PLAN_COMPTABLE_DONNEE_BASE,
        component: PlancomptableComponent,
      },
      {
        path: APP_NATURE_OPERATION_DONNEE_BASE,
        component: NatureoperationComponent,
      },
      {
        path: APP_BUDGETS_BUDGET,
        component: BudgetComponent,
      },
      {
        path: APP_BUDGETS_LIGNE_BUDGET,
        component: LigneBudgetComponent,
      },
      {
        path: APP_ROOT_DMD_DECAISSEMENT,
        component: DemandeDecaissementComponent,
      },
      {
        path: APP_JOURNAL_CAISSE_JOURNAL,
        component: JournalComponent,
      },
      {
        path: APP_CAISSE_CAISSE_JOURNAL,
        component: CaisseComponent,
      },
      {
        path: APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL,
        component: AffectationCaissierComponent,
      },
      {
        path: APP_OPERATION_GENERAL,
        component: OperationCaisseComponent,
      },
    ],
  },
  {
    path: '',
    redirectTo: APP,
    pathMatch: 'full',
  },
];
