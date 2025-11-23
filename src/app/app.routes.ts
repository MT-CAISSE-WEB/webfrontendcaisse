import { Routes } from '@angular/router';
import { APP, APP_CENTRE_GESTION } from './_core/routes/frontend.root';
import { LayoutMainComponent } from './layout/layout-main/layout-main.component';
import { LayoutContentComponent } from './layout/composant/layout-content/layout-content.component';

export const routes: Routes = [
    { 
        path : APP,
        component: LayoutMainComponent,
        children: [   
            {
                path : 'test',
                component: LayoutContentComponent,
            }
        ]
    },
    {
        path: '',
        redirectTo: APP,
        pathMatch : 'full'
    },
];
