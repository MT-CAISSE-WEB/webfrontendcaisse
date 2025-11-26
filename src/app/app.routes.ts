import { Routes } from '@angular/router';
import { APP, APP_TAUX_DONNEE_BASE, APP_TAUX, APP_PLAN_COMPTABLE_DONNEE_BASE, APP_CENTRE_ANALYTIQUE_DONNEE_BASE, APP_NATURE_OPERATION_DONNEE_BASE } from './_core/routes/frontend.root';
import { LayoutMainComponent } from './layout/layout-main/layout-main.component';
import { LayoutContentComponent } from './layout/composant/layout-content/layout-content.component';
import { TauxdeviseComponent } from './features/donnee_base/donnee_base/tauxdevise/tauxdevise.component';
import { CentreanalytiqueComponent } from './features/donnee_base/centreanalytique/centreanalytique.component';
import { PlancomptableComponent } from './features/donnee_base/plancomptable/plancomptable.component';
import { NatureoperationComponent } from './features/donnee_base/natureoperation/natureoperation.component';

export const routes: Routes = [
    { 
        path : APP,
        component: LayoutMainComponent,
        children: [   
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
        ]
    },
    {
        path: '',
        redirectTo: APP,
        pathMatch : 'full'
    },
];
