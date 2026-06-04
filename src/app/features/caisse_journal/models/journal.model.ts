import { MainModel } from "../../../_core/models/main.model";

export class journalModel extends MainModel{
    idjournal : string = "";
    idsociete : string = "";
    codejournal :  string = "";
    designation : string = "";
    actif : Number = 0;
}