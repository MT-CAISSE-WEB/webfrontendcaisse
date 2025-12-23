
import { Component } from '@angular/core';
import { usermodel } from '../model/user.model';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { userservice } from '../service/user.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { societemodel } from '../../structure/model/societe.model';
import { societeservice } from '../../structure/service/societe.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-user',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
    title = "Utilisateurs";
    params : any = {};
    breadCrumbs : any = {};
    fb: FormBuilder = new FormBuilder();
    users : usermodel[] = [];
    user : usermodel = new usermodel();
    msgErros : string = "";
    loading: Boolean = false;
    userForm : FormGroup = this.fb.group({});
    societes : societemodel[] = [];

    //Tri et recherche 
    filtreusers : usermodel[] = [];
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
    objectsSelected : usermodel[] = [];
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
      deleteuser : any = null;

      constructor(private us:userservice,private cdr: ChangeDetectorRef,private sc:societeservice,private router : Router){}
      
      ngOnInit(): void {
      //Afficher toutes les users
      this.getallsocietes();
      this.getallusers();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cet utilisateur");
      this.titleMsg = TITLE_DELETE;
      // this.userForm.get('email')?.valueChanges.subscribe(value => {
      //   this.userForm.patchValue({
      //     login : value
      //   }, { emitEvent: false });
      //   });
  }

   getallusers (){
    this.us.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.users = res.data;
            this.filtreusers = res.data;
         }
      }
    });
  }

  getallsocietes(){
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
  return Math.ceil(this.filtreusers.length / this.pageSize);
}

// Liste des éléments visibles pour la page courante
get pagedusers(): any[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filtreusers.slice(start, start + this.pageSize);
}

changePage(page: number) {
  if(page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}


 searchuser() {
  const term = this.normalize(this.searchtext);

  this.filtreusers = this.users.filter(user => {
    const codeutilisateur = this.normalize(user.codeutilisateur);
    const idsociete = this.normalize(user.idsociete);
    const nom = this.normalize(user.nom);
    const prenom = this.normalize(user.prenom);
    const adresse = this.normalize(user.adresse);
    const telephone = this.normalize(user.telephone);
    const email = this.normalize(user.email);
    const login = this.normalize(user.login);
    const password = this.normalize(user.password);
    const typeentitesite = this.normalize(user.typeentitesite);
    const typeentitedepartement = this.normalize(user.typeentitedepartement);
    const typeentitesociete = this.normalize(user.typeentitesociete);
    const acheteur = this.normalize(user.acheteur); 

    const matchtext =
      codeutilisateur.includes(term) ||
      idsociete.includes(term) ||
      nom.includes(term) ||
      prenom.includes(term) ||
      adresse.includes(term) ||
      telephone.includes(term) ||
      email.includes(term) ||
      login.includes(term) ||
      password.includes(term) ||
      typeentitesite.includes(term) ||
      typeentitedepartement.includes(term) ||
      typeentitesociete.includes(term) ||
      acheteur.includes(term);

   const matchstatus = (() => {
      switch (this.selectedstatus) {
        case "":
          return true;
        case "societe":
          return user.typeentitesociete === 1;
        case "site":
          return user.typeentitesite === 1;
        case "departement":
          return user.typeentitedepartement === 1;
        case "acheteur":
          return user.acheteur === 1;
        default:
          return true;
      }
    })();

    return matchtext && matchstatus;
  });

  this.currentPage = 1;
}

setActiveTab(tab: string) {
 
 this.selectedstatus = tab;
 this.searchuser(); 
}

// //Gestion des Badges
get societeCount(): number {
  return this.users.filter(user => user.typeentitesociete === 1).length;
}

get siteCount(): number {
  return this.users.filter(user => user.typeentitesite === 1).length;
}

get departementCount(): number {
  return this.users.filter(user => user.typeentitedepartement === 1).length;
}

get acheteurCount(): number {
  return this.users.filter(user => user.acheteur === 1).length;
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
    this.userForm = this.fb.group({
       codeutilisateur :['', Validators.required],
       idsociete :[''],
       nom :[''],
       prenom :[''],
       adresse :[''],
       telephone : [''],
       email :  [''],
       login : [''],
       password :[''],
       typeentitesite :[''],
       typeentitedepartement :[''],
       typeentitesociete : [''],
       acheteur: ['']

    })
  }

  get form(){
    return this.userForm.controls;
  }

  dispatchuser(_object: usermodel){
      this.userForm.patchValue({
        codeutilisateur :_object.codeutilisateur,
        idsociete :_object.idsociete,
        nom :_object.nom,
        prenom :_object.prenom,
        adresse :_object.adresse,
        telephone : _object.telephone,
        email :  _object.email,
        login : _object.login,
        password :_object.password,
        typeentitesite :_object.typeentitesite,
        typeentitedepartement :_object.typeentitedepartement,
        typeentitesociete : _object.typeentitesociete,
        acheteur: _object.acheteur
      });
    }

isValidField(field: string): string {
  const control = this.userForm.get(field);
  return control && control.invalid && (control.touched || control.dirty)
    ? 'is-invalid'
    : '';
}

//vérifie si _id est inclus dans un tableau d'Ius stocké
  isChecked(_id: String) {
    const ius: String[] = this.objectsSelected.map((el) => el.idutilisateur);
    return ius.includes(_id);
  }

  //selectionner une instance dans une liste
      handleSelectOne(user: usermodel, actif: any) {
        const index = this.objectsSelected.findIndex(
          (el) => el.idutilisateur== user.idutilisateur
        );
        if (index == -1) this.objectsSelected.push(user);
        if (index != -1) this.objectsSelected.splice(index, 1);
        //this.checkAllRow = this.objectsSelected?.length == this.user?.length;
      }

       //Soumission du formulaire
        onsubmit(){
          /** Check formulaire */
          this.msgErros = '';
          const controls = this.userForm.controls;
          if (this.userForm.invalid) {
            Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
            this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
            return;
          }
      
          /** 2. prepare data */
          const formValue = this.userForm.value;
          
          const _user: usermodel = {
                ...this.user,
                ...formValue,
              };
      
              this.upsert(_user);
              this.closeModal('showModal');


      
      }

      rafreshpage(){
        const currentUrl = this.router.url; 
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([currentUrl]);
        });
      }

      upsert (user : usermodel){
          this.us.upsert(user).subscribe({
            next: (res: any) => {
              console.log(res);
              if(res.success){
                this.loadusers(true);
                this.closeModal('showModal');
                this.rafreshpage();
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

      modalUpdate(_object: usermodel){
        this.user = _object;
        this.actionModal = "update";
        this.userForm.reset();
        this.dispatchuser(_object);
      }

      modalDuplicate(_object: usermodel){
        this.user = _object;
        this.actionModal = "duplicate";
        this.userForm.reset();
        this.userForm.patchValue({
        codeutilisateur :'',
        idsociete :_object.idsociete,
        nom :_object.nom,
        prenom :_object.prenom,
        adresse :_object.adresse,
        telephone : _object.telephone,
        email :  _object.email,
        login : _object.login,
        password :_object.password,
        typeentitesite :_object.typeentitesite,
        typeentitedepartement :_object.typeentitedepartement,
        typeentitesociete : _object.typeentitesociete,
        acheteur: _object.acheteur
      });
      }

      modalView (_object : usermodel){
        this.user = _object;
        this.actionModal ="view";
        this.userForm.reset();
        this.dispatchuser(_object);
      }

      modalDelete(item: usermodel){
        this.deleteuser = item;
      }

deleteConfirmed(){
  if(!this.deleteuser) return ;
  this.us.delete(this.deleteuser.idutilisateur).subscribe({
    next: (res) => {
      if (res.success) {
        this.deleteuser = null;
        this.closeModal('deleteOrder');
        this.getallusers();
        this.rafreshpage();
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

loadusers(applyFilterAfter: boolean = false) {
  this.us.getAll().subscribe({
    next: (data) => {
      this.users = data.data;

      if (applyFilterAfter) {
        this.searchuser();
      } else {
        this.filtreusers = [...this.users]; // affichage initial
      }
    }
  });
}
}