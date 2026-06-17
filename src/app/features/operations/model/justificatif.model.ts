import { MainModel } from "../../../_core/models/main.model";

export class detailJustificatifModel extends MainModel{
    iddetailsjustificatifoperation: string = "";
    idjustificatif: string = "";
    idnature: string = "";
    idcentreanalytique: string = "";
    idtiers: string = "";
    montantdetail: number = 0;
    montantref: number = 0;
    nature: any ;
    centreAnalytique: any;
    tiers: any;
    justificatif: any
}

export class JustificatifModel extends MainModel{
    idjustificatifoperation: string = "";
    codejustificatif: string = "";
    idoperation: string = "";
    iddevise: string = "";
    idtiers: string = "";
    taux: number = 0;
    tuaxinverse: number = 0;
    date: string = "";
    montantjustificatif: number = 0;
    commentaire: string = "";
    devise: any;
    operation: any
}