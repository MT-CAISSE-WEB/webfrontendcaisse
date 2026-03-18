export interface Compteur {
  idmodelecompteur: string;
  codemodelecompteur: string;
  libelle: string;
  typedocument: string;
  sequence_1: string;
  prefixe_1: string;
  sequence_2: string;
  prefixe_2: string;
  createdat: Date;
  createdby: string;
  updatedat: Date | null;
  updatedby: string | null;
}
