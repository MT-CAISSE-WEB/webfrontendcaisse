import { MainModel } from "../../../_core/models/main.model";
import { centreanalytiqueModel } from "./centreanalytique.model";
import { natureoperationModel } from "./natureoperation.model";
import { societemodel } from "../../structure/model/societe.model";
import { departementmodel } from "../../structure/model/departement.model";



export class affectationdepartementnatureModel extends MainModel{
    idaffdepartementnature : string = "";
    idsociete : string = "";
    iddepartement : string = "";
    idnature : string = "";
    societe : societemodel = new societemodel();
    departement : departementmodel = new departementmodel();
    nature : natureoperationModel = new natureoperationModel();
}