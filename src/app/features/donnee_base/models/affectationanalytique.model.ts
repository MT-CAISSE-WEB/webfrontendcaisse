import { MainModel } from "../../../_core/models/main.model";

export class affectationanalytiqueModel extends MainModel{
    idaffectation : string = "";
    codeaffectation : string = "";
    actif : Number = 0;
    idcentreanalytique : string = "";
    idnature : string = "";
    idsociete : string = "";
    idsite : string = "";
    iddepartement : string = "";
}