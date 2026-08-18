// services/menu-config.service.ts
import { Injectable } from '@angular/core';
import {
  APP_ROOT_USER_ADMINISTRATION,
  APP_ROOT_ROLE_ADMINISTRATION,
  APP_ROOT_WORKFLOW_ADMINISTRATION,
  APP_ROOT_STRUCTURE_SOCIETE,
  APP_ROOT_STRUCTURE_SITE,
  APP_ROOT_STRUCTURE_DEPARTEMENT,
  APP_ROOT_DONNEE_BASE_DEVISE,
  APP_ROOT_TAUX_DONNEE_BASE,
  APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE,
  APP_ROOT_NATURE_OPERATION_DONNEE_BASE,
  APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE,
  APP_ROOT_TIERS_DONNEE_BASE,
  APP_ROOT_AFF_NATURE_CENTRE_DONNEE_BASE,
  APP_AFF_DEPT_NATURE_DONNEE_BASE,
  APP_ROOT_JOURNAL_CAISSE_JOURNAL,
  APP_ROOT_CAISSE_CAISSE_JOURNAL,
  APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL,
  APP_ROOT_BUDGETS_BUDGET,
  APP_ROOT_BUDGETS_LIGNE_BUDGET,
  APP_ROOT_DMD_DECAISSEMENT,
  APP_ROOT_OPERATION_GENERAL,
  APP_ROOT_OPERATION_GENERAL_JUSITIFIER,
  APP_ROOT_OPERATION_GENERAL_JUSITIFIER_LIST,
  APP_ROOT_DETAILDEAMNDE_CONSULTATION,
  APP_ROOT_OPERATIONPERIODE_CONSULTATION,
  APP_ROOT_OPERATIONDETAILS_CONSULTATION,
  APP_ROOT_SUIVIBUDGET_CONSULTATION,
  APP_ROOT_SUIVIBUDGETFILTRE_CONSULTATION,
  APP_ROOT_DECAISSEMENTAJUSTIFIER_CONSULTATION,
  APP_ROOT_STATSAFFDEPTNATURE_CONSULTATION,
  APP_ROOT_SOLDECAISSE_CONSULTATION,
  APP_ROOT_CLOTURECAISSE_CONSULTATION,
  APP_ROOT_COMPTABILISATION,
  APP_ROOT_BANQUE_DONNEE_BASE,
  APP_ROOT_AFF_DEPT_NATURE_DONNEE_BASE,
  APP_ROOT_PARAMETRE,
} from '../../../_core/routes/frontend.root';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
  category: string;
  shortcut: string;
  color: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuConfigService {
  change_password_route = '/app/administration/changepassword';
  getAllMenuItems(): MenuItem[] {
    return [
      // ==================== ADMINISTRATION ====================
      {
        label: 'Utilisateurs',
        route: APP_ROOT_USER_ADMINISTRATION,
        icon: 'ri-account-circle-line',
        category: 'Administration',
        shortcut: 'U',
        color: '#3b82f6',
        roles: ['admin', 'superadmin'],
      },
      {
        label: 'Rôles & Permissions',
        route: APP_ROOT_ROLE_ADMINISTRATION,
        icon: 'ri-tools-line',
        category: 'Administration',
        shortcut: 'R',
        color: '#8b5cf6',
        roles: ['superadmin'],
      },
      {
        label: 'Workflow',
        route: APP_ROOT_WORKFLOW_ADMINISTRATION,
        icon: 'ri-refresh-line',
        category: 'Administration',
        shortcut: 'W',
        color: '#06b6d4',
        roles: ['admin', 'superadmin'],
      },

      // ==================== PARAMÉTRAGES ====================
      {
        label: 'Société',
        route: APP_ROOT_STRUCTURE_SOCIETE,
        icon: 'ri-building-line',
        category: 'Paramétrages',
        shortcut: 'S',
        color: '#10b981',
        roles: ['admin', 'superviseur', 'superadmin'],
      },
      {
        label: 'Site',
        route: APP_ROOT_STRUCTURE_SITE,
        icon: 'ri-map-pin-line',
        category: 'Paramétrages',
        shortcut: 'P',
        color: '#f59e0b',
        roles: ['admin', 'superviseur', 'superadmin'],
      },
      {
        label: 'Département',
        route: APP_ROOT_STRUCTURE_DEPARTEMENT,
        icon: 'ri-folder-line',
        category: 'Paramétrages',
        shortcut: 'D',
        color: '#ef4444',
        roles: ['superviseur', 'superadmin'],
      },

      // ==================== DONNÉES DE BASE ====================
      {
        label: 'Devise',
        route: APP_ROOT_DONNEE_BASE_DEVISE,
        icon: 'ri-money-dollar-circle-line',
        category: 'Données de base',
        shortcut: 'V',
        color: '#3b82f6',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      {
        label: 'Taux de devise',
        route: APP_ROOT_TAUX_DONNEE_BASE,
        icon: 'ri-exchange-line',
        category: 'Données de base',
        shortcut: 'T',
        color: '#8b5cf6',
        roles: ['comptable', 'superviseur', 'caissier', 'superadmin'],
      },
      {
        label: 'Plan comptable',
        route: APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE,
        icon: 'ri-booklet-line',
        category: 'Données de base',
        shortcut: 'C',
        color: '#06b6d4',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      {
        label: 'Nature opération',
        route: APP_ROOT_NATURE_OPERATION_DONNEE_BASE,
        icon: 'ri-tag-line',
        category: 'Données de base',
        shortcut: 'N',
        color: '#10b981',
        roles: ['comptable', 'superviseur', 'caissier', 'superadmin'],
      },
      {
        label: 'Centre analytique',
        route: APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE,
        icon: 'ri-pie-chart-2-line',
        category: 'Données de base',
        shortcut: 'A',
        color: '#f59e0b',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      {
        label: 'Tiers',
        route: APP_ROOT_TIERS_DONNEE_BASE,
        icon: 'ri-user-3-line',
        category: 'Données de base',
        shortcut: 'I',
        color: '#ef4444',
        roles: ['comptable', 'superviseur', 'caissier', 'superadmin'],
      },
      {
        label: 'Banque',
        route: APP_ROOT_BANQUE_DONNEE_BASE,
        icon: 'ri-bank-line',
        category: 'Données de base',
        shortcut: 'B',
        color: '#3b82f6',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },

      {
        label: 'Aff. Dépt - Nature',
        route: APP_ROOT_AFF_DEPT_NATURE_DONNEE_BASE,
        icon: 'ri-bank-line',
        category: 'Données de base',
        shortcut: 'AFF',
        color: '#3b82f6',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      {
        label: 'Aff. Centre - Nature',
        route: APP_ROOT_AFF_NATURE_CENTRE_DONNEE_BASE,
        icon: 'ri-bank-line',
        category: 'Données de base',
        shortcut: 'AFF',
        color: '#3b82f6',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      // ==================== CAISSE ET JOURNAL ====================
      {
        label: 'Journal',
        route: APP_ROOT_JOURNAL_CAISSE_JOURNAL,
        icon: 'ri-file-text-line',
        category: 'Caisse et Journal',
        shortcut: 'J',
        color: '#3b82f6',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      {
        label: 'Caisse',
        route: APP_ROOT_CAISSE_CAISSE_JOURNAL,
        icon: 'ri-bank-card-2-line',
        category: 'Caisse et Journal',
        shortcut: 'K',
        color: '#10b981',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      {
        label: 'Affectation caissier',
        route: APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL,
        icon: 'ri-user-settings-line',
        category: 'Caisse et Journal',
        shortcut: 'A',
        color: '#f59e0b',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },

      // ==================== GESTION DU BUDGET ====================
      {
        label: 'Budget',
        route: APP_ROOT_BUDGETS_BUDGET,
        icon: 'ri-folder-chart-line',
        category: 'Gestion du budget',
        shortcut: 'B',
        color: '#3b82f6',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },
      {
        label: 'Lignes du budget',
        route: APP_ROOT_BUDGETS_LIGNE_BUDGET,
        icon: 'ri-list-check-3',
        category: 'Gestion du budget',
        shortcut: 'L',
        color: '#8b5cf6',
        roles: ['comptable', 'superviseur', 'superadmin'],
      },

      // ==================== OPÉRATIONS ====================
      {
        label: 'Demande de décaissement',
        route: '/app/' + APP_ROOT_DMD_DECAISSEMENT,
        icon: 'ri-file-edit-line',
        category: 'Opérations',
        shortcut: 'D',
        color: '#06b6d4',
        roles: [
          'superviseur',
          'comptable',
          'caissier',
          'demandeur',
          'superadmin',
        ],
      },
      {
        label: 'Opération caisse',
        route: APP_ROOT_OPERATION_GENERAL,
        icon: 'ri-cash-line',
        category: 'Opérations',
        shortcut: 'O',
        color: '#10b981',
        roles: ['caissier', 'superviseur', 'superadmin'],
      },
      {
        label: 'Justificatif des opérations (Liste)',
        route: APP_ROOT_OPERATION_GENERAL_JUSITIFIER_LIST,
        icon: 'ri-list-check',
        category: 'Opérations',
        shortcut: 'L',
        color: '#8b5cf6',
        roles: ['caissier', 'superviseur', 'superadmin'],
      },

      // ==================== CONSULTATIONS ====================
      {
        label: 'Détail des demandes',
        route: APP_ROOT_DETAILDEAMNDE_CONSULTATION,
        icon: 'ri-file-search-line',
        category: 'Consultations',
        shortcut: 'R',
        color: '#3b82f6',
        roles: ['superviseur', 'comptable', 'caissier', 'superadmin'],
      },
      {
        label: 'Journal de paiement',
        route: APP_ROOT_OPERATIONPERIODE_CONSULTATION,
        icon: 'ri-calendar-event-line',
        category: 'Consultations',
        shortcut: 'P',
        color: '#8b5cf6',
        roles: ['superviseur', 'comptable', 'caissier', 'superadmin'],
      },
      {
        label: 'Opération détail de caisse',
        route: APP_ROOT_OPERATIONDETAILS_CONSULTATION,
        icon: 'ri-file-list-3-line',
        category: 'Consultations',
        shortcut: 'T',
        color: '#06b6d4',
        roles: ['superviseur', 'caissier', 'superadmin'],
      },
      {
        label: 'Évolution budgétaire',
        route: APP_ROOT_SUIVIBUDGET_CONSULTATION,
        icon: 'ri-line-chart-line',
        category: 'Consultations',
        shortcut: 'E',
        color: '#10b981',
        roles: ['superviseur', 'superadmin'],
      },
      {
        label: 'Prévision budgétaire',
        route: APP_ROOT_SUIVIBUDGETFILTRE_CONSULTATION,
        icon: 'ri-pie-chart-line',
        category: 'Consultations',
        shortcut: 'V',
        color: '#f59e0b',
        roles: ['superviseur', 'superadmin'],
      },
      {
        label: 'Décaissement et justificatif',
        route: APP_ROOT_DECAISSEMENTAJUSTIFIER_CONSULTATION,
        icon: 'ri-checkbox-circle-line',
        category: 'Consultations',
        shortcut: 'D',
        color: '#ef4444',
        roles: ['superviseur', 'caissier', 'superadmin'],
      },
      {
        label: 'Statistiques',
        route: APP_ROOT_STATSAFFDEPTNATURE_CONSULTATION,
        icon: 'ri-bar-chart-2-line',
        category: 'Consultations',
        shortcut: 'S',
        color: '#8b5cf6',
        roles: ['superviseur', 'caissier', 'superadmin'],
      },
      {
        label: 'Solde de caisse par date',
        route: APP_ROOT_SOLDECAISSE_CONSULTATION,
        icon: 'ri-wallet-3-line',
        category: 'Consultations',
        shortcut: 'C',
        color: '#06b6d4',
        roles: ['superviseur', 'caissier', 'superadmin'],
      },
      {
        label: 'État de clôture caisse',
        route: APP_ROOT_CLOTURECAISSE_CONSULTATION,
        icon: 'ri-lock-2-line',
        category: 'Consultations',
        shortcut: 'L',
        color: '#10b981',
        roles: ['superviseur', 'caissier', 'superadmin'],
      },

      // ==================== COMPTABILISATION ====================
      {
        label: 'Comptabilisation',
        route: APP_ROOT_COMPTABILISATION,
        icon: 'ri-book-2-line',
        category: 'Comptabilisation',
        shortcut: 'M',
        color: '#3b82f6',
        roles: ['superviseur', 'caissier', 'comptable', 'superadmin'],
      },
    ];
  }

  getMenuItemsForUser(userRoles: string[]): MenuItem[] {
    const allItems = this.getAllMenuItems();

    if (userRoles.includes('superadmin')) {
      return allItems;
    }

    return allItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.some((role) => userRoles.includes(role));
    });
  }
}
