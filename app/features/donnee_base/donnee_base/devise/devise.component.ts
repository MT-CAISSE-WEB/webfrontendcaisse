import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { devisemodel } from '../model/devise.model';
import { deviseservice } from '../service/devise.service';


@Component({
  selector: 'app-devise',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './devise.component.html',
  styleUrl: './devise.component.css'
})
export class DeviseComponent implements OnInit {
      title = "Devise";
      params : any = {};
      breadCrumbs : any = {};
      fb: FormBuilder = new FormBuilder();
      devises : devisemodel[] = [];
      devise : devisemodel = new devisemodel();
      msgErros : string = "";
      loading: Boolean = false;
      deviseForm : FormGroup = this.fb.group({});

      //Tri et recherche 
      filtredevises : devisemodel[] = [];
      searchtext : string ="";
      sortby: string = "code";
      sortdirection : 'asc' | 'desc' = 'asc';
      selectedstatus : string="";
      activeTab: string = 'all';

      //Pagination 
      pageSize: number = 10;        // éléments par page (à adapter si tu veux)
      currentPage: number = 1;      // page courante


      // Définissez des propriétés de pagination
      //currentPage: number = 1;
      // Nombre d'éléments par page
      limit: number = 5;

      //Faire le check selection **********
      objectsSelected : devisemodel[] = [];
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
      deletedevise : any = null;

      constructor(private ds:deviseservice,private router : Router){}
      
      ngOnInit(): void {
      //Afficher toutes les devises
      this.getalldevises();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette Devise");
      this.titleMsg = TITLE_DELETE
  }

   getalldevises (){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.ds.getAll(this.params).subscribe({
      next : (res) => {
         if(res.success){
            this.devises = res.data;
            this.filtredevises = res.data;
         }
      }
    });
  }

  // Nombre total de pages calculé dynamiquement
get totalPages(): number {
  return Math.ceil(this.filtredevises.length / this.pageSize);
}

// Liste des éléments visibles pour la page courante
get pagedDevises(): any[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filtredevises.slice(start, start + this.pageSize);
}

changePage(page: number) {
  if(page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}


 searchdevise() {
  const term = this.normalize(this.searchtext);

  this.filtredevises = this.devises.filter(devise => {
    const codedevise = this.normalize(devise.codedevise);
    const codeiso = this.normalize(devise.codeiso);
    const intitule = this.normalize(devise.intitule);

    const matchtext =
      codedevise.includes(term) ||
      codeiso.includes(term) ||
      intitule.includes(term);

    const matchstatus =
      this.selectedstatus === ""
        ? true
        : devise.actif.toString() === this.selectedstatus;

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
  this.searchdevise(); 
}

//Gestion des Badges
get actifCount(): number {
  return this.devises.filter(devise => devise.actif === 1).length;
}

get inactifCount(): number {
  return this.devises.filter(devise => devise.actif === 0).length;
}
  //normaliser le test pour la recherche
  normalize(value: any): string {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")               // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .trim();
}


   initForm(): void{
    this.deviseForm = this.fb.group({
      iddevise: [null],
      codedevise : ['', Validators.required],
      intitule: [''],
      codeiso : [''],
      actif : [true]
    })
  }

  get form(){
    return this.deviseForm.controls;
  }

  dispatchdevise(_object: devisemodel){
      this.deviseForm.patchValue({
        codedevise : _object.codedevise,
        intitule : _object.intitule,
        codeiso  : _object.codeiso,
        actif : _object.actif
      });
    }

    isValidField(field: string): string {
  const control = this.deviseForm.get(field);
  return control && control.invalid && (control.touched || control.dirty)
    ? 'is-invalid'
    : '';
}

//vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: String) {
    const ids: String[] = this.objectsSelected.map((el) => el.iddevise);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
      handleSelectOne(devise: devisemodel, actif: any) {
        const index = this.objectsSelected.findIndex(
          (el) => el.iddevise == devise.iddevise
        );
        if (index == -1) this.objectsSelected.push(devise);
        if (index != -1) this.objectsSelected.splice(index, 1);
        //this.checkAllRow = this.objectsSelected?.length == this.devise?.length;
      }

       //Soumission du formulaire
        onsubmit(){
          /** Check formulaire */
          this.msgErros = '';
          const controls = this.deviseForm.controls;
          if (this.deviseForm.invalid) {
            Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
            this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
            return;
          }
      
          /** 2. prepare data */
          const formValue = this.deviseForm.value;
          
          const _devise: devisemodel = {
                ...this.devise,
                ...formValue,
              };
      
              this.upsert(_devise);
              this.closeModal('showModal');
      
      }

      upsert (devise : devisemodel){
          this.ds.upsert(devise).subscribe({
            next: (res: any) => {
              console.log(res);
              if(res.success){
                this.getalldevises();
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

      modalUpdate(_object: devisemodel){
        this.devise = _object;
        this.actionModal = "update";
        this.deviseForm.reset();
        this.dispatchdevise(_object);
      }

      modalDuplicate(_object: devisemodel){
        this.devise = _object;
        this.actionModal = "duplicate";
        this.deviseForm.reset();
        this.deviseForm.patchValue({
        codedevise : '',
        intitule : _object.intitule,
        codeiso  : _object.codeiso,
        actif : _object.actif
      });
      }

      modalView (_object : devisemodel){
        this.devise = _object;
        this.actionModal ="view";
        this.deviseForm.reset();
        this.dispatchdevise(_object);
      }

      modalDelete(item: devisemodel){
        this.deletedevise = item;
      }

      deleteConfirmed(){
  if(!this.deletedevise) return ;
  this.ds.delete(this.deletedevise.iddevise).subscribe({
    next: (res) => {
      if (res.success) {
        this.deletedevise = null;
        this.getalldevises();
        this.closeModal('deleteOrder');
        
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
