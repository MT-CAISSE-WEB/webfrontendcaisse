import { MainModel } from "../../../_core/models/main.model";

export class validationdemandeModel extends MainModel{
    idvalidationdemande : string = "";
    iddemande : string = "";
    idsociete : string = "";
    datevalidation :  Date = new Date() ;
    actif : Number = 0;
}