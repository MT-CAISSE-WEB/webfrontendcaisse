import { MainModel } from "../../../_core/models/main.model";
import { centreanalytiqueModel } from "./centreanalytique.model";
import { natureoperationModel } from "./natureoperation.model";
import { societemodel } from "../../structure/model/societe.model";
import { sitemodel } from "../../structure/model/site.model";
import { departementmodel } from "../../structure/model/departement.model";



export class affectationanalytiqueModel extends MainModel{
    idaffectation : string = "";
    codeaffectation : string = "";
    actif : Number = 0;
    idsociete : string = "";
    idsite : string = "";
    iddepartement : string = "";
    idcentreanalytique : string = "";
    idnature : string = "";
    societe : societemodel = new societemodel();
    site : sitemodel = new sitemodel();
    departement : departementmodel = new departementmodel();
    centre : centreanalytiqueModel = new centreanalytiqueModel();
    nature : natureoperationModel = new natureoperationModel();
}