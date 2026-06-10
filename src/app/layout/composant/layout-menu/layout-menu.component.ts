import { Component } from '@angular/core';
import { APP_ROOT,APP_ROOT_DONNEE_BASE_DEVISE, 
  APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL, 
  APP_ROOT_CAISSE_CAISSE_JOURNAL, APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE, 
  APP_ROOT_JOURNAL_CAISSE_JOURNAL, APP_ROOT_NATURE_OPERATION_DONNEE_BASE, 
  APP_ROOT_OPERATION_GENERAL, APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE, 
  APP_ROOT_TIERS_DONNEE_BASE, 
  APP_ROOT_TAUX_DONNEE_BASE, APP_STRUCTURE_SOCIETE, APP_ROOT_USER_ADMINISTRATION, 
  APP_ROOT_STRUCTURE_SITE, APP_ROOT_STRUCTURE_DEPARTEMENT, 
  APP_ROOT_ROLE_PERMISSION_ADMINISTRATION, APP_ROOT_PERMISSION_ADMINISTRATION, 
  APP_ROOT_ROLE_ADMINISTRATION,APP_ROOT_AFF_NATURE_CENTRE_DONNEE_BASE, 
  APP_AFF_DEPT_NATURE_DONNEE_BASE,
  APP_ROOT_BUDGETS_LIGNE_BUDGET, APP_ROOT_BUDGETS_BUDGET,
  APP_ROOT_DMD_DECAISSEMENT, 
  APP_ROOT_WORKFLOW_ADMINISTRATION,
  APP_ROOT_SUIVIBUDGET_CONSULTATION, APP_ROOT_SUIVIBUDGETFILTRE_CONSULTATION,
  APP_ROOT_OPERATIONPERIODE_CONSULTATION,
  APP_ROOT_OPERATIONDETAILS_CONSULTATION,
  APP_ROOT_OPERATION_GENERAL_JUSITIFIER,
  APP_ROOT_COMPTABILISATION,
  APP_ROOT_DECAISSEMENTAJUSTIFIER_CONSULTATION,
  APP_ROOT_STATSAFFDEPTNATURE_CONSULTATION,
  APP_ROOT_DETAILDEAMNDE_CONSULTATION,
  APP_ROOT_BANQUE_DONNEE_BASE,
  APP_ROOT_CLOTURECAISSE_CONSULTATION,
  APP_ROOT_SOLDECAISSE_CONSULTATION} from '../../../_core/routes/frontend.root';

import { RouterLink, RouterModule, RouterOutlet } from "@angular/router";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout-menu',
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './layout-menu.component.html',
  styleUrl: './layout-menu.component.css'
})
export class LayoutMenuComponent {
  root_banque = APP_ROOT_BANQUE_DONNEE_BASE;
  root_taux = APP_ROOT_TAUX_DONNEE_BASE;
  root_tiers = APP_ROOT_TIERS_DONNEE_BASE;
  root_centre_analytique = APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE;
  root_plan_comptable = APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE;
  root_nature_operation = APP_ROOT_NATURE_OPERATION_DONNEE_BASE;
  root_aff_nature_centre = APP_ROOT_AFF_NATURE_CENTRE_DONNEE_BASE;
  root_aff_dept_nature = APP_AFF_DEPT_NATURE_DONNEE_BASE;
  root_journal = APP_ROOT_JOURNAL_CAISSE_JOURNAL;
  root_caisse = APP_ROOT_CAISSE_CAISSE_JOURNAL;
  root_affectation_caissier = APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL;
  root_operation = APP_ROOT_OPERATION_GENERAL;
  root_budget = APP_ROOT_BUDGETS_BUDGET;
  root_ligne_budget = APP_ROOT_BUDGETS_LIGNE_BUDGET;
  root_demande_decaissement = APP_ROOT_DMD_DECAISSEMENT;
  root_societe = APP_STRUCTURE_SOCIETE;
  root_devise = APP_ROOT_DONNEE_BASE_DEVISE;
  root_utilisateur = APP_ROOT_USER_ADMINISTRATION;
  root_site = APP_ROOT_STRUCTURE_SITE;
  root_departement = APP_ROOT_STRUCTURE_DEPARTEMENT;
  root_role = APP_ROOT_ROLE_ADMINISTRATION;
  root_permission = APP_ROOT_PERMISSION_ADMINISTRATION;
  root_role_permission = APP_ROOT_ROLE_PERMISSION_ADMINISTRATION;
  root_workflow = APP_ROOT_WORKFLOW_ADMINISTRATION;
  root = APP_ROOT;
  root_suivibudget = APP_ROOT_SUIVIBUDGET_CONSULTATION;
  root_suivibudgetfiltre = APP_ROOT_SUIVIBUDGETFILTRE_CONSULTATION;
  root_operationperiode = APP_ROOT_OPERATIONPERIODE_CONSULTATION;
  root_operationdetail = APP_ROOT_OPERATIONDETAILS_CONSULTATION;
  root_operationjustifiee = APP_ROOT_OPERATION_GENERAL_JUSITIFIER;
  root_comptabilisation = APP_ROOT_COMPTABILISATION;
  root_decaissementjustifiee = APP_ROOT_DECAISSEMENTAJUSTIFIER_CONSULTATION;
  root_nature_operation_departement = APP_ROOT_STATSAFFDEPTNATURE_CONSULTATION;
  root_detail_demande = APP_ROOT_DETAILDEAMNDE_CONSULTATION;
  root_cloture_caisse = APP_ROOT_CLOTURECAISSE_CONSULTATION;
  root_solde_caisse = APP_ROOT_SOLDECAISSE_CONSULTATION;

  admin : boolean =false;
  supervisor : boolean=false;
  caissier : boolean = false;
  comptable : boolean = false; 
  superadmin : boolean = false;
  demandeur : boolean = false;

  isuperadmin (): boolean {
      if (typeof window !== 'undefined') {
            const user =JSON.parse(localStorage.getItem('user') || '{}') ;
        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];
            if (element['code'] ==='00')
                {
                    this.superadmin = true;  
                }
        }
    }
     return this.superadmin;
  }

  isadmin(): boolean {
      if (typeof window !== 'undefined') {
            const user =JSON.parse(localStorage.getItem('user') || '{}') ;
        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];
            if (element['code'] ==='01')
                {
                    this.admin = true;  
                }
        }
    }
     return this.admin;
  }

  issuperviseur (): boolean {
      if (typeof window !== 'undefined') {
            const user =JSON.parse(localStorage.getItem('user') || '{}') ;
        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];
            if (element['code'] ==='02')
                {
                    this.supervisor = true;  
                }
        }
    }
     return this.supervisor;
  }

  iscomptable (): boolean {
      if (typeof window !== 'undefined') {
            const user =JSON.parse(localStorage.getItem('user') || '{}') ;
        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];
            if (element['code'] ==='03')
                {
                    this.comptable = true;  
                }
        }
    }
     return this.comptable;
  }

  iscaissier (): boolean {
      if (typeof window !== 'undefined') {
            const user =JSON.parse(localStorage.getItem('user') || '{}') ;
        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];
            if (element['code'] ==='04')
                {
                    this.caissier = true;  
                }
        }
    }
     return  this.caissier;
  }

  isdemandeur (): boolean {
      if (typeof window !== 'undefined') {
            const user =JSON.parse(localStorage.getItem('user') || '{}') ;
        for (let index = 0; index < user.roles.length; index++) {
            const element = user.roles[index];
            if (element['code'] ==='05')
                {
                    this.demandeur = true;  
                }
        }
    }
     return this.demandeur;
  }

}