import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { sitemodel } from '../model/site.model';
import { siteservice } from '../service/site.service';
import { societeservice } from '../service/societe.service';
import { Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { societemodel } from '../model/societe.model';
import { CommonModule } from '@angular/common';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';

@Component({
  selector: 'app-site',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './site.component.html',
  styleUrl: './site.component.css'
})
export class SiteComponent implements OnInit {
      title = "Site";
      params : any = {};
      breadCrumbs : any = {};
      fb: FormBuilder = new FormBuilder();
      sites : sitemodel[] = [];
      site : sitemodel = new sitemodel();
      societes : societemodel[] = [];
      msgErros : string = "";
      loading: Boolean = false;
      siteForm : FormGroup = this.fb.group({});

      //Tri et recherche 
      filtresites : sitemodel[] = [];
      searchtext : string ="";
      sortby: string = "code";
      sortdirection : 'asc' | 'desc' = 'asc';
      selectedstatus : string="";
      activeTab: string = 'all';

      //Pagination 
      pageSize: number = 5;        // éléments par page (à adapter si tu veux)
      currentPage: number = 1;      // page courante

      objectsSelected : sitemodel[] = [];
      selectedItems : any[] = [];

      centres : centreanalytiqueModel[] = [];
      
      // Détermine si toutes les lignes sont selectionnées
      checkAllRow : any;
      error : string = "";

      //Changement titre modal
      actionModal: string = "create";
      
      //Message suppression
      msgSup: string = "";
      titleMsg: string ="";

      //Element à supprimer 
      deletesite : any = null;

      constructor(private st:siteservice,private sc:societeservice,private router : Router, private centreanalytiqueservice: CentreAnalytiqueService){}

      ngOnInit(): void {
            //Afficher toutes les sites 
            this.getallsocietes();
            this.getallsites();
            //Initialisation du formulaire
            this.initForm();
            this.initcentreanalytique();
            this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce Site");
            this.titleMsg = TITLE_DELETE

            //charger tous les centres analytiques
            this.getAllcentres();
        }

  getallsites (){
    this.st.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.sites = res.data;
            this.filtresites = res.data;
         }
      }
    });
  }

  getAllcentres() {
    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.centres = res.data;
        }
      },
      error(err) {
          console.log(err);
      },
    })
  }

    getallsocietes (){
    this.sc.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.societes = res.data;
         }
      }
    });
  }

    // Nombre total de pages calculé dynamiquement
get totalPages(): number {
  return Math.ceil(this.filtresites.length / this.pageSize);
}

// Liste des éléments visibles pour la page courante
get pagedSites(): any[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filtresites.slice(start, start + this.pageSize);
}

changePage(page: number) {
  if(page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}

searchsite() {
  const term = this.normalize(this.searchtext);

  this.filtresites = this.sites.filter(site => {
    const codesite = this.normalize(site.codesite);
    const libelle = this.normalize(site.libelle);
    const societe = this.normalize(site.raisonsociale);

    const matchtext =
      codesite.includes(term) ||
      libelle.includes(term) ||
      societe.includes(term);

    const matchstatus =
      this.selectedstatus === ""
        ? true
        : site.estcentreanalytique.toString() === this.selectedstatus;

    return matchtext && matchstatus;
  });

  this.currentPage = 1;
}

setActiveTab(tab: string) {
  if (tab === 'All') {
    this.selectedstatus = '';
  } else if (tab === 'Actif') {
    this.selectedstatus = '1';
  } else if (tab === 'Inactif') {
    this.selectedstatus = '0';
  }
  this.searchsite(); 
}

 normalize(value: any): string {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")               // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .trim();
}

 initForm(): void{
    this.siteForm = this.fb.group({
      idsite: [null],
      idsociete: [''],
      codesite : ['', Validators.required],
      idanalytique: [''],
      libelle : [''],
      email : [''],
      telephone : [''],
      adresse : [''],
      estcentreanalytique : [false]
    });
  }

  initcentreanalytique (){
    this.siteForm.get('estcentreanalytique')?.valueChanges.subscribe(value => {
      console.log(value);
  if (!value) {
    this.siteForm.get('idanalytique')?.reset();
  }
});

  }

  get form(){
    return this.siteForm.controls;
  }

  
//Gestion des Badges
get actifCount(): number {
  return this.sites.filter(site => site.estcentreanalytique === 1).length;
}

get inactifCount(): number {
  return this.sites.filter(site => site.estcentreanalytique === 0).length;
}

  dispatchsite(_object: sitemodel){
      this.siteForm.patchValue({
        idsociete : _object.idsociete,
        codesite : _object.codesite,
        libelle : _object.libelle,
        idanalytique  : _object.idanalytique,
        email : _object.email,
        telephone : _object.telephone,
        adresse : _object.adresse,
        estcentreanalytique : _object.estcentreanalytique
      });
    }

isValidField(field: string): string {
  const control = this.siteForm.get(field);
  return control && control.invalid && (control.touched || control.dirty)
    ? 'is-invalid'
    : '';
}

//vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: String) {
    const ids: String[] = this.objectsSelected.map((el) => el.idsite);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
      handleSelectOne(site: sitemodel, actif: any) {
        const index = this.objectsSelected.findIndex(
          (el) => el.idsite == site.idsite
        );
        if (index == -1) this.objectsSelected.push(site);
        if (index != -1) this.objectsSelected.splice(index, 1);
        //this.checkAllRow = this.objectsSelected?.length == this.devise?.length;
      }

      //Soumission du formulaire
              onsubmit(){
                /** Check formulaire */
                this.msgErros = '';
                const controls = this.siteForm.controls;
                if (this.siteForm.invalid) {
                  Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
                  this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
                  return;
                }
            
                /** 2. prepare data */
                const formValue = this.siteForm.value;
                
                const _site: sitemodel = {
                      ...this.site,
                      ...formValue,
                    };
            
                    this.upsert(_site);
                    this.closeModal('showModal');

                     
            
            }
      
refreshpage(){
  const currentUrl = this.router.url;
  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigate([currentUrl]);
  });
}

 upsert (site : sitemodel){
          this.st.upsert(site).subscribe({
            next: (res: any) => {
              console.log(res);
              if(res.success){
                this.getallsites();
                this.refreshpage();
                //this.router.navigate(["/"])
              }
            },
            error :(err) => {
                console.log(err);
            }
          });
      }

closeModal(modal: string){
        const modalEl = document.getElementById(modal);
        modalEl?.classList.remove('show');
        modalEl?.setAttribute('aria-hidden', 'true');
        (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
}

modalCreate(){
      this.actionModal = "create";
      this.initForm();
      }
      
modalUpdate(_object: sitemodel){
        this.site = _object;
        this.actionModal = "update";
        this.siteForm.reset();
        this.dispatchsite(_object);
      }
 modalDuplicate(_object: sitemodel){
        this.site = _object;
        this.actionModal = "duplicate";
        this.siteForm.reset();
        this.siteForm.patchValue({
        idsociete : _object.idsociete,
        codesite : '',
        libelle : _object.libelle,
        idanalytique  : _object.idanalytique,
        email : _object.email,
        telephone : _object.telephone,
        adresse : _object.adresse,
        estcentreanalytique : _object.estcentreanalytique
      });
      }

 modalDelete(item: sitemodel){
        this.deletesite = item;
      }

deleteConfirmed(){
  if(!this.deletesite) return ;
  this.st.delete(this.deletesite.idsite).subscribe({
    next: (res) => {
      if (res.success) {
        this.deletesite = null;
        this.getallsites();
        this.closeModal('deleteOrder');
        this.refreshpage();
        
      } else {
        this.error = "Erreur de Suppression";
      }
      this.loading = false;
    },
    error: (err) => {
      this.error = "Suppression échec";
      this.loading = false;
    }
  })
}




}
