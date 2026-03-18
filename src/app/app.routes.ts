import { Routes } from '@angular/router';
import { APP, APP_DONNEE_BASE_DEVISE, APP_AFF_NATURE_CENTRE_DONNEE_BASE, 
    APP_TIERS_DONNEE_BASE, APP_BUDGETS_LIGNE_BUDGET, APP_BUDGETS_BUDGET, 
    APP_ROOT_DMD_DECAISSEMENT, APP_AFF_DEPT_NATURE_DONNEE_BASE, APP_ROLE_ADMINISTRATION, 
    APP_TAUX_DONNEE_BASE, 
    APP_TAUX, APP_PLAN_COMPTABLE_DONNEE_BASE, APP_CENTRE_ANALYTIQUE_DONNEE_BASE, 
    APP_NATURE_OPERATION_DONNEE_BASE, APP_JOURNAL_CAISSE_JOURNAL, 
    APP_CAISSE_CAISSE_JOURNAL, APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL,
     APP_OPERATION, APP_OPERATION_GENERAL,APP_STRUCTURE_SOCIETE, APP_USER,
     APP_USER_ADMINISTRATION, APP_STRUCTURE_SITE, APP_STRUCTURE_DEPARTEMENT, 
     APP_PERMISSION_ADMINISTRATION, APP_ROLE_PERMISSION_ADMINISTRATION,
     APP_ROOT_DMD_EDIT_DECAISSEMENT,
     APP_ROOT_EDIT_DECAISSEMENT,
     APP_WORKFLOW_ADMINISTRATION, APP_SUIVIBUDGET_CONSULTATION,
    APP_SUIVIBUDGETFILTRE_CONSULTATION, 
    APP_OPERATIONPERIODE_CONSULTATION,
    APP_OPERATIONDETAILS_CONSULTATION,
    APP_PARAMETREPAGE_PARAMETRE,
    APP_OPERATION_GENERAL_JUSTIFIER,
    APP_COMPTABILISATION, APP_DECAISSEMENTAJUSTIFIER,
    APP_DECAISSEMENTAJUSTIFIER_CONSULTATION,
    APP_STATSAFFDEPTNATURE_CONSULTATION} from './_core/routes/frontend.root';

import { LayoutMainComponent } from './layout/layout-main/layout-main.component';
import { LayoutContentComponent } from './layout/composant/layout-content/layout-content.component';
import { TauxdeviseComponent } from './features/donnee_base/donnee_base/tauxdevise/tauxdevise.component';
import { JournalComponent } from './features/caisse_journal/journal/journal.component';
import { CaisseComponent } from './features/caisse_journal/caisse/caisse.component';
import { AffectationCaissierComponent } from './features/caisse_journal/affectation-caissier/affectation-caissier.component';
import { OperationCaisseComponent } from './features/operations/operation-caisse/operation-caisse.component';
import { BudgetComponent } from './features/budgets/budget/budget.component';
import { LigneBudgetComponent } from './features/budgets/ligne-budget/ligne-budget.component';
import { DemandeDecaissementComponent } from './features/demande/demande_decaissement/demande-decaissement.component';

// RICHARD
import { CentreanalytiqueComponent } from './features/donnee_base/centreanalytique/centreanalytique.component';
import { PlancomptableComponent } from './features/donnee_base/plancomptable/plancomptable.component';
import { NatureoperationComponent } from './features/donnee_base/natureoperation/natureoperation.component';
import { TiersComponent } from './features/donnee_base/tiers/tiers.component';
import { AffectationNatureCentreComponent } from './features/donnee_base/affectationnaturecentre/affectationnaturecentre.component';
import { AffectationDepartementNatureComponent } from './features/donnee_base/affectationdepartementnature/affectationdepartementnature.component';

import { SuiviBudgetComponent } from './features/consultations/suivibudget/suivibudget.component';
import { SuiviBudgetByFiltresComponent } from './features/consultations/suivibudgetbyfiltres/suivibudgetbyfiltres.component';

import { LoginComponent } from './features/administration/login/login.component';
import { AuthGuard } from './features/administration/service/auth.guard';
import { DepartementComponent } from './features/structure/departement/departement.component';
import { SiteComponent } from './features/structure/site/site.component';
import { SocieteComponent } from './features/structure/societe/societe.component';
import { DeviseComponent } from './features/donnee_base/donnee_base/devise/devise.component';
import { UserComponent } from './features/administration/user/user.component';
import { EditDemandeComponent } from './features/demande/edit-demande/edit-demande.component';
import { RoleComponent } from './features/administration/role/role.component';
import { PermissionComponent } from './features/administration/permission/permission.component';
import { RolepermissionComponent } from './features/administration/rolepermission/rolepermission.component';
import { CircuitvalidationComponent } from './features/workflow/circuitvalidation/circuitvalidation.component';
import { operationModel } from './features/operations/model/operation.model';
import { OperationPeriodeComponent } from './features/consultations/operation-periode/operation-periode.component';
import { OperationDetailComponent } from './features/consultations/operation-detail/operation-detail.component';
import { ParametrePageComponent } from './features/paramètres/parametre-page/parametre-page.component';
import { OprationJustifieeComponent } from './features/operations/opration-justifiee/opration-justifiee.component';
import { ComptabilisationComponent } from './features/consultations/comptabilisation/comptabilisation.component';
import { DecaissementJustifierComponent } from './features/consultations/decaissement-justifier/decaissement-justifier.component';
import { NatureOperationByDepartementComponent } from './features/consultations/nature-par-departement/nature-par-departement.component';
import { UpdatepasswordComponent } from './features/administration/updatepassword/updatepassword.component';

export const routes: Routes = [
  {
      path :'login',
      component:LoginComponent
  },
  {
    path: '',
    redirectTo: 'app',
    pathMatch: 'full'
  },
  {
    path: APP,
    canActivate: [AuthGuard],
    component: LayoutMainComponent,
    children: [
      {
        path : '',
        component: LayoutContentComponent
      },
      {
        path : "app/administration/changepassword",
        component : UpdatepasswordComponent
      },
      {
        path : APP_STRUCTURE_DEPARTEMENT,
        component : DepartementComponent
      },
      {
          path : APP_STRUCTURE_SITE,
          component : SiteComponent
      } ,
      {
          path : APP_TAUX_DONNEE_BASE,
          component: TauxdeviseComponent,
      },
      {
          path : APP_JOURNAL_CAISSE_JOURNAL,
          component: JournalComponent,
      },
      {
          path : APP_CAISSE_CAISSE_JOURNAL,
          component: CaisseComponent,
      },
      {
          path : APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL,
          component: AffectationCaissierComponent,
      },
      {
          path : APP_OPERATION_GENERAL,
          component: OperationCaisseComponent,
      },
      {
          path: APP_OPERATION_GENERAL_JUSTIFIER,
          component: OprationJustifieeComponent 
      },
      {
          path : APP_STRUCTURE_SOCIETE,
          component : SocieteComponent
      },
      {
          path : APP_DONNEE_BASE_DEVISE,
          component : DeviseComponent
      },
      {
          path: APP_USER_ADMINISTRATION,
          component: UserComponent
      },
      // ferreol
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
        path: APP_ROOT_DMD_EDIT_DECAISSEMENT,
        component: EditDemandeComponent,
      },
      {
        path: APP_ROOT_EDIT_DECAISSEMENT,
        component: EditDemandeComponent,
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
      // Début travaux Richard...
      {
          path : APP_TIERS_DONNEE_BASE,
          component: TiersComponent,
      },
      {
          path : APP_CENTRE_ANALYTIQUE_DONNEE_BASE,
          component: CentreanalytiqueComponent,
      },
      {
          path : APP_PLAN_COMPTABLE_DONNEE_BASE,
          component: PlancomptableComponent,
      },
      {
          path : APP_NATURE_OPERATION_DONNEE_BASE,
          component: NatureoperationComponent,
      },
      {
          path : APP_AFF_NATURE_CENTRE_DONNEE_BASE,
          component: AffectationNatureCentreComponent,
      },
      {
          path : APP_AFF_DEPT_NATURE_DONNEE_BASE,
          component: AffectationDepartementNatureComponent,
      },
      {
          path: APP_USER_ADMINISTRATION,
          component: UserComponent
      },
      {
          path : APP_ROLE_ADMINISTRATION,
          component : RoleComponent
      },
      {
          path : APP_PERMISSION_ADMINISTRATION,
          component : PermissionComponent
      },
      {
          path : APP_ROLE_PERMISSION_ADMINISTRATION,
          component : RolepermissionComponent
      },
      {
          path : APP_WORKFLOW_ADMINISTRATION,
          component:CircuitvalidationComponent
      },
      {
          path : APP_SUIVIBUDGET_CONSULTATION,
          component:SuiviBudgetComponent
      },
      {
          path : APP_SUIVIBUDGETFILTRE_CONSULTATION,
          component:SuiviBudgetByFiltresComponent
      },
      {
          path : APP_OPERATIONPERIODE_CONSULTATION,
          component: OperationPeriodeComponent
      },
      {
          path : APP_OPERATIONDETAILS_CONSULTATION,
          component: OperationDetailComponent
      },
      {
          path : APP_PARAMETREPAGE_PARAMETRE,
          component: ParametrePageComponent
      },
      {
          path : APP_COMPTABILISATION,
          component: ComptabilisationComponent
      },
      {
        path: APP_STATSAFFDEPTNATURE_CONSULTATION,
        component: NatureOperationByDepartementComponent,
      },
      {
          path : APP_DECAISSEMENTAJUSTIFIER_CONSULTATION,
          component: DecaissementJustifierComponent
      },
    ]
  }
];



