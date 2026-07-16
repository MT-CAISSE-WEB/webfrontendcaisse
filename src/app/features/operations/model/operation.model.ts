import { MainModel } from '../../../_core/models/main.model';
import { caisseModel } from '../../caisse_journal/models/caisse.model';

export class operationModel extends MainModel {
  idoperation: string = '';
  idoperationorigine: string = '';
  idoperationannulation: string = '';
  codeoperation: string = '';
  justifiee: number = 0;
  annulee: number = 0;
  libelle: string = '';
  commentaire: string = '';
  lignes: any[] = [];
  caisses: any[] = [];
  ecritures: any[] = [];
  devise: any;
  site: any;
  montant: number = 0;
  tauxoperation: number = 1;
  iddemande: string | undefined = '';
  typeoperation: string = '';
  beneficiaire: string = '';
  dateoperation: string = '';
  societe: any;
  typepaiement: string = '';
}
