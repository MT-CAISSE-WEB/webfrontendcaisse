import { Component } from '@angular/core';
import { APP_ROOT, APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL, APP_ROOT_CAISSE_CAISSE_JOURNAL, APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE, APP_ROOT_CIRCUIT_VALIDATEUR, APP_ROOT_JOURNAL_CAISSE_JOURNAL, APP_ROOT_NATURE_OPERATION_DONNEE_BASE, APP_ROOT_OPERATION_GENERAL, APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE, APP_ROOT_TAUX_DONNEE_BASE, APP_ROOT_CIRCUIT_VALIDATION, APP_ROOT_VALIDATION_DEMANDE } from '../../../_core/routes/frontend.root';
import { RouterLink, RouterModule, RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-layout-menu',
  imports: [RouterLink, RouterModule],
  templateUrl: './layout-menu.component.html',
  styleUrl: './layout-menu.component.css'
})
export class LayoutMenuComponent {
  root_taux = APP_ROOT_TAUX_DONNEE_BASE;
  root_centre_analytique = APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE;
  root_plan_comptable = APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE;
  root_nature_operation = APP_ROOT_NATURE_OPERATION_DONNEE_BASE;
  root_journal = APP_ROOT_JOURNAL_CAISSE_JOURNAL;
  root_caisse = APP_ROOT_CAISSE_CAISSE_JOURNAL;
  root_affectation_caissier = APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL;
  root_operation = APP_ROOT_OPERATION_GENERAL;
  root_circuit_validateur = APP_ROOT_CIRCUIT_VALIDATEUR;
  root_circuit_validation = APP_ROOT_CIRCUIT_VALIDATION;
  root_validationdemande = APP_ROOT_VALIDATION_DEMANDE;
  root = APP_ROOT;
}
