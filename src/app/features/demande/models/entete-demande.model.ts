import { devisemodel } from "../../donnee_base/donnee_base/model/devise.model";
import { societeModel } from "../../donnee_base/models/societe.model";
import { sitemodel } from "../../structure/model/site.model";
import { LigneDemande } from "./ligne-demande.model";

export interface EnteteDemande {
  iddemande: string;
  codedemande?: string;
  iddemandeur?: string;
  typedemande?: string;
  libelledemande?: string;
  datedemande?: string; // ISO
  decaisse?: number;
  solde?: number;
  statut?: string;
  idcircuit?: string;
  idsociete?: string;
  idsite?: string;
  iddepartement?: string;
  iddevise?: string;
  createdat?: string;
  createdby?: string;
  updatedat?: string;
  updatedby?: string;
  lignes : LigneDemande[];
  site?: sitemodel;
  societe? : societeModel;
  devise? : devisemodel;
}
