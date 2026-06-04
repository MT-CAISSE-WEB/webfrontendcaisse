import { MainModel } from "../../../_core/models/main.model";
import { centreanalytiqueModel } from "./centreanalytique.model";
import { natureoperationModel } from "./natureoperation.model";
import { societemodel } from "../../structure/model/societe.model";



export class affectationnaturecentreModel extends MainModel{
    idaffnaturecentre : string = "";
    idsociete : string = "";
    idnature : string = "";
    idcentreanalytique : string = "";
    societe : societemodel = new societemodel();
    nature : natureoperationModel = new natureoperationModel();
    centre : centreanalytiqueModel = new centreanalytiqueModel();
}