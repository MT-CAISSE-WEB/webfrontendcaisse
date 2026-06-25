import { MainModel } from '../../../_core/models/main.model';

export class circuitvalidationmodel extends MainModel {
  idcircuitvalidation: string = '';
  codecircuitvalidation: string = '';
  typeentite: string = '';
  typeaction: string = '';
  idsociete: string = '';
  idsite: string = '';
  validateurs: any[] = [];
}
