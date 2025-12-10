import { MainModel } from "../../../_core/models/main.model";

export class usermodel extends MainModel{ 
                idutilisateur :string="";
                codeutilisateur :string="";
                idsociete :string="";
                nom :string="";
                prenom :string="";
                adresse :string="";
                telephone : string="";
                email : string="";
                login : string="";
                password : string="";
                typeentitesite : number=0;
                typeentitedepartement : number=0;
                typeentitesociete : number=0;
                acheteur: number=0;

}