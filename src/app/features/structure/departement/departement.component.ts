import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { departementmodel } from '../model/departement.model';
import { sitemodel } from '../model/site.model';
import { siteservice } from '../service/site.service';
import { departementservice } from '../service/departement.service';
import { Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';
import { societemodel } from '../model/societe.model';
import { usermodel } from '../../administration/model/user.model';
import { userservice } from '../../administration/service/user.service';

@Component({
  selector: 'app-departement',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
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
      societes : societemodel[] = [];
      utilisateurs : usermodel[] = [];
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

      constructor(private st:siteservice,private dp:departementservice,private us:userservice,private router : Router){}

          ngOnInit(): void {
                  //Afficher toutes les departements 
                  this.getallutilisateurs();
                  this.getallsites();
                  this.getalldepartements();
                  //Initialisation du formulaire
                  this.initForm();
                  this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce Département");
                  this.titleMsg = TITLE_DELETE
              }

getsocietebysite(){
    this.departementForm.get('idsite')?.valueChanges.subscribe(idsite => {
    const site = this.sites.find(s => s.idsite === idsite);
  
    if (site) {
      // Mettre l’ID société dans le formulaire
      this.departementForm.get('idsociete')?.setValue(site.idsociete);

      // Mettre le nom société dans l’input affiché
      this.departementForm.get('societe')?.setValue(site.raisonsociale);
    } else {
      this.departementForm.get('idsociete')?.setValue(null);
      this.departementForm.get('societe')?.setValue('');
    }
  });
}

getalldepartements (){
    this.dp.getAll().subscribe({
      next : (res) => {
         if(res.success){
            console.log(res.data);
            this.departements = res.data;
            this.filtredepartement = res.data;
         }
      }
    });
  }

getallutilisateurs (){
    this.us.getAll().subscribe({
      next : (res) => {
        this.utilisateurs = res.data;
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


      // Nombre total de pages calculé dynamiquement
  get totalPages(): number {
    return Math.ceil(this.filtredepartement.length / this.pageSize);
  }

// Liste des éléments visibles pour la page courante
get pagedDepartements(): any[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filtredepartement.slice(start, start + this.pageSize);
}

changePage(page: number) {
  if(page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}

searchdepartement() {
  const term = this.normalize(this.searchtext);

  this.filtredepartement = this.departements.filter(departement => {
    const codedept = this.normalize(departement.codedept);
    const libelle = this.normalize(departement.libelle);
    const societe = this.normalize(departement.societe);
    const site = this.normalize(departement.site);
    const nomresponsable = this.normalize(departement.nom);
    const prenomresponsable = this.normalize(departement.prenom);
    
    const matchtext =
      codedept.includes(term) ||
      libelle.includes(term) ||
      societe.includes(term) ||
      site.includes(term) ||
      nomresponsable.includes(term) ||
      prenomresponsable.includes(term);

    // const matchstatus =
    //   this.selectedstatus === ""
    //     ? true
    //     : site.estcentreanalytique.toString() === this.selectedstatus;

    return matchtext 
    // && matchstatus;
  });

  this.currentPage = 1;
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
    this.departementForm = this.fb.group({
      iddepartement: [null],
      idsite: [''],
      idsociete: [''],
      responsable : [''],
      codedept : ['', Validators.required],
      societe : [{ value: '', disabled: true }],
      libelle : [''],
      email : [''],
      telephone : [''],
      adresse : ['']
    });

    this.getsocietebysite();
  }

get form(){
    return this.departementForm.controls;
  }

  dispatchdepartement(_object: departementmodel){
      this.departementForm.patchValue({
        idsociete : _object.idsociete,
        idsite : _object.idsite,
        codedept : _object.codedept,
        responsable : _object.responsable,
        libelle : _object.libelle,
        email : _object.email,
        telephone : _object.telephone,
        adresse : _object.adresse
      });
    }

isValidField(field: string): string {
  const control = this.departementForm.get(field);
  return control && control.invalid && (control.touched || control.dirty)
    ? 'is-invalid'
    : '';
}

//vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: String) {
    const ids: String[] = this.objectsSelected.map((el) => el.iddepartement);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
      handleSelectOne(departement: departementmodel, actif: any) {
        const index = this.objectsSelected.findIndex(
          (el) => el.iddepartement == departement.iddepartement
        );
        if (index == -1) this.objectsSelected.push(departement);
        if (index != -1) this.objectsSelected.splice(index, 1);
        //this.checkAllRow = this.objectsSelected?.length == this.devise?.length;
      }
  
 //Soumission du formulaire
               onsubmit(){
                 /** Check formulaire */
                 this.msgErros = '';
                 const controls = this.departementForm.controls;
                 if (this.departementForm.invalid) {
                   Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
                   this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
                   return;
                 }
             
                 /** 2. prepare data */
                 const formValue = this.departementForm.value;
                 
                 const _departement: departementmodel = {
                       ...this.departement,
                       ...formValue,
                     };
             
                     this.upsert(_departement);
                     this.closeModal('showModal');
             
             }
  refreshpage(){
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
 
  upsert (departement : departementmodel){
           this.dp.upsert(departement).subscribe({
             next: (res: any) => {
               if(res.success){
                 this.getalldepartements();
                 this.refreshpage();
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
modalUpdate(_object: departementmodel){
        this.departement = _object;
        this.actionModal = "update";
        this.departementForm.reset();
        this.dispatchdepartement(_object);
      }

 modalDuplicate(_object: departementmodel){
        this.departement = _object;
        this.actionModal = "duplicate";
        this.departementForm.reset();
        this.departementForm.patchValue({
        idsociete : _object.idsociete,
        idsite : _object.idsite,
        codedept : '',
        libelle : _object.libelle,
        responsable : _object.responsable,
        email : _object.email,
        telephone : _object.telephone,
        adresse : _object.adresse
      });
      }
  
   modalDelete(item: departementmodel){
        this.deletedepartement = item;
      }
      deleteConfirmed(){
  if(!this.deletedepartement) return ;
  this.dp.delete(this.deletedepartement.iddepartement).subscribe({
    next: (res) => {
      if (res.success) {
        this.deletedepartement = null;
        this.getalldepartements();
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