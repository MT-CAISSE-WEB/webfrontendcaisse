import { MainModel } from "../../../_core/models/main.model";

export class plancomptableModel extends MainModel{
    idcompte : string = "";
    numcompte : string = "";
    libelle : string = "";
    ventillable : Number = 0;
    auxiliaire : Number = 0;
    actif : Number = 0;
    suivibudgetaire : Number = 0;
    suivibudgetairemensuel : Number = 0;
    idsociete : string = "";
}