export const DEFAULT = 'default';
export const APP = 'app';
export const APP_ROOT = '/app';
export const APP_ADMINISTRATION = 'administration';
export const APP_DONNEE_BASE = 'donnee_de_base';
export const APP_CAISSE_JOURNAL = 'caisse_journal';
export const APP_STRUCTURE = 'structure';
export const APP_GENERAL = 'general';
export const APP_CONSULTATION = 'consultations';
export const APP_PARAMETRE = 'paramètres';
export const APP_COMPTABILISATION = 'comptabilisations';
export const APP_ROOT_CAISSE_JOURNAL = APP_ROOT + '/' + APP_CAISSE_JOURNAL;
export const APP_ROOT_DONNEE_BASE = APP_ROOT + '/' + APP_DONNEE_BASE;
export const APP_ROOT_GENERAL = APP_ROOT + '/' + APP_GENERAL;
export const APP_ROOT_STRUCTURE = APP_ROOT + '/' + APP_STRUCTURE;
export const APP_ROOT_ADMINISTRATION = APP_ROOT + '/' + APP_ADMINISTRATION;
export const APP_ROOT_CONSULTATION = APP_ROOT + '/' + APP_CONSULTATION;
export const APP_ROOT_PARAMETRE = APP_ROOT + '/' + APP_PARAMETRE;
export const APP_ROOT_COMPTABILISATION = APP_ROOT + '/' + APP_COMPTABILISATION;

export const APP_DEPARTEMENT = 'departement';
export const APP_STRUCTURE_DEPARTEMENT = APP_STRUCTURE + '/' + APP_DEPARTEMENT;
export const APP_ROOT_STRUCTURE_DEPARTEMENT =
  APP_ROOT + '/' + APP_STRUCTURE_DEPARTEMENT;

// Route sites
export const APP_SITE = 'site';
export const APP_STRUCTURE_SITE = APP_STRUCTURE + '/' + APP_SITE;
export const APP_ROOT_STRUCTURE_SITE = APP_ROOT + '/' + APP_STRUCTURE_SITE;

//Route Société
export const APP_SOCIETE = 'societe';
export const APP_STRUCTURE_SOCIETE = APP_STRUCTURE + '/' + APP_SOCIETE;
export const APP_ROOT_STRUCTURE_SOCIETE =
  APP_ROOT + '/' + APP_STRUCTURE_SOCIETE;

//Route Utilisateur
export const APP_USER = 'utilisateur';
export const APP_USER_ADMINISTRATION = APP_ADMINISTRATION + '/' + APP_USER;
export const APP_ROOT_USER_ADMINISTRATION =
  APP_ROOT + '/' + APP_USER_ADMINISTRATION;

//Route circuitvalidation
export const APP_WORKFLOW = 'workflow';
export const APP_WORKFLOW_ADMINISTRATION =
  APP_ADMINISTRATION + '/' + APP_WORKFLOW;
export const APP_ROOT_WORKFLOW_ADMINISTRATION =
  APP_ROOT + '/' + APP_WORKFLOW_ADMINISTRATION;

//Route Role
export const APP_ROLE = 'role';
export const APP_ROLE_ADMINISTRATION = APP_ADMINISTRATION + '/' + APP_ROLE;
export const APP_ROOT_ROLE_ADMINISTRATION =
  APP_ROOT + '/' + APP_ROLE_ADMINISTRATION;

//Route Permission
export const APP_PERMISSION = 'permission';
export const APP_PERMISSION_ADMINISTRATION =
  APP_ADMINISTRATION + '/' + APP + '/' + APP_PERMISSION;
export const APP_ROOT_PERMISSION_ADMINISTRATION =
  APP_ROOT + '/' + APP_PERMISSION_ADMINISTRATION;

//Route RolePermission
export const APP_ROLE_PERMISSION = 'rolepermission';
export const APP_ROLE_PERMISSION_ADMINISTRATION =
  APP_ADMINISTRATION + '/' + APP_ROLE_PERMISSION;
export const APP_ROOT_ROLE_PERMISSION_ADMINISTRATION =
  APP_ROOT + '/' + APP_ROLE_PERMISSION_ADMINISTRATION;

//Route de devise
export const APP_DEVISE = 'devise';
export const APP_DONNEE_BASE_DEVISE = APP_DONNEE_BASE + '/' + APP_DEVISE;
export const APP_ROOT_DONNEE_BASE_DEVISE =
  APP_ROOT + '/' + APP_DONNEE_BASE_DEVISE;

// Route Budget
export const APP_BUDGET = 'budget';
export const APP_BUDGETS = 'budgets';
export const APP_BUDGETS_BUDGET = APP_BUDGETS + '/' + APP_BUDGET; //APP_CAISSE_JOURNAL = caisse_journal
export const APP_ROOT_BUDGETS_BUDGET = APP_ROOT + '/' + APP_BUDGETS_BUDGET;

// Route ligne budgétaire
export const APP_LIGNE_BUDGET = 'ligne_budget';
export const APP_BUDGETS_LIGNE_BUDGET = APP_BUDGETS + '/' + APP_LIGNE_BUDGET; //APP_CAISSE_JOURNAL = caisse_journal
export const APP_ROOT_BUDGETS_LIGNE_BUDGET =
  APP_ROOT + '/' + APP_BUDGETS_LIGNE_BUDGET;

// Route de demande décaissement
export const APP_ROOT_DMD_DECAISSEMENT = 'demande_decaissement';
export const APP_ROOT_EDIT_DECAISSEMENT = 'demande_decaissement/edit';
export const APP_ROOT_DMD_EDIT_DECAISSEMENT = 'demande_decaissement/edit/:id';

//Route taux de devise
export const APP_TAUX = 'taux_devise';
export const APP_TAUX_DONNEE_BASE = APP_DONNEE_BASE + '/' + APP_TAUX;
export const APP_ROOT_TAUX_DONNEE_BASE = APP_ROOT + '/' + APP_TAUX_DONNEE_BASE;

//Route journal
export const APP_JOURNAL = 'journal';
export const APP_JOURNAL_CAISSE_JOURNAL =
  APP_CAISSE_JOURNAL + '/' + APP_JOURNAL;
export const APP_ROOT_JOURNAL_CAISSE_JOURNAL =
  APP_ROOT + '/' + APP_JOURNAL_CAISSE_JOURNAL;

//Route caisse
export const APP_CAISSE = 'caisse';
export const APP_CAISSE_CAISSE_JOURNAL = APP_CAISSE_JOURNAL + '/' + APP_CAISSE;
export const APP_ROOT_CAISSE_CAISSE_JOURNAL =
  APP_ROOT + '/' + APP_CAISSE_CAISSE_JOURNAL;

//Route affectation caissier
export const APP_AFFECTATION_CAISSIER = 'affectation_caissier';
export const APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL =
  APP_CAISSE_JOURNAL + '/' + APP_AFFECTATION_CAISSIER;
export const APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL =
  APP_ROOT + '/' + APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL;

//Route des operations
export const APP_OPERATION = 'operation';
export const APP_OPERATION_GENERAL = APP_GENERAL + '/' + APP_OPERATION;
export const APP_ROOT_OPERATION_GENERAL =
  APP_ROOT + '/' + APP_OPERATION_GENERAL;

//Route des operations a justifier
export const APP_OPERATION_GENERAL_JUSTIFIER =
  APP_GENERAL + '/' + APP_OPERATION + '/' + 'ajustifiee';
export const APP_ROOT_OPERATION_GENERAL_JUSITIFIER =
  APP_ROOT + '/' + APP_OPERATION_GENERAL_JUSTIFIER;

// RICHARD
//Route Plan comptable
export const APP_PLAN_COMPTABLE = 'plan_comptable';
export const APP_PLAN_COMPTABLE_DONNEE_BASE =
  APP_DONNEE_BASE + '/' + APP_PLAN_COMPTABLE;
export const APP_ROOT_PLAN_COMPTABLE_DONNEE_BASE =
  APP_ROOT + '/' + APP_PLAN_COMPTABLE_DONNEE_BASE;

//Route des tiers :
export const APP_TIERS = 'tiers';
export const APP_TIERS_DONNEE_BASE = APP_DONNEE_BASE + '/' + APP_TIERS;
export const APP_ROOT_TIERS_DONNEE_BASE =
  APP_ROOT + '/' + APP_TIERS_DONNEE_BASE;

//Route centre analytique
export const APP_CENTRE_ANALYTIQUE = 'centreanalytique';
export const APP_CENTRE_ANALYTIQUE_DONNEE_BASE =
  APP_DONNEE_BASE + '/' + APP_CENTRE_ANALYTIQUE;
export const APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE =
  APP_ROOT + '/' + APP_CENTRE_ANALYTIQUE_DONNEE_BASE;

//Route nature operation
export const APP_NATURE_OPERATION = 'nature_operation';
export const APP_NATURE_OPERATION_DONNEE_BASE =
  APP_DONNEE_BASE + '/' + APP_NATURE_OPERATION;
export const APP_ROOT_NATURE_OPERATION_DONNEE_BASE =
  APP_ROOT + '/' + APP_NATURE_OPERATION_DONNEE_BASE;

//Route affectation nature centre
export const APP_AFF_NATURE_CENTRE = 'affectationnaturecentre';
export const APP_AFF_NATURE_CENTRE_DONNEE_BASE =
  APP_DONNEE_BASE + '/' + APP_AFF_NATURE_CENTRE;
export const APP_ROOT_AFF_NATURE_CENTRE_DONNEE_BASE =
  APP_ROOT + '/' + APP_AFF_NATURE_CENTRE_DONNEE_BASE;

//Route affectation département nature
export const APP_AFF_DEPT_NATURE = 'affectationdepartementnature';
export const APP_AFF_DEPT_NATURE_DONNEE_BASE =
  APP_DONNEE_BASE + '/' + APP_AFF_DEPT_NATURE;
export const APP_ROOT_AFF_DEPT_NATURE_DONNEE_BASE =
  APP_ROOT + '/' + APP_AFF_DEPT_NATURE_DONNEE_BASE;

// Route pour les écrans de consultations
export const APP_SUIVIBUDGET = 'suivibudget';
export const APP_SUIVIBUDGET_CONSULTATION =
  APP_CONSULTATION + '/' + APP_SUIVIBUDGET;
export const APP_ROOT_SUIVIBUDGET_CONSULTATION =
  APP_ROOT + '/' + APP_SUIVIBUDGET_CONSULTATION;

export const APP_SUIVIBUDGETFILTRE = 'suivibudget/recherche';
export const APP_SUIVIBUDGETFILTRE_CONSULTATION =
  APP_CONSULTATION + '/' + APP_SUIVIBUDGETFILTRE;
export const APP_ROOT_SUIVIBUDGETFILTRE_CONSULTATION =
  APP_ROOT + '/' + APP_SUIVIBUDGETFILTRE_CONSULTATION;

//Route consultation des opérations
export const APP_OPERATIONPERIODE = 'operation_periode';
export const APP_OPERATIONPERIODE_CONSULTATION =
  APP_CONSULTATION + '/' + APP_OPERATIONPERIODE;
export const APP_ROOT_OPERATIONPERIODE_CONSULTATION =
  APP_ROOT + '/' + APP_OPERATIONPERIODE_CONSULTATION;

//Route consultation des opérations details
export const APP_OPERATIONDETAILS = 'operation_details';
export const APP_OPERATIONDETAILS_CONSULTATION =
  APP_CONSULTATION + '/' + APP_OPERATIONDETAILS;
export const APP_ROOT_OPERATIONDETAILS_CONSULTATION =
  APP_ROOT + '/' + APP_OPERATIONDETAILS_CONSULTATION;

//Route paramètre
export const APP_PARAMETREPAGE = 'générale';
export const APP_PARAMETREPAGE_PARAMETRE =
  APP_PARAMETRE + '/' + APP_PARAMETREPAGE;
export const APP_ROOT_PARAMETREPAGE_PARAMETRE =
  APP_ROOT + '/' + APP_PARAMETREPAGE_PARAMETRE;

//Route consultation des décaissements à justifier
export const APP_DECAISSEMENTAJUSTIFIER = 'decaissement_ajustifier';
export const APP_DECAISSEMENTAJUSTIFIER_CONSULTATION =
  APP_CONSULTATION + '/' + APP_DECAISSEMENTAJUSTIFIER;
export const APP_ROOT_DECAISSEMENTAJUSTIFIER_CONSULTATION =
  APP_ROOT + '/' + APP_DECAISSEMENTAJUSTIFIER_CONSULTATION;

// Route stats affection nature département
export const APP_STATSAFFDEPTNATURE = 'statistiques-globales';
export const APP_STATSAFFDEPTNATURE_CONSULTATION =
  APP_CONSULTATION + '/' + APP_STATSAFFDEPTNATURE;
export const APP_ROOT_STATSAFFDEPTNATURE_CONSULTATION =
  APP_ROOT + '/' + APP_STATSAFFDEPTNATURE_CONSULTATION;

//Route consultation des demandes
export const APP_DETAILDEAMNDE = 'demande_detail';
export const APP_DETAILDEAMNDE_CONSULTATION =
  APP_CONSULTATION + '/' + APP_DETAILDEAMNDE;
export const APP_ROOT_DETAILDEAMNDE_CONSULTATION =
  APP_ROOT + '/' + APP_DETAILDEAMNDE_CONSULTATION;

//Route nature operation
export const APP_BANQUE = 'banque';
export const APP_BANQUE_DONNEE_BASE = APP_DONNEE_BASE + '/' + APP_BANQUE;
export const APP_ROOT_BANQUE_DONNEE_BASE =
  APP_ROOT + '/' + APP_BANQUE_DONNEE_BASE;

//Route consultation des etats cloture caisse
export const APP_CLOTURECAISSE = 'etat_caisse';
export const APP_CLOTURECAISSE_CONSULTATION =
  APP_CONSULTATION + '/' + APP_CLOTURECAISSE;
export const APP_ROOT_CLOTURECAISSE_CONSULTATION =
  APP_ROOT + '/' + APP_CLOTURECAISSE_CONSULTATION;

//Route consultation des soldes caisse
export const APP_SOLDECAISSE = 'solde_caisse';
export const APP_SOLDECAISSE_CONSULTATION =
  APP_CONSULTATION + '/' + APP_SOLDECAISSE;
export const APP_ROOT_SOLDECAISSE_CONSULTATION =
  APP_ROOT + '/' + APP_SOLDECAISSE_CONSULTATION;

//Route consultation des dépenses par nature, département et centre analytique
export const APP_DEPNSESNATURE = 'depenses_nature';
export const APP_DEPNSESNATURE_CONSULTATION =
  APP_CONSULTATION + '/' + APP_DEPNSESNATURE;
export const APP_ROOT_DEPNSESNATURE_CONSULTATION =
  APP_ROOT + '/' + APP_DEPNSESNATURE_CONSULTATION;
