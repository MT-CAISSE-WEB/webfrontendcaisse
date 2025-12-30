import { MainModel } from "../../../_core/models/main.model";
import { usermodel } from "../../administration/model/user.model";
import { societemodel } from "../../structure/model/societe.model";
import { caisseModel } from "./caisse.model";

export class AffectationCaisseModel extends MainModel{
    idutilisateurcaisse: string = "";
    idcaisse : string = "";
    idutilisateur : string = "";
    idsociete : string = "";
    caisse : caisseModel = new caisseModel();
    societe :  societemodel = new societemodel();
    utilisateur :  usermodel = new usermodel();
    actif : Number = 0;
}