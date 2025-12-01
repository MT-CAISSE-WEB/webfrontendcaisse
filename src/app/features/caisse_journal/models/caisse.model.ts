import { MainModel } from "../../../_core/models/main.model";
import { journalModel } from "./journal.model";

export class caisseModel extends MainModel{
    idcaisse : string = "";
    codecaisse : string = "";
    libelle : string = "";
    journal : journalModel = new journalModel();
    devise : any;
    site : any;
    compte : any;
    societe :  any;
    actif : Number = 0;
}