import { MainModel } from "../../../_core/models/main.model";
import { caisseModel } from "../../caisse_journal/models/caisse.model";

export class operationModel extends MainModel{
    idoperation : string = "";
    codeoperation : string = "";
    justifiee : number = 0;
    libelle : string = "";
    lignes : any[] = [];
    caisses: any[] = [];
    devise : any;
    site : any;
    montant : number = 0;
    tauxoperation: number = 1 ;
    dateoperation: string = "";
    societe :  any;
    typepaiement : string = ""
}