import { MainModel } from "../../../_core/models/main.model";

export class banqueModel extends MainModel{
    idbanque : string = "";
    codebanque :  string = "";
    libelle : string = "";
    numerocompte : string = "";
    iban : string = "";
    swift : string = "";
    solde_initial : number = 0;
    solde_actuel : number = 0;
    actif : Number = 0;
    idsociete : string = "";
    idsite : string = "";
    idcompte : string = "";
    iddevise : string = "";
    compte : any;
    devise : any;
}