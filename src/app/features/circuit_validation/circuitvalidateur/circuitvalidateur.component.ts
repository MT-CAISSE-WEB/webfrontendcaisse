import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { circuitvalidateurModel } from '../models/circuitvalidateur.model';
import { circuitvalidateurService } from '../services/circuitvalidateur.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-circuitvalidateur',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './circuitvalidateur.component.html',
  styleUrl: './circuitvalidateur.component.css'
})
export class CircuitvalidateurComponent implements OnInit{
  title = "Circuit validateur";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  circuits : circuitvalidateurModel[] = [];
  circuit : circuitvalidateurModel = new circuitvalidateurModel();
  msgErros : string = "";
  loading: Boolean = false;
  circuitvalidateurForm : FormGroup = this.fb.group({})

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected : circuitvalidateurModel[] = [];
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
  deletecircuit: any = null;


  constructor(private circuitvalidateurservice: circuitvalidateurService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les journaux
      this.getAllcircuits();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce circuit");
      this.titleMsg = TITLE_DELETE
  }

  getAllcircuits(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.circuitvalidateurservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.circuits = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //création du formulaire
  initForm(): void{
    this.circuitvalidateurForm = this.fb.group({
      codecircuitvalidateur : ["", [Validators.required]],
      idutilisateur : ["", [Validators.required]],
      idsociete : ["", [Validators.required]],
      idcircuitvalidation : ["", [Validators.required]],
      rangvalidation : ["", [Validators.required]],
      
      actif : [true],
    })
  }

  get form() {
    return this.circuitvalidateurForm.controls;
  }

  dispatchcircuit(_object: circuitvalidateurModel){
    const status = _object.actif === 1;
    this.circuitvalidateurForm.patchValue({
       codecircuitvalidateur : _object.codecircuitvalidateur,
      idutilisateur : _object.idutilisateur,
      idsociete: _object.idsociete,
      idcircuitvalidation : _object.idcircuitvalidation,
      rangvalidation : _object.rangvalidation,
      actif : status
    })
  }

  //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.idcircuitvalidateur);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(circuit: circuitvalidateurModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcircuitvalidateur == circuit.idcircuitvalidateur
    );
    if (index == -1 && actif) this.objectsSelected.push(circuit);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.circuits?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.circuits.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllcircuits(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.circuitvalidateurForm.controls;

    console.log("entrer submit");
   
    if (this.circuitvalidateurForm.invalid) {
      console.log("formulaire");
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }
     console.log("submit");
    /** 2. prepare data */
    const formValue = this.circuitvalidateurForm.value;

    console.log(formValue);

    const _circuit: circuitvalidateurModel = {
      ...this.circuit,
      ...formValue,
      actif: formValue.actif ? 1 : 0  
    };

     

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_circuit);
    else this.update(_circuit);
    // if (!_journal.idjournal) this.create(_journal);
    // else this.update(_journal);
  }

  //Enregistrement de données
  create(_circuit: circuitvalidateurModel) {
    const {idcircuitvalidateur, ...dataToSend} = _circuit;
    this.loading = true;
    this.circuitvalidateurservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcircuits();
        } else {
          this.error = "Erreur de création";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Création échec";
        this.loading = false;
      }
    })
  }

  //Modification de données
  update(_circuit: circuitvalidateurModel){
    console.log(_circuit);
    this.circuitvalidateurservice.update(_circuit).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcircuits();
        } else {
          this.error = "Erreur de modification";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Modification échec";
        this.loading = false;
      }
    })
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

  modalUpdate(_object: circuitvalidateurModel){
    this.circuit = _object;
    this.actionModal = "update";
    this.circuitvalidateurForm.reset();
    this.dispatchcircuit(_object);
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: circuitvalidateurModel){
    this.deletecircuit = item;
  }

  deleteConfirmed(){
    if(!this.deletecircuit) return ;
    this.circuitvalidateurservice.delete(this.deletecircuit.idcircuitvalidateur).subscribe({
      next: (res) => {
        if (res.success) {
          this.deletecircuit = null;
          this.closeModal('deleteOrder');
          this.getAllcircuits();
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
