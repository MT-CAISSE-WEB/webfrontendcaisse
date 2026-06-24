import { MainModel } from "../../../_core/models/main.model";
import { journalModel } from "./journal.model";

export class caisseModel extends MainModel{
    idcaisse : string = "";
    codecaisse : string = "";
    libelle : string = "";
    journal : journalModel = new journalModel();
    devise : any;
    site : any;
    compte : any;
    societe :  any;
    actif : Number = 0;
    dateinitialisation : string = "";
    soldeinitialisation : Number = 0;
    seuilminimal : Number = 0;
}

export interface CaisseSolde {
  idcaisse: string;
  codecaisse: string;
  libelle: string;
  codedevise: string;
  soldeouverture: number;
  derniere_date_periode: string;
  total_encaissement: number;
  total_encaissement_ref: number;
  total_decaissement: number;
  total_decaissement_ref: number;
  solde_theorique: number;
}