import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { circuitvalidationmodel } from '../model/circuitvalidation.model';
import { circuitvalidationservice } from '../service/circuitvalidation.service';
import { Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circuitvalidation',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './circuitvalidation.component.html',
  styleUrl: './circuitvalidation.component.css'
})
export class CircuitvalidationComponent implements OnInit{
      title = "Circuit Validation ";
      params : any = {};
      breadCrumbs : any = {};
      fb: FormBuilder = new FormBuilder();
      circuitvalidations : circuitvalidationmodel[] = [];
      circuitvalidation : circuitvalidationmodel = new circuitvalidationmodel();
      filtrecircuitvalidation : circuitvalidationmodel[] = [];;
      msgErros : string = "";
      loading: Boolean = false;
      circuitvalidationForm : FormGroup = this.fb.group({});

      //Tri et recherche 
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
      objectsSelected :circuitvalidationmodel[] = [];
      selectedItems : any[] = [];
      
      //Changement titre modal
      actionModal: string = "create";
      
      //Message suppression
      msgSup: string = "";
      titleMsg: string ="";

      //Element à supprimer 
      deletetcircuitvalidation : any = null;

      constructor(private cv:circuitvalidationservice,private router : Router){}

        ngOnInit(): void {
            //Afficher toutes les devises
            this.getallcircuitvalidation()
            //Initialisation du formulaire
            this.initForm();
            this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce Circuit de validation");
            this.titleMsg = TITLE_DELETE;
        }

  getallcircuitvalidation(){
    this.cv.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.circuitvalidations = res.data;
          this.filtrecircuitvalidation = [...this.circuitvalidations];
        }
      }
    })
  }





// filterByDevise() {
//   this.filtretauxdevises = this.tauxdevises.filter(item => {
//     const matchOrigine = this.selectedOrigine === "" || item.iddeviseorigine === this.selectedOrigine;
//     const matchDest = this.selectedDestination === "" || item.iddevisedestination === this.selectedDestination;
//     return matchOrigine && matchDest;
// });
// }

// filterByDate() {
//   const selected = (this.selecteddate || "").toString().substring(0, 10);

//   this.filtretauxdevises = this.tauxdevises.filter(item => {
//     const itemDate = item.datecours
//       ? item.datecours.toString().substring(0, 10)
//       : "";

//     return selected === "" || itemDate === selected;
//   });

//   this.currentPage = 1; // pour réinitialiser la pagination
// }


// Nombre total de pages calculé dynamiquement
get totalPages(): number {
return Math.ceil(this.filtrecircuitvalidation.length / this.pageSize);
}

// Liste des éléments visibles pour la page courante
get pagedcircuitvalidation(): any[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.filtrecircuitvalidation.slice(start, start + this.pageSize);
}

changePage(page: number) {
  if(page < 1 || page > this.totalPages) return;
  this.currentPage = page;
}

searchtauxdevise() {
  const term = this.normalize(this.searchtext);

  this.filtrecircuitvalidation = this.circuitvalidations.filter(c => {
    const idcircuitvalidation = this.normalize(c.idcircuitvalidation);
    const codecircuitvalidation = this.normalize(c.codecircuitvalidation);
    const typeentite = this.normalize(c.typeentite);
    const typeaction = this.normalize(c.typeaction);
    const idsociete  = this.normalize(c.idsociete);
    const idsite = this.normalize(c.idsite);
    const iddepartement = this.normalize(c.iddepartement);
    const nombrevalidateur  = this.normalize(c.nombrevalidateur);
    const rangvalidation = this.normalize(c.rangvalidation);
    const actif  = this.normalize(c.actif);
    

    const matchtext =
     idcircuitvalidation.includes(term) ||
     codecircuitvalidation.includes(term) ||
     typeentite.includes(term) ||
     typeaction.includes(term) ||
     idsociete.includes(term) ||
     idsite.includes(term) ||
     iddepartement.includes(term) ||
     nombrevalidateur.includes(term) ||
     rangvalidation.includes(term) ||
     actif.includes(term) ;

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
    this.circuitvalidationForm = this.fb.group({
      idcircuitvalidation: [null],
      codecircuitvalidation : ['', Validators.required],
      typeentite :[''],
      typeaction :[''],
      idsociete : [''],
      idsite : [''],
      iddepartement : [''],
      nombrevalidateur : [''],
      rangvalidation : [''],
      actif : 0,
    })
  }

  get form(){
    return this.circuitvalidationForm.controls;
  }

  dispatchcircuitvalidation (item : circuitvalidationmodel) {

    this.circuitvalidation = item;

    this.circuitvalidationForm.patchValue({
      idcircuitvalidation: item.idcircuitvalidation,
      codecircuitvalidation : item.codecircuitvalidation,
      typeentite :item.typeentite,
      typeaction :item.typeaction,
      idsociete : item.typeaction,
      idsite : item.idsite,
      iddepartement :item.iddepartement,
      nombrevalidateur : item.nombrevalidateur,
      rangvalidation : item.rangvalidation,
      actif :item.actif,
    });
  }

  //   // Important : recalculer la liste destination après patch
  //   setTimeout(() => this.filterDestinationList(), 10);
  // }

  
  dispatchcircuitvalidationduplicate (item : circuitvalidationmodel) {

    this.circuitvalidation = item;

    this.circuitvalidationForm.patchValue({
      codecircuitvalidation : '',
      typeentite :item.typeentite,
      typeaction :item.typeaction,
      idsociete : item.typeaction,
      idsite : item.idsite,
      iddepartement :item.iddepartement,
      nombrevalidateur : item.nombrevalidateur,
      rangvalidation : item.rangvalidation,
      actif :item.actif,
    });
  }

  //   // Important : recalculer la liste destination après patch
  //   setTimeout(() => this.filterDestinationList(), 10);
  // }

   isValidField(field: string): string {
  const control = this.circuitvalidationForm.get(field);
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
          this.msgErros = '';
          const controls = this.circuitvalidationForm.controls;
          if (this.circuitvalidationForm.invalid) {
            Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
            this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
            return;
          }

          /** 2. prepare data */
          const formValue = this.circuitvalidationForm.value;
          
          const _circuitvalidation: circuitvalidationmodel = {
                ...this.circuitvalidation,
                ...formValue,
              };

              if(this.actionModal==="create")
              {
                this.create(_circuitvalidation);
                this.refreshpage();
              }
              else if (this.actionModal==="update")
              {
                this.update(_circuitvalidation);
                this.refreshpage();
              }
              else
              {
                this.create(_circuitvalidation);
                this.refreshpage();
              }



         
      }

      refreshpage(){
        const currentUrl = this.router.url;

        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([currentUrl]);
        });
      }

      create (circuitvalidation : circuitvalidationmodel){
          this.cv.create(circuitvalidation).subscribe({
            next: (res: any) => {
              if(res.success){
                this.getallcircuitvalidation();
                this.refreshpage();
                //this.router.navigate(["/"])
              }
            },
            error :(err) => {
                console.log(err);
            }
          });
      }

      update (circuitvalidation : circuitvalidationmodel){
          this.cv.update(circuitvalidation).subscribe({
            next: (res: any) => {
              if(res.success){
                this.getallcircuitvalidation();
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
      
            modalUpdate(_object: circuitvalidationmodel){
              this.circuitvalidation = _object;
              this.actionModal = "update";
              this.circuitvalidationForm.reset();
              this.dispatchcircuitvalidation(_object);
            }
      
            modalDuplicate(_object: circuitvalidationmodel){
              this.circuitvalidation = _object;
              this.actionModal = "duplicate";
              this.circuitvalidationForm.reset();

              this.dispatchcircuitvalidationduplicate(this.circuitvalidation);
            }

            modalView (_object: circuitvalidationmodel){
                    this.circuitvalidation = _object;
                    this.actionModal ="view";
                    this.circuitvalidationForm.reset();
                    this.dispatchcircuitvalidation(_object);
                  }
            
                  modalDelete(item: circuitvalidationmodel){
                    this.deletetcircuitvalidation = item;
                  }

  deleteConfirmed(){
  if(!this.deletetcircuitvalidation) return ;
  this.cv.delete(this.deletetcircuitvalidation.idcircuitvalidation).subscribe({
    next: (res) => {
      if (res.success) {
        this.deletetcircuitvalidation = null;
        this.closeModal('deleteOrder');
        this.getallcircuitvalidation();
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

