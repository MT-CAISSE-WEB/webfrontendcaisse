import { MainModel } from "../../../_core/models/main.model";

export class sitemodel extends MainModel {
    idsite : string="";
    idsociete : string="";
    codesite : string=""
    idanalytique : string="";
    libelle : string="";
    email : string="";
    telephone : string="";
    adresse : string="";
    estcentreanalytique : number=0;
    raisonsociale : string="";
}