import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { societemodel } from '../model/societe.model';
import { societeservice } from '../service/societe.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { devisemodel } from '../../donnee_base/donnee_base/model/devise.model';
import { map } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-societe',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './societe.component.html',
  styleUrl: './societe.component.css'
})
export class SocieteComponent {
      title = "Société";
      params : any = {};
      breadCrumbs : any = {};
      fb: FormBuilder = new FormBuilder();
      societes : societemodel[] = [];
      societe : societemodel = new societemodel();
      msgErros : string = "";
      loading: Boolean = false;
      societeForm : FormGroup = this.fb.group({});
      devises : devisemodel[] =[];

       //Tri et recherche 
      filtresocietes : societemodel[] = [];
      searchtext : string ="";

      // Définissez des propriétés de pagination
      currentPage: number = 1;
      // Nombre d'éléments par page
      totalPages: number = 0;
      limit: number = 5;

      //Faire le check selection **********
      objectsSelected : societemodel[] = [];
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
      deletesociete : any = null;
      selectedstatus: string = "";

      constructor(private sc:societeservice,private cdr:ChangeDetectorRef,private router : Router){}

      ngOnInit(): void {
      //Afficher toutes les sociétés
      this.getalldevisesactif();
      this.getallsocietes();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette société");
      this.titleMsg = TITLE_DELETE
  }

  getallsocietes (){
    this.sc.getAll().subscribe({
      next : (res:any) => {
         if(res.success){
            this.societes = res.data;
            this.filtresocietes = res.data;
            this.totalPages = res.data.totalPages;
         }
      }
    });
  }

  
  getalldevisesactif(){
    this.sc.getAlldevisesactif().subscribe({
      next : (res) => {
        if(res.success){
          this.devises = res.data;
        }
      }
    })
  }

  
searchsociete() {
  const term = this.normalize(this.searchtext);

  this.filtresocietes = this.societes.filter(societe => {
    const codesociete = this.normalize(societe.codesociete);
    const raisonsociale = this.normalize(societe.raisonsociale);

    const matchtext = codesociete.includes(term) || raisonsociale.includes(term);

    const matchstatus =
      this.selectedstatus === ""
        ? true
        : societe.suivibudgetaire.toString() === this.selectedstatus;

    return matchtext && matchstatus;
  });

  this.currentPage = 1;
  this.cdr.detectChanges();
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

  setActiveTab(tab: string) {
  if (tab === 'All') {
    this.selectedstatus = '';
  } else if (tab === 'Actif') {
    this.selectedstatus = '1';
  } else if (tab === 'Inactif') {
    this.selectedstatus = '0';
  }
  this.searchsociete(); 
}

//Gestion des Badges
get actifCount(): number {
  return this.societes.filter(societe => societe.suivibudgetaire === 1).length;
}

get inactifCount(): number {
  return this.societes.filter(societe => societe.suivibudgetaire === 0).length;
}

  //création du formulaire
  initForm(): void{
    this.societeForm = this.fb.group({
    idsociete: [null],
    codesociete: ['', Validators.required],
    raisonsociale: ['', Validators.required],
    sigle: [''],
    rccm: [''],
    numnui: [''],
    email: ['', [Validators.email]],
    telephone: [''],
    adresse: [''],
    logo: [null],
    suivibudgetaire: [false],
    iddevisereference: [''],
    iddevisereporting: [''],
});

  }

  get form(){
    return this.societeForm.controls;
  }

  dispatchsociete(_object: societemodel){
    this.societeForm.patchValue({
      codesociete : _object.codesociete,
      raisonsociale : _object.raisonsociale,
      rccm : _object.rccm,
      email : _object.email,
      sigle : _object.sigle,
      numnui : _object.numnui,
      telephone : _object.telephone,
      logo : _object.logo,
      adresse : _object.adresse,
      suivibudgetaire : _object.suivibudgetaire,
      iddevisereference : _object.iddevisereference,
      iddevisereporting : _object.iddevisereporting
    });
  }

   //validation required
  // isValidField(label: string): string {
  //   let status: string = "";
  //   this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
  //     this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
  //   return status;
  // }

  isValidField(field: string): string {
  const control = this.societeForm.get(field);
  return control && control.invalid && (control.touched || control.dirty)
    ? 'is-invalid'
    : '';
}


  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: String) {
    const ids: String[] = this.objectsSelected.map((el) => el.idsociete);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
    handleSelectOne(societe: societemodel, actif: any) {
      const index = this.objectsSelected.findIndex(
        (el) => el.idsociete == societe.idsociete
      );
      if (index == -1) this.objectsSelected.push(societe);
      if (index != -1) this.objectsSelected.splice(index, 1);
      //this.checkAllRow = this.objectsSelected?.length == this.societe?.length;
    }



onSubmit() {
  this.msgErros = '';

  if (this.societeForm.invalid) {
    Object.values(this.societeForm.controls).forEach(c => c.markAsTouched());
    this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
    return;
  }


  const formdata = new FormData();
  const formValue = this.societeForm.value;
  
  const sb = formValue.suivibudgetaire ? 1 : 0;
  formdata.append('suivibudgetaire', sb.toString());

  // Ajouter tous les champs du formulaire sauf logo et idsociete
  for (const key in formValue) {
    if (key !== 'logo' && key !== 'idsociete' && key!=='suivibudgetaire') {
      formdata.append(key, formValue[key]);
    }
  }

 

  // Ajouter l’image si présente
  const file = this.societeForm.get('logo')?.value;

  if (file) {
    formdata.append('logo', file);
  }


  // Ajouter idsociete UNIQUEMENT si update
  if (this.societe?.idsociete) {
    formdata.append('idsociete', this.societe.idsociete);
  }

  this.upsert(formdata);
  this.closeModal('showModal');
}

refreshpage(){
  const currentUrl = this.router.url;
  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigate([currentUrl]);
  });
}


previewLogo: string | ArrayBuffer | null = null;
selectedLogoFile: File | null = null;


onLogoSelected(event: any) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.previewLogo = null;   
  input.value = "";         

  this.selectedLogoFile = file;
  this.societeForm.get('logo')?.setValue(file);
  this.societeForm.get('logo')?.updateValueAndValidity();

  const reader = new FileReader();
  reader.onload = () => { this.previewLogo = reader.result; };
  reader.readAsDataURL(file);
}




upsert(formdata: FormData) {
  this.loading = true;

  this.sc.upsert(formdata).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.loadsociete(true);
        this.refreshpage();
      }
      this.loading = false;
      this.cdr.detectChanges();

    },
    error: err => {
      console.error(err);
      this.loading = false;
      this.cdr.detectChanges();
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
  this.selectedLogoFile = null;
  this.previewLogo = null;

  // Initialiser createdby
  this.societeForm.patchValue({
    createdby: 'admin',
    updatedby: 'admin'
  });
}

modalUpdate(_object: societemodel){
  this.societe = _object;
  this.actionModal = "update";
  this.societeForm.reset();
  this.dispatchsociete(_object);
}

modalDuplicate(_object: societemodel){
  this.societe = _object;
  this.actionModal = "duplicate";
  this.societeForm.reset();
  this.societeForm.patchValue({
      codesociete :'',
      raisonsociale : _object.raisonsociale,
      rccm : _object.rccm,
      email : _object.email,
      sigle : _object.sigle,
      numnui : _object.numnui,
      telephone : _object.telephone,
      logo : _object.logo,
      adresse : _object.adresse,
      suivibudgetaire : _object.suivibudgetaire,
      iddevisereference : _object.iddevisereference,
      iddevisereporting : _object.iddevisereporting
    });
}

modalView (_object : societemodel){
  this.societe = _object;
  this.actionModal ="view";
  this.societeForm.reset();
  this.dispatchsociete(_object);
}

// loader(){
//   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
// }

modalDelete(item: societemodel){
  this.deletesociete = item;
}

deleteConfirmed(){
  if(!this.deletesociete) return ;
  this.sc.delete(this.deletesociete.idsociete).subscribe({
    next: (res) => {
      if (res.success) {
        this.deletesociete = null;
        this.closeModal('deleteOrder');
        this.getallsocietes();
        this.refreshpage();
      } else {
        this.error = "Erreur de Suppression";
      }
      this.loading = false;
    },
    error: (err) => {
      console.log(err);
      this.error = "Suppression échec";
      this.loading = false;
    }
  })
}

loadsociete(applyFilterAfter: boolean = false) {
  this.loading = true;
  this.sc.getAll().subscribe({
    next: (data) => {
      this.societes = data.data;
      this.loading = false;

      if (applyFilterAfter) {
        this.searchsociete();
      } else {
        this.filtresocietes = [...this.societes]; // affichage initial
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

get pagedSocietes(): societemodel[] {
  const start = (this.currentPage - 1) * this.limit;
  return this.filtresocietes.slice(start, start + this.limit);
}

changePage(page: number) {
  if (page < 1) return;
  if (page > Math.ceil(this.filtresocietes.length / this.limit)) return;
  this.currentPage = page;
  this.cdr.detectChanges();
}




}