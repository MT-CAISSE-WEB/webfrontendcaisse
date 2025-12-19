import { MainModel } from "../../../_core/models/main.model";
import { devisemodel } from "../../donnee_base/donnee_base/model/devise.model";

export class societemodel extends MainModel {
    idsociete : string="";
    codesociete : string="";
    raisonsociale : string="";
    rccm : string="";
    email : string="";
    sigle : string="";
    numnui : string="";
    telephone : string="";
    logo : string="";
    adresse : string="";
    suivibudgetaire :number=0;
    iddevisereference : string="";
    iddevisereporting : string="";
    devisereference : devisemodel = new devisemodel();
    devisereporting : devisemodel = new devisemodel();
}