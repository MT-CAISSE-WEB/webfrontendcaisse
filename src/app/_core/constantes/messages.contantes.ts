// Message champs obligatoire
export const MESSAGE_CHAMPS_OBLIGATOIRE = 'Veuillez correctement remplir les champs obligatoire';

// titre dialog confirmation suppression
export const MESSAGE_SUPPRESSION_TITRE = 'Confirmer la suppresion';

export const MESSAGE_SUPPRESSION_ENCOURS = 'La suppression est encours ...';
export const MESSAGE_SUPPRESSION_EFFECTUEE = `La suppression a été effectuée`;
export const MESSAGE_SUPPRESSION_ECHOUEE = `La suppression a echoué`;

export const MESSAGE_MODIFICATION_EFFECTUEE = `La modification a été enregistré`;
export const MESSAGE_MODIFICATION_ECHOUEE = `La modification a echoué`;

export const MESSAGE_CREATION_EFFECTUEE = `La création a été effectué`;
export const MESSAGE_CREATION_ECHEOUEE = `La création a echoué `;

export const MESSAGE_ENREGISTREMENT_ENCOURS = 'L\'enregistrement est encours ...';
export const MESSAGE_ENREGISTREMENT_EFFECTUEE = `L\'enregistrement a été effectuée`;
export const MESSAGE_ENREGISTREMENT_ECHOUEE = `L\'enregistrement a echoué`;

export const MESSAGE_OPERATION_EFFECTUEE = `L\'opération a été effectuée avec succès`;
export const MESSAGE_OPERATION_ECHOUEE = `L\'opération a echoué`;

export const MESSAGE_VALIDATION_EFFECTUEE = `La validation a été effectué`;
export const MESSAGE_VALIDATION_ECHOUEE = `La validation a echoué `;

export const MESSAGE_CLOSE_EFFECTUEE = `La clotûre a été effectué`;
export const MESSAGE_CLOSE_ECHOUEE = `La clotûre a echoué `;

export const TITLE_ACTIVE = `Activation `;
export const TITLE_SUSPEND = `Suspension `;
export const TITLE_CLOSE = `Clôture `;
export const TITLE_DISABLE = `Désactivation`;
export const TITLE_DELETE = `Suppression `;

export const MONTH_LIST = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export const DAY_LIST = [];

// Message dialog confirmation suppression
export function MESSAGE_SUPPRESSION_DESCRIPTION(entite: string) {
    return 'Êtes-vous sûr de vouloir supprimer définitivement ' + entite + '?';
}
