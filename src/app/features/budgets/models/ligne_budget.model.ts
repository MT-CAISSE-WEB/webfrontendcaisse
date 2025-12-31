import { MainModel } from '../../../_core/models/main.model';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { departementmodel } from '../../structure/model/departement.model';
import { BudgetModel } from './budget.model';

export class LigneBudgetModel extends MainModel {
  idbudgetdepartementnature: string = '';
  idbudget: string = '';
  iddepartement: string | null = '';
  idnature: string | null = '';
  montantprevisiondept: number = 0;
  montantprevisionsite: number = 0;
  montantprevisionsociete: number = 0;
  totalconsocloture: number = 0;
  soldecloture: number = 0;
  budget: BudgetModel | null = null;
  departement: departementmodel | null = null;
  nature_operation: natureoperationModel | null = null;
}
