import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { circuitvalidateurmodel } from '../model/circuitvalidateur.model';
import { usermodel } from '../../administration/model/user.model';
import { circuitvalidationmodel } from '../model/circuitvalidation.model';
import { circuitvalidateurservice } from '../service/circuitvalidateur.service';
import { circuitvalidationservice } from '../service/circuitvalidation.service';
import { userservice } from '../../administration/service/user.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circuitvalidateur',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './circuitvalidateur.component.html',
  styleUrl: './circuitvalidateur.component.css'
})
export class CircuitvalidateurComponent implements OnInit {
      title = "Circuit Validateur";
      params : any = {};
      breadCrumbs : any = {};
      fb: FormBuilder = new FormBuilder();
      circuitvalidateurs : circuitvalidateurmodel[] = [];
      circuitvalidateur : circuitvalidateurmodel = new circuitvalidateurmodel();
      filtrecircuitvalidateur : circuitvalidateurmodel[] = [];
      msgErros : string = "";
      loading: Boolean = false;
      circuitvalidateurForm : FormGroup = this.fb.group({});
      
      //Utils
      circuitvalidations : circuitvalidationmodel[] = [];
      utilisateurs : usermodel[] = [];

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
      deletetcircuitvalidateur : any = null;

      constructor(
        private cvalidateur : circuitvalidateurservice,
        private cvalidation : circuitvalidationservice,
        private us : userservice,
        private router : Router
      ){}

      ngOnInit(): void {
                  //Afficher toutes les circuits validateurs
                  this.getallcircuitvalidateur()
                  //this.loadsociete();
                  this.loadcircuitvalidation();
                  this.loadutilisateur();
                  //Initialisation du formulaire
                  this.initForm();
                  this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce Circuit de validation");
                  this.titleMsg = TITLE_DELETE;
        }

getallcircuitvalidateur(){
    this.cvalidateur.getAll().subscribe({
      next : (res) => {
        if(res.success){
          console.log(res.data);
          this.circuitvalidateurs = res.data;
          this.filtrecircuitvalidateur = [...this.circuitvalidateurs];
        }
      }
    })
  }

loadcircuitvalidation(){
    this.cvalidation.getAll().subscribe({
      next : (res) => {
        this.circuitvalidations = res.data;
      }
    })
  }

  loadutilisateur(){
    this.us.getAll().subscribe({
      next : (res) => {
        this.utilisateurs = res.data;
      }
    })
  }

  initForm(): void{
    this.circuitvalidateurForm = this.fb.group({
      idcircuitvalidateur: [null],
      codecircuitvalidateur : ['', Validators.required],
      idsociete : [''],
      idcircuitvalidation : [''],
      idutilisateur : [''],
      rangvalidation : ['']
    })
  }

  get form(){
    return this.circuitvalidateurForm.controls;
  }

  dispatchcircuitvalidateur (item : circuitvalidateurmodel) {

    this.circuitvalidateur = item;

    this.circuitvalidateurForm.patchValue({
      idcircuitvalidateur: item.idcircuitvalidateur,
      codecircuitvalidateur : item.codecircuitvalidateur,
      idsociete : item.idsociete,
      idutilisateur : item.idutilisateur,
      idcircuitvalidation : item. idcircuitvalidation,
      rangvalidation : item.rangvalidation
    });
  }

    dispatchcircuitvalidateurduplicate (item : circuitvalidateurmodel) {

    this.circuitvalidateur = item;

    this.circuitvalidateurForm.patchValue({
      idcircuitvalidateur: '',
      codecircuitvalidateur : item.codecircuitvalidateur,
      idsociete : item.idsociete,
      idutilisateur : item.idutilisateur,
      idcircuitvalidation : item. idcircuitvalidation,
      rangvalidation : item.rangvalidation
    });
  }

   isValidField(field: string): string {
  const control = this.circuitvalidateurForm.get(field);
  return control && control.invalid && (control.touched || control.dirty)
    ? 'is-invalid'
    : '';
  }

  //Soumission du formulaire
          onsubmit(){
            /** Check formulaire */
            this.msgErros = '';
            const controls = this.circuitvalidateurForm.controls;
            if (this.circuitvalidateurForm.invalid) {
              Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
              this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
              return;
            }
  
            /** 2. prepare data */
            const formValue = this.circuitvalidateurForm.value;
            
            const _circuitvalidateur: circuitvalidateurmodel = {
                  ...this.circuitvalidateur,
                  ...formValue,
                };
  
                if(this.actionModal==="create")
                {
                  this.create(_circuitvalidateur);
                  this.refreshpage();
                }
                else if (this.actionModal==="update")
                {
                  this.update(_circuitvalidateur);
                  this.refreshpage();
                }
                else
                {
                  this.create(_circuitvalidateur);
                  this.refreshpage();
                }
  
  
  
           
        }

         refreshpage(){
        const currentUrl = this.router.url;

        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([currentUrl]);
        });
      }

       create (circuitvalidateur : circuitvalidateurmodel){
          this.cvalidateur.create(circuitvalidateur).subscribe({
            next: (res: any) => {
              if(res.success){
                this.getallcircuitvalidateur();
                this.refreshpage();
                //this.router.navigate(["/"])
              }
            },
            error :(err) => {
                console.log(err);
            }
          });
      }

       update (circuitvalidateur : circuitvalidateurmodel){
          this.cvalidateur.update(circuitvalidateur).subscribe({
            next: (res: any) => {
              if(res.success){
                this.getallcircuitvalidateur();
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
         modalUpdate(_object: circuitvalidateurmodel){
              this.circuitvalidateur = _object;
              this.actionModal = "update";
              this.circuitvalidateurForm.reset();
              this.dispatchcircuitvalidateur (_object);
            }

         modalDuplicate(_object: circuitvalidateurmodel){
              this.circuitvalidateur = _object;
              this.actionModal = "duplicate";
              this.circuitvalidateurForm.reset();

              this.dispatchcircuitvalidateurduplicate(this.circuitvalidateur);
            }
         modalView (_object: circuitvalidateurmodel){
                    this.circuitvalidateur = _object;
                    this.actionModal ="view";
                    this.circuitvalidateurForm.reset();
                    this.dispatchcircuitvalidateur(_object);
                  }
            
                  modalDelete(item: circuitvalidateurmodel){
                    this.deletetcircuitvalidateur = item;
                  }
   deleteConfirmed(){
  if(!this.deletetcircuitvalidateur) return ;
  this.cvalidateur.delete(this.deletetcircuitvalidateur.idcircuitvalidateur).subscribe({
    next: (res) => {
      if (res.success) {
        this.deletetcircuitvalidateur = null;
        this.closeModal('deleteOrder');
        this.getallcircuitvalidateur();
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
