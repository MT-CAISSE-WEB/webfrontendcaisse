import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators,FormsModule,ReactiveFormsModule } from '@angular/forms';
import { tauxdevisemodel } from '../model/tauxdevise.model';
import { devisemodel } from '../model/devise.model';
import { tauxdeviseservice } from '../service/tauxdevise.service';
import { Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-tauxdevise',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './tauxdevise.component.html',
  styleUrl: './tauxdevise.component.css'
})
export class TauxdeviseComponent implements OnInit {
      title = "Tauxdevise";
      params : any = {};
      breadCrumbs : any = {};
      fb: FormBuilder = new FormBuilder();
      tauxdevises : tauxdevisemodel[] = [];
      devises : devisemodel [] = [];
      devise : devisemodel = new devisemodel();
      filtresdevises : devisemodel [] = [];
      filtrestauxdevises : tauxdevisemodel [] = [];
      tauxdevise : tauxdevisemodel = new tauxdevisemodel();
      msgErros : string = "";
      loading: Boolean = false;
      tauxdeviseForm : FormGroup = this.fb.group({});

      //Tri et recherche 
      filtretauxdevises : tauxdevisemodel[] = [];
      searchtext : string ="";
      sortby: string = "code";
      sortdirection : 'asc' | 'desc' = 'asc';
      selectedstatus : string="";
      activeTab: string = 'all';
      selectedOrigine : string="";
      selectedDestination : string="";
      selecteddate : string="";

      // Détermine si toutes les lignes sont selectionnées
      checkAllRow : any;
      error : string = "";

      //Pagination 
      pageSize: number = 10;        
      currentPage: number = 1;    

      // Définissez des propriétés de pagination
      //currentPage: number = 1;
      // Nombre d'éléments par page
      limit: number = 5;

      //Faire le check selection **********
      objectsSelected :tauxdevisemodel[] = [];
      selectedItems : any[] = [];
      
      //Changement titre modal
      actionModal: string = "create";
      
      //Message suppression
      msgSup: string = "";
      titleMsg: string ="";

      //Element à supprimer 
      deletetauxdevise : any = null;

      constructor(private ts:tauxdeviseservice,private router : Router){}

        ngOnInit(): void {
            //Afficher toutes les devises
            this.getalldevisesactif();
            this.getalltauxdevises();
            //Initialisation du formulaire
            this.initForm();
            this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette cours Devise");
            this.titleMsg = TITLE_DELETE;

            this.tauxdeviseForm.get('coefficient')?.valueChanges.subscribe(value => {
            if (value && value > 0) {
              const inverse = 1 / value;
              this.tauxdeviseForm.patchValue({
                coefficientinverse: inverse.toFixed(6)
              }, { emitEvent: false });
            }
});

        }

  getalldevisesactif(){
    this.ts.getAlldevisesactif().subscribe({
      next : (res) => {
        if(res.success){
          this.devises = res.data;
          this.filtresdevises = [...this.devises];
        }
      }
    })
  }

  private recalculerInverse() {
  const v = this.tauxdeviseForm.get('coefficient')?.value;
  if (v && v > 0) {
    const inverse = 1 / v;
    this.tauxdeviseForm.patchValue({
      coefficientinverse: inverse
    }, { emitEvent: false });
  }
}


  filterDestinationList() {
  const origine = this.tauxdeviseForm.get('iddeviseorigine')?.value;

  this.filtresdevises = this.devises.filter(d => d.iddevise !== origine);

  // Reset si la destination sélectionnée est devenue interdite
  if (this.tauxdeviseForm.get('iddevisedestination')?.value === origine) {
    this.tauxdeviseForm.get('iddevisedestination')?.setValue('');
  }
}

filterByDevise() {
  this.filtretauxdevises = this.tauxdevises.filter(item => {
    const matchOrigine = this.selectedOrigine === "" || item.iddeviseorigine === this.selectedOrigine;
    const matchDest = this.selectedDestination === "" || item.iddevisedestination === this.selectedDestination;
    return matchOrigine && matchDest;
});
}

filterByDate() {
  const selected = (this.selecteddate || "").toString().substring(0, 10);

  this.filtretauxdevises = this.tauxdevises.filter(item => {
    const itemDate = item.datecours
      ? item.datecours.toString().substring(0, 10)
      : "";

    return selected === "" || itemDate === selected;
  });

  this.currentPage = 1; // pour réinitialiser la pagination
}



  getalltauxdevises (){
    // this.params = {
    //   page: this.currentPage,
    //   limit: this.limit
    // };
    this.ts.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.tauxdevises = res.data;
            this.filtretauxdevises = res.data;
         }
      }
    });
  }

// Nombre total de pages calculé dynamiquement
get totalPages(): number {
return Math.ceil(this.filtretauxdevises.length / this.pageSize);
}

// Liste des éléments visibles pour la page courante
get pagedtauxDevises(): any[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filtretauxdevises.slice(start, start + this.pageSize);
}

changePage(page: number) {
  if(page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}

searchtauxdevise() {
  const term = this.normalize(this.searchtext);

  this.filtretauxdevises = this.tauxdevises.filter(tauxdevise => {
    const iddeviseorigine = this.normalize(tauxdevise.iddeviseorigine);
    const iddevisedestination = this.normalize(tauxdevise.iddevisedestination);
    const codetauxdevise = this.normalize(tauxdevise.codetauxdevise);
    const intitule = this.normalize(tauxdevise.intitule);
    const typecours = this.normalize(tauxdevise.typecours);
    const datecours = this.normalize(tauxdevise.datecours);
    const coefficient = this.normalize(tauxdevise.coefficient);
    const coefficientinverse  = this.normalize(tauxdevise.coefficientinverse);
    

    const matchtext =
    iddeviseorigine.includes(term) ||
    iddevisedestination.includes(term) ||
    codetauxdevise.includes(term) ||
    intitule.includes(term) ||
    typecours.includes(term) ||
    datecours.includes(term) ||
    coefficient.includes(term) ||
    coefficientinverse.includes(term);

    // const matchstatus =
    //   this.selectedstatus === ""
    //     ? true
    //     : tauxdevise.actif.toString() === this.selectedstatus;

    return matchtext;
  });

  this.currentPage = 1;
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
    this.tauxdeviseForm = this.fb.group({
      idtauxdevise: [null],
      codetauxdevise : ['', Validators.required],
      iddeviseorigine :[''],
      iddevisedestination:[''],
      intitule: [''],
      typecours : [''],
      datecours : [''],
      coefficient : [''],
      coefficientinverse : ['']
    })
  }

  get form(){
    return this.tauxdeviseForm.controls;
  }

  dispatchtauxdevise(item : tauxdevisemodel) {

    const cleanDate = item.datecours
      ? item.datecours.toString().substring(0, 10)
      : null;

    this.tauxdevise = item;

    this.tauxdeviseForm.patchValue({
      codetauxdevise : item.codetauxdevise,
      iddeviseorigine: item.iddeviseorigine,
      iddevisedestination: item.iddevisedestination,
      typecours : item.typecours,
      coefficient: item.coefficient,
      coefficientinverse: item.coefficientinverse,
      datecours: cleanDate
    });

    // Important : recalculer la liste destination après patch
    setTimeout(() => this.filterDestinationList(), 10);
  }

  
  dispatchtauxdeviseduplicate(item : tauxdevisemodel) {

    const cleanDate = item.datecours
      ? item.datecours.toString().substring(0, 10)
      : null;

    this.tauxdevise = item;

    this.tauxdeviseForm.patchValue({
      codetauxdevise : '',
      iddeviseorigine: item.iddeviseorigine,
      iddevisedestination: item.iddevisedestination,
      typecours : item.typecours,
      coefficient: item.coefficient,
      coefficientinverse: item.coefficientinverse,
      datecours: cleanDate
    });

    // Important : recalculer la liste destination après patch
    setTimeout(() => this.filterDestinationList(), 10);
  }

   isValidField(field: string): string {
  const control = this.tauxdeviseForm.get(field);
  return control && control.invalid && (control.touched || control.dirty)
    ? 'is-invalid'
    : '';
}

//selectionner une instance dans une liste
      // handleSelectOne(tauxdevise: tauxdevisemodel, actif: any) {
      //   const index = this.objectsSelected.findIndex(
      //     (el) => el.idtauxdevise ==tauxdevise.idtauxdevise
      //   );
      //   if (index == -1) this.objectsSelected.push(tauxdevise);
      //   if (index != -1) this.objectsSelected.splice(index, 1);
      //   this.checkAllRow = this.objectsSelected?.length == this.tauxdevise?.length;
      // }

//Soumission du formulaire
        onsubmit(){
          /** Check formulaire */
          console.log("1");
          this.msgErros = '';
          const controls = this.tauxdeviseForm.controls;
          if (this.tauxdeviseForm.invalid) {
            Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
            this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
            return;
          }

          console.log("2");
      
          /** 2. prepare data */
          const formValue = this.tauxdeviseForm.value;

           console.log(formValue);
          
          const _tauxdevise: tauxdevisemodel = {
                ...this.tauxdevise,
                ...formValue,
              };
      
              this.upsert(_tauxdevise);
              this.modalCreate();

              this.refreshpage();

         
      }

      refreshpage(){
        const currentUrl = this.router.url;

        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([currentUrl]);
        });
      }

      upsert (tauxdevise : tauxdevisemodel){
          this.ts.upsert(tauxdevise).subscribe({
            next: (res: any) => {
              console.log(res);
              if(res.success){
                this.getalltauxdevises();
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
      
            modalUpdate(_object: tauxdevisemodel){
              this.tauxdevise = _object;
              this.actionModal = "update";
              this.tauxdeviseForm.reset();
              this.dispatchtauxdevise(_object);
                

              setTimeout(() => this.recalculerInverse(), 50);
            }
      
            modalDuplicate(_object: tauxdevisemodel){
              this.tauxdevise = _object;
              this.actionModal = "duplicate";
              this.tauxdeviseForm.reset();

              this.dispatchtauxdeviseduplicate(this.tauxdevise);

             setTimeout(() => this.recalculerInverse(), 50);
            }

            modalView (_object : tauxdevisemodel){
                    this.tauxdevise = _object;
                    this.actionModal ="view";
                    this.tauxdeviseForm.reset();
                    this.dispatchtauxdevise(_object);
                  }
            
                  modalDelete(item: tauxdevisemodel){
                    this.deletetauxdevise = item;
                  }

  deleteConfirmed(){
  if(!this.deletetauxdevise) return ;
  this.ts.delete(this.deletetauxdevise.idtauxdevise).subscribe({
    next: (res) => {
      if (res.success) {
        this.deletetauxdevise = null;
        this.closeModal('deleteOrder');
        this.getalltauxdevises();
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
  });
}
}
