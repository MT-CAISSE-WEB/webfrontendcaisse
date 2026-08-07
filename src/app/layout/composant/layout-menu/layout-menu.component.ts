import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  APP_ROOT,
  APP_ROOT_DONNEE_BASE_DEVISE,
  APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL,
  APP_ROOT_CAISSE_CAISSE_JOURNAL,
  APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE,
  APP_ROOT_JOURNAL_CAISSE_JOURNAL,
  APP_ROOT_NATURE_OPERATION_DONNEE_BASE,
  APP_ROOT_OPERATION_GENERAL,
  APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE,
  APP_ROOT_TIERS_DONNEE_BASE,
  APP_ROOT_TAUX_DONNEE_BASE,
  APP_STRUCTURE_SOCIETE,
  APP_ROOT_USER_ADMINISTRATION,
  APP_ROOT_STRUCTURE_SITE,
  APP_ROOT_STRUCTURE_DEPARTEMENT,
  APP_ROOT_ROLE_PERMISSION_ADMINISTRATION,
  APP_ROOT_PERMISSION_ADMINISTRATION,
  APP_ROOT_ROLE_ADMINISTRATION,
  APP_ROOT_AFF_NATURE_CENTRE_DONNEE_BASE,
  APP_AFF_DEPT_NATURE_DONNEE_BASE,
  APP_ROOT_BUDGETS_LIGNE_BUDGET,
  APP_ROOT_BUDGETS_BUDGET,
  APP_ROOT_DMD_DECAISSEMENT,
  APP_ROOT_WORKFLOW_ADMINISTRATION,
  APP_ROOT_SUIVIBUDGET_CONSULTATION,
  APP_ROOT_SUIVIBUDGETFILTRE_CONSULTATION,
  APP_ROOT_OPERATIONPERIODE_CONSULTATION,
  APP_ROOT_OPERATIONDETAILS_CONSULTATION,
  APP_ROOT_OPERATION_GENERAL_JUSITIFIER,
  APP_ROOT_COMPTABILISATION,
  APP_ROOT_DECAISSEMENTAJUSTIFIER_CONSULTATION,
  APP_ROOT_STATSAFFDEPTNATURE_CONSULTATION,
  APP_ROOT_DETAILDEAMNDE_CONSULTATION,
  APP_ROOT_BANQUE_DONNEE_BASE,
  APP_ROOT_CLOTURECAISSE_CONSULTATION,
  APP_ROOT_SOLDECAISSE_CONSULTATION,
  APP_ROOT_OPERATION_GENERAL_JUSITIFIER_LIST,
} from '../../../_core/routes/frontend.root';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterModule,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenuService } from '../services/menu.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-layout-menu',
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './layout-menu.component.html',
  styleUrl: './layout-menu.component.css',
})
export class LayoutMenuComponent implements OnInit, OnDestroy {
  // ========== ROUTES ==========
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
  root_list_decaissements_justifies =
    APP_ROOT_OPERATION_GENERAL_JUSITIFIER_LIST;

  // ========== RÔLES ==========
  admin: boolean = false;
  supervisor: boolean = false;
  caissier: boolean = false;
  comptable: boolean = false;
  superadmin: boolean = false;
  demandeur: boolean = false;

  // ========== ÉTAT DU MENU LATÉRAL ==========
  isMenuOpen = false;
  private menuSubscription!: Subscription;

  // ========== GESTION DES SOUS-MENUS ==========
  openSubMenus: Set<string> = new Set();
  private routerSubscription: any;

  constructor(
    private menuService: MenuService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Écoute les changements d'état du menu latéral
    this.menuSubscription = this.menuService.isMenuOpen$.subscribe((isOpen) => {
      this.isMenuOpen = isOpen;
    });

    // Écouter les changements de route pour fermer les sous-menus
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // On ne ferme pas tout, on garde les menus actifs
        this.updateActiveMenus();
      });
  }

  ngOnDestroy(): void {
    this.menuSubscription.unsubscribe();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // ========== MÉTHODES DE GESTION DU MENU LATÉRAL ==========

  /**
   * Ferme le menu latéral (mobile)
   */
  closeMenu(): void {
    this.menuService.setMenuState(false);
  }

  // ========== MÉTHODES DE GESTION DES SOUS-MENUS ==========

  /**
   * Vérifie si un sous-menu est ouvert
   */
  isSubMenuOpen(menuId: string): boolean {
    return this.openSubMenus.has(menuId);
  }

  /**
   * Vérifie si un sous-menu est actif (contient une route active)
   */
  isSubMenuActive(menuId: string): boolean {
    const menuElement = document.getElementById(menuId);
    if (!menuElement) return false;

    const links = menuElement.querySelectorAll('a[routerLink]');
    let isActive = false;
    links.forEach((link: any) => {
      const route = link.getAttribute('routerLink');
      if (route && this.isRouteActive(route)) {
        isActive = true;
      }
    });
    return isActive;
  }

  /**
   * Vérifie si une route est active
   */
  isRouteActive(route: string): boolean {
    if (!route) return false;
    return this.router.url.includes(route);
  }

  /**
   * Bascule l'état d'un sous-menu avec gestion des niveaux
   * @param menuId - L'ID du menu à basculer
   * @param event - L'événement de clic
   * @param parentId - L'ID du menu parent (pour les sous-sous-menus)
   */
  toggleSubMenu(menuId: string, event?: Event, parentId?: string): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Si le menu est déjà ouvert
    if (this.openSubMenus.has(menuId)) {
      // Pour les sous-menus de niveau 1, on peut les fermer
      // Pour les sous-sous-menus, on les garde ouverts
      if (!parentId) {
        this.openSubMenus.delete(menuId);
      }
      return;
    }

    // Si c'est un sous-sous-menu, on garde le parent ouvert
    if (parentId) {
      // S'assurer que le parent est ouvert
      this.openSubMenus.add(parentId);
    }

    // Fermer tous les autres menus du même niveau
    const menusToClose: string[] = [];
    this.openSubMenus.forEach((id) => {
      // Ne pas fermer les menus parents si on est dans un sous-sous-menu
      if (parentId && id === parentId) return;
      menusToClose.push(id);
    });

    menusToClose.forEach((id) => this.openSubMenus.delete(id));

    // Ouvrir le menu
    this.openSubMenus.add(menuId);
  }

  /**
   * Ouvre un sous-menu et ferme les autres
   */
  openSubMenu(menuId: string, parentId?: string): void {
    // Si c'est un sous-sous-menu, garder le parent ouvert
    if (parentId) {
      this.openSubMenus.add(parentId);
    }

    // Fermer tous les autres
    const menusToClose: string[] = [];
    this.openSubMenus.forEach((id) => {
      if (id !== menuId && id !== parentId) {
        menusToClose.push(id);
      }
    });
    menusToClose.forEach((id) => this.openSubMenus.delete(id));

    this.openSubMenus.add(menuId);
  }

  /**
   * Ferme tous les sous-menus sauf un
   */
  closeOtherMenus(keepOpen: string | null): void {
    this.openSubMenus.clear();
    if (keepOpen) {
      this.openSubMenus.add(keepOpen);
    }
  }

  /**
   * Met à jour les menus actifs après un changement de route
   */
  private updateActiveMenus(): void {
    // Récupérer tous les menus qui ont un lien actif
    const activeMenuIds: string[] = [];
    const menuElements = document.querySelectorAll('.menu-dropdown');

    menuElements.forEach((element) => {
      const menuId = element.id;
      if (menuId && this.isSubMenuActive(menuId)) {
        activeMenuIds.push(menuId);
      }
    });

    // Garder uniquement les menus actifs ouverts
    this.openSubMenus.clear();
    activeMenuIds.forEach((id) => this.openSubMenus.add(id));
  }

  // ========== MÉTHODES DE VÉRIFICATION DES RÔLES ==========

  isuperadmin(): boolean {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      for (let index = 0; index < user.roles.length; index++) {
        const element = user.roles[index];
        if (element['code'] === '00') {
          this.superadmin = true;
        }
      }
    }
    return this.superadmin;
  }

  isadmin(): boolean {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      for (let index = 0; index < user.roles.length; index++) {
        const element = user.roles[index];
        if (element['code'] === '01') {
          this.admin = true;
        }
      }
    }
    return this.admin;
  }

  issuperviseur(): boolean {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      for (let index = 0; index < user.roles.length; index++) {
        const element = user.roles[index];
        if (element['code'] === '02') {
          this.supervisor = true;
        }
      }
    }
    return this.supervisor;
  }

  iscomptable(): boolean {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      for (let index = 0; index < user.roles.length; index++) {
        const element = user.roles[index];
        if (element['code'] === '03') {
          this.comptable = true;
        }
      }
    }
    return this.comptable;
  }

  iscaissier(): boolean {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      for (let index = 0; index < user.roles.length; index++) {
        const element = user.roles[index];
        if (element['code'] === '04') {
          this.caissier = true;
        }
      }
    }
    return this.caissier;
  }

  isdemandeur(): boolean {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      for (let index = 0; index < user.roles.length; index++) {
        const element = user.roles[index];
        if (element['code'] === '05') {
          this.demandeur = true;
        }
      }
    }
    return this.demandeur;
  }
}
