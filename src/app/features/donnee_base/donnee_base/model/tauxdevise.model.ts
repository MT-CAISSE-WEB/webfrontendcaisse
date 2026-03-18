import { MainModel } from "../../../../_core/models/main.model";

export class tauxdevisemodel extends MainModel{ 
    idtauxdevise : string="";
    iddeviseorigine : string="";
    iddevisedestination : string="";
    codetauxdevise : string="";
    intitule : string="";
    typecours: string="";
    datecours!: Date;
    coefficient : number=0.0;
    coefficientinverse: number=0.0;
}