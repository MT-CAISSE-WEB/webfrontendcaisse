import { MainModel } from "../../../_core/models/main.model";

export class natureoperationModel extends MainModel{
    idnature : string = "";
    codenature :  string = "";
    libelle : string = "";
    avanceajustifier : Number = 0;
    imputationtiers : Number = 0;
    actif : Number = 0;
    demandedecaissement : Number = 0;
    idsociete : string = "";
    idcompte : string = "";
}