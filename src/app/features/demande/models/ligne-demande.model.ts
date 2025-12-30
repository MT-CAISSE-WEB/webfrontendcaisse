import { centreanalytiqueModel } from "../../donnee_base/models/centreanalytique.model";
import { natureoperationModel } from "../../donnee_base/models/natureoperation.model";
import { DetailsDemande } from "./details-demande.model";

export interface LigneDemande {
  idlignedemande?: string;
  iddemande: string;
  numligne?: number;
  libellelignedemande?: string;
  montantdemande: number;
  idnature?: string;
  idbudget?: string;
  idcentre?: string;
  idsociete?: string;
  idsite?: string;
  createdat?: string;
  createdby?: string;
  updatedat?: string;
  updatedby?: string;
  details?: DetailsDemande [];
  nature?: natureoperationModel;
  centre?: centreanalytiqueModel;
}
