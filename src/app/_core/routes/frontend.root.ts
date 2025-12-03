export const DEFAULT = "default";
export const APP = "app";
export const APP_ROOT = "/app";
export const APP_DONNEE_BASE = "donnee_de_base";
export const APP_CAISSE_JOURNAL = "caisse_journal";
export const APP_GENERAL = "general";
export const APP_ROOT_CAISSE_JOURNAL = APP_ROOT + "/" + APP_CAISSE_JOURNAL;
export const APP_ROOT_DONNEE_BASE = APP_ROOT + "/" + APP_DONNEE_BASE;
export const APP_ROOT_GENERAL = APP_ROOT + "/" + APP_GENERAL;

export const APP_SITE = "site";
export const APP_SITE_ROOT = APP_ROOT + "/" + APP_SITE;

//Route taux de devise
export const APP_TAUX = 'taux_devise';
export const APP_TAUX_DONNEE_BASE = APP_DONNEE_BASE + "/" + APP_TAUX;
export const APP_ROOT_TAUX_DONNEE_BASE = APP_ROOT + "/" + APP_TAUX_DONNEE_BASE;



//Route journal
export const APP_JOURNAL = "journal";
export const APP_JOURNAL_CAISSE_JOURNAL = APP_CAISSE_JOURNAL + "/" + APP_JOURNAL;
export const APP_ROOT_JOURNAL_CAISSE_JOURNAL = APP_ROOT + "/" + APP_JOURNAL_CAISSE_JOURNAL;

//Route caisse
export const APP_CAISSE = "caisse";
export const APP_CAISSE_CAISSE_JOURNAL = APP_CAISSE_JOURNAL + "/" + APP_CAISSE;
export const APP_ROOT_CAISSE_CAISSE_JOURNAL = APP_ROOT + "/" + APP_CAISSE_CAISSE_JOURNAL;

//Route affectation caissier
export const APP_AFFECTATION_CAISSIER = "affectation_caissier";
export const APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL = APP_CAISSE_JOURNAL + "/" + APP_AFFECTATION_CAISSIER;
export const APP_ROOT_AFFECTATION_CAISSIER_CAISSE_JOURNAL = APP_ROOT + "/" + APP_AFFECTATION_CAISSIER_CAISSE_JOURNAL;

//Route des operations
export const APP_OPERATION = "operation";
export const APP_OPERATION_GENERAL = APP_GENERAL + "/" + APP_OPERATION;
export const APP_ROOT_OPERATION_GENERAL = APP_ROOT + "/" + APP_OPERATION_GENERAL;

// Richard
//Route des tiers :
export const APP_TIERS = "tiers";
export const APP_TIERS_DONNEE_BASE = APP_DONNEE_BASE + "/" + APP_TIERS;
export const APP_ROOT_TIERS_DONNEE_BASE = APP_ROOT + "/" + APP_TIERS_DONNEE_BASE;

//Route du plan comptable :
export const APP_PLANCOMPTABLE = "plancomptable";
export const APP_PLANCOMPTABLE_DONNEE_BASE = APP_DONNEE_BASE + "/" + APP_PLANCOMPTABLE;
export const APP_ROOT_PLANCOMPTABLE_DONNEE_BASE = APP_ROOT + "/" + APP_PLANCOMPTABLE_DONNEE_BASE;

//Route centre analytique
export const APP_CENTRE_ANALYTIQUE = 'centreanalytique';
export const APP_CENTRE_ANALYTIQUE_DONNEE_BASE = APP_DONNEE_BASE + "/" + APP_CENTRE_ANALYTIQUE;
export const APP_ROOT_CENTRE_ANALYTIQUE_DONNEE_BASE = APP_ROOT + "/" + APP_CENTRE_ANALYTIQUE_DONNEE_BASE;

//Route nature operation
export const APP_NATURE_OPERATION = 'nature_operation';
export const APP_NATURE_OPERATION_DONNEE_BASE = APP_DONNEE_BASE + "/" + APP_NATURE_OPERATION;
export const APP_ROOT_NATURE_OPERATION_DONNEE_BASE = APP_ROOT + "/" + APP_NATURE_OPERATION_DONNEE_BASE;

//Route affectation analytique
export const APP_AFFECTATION_ANALYTIQUE = 'affectationanalytique'; 
export const APP_AFFECTATION_ANALYTIQUE_DONNEE_BASE = APP_DONNEE_BASE + "/" + APP_AFFECTATION_ANALYTIQUE;
export const APP_ROOT_AFFECTATION_ANALYTIQUE_DONNEE_BASE = APP_ROOT + "/" + APP_AFFECTATION_ANALYTIQUE_DONNEE_BASE;