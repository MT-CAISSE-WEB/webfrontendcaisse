import { MainModel } from "../../../_core/models/main.model";

export class parametreComptableModel extends MainModel{
    idparametrecomptable : string = "";
    societe :  string = "";
    compteintermediaire : string = "";
    journal : string = "";
    url : string = "";
}

export interface Correspondance {
  idcorrespondance : string;
  centreAnalytique: string;
  correspondance: string;
}