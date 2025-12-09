import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { departementmodel } from '../model/departement.model';
import { sitemodel } from '../model/site.model';
import { siteservice } from '../service/site.service';
import { departementservice } from '../service/departement.service';
import { Router } from '@angular/router';
import { MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';

@Component({
  selector: 'app-departement',
  imports: [],
  templateUrl: './departement.component.html',
  styleUrl: './departement.component.css'
})
export class DepartementComponent implements OnInit {
      title = "Departement";
      params : any = {};
      breadCrumbs : any = {};
      fb: FormBuilder = new FormBuilder();
      departements : departementmodel[] = [];
      departement : departementmodel = new departementmodel();
      sites : sitemodel[] = [];
      msgErros : string = "";
      loading: Boolean = false;
      departementForm : FormGroup = this.fb.group({});

      //Tri et recherche 
      filtredepartement : departementmodel[] = [];
      searchtext : string ="";
      sortby: string = "code";
      sortdirection : 'asc' | 'desc' = 'asc';
      selectedstatus : string="";
      activeTab: string = 'all';

      //Pagination 
      pageSize: number = 5;        // éléments par page (à adapter si tu veux)
      currentPage: number = 1;  

      objectsSelected : departementmodel[] = [];
      selectedItems : any[] = [];
      // Détermine si toutes les lignes sont selectionnées
      checkAllRow : any;
      error : string = "";

      //Changement titre modal
      actionModal: string = "create";
      
      //Message suppression
      msgSup: string = "";
      titleMsg: string ="";

      //Element à supprimer 
      deletedepartement : any = null;

      constructor(private st:siteservice,private dp:departementservice,private router : Router){}

          ngOnInit(): void {
                  //Afficher toutes les departements 
                 
                  this.getallsites();
                  this.getalldepartements();
                  //Initialisation du formulaire
                  this.initForm();
                  this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce Département");
                  this.titleMsg = TITLE_DELETE
              }

getalldepartements (){
    this.dp.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.departements = res.data;
            this.filtredepartement = res.data;
         }
      }
    });
  }

   getallsites (){
    this.st.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.sites = res.data;
         }
      }
    });
  }
}
