import { MainModel } from "../../../_core/models/main.model";
import { caisseModel } from "./caisse.model";

export class caissePeriodeModel extends MainModel{
    idperiode : string = "";
    idcaisse : string = "";
    dateperiode : string = "";
    soldeouverture : Number = 0;
    soldefermeture : Number = 0;
    montantphysique : Number = 0;
    periode : any = null;
    ecart : Number = 0;
    statut : string = "";
    caisse : caisseModel = new caisseModel();
    validatedat : string = "";
    validatedby : string = "";
}