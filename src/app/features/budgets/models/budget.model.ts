import { MainModel } from '../../../_core/models/main.model';

export class BudgetModel extends MainModel {
  idbudget: string = '';
  codebudget: string = '';
  libelle: string = '';
  idbudgetparent: string | null = null;
  typebudget: string = '';
  isanalytique: Number | null = 0;
  entite: string = '';
  datedebut: string = '';
  datefin: string = '';
  actif: Number | null = 0;
  cloture: Number | null = 0;
  valide: Number | null = 0;
  idcircuitvalidation: string | null = '';
  dernierniveau: Number | null = 0;
  niveauactuel: Number | null = 0;
  validedept: Number | null = 0;
  datevalidedept: string | null = '';
  validesite: Number | null = 0;
  datevalidesite: string | null = '';
  validesociete: Number | null = 0;
  datevalidesociete: string | null = '';
  idsite: string | null = '';
  idsociete: string | null = '';
}
