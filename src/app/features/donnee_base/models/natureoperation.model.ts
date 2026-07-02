import { MainModel } from "../../../_core/models/main.model";

export class natureoperationModel extends MainModel{
    idnature : string = "";
    codenature :  string = "";
    libelle : string = "";
    decajustifier : Number = 0;
    imputationtiers : Number = 0;
    typetiers : string = "";
    actif : Number = 0;
    demandedecaissement : Number = 0;
    typeoperation : string = "";
    idsociete : string = "";
    idcompte : string = "";
    compte : any;
}