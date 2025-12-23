import { MainModel } from "../../../_core/models/main.model";
import { centreanalytiqueModel } from "./centreanalytique.model";
import { natureoperationModel } from "./natureoperation.model";

export class affectationanalytiqueModel extends MainModel{
    idaffectation : string = "";
    codeaffectation : string = "";
    actif : Number = 0;
    idsociete : string = "";
    idsite : string = "";
    iddepartement : string = "";
    idcentreanalytique : string = "";
    idnature : string = "";
    societe : any;
    site : any;
    departement : any;
    centre : centreanalytiqueModel = new centreanalytiqueModel();
    nature : natureoperationModel = new natureoperationModel();
}
