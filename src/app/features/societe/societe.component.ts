import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { societeModel } from '../donnee_base/models/societe.model';
import { SocieteService } from '../donnee_base/services/societe.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-societe',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './societe.component.html',
  styleUrl: './societe.component.css'
})

export class SocieteComponent implements OnInit{
  title = "Plan comptable";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  societes : societeModel[] = [];
  societe : societeModel = new societeModel();
  msgErros : string = "";
  loading: Boolean = false;
  plancomptableForm : FormGroup = this.fb.group({})

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  //Faire le check selection **********
  objectsSelected : societeModel[] = [];
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
  deletesociete: any = null;


  constructor(private SocieteService: SocieteService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les societes
      this.getAllsocietes();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce societe");
      this.titleMsg = TITLE_DELETE;
  }

  getAllsocietes(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.SocieteService.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.societes = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }


  //Création du formulaire
  initForm(): void{
    this.plancomptableForm = this.fb.group({
      numsociete : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      ventillable: [false],
      auxiliaire: [false],
      suivibudgetaire: [false],
      suivibudgetairemensuel: [false],
      idsociete : ["", [Validators.required]],
      actif : [true],
    })
  }
}

//   get form() {
//     return this.plancomptableForm.controls;
//   }

//   dispatchsocietes(_object: societeModel){
//     const status = _object.actif === 1;
//     this.plancomptableForm.patchValue({
//       numsociete : _object.numsociete,
//       libelle : _object.libelle,
//       ventillable : _object.ventillable,
//       auxiliaire : _object.auxiliaire,
//       suivibudgetaire : _object.suivibudgetaire,
//       suivibudgetairemensuel : _object.suivibudgetairemensuel,
//       idsociete: _object.idsociete,
//       actif : status
//     })
//   }

//   //validation required
//   isValidField(label: string): string {
//     let status: string = "";
//     this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
//       this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
//     return status;
//   }

//   //vérifie si _id est inclus dans un tableau d'IDs stocké
//   isChecked(_id: string) {
//     const ids: string[] = this.objectsSelected.map((el) => el.idsociete);
//     return ids.includes(_id);
//   }

//   //selectionner une instance dans une liste
//   handleSelectOne(societe: societeModel, actif: any) {
//     const index = this.objectsSelected.findIndex(
//       (el) => el.idsociete == societe.idsociete
//     );
//     if (index == -1 && actif) this.objectsSelected.push(societe);
//     if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
//     this.checkAllRow = this.objectsSelected?.length == this.societes?.length;
//   }

//   //Sélection/ Désélection de tous les éléments
//   handleSelectAll($event: any) {
//     this.checkAllRow = $event;
//     if (this.checkAllRow) this.objectsSelected = this.societes.slice();
//     else this.objectsSelected = [];
//   }

//   //Recharger la page
//   changePage(page: number) {
//     this.currentPage = page;
//     this.getAllsocietes(); // recharge les données
//   }

//   //Soumission du formulaire
//   onSubmit(){
//     /** Check formulaire */
//     this.msgErros = '';
//     const controls = this.plancomptableForm.controls;
//     if (this.plancomptableForm.invalid) {
//       Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
//       this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
//       return;
//     }

//     /** 2. prepare data */
//     const formValue = this.plancomptableForm.value;

//     const _societes: societeModel = {
//       ...this.societe,
//       ...formValue,
//       actif: formValue.actif ? 1 : 0,
//       ventillable: formValue.ventillable ? 1 : 0,
//       auxiliaire: formValue.auxiliaire ? 1 : 0,
//       suivibudgetaire: formValue.suivibudgetaire ? 1 : 0,
//       suivibudgetairemensuel: formValue.suivibudgetairemensuel ? 1 : 0,
//     };

//     /** 3. choices action */
//     if(this.actionModal == "create")this.create(_societes);
//     else this.update(_societes);
//     // if (!_societes.idsocietes) this.create(_societes);
//     // else this.update(_societes);
//   }

//   //Enregistrement de données
//   create(_societes: societeModel) {
//     const {idsociete, ...dataToSend} = _societes;
//     this.loading = true;
//     this.plancomptableservice.create(dataToSend).subscribe({
//       next: (res) => {
//         if (res.success) {
//           this.closeModal('showModal');
//           this.getAllsocietes();
//         } else {
//           this.error = "Erreur de création";
//         }
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = "Echec de création";
//         this.loading = false;
//       }
//     })
//   }

//   //Modification de données
//   update(_societes: societeModel){
//     this.plancomptableservice.update(_societes).subscribe({
//       next: (res) => {
//         if (res.success) {
//           this.closeModal('showModal');
//           this.getAllsocietes();
//         } else {
//           this.error = "Erreur de modification";
//         }
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = "Echec de modification";
//         this.loading = false;
//       }
//     })
//   }

//   closeModal(modal: string){
//     const modalEl = document.getElementById(modal);
//     modalEl?.classList.remove('show');
//     modalEl?.setAttribute('aria-hidden', 'true');
//     (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
//   }

//   modalCreate(){
//     this.actionModal = "create";
//     this.initForm();
//   }

//   modalUpdate(_object: societeModel){
//     this.societe = _object;
//     this.actionModal = "update";
//     this.plancomptableForm.reset();
//     this.dispatchsocietes(_object);
//   }

//   modalDelete(item: societeModel){
//     this.deletesociete = item;
//   }

//   deleteConfirmed(){
//     if(!this.deletesociete) return ;
//     this.plancomptableservice.delete(this.deletesociete.idsociete).subscribe({
//       next: (res) => {
//         if (res.success) {
//           this.closeModal('delete');
//           this.getAllsocietes();
//         } else {
//           this.error = "Erreur de Suppression";
//         }
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = "Suppression échec";
//         this.loading = false;
//       }
//     })
//   }
// }
