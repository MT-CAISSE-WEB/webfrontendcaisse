export interface User {
  idutilisateur: string;
  codeutilisateur: string;
  idsociete: string;
  idsite: string;
  nom: string;
  prenom: string;
  adresse: string;
  telephone: string;
  email: string;
  login: string;
  password?: string;
  typeentitesite: number;
  typeentitedepartement: number;
  typeentitesociete: number;
  acheteur: number;
  actif: number;
  createdat: Date;
  createdby: string;
  updatedat?: Date;
  updatedby?: string;
  roles?: string;
  societe?: string;
  codesociete?: string;
  codesite?: string;
  site_libelle?: string;
}

export interface UserFilters {
  search?: string;
  idsociete?: string;
  idsite?: string;
  actif?: number;
  page?: number;
  limit?: number;
}
