import { DetailsDemande } from './details-demande.model';
import { EnteteDemande } from './entete-demande.model';
import { LigneDemande } from './ligne-demande.model';

export interface LigneComplet {
  ligne: LigneDemande;
  details: DetailsDemande[];
}

export interface DemandeComplet {
  entete: EnteteDemande;
  lignes: LigneComplet[];
}
