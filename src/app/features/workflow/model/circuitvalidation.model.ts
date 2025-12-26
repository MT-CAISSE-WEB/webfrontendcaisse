import { MainModel } from "../../../_core/models/main.model";

export class circuitvalidationmodel extends MainModel{ 
        idcircuitvalidation : string=""; ;
        codecircuitvalidation : string="";;
        typeentite  : string="";
        typeaction : string="";
        idsociete : string="";
        idsite : string="";
        iddepartement : string="";
        nombrevalidateur : number =0;
        rangvalidation : number =0;
        actif : number =0;
}