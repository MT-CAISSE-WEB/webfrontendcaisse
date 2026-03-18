export interface ValidateursBudget {
    idvalidationbudget: string;
    idbudget: string;
    idcircuitvalidation: string;
    idcircuitetape: string;
    idutilisateur: string;
    idmotif: string | null;
    decision: string;
    commentaire: string | null;
    datevalidation: Date | null;
    rang: number;
    createdat: Date | null;
    createdby: string | null;
    nom: string;
    prenom: string;
    codecircuitvalidation: string;
    codebudget: string;
}