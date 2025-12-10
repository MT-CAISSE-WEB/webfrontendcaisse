import { Routes } from '@angular/router';
import { APP,APP_DONNEE_BASE_DEVISE, APP_TAUX_DONNEE_BASE, APP_TAUX, APP_PLAN_COMPTABLE_DONNEE_BASE, APP_CENTRE_ANALYTIQUE_DONNEE_BASE, APP_NATURE_OPERATION_DONNEE_BASE, APP_JOURNAL_CAISSE_JOURNAL, APP_CAISSE_CAISSE_JOURNAL, APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL, APP_OPERATION, APP_OPERATION_GENERAL,APP_STRUCTURE_SOCIETE, APP_USER, APP_USER_ADMINISTRATION, APP_STRUCTURE_SITE, APP_STRUCTURE_DEPARTEMENT } from './_core/routes/frontend.root';
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
import { Component } from '@angular/core';
import { SocieteComponent } from './features/structure/societe/societe.component';
import { DeviseComponent } from './features/donnee_base/donnee_base/devise/devise.component';
import { LoginComponent  } from './features/administration/login/login.component';
import { AuthGuard } from './features/administration/service/auth.guard';
import { UserComponent } from './features/administration/user/user.component';
import { SiteComponent } from './features/structure/site/site.component';
import { DepartementComponent } from './features/structure/departement/departement.component';

export const routes: Routes = [
    {
        path :'login',
        component:LoginComponent
    },
    { 
        path : APP,
        canActivate: [AuthGuard],
        component: LayoutMainComponent,
        children: [ 
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
            }
         
        ]
    },
    {
        path: '',
        redirectTo:'login',
        pathMatch : 'full'
    },
];
