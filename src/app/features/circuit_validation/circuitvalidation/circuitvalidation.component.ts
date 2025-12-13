import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { circuitvalidationModel } from '../models/circuitvalidation.model';
import { circuitvalidationService } from '../services/circuitvalidation.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-circuitvalidation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './circuitvalidation.component.html',
  styleUrl: './circuitvalidation.component.css'
})
export class CircuitvalidationComponent implements OnInit{
  title = "Circuit validation";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  circuits : circuitvalidationModel[] = [];
  circuit : circuitvalidationModel = new circuitvalidationModel();
  msgErros : string = "";
  loading: Boolean = false;
  circuitvalidationForm : FormGroup = this.fb.group({})

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected : circuitvalidationModel[] = [];
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


  constructor(private circuitvalidationservice: circuitvalidationService,
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
    this.circuitvalidationservice.getAll(this.params).subscribe({
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
    this.circuitvalidationForm = this.fb.group({
      codecircuitvalidation : ["", [Validators.required]],
      typeentite : ["", [Validators.required]],
      typeaction : ["", [Validators.required]],
      idsociete : ["", [Validators.required]],
      idsite : ["", [Validators.required]],
      iddepartement : ["", [Validators.required]],
      nombrevalidateur : ["", [Validators.required]],      
      actif : [true],
    })
  }

  get form() {
    return this.circuitvalidationForm.controls;
  }

  dispatchcircuit(_object: circuitvalidationModel){
    const status = _object.actif === 1;
    this.circuitvalidationForm.patchValue({
      codecircuitvalidateur : _object.codecircuitvalidation,
      typeentite : _object.typeentite,
      typeaction : _object.typeaction,
      idsociete: _object.idsociete,
      idsite : _object.idsite,
      iddepartement : _object.iddepartement,
      nombrevalidateur : _object.nombrevalidateur,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idcircuitvalidation);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(circuit: circuitvalidationModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcircuitvalidation == circuit.idcircuitvalidation
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
    const controls = this.circuitvalidationForm.controls;
    if (this.circuitvalidationForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.circuitvalidationForm.value;

    const _circuit: circuitvalidationModel = {
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
  create(_circuit: circuitvalidationModel) {
    const {idcircuitvalidation, ...dataToSend} = _circuit;
    this.loading = true;
    this.circuitvalidationservice.create(dataToSend).subscribe({
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
  update(_circuit: circuitvalidationModel){
    console.log(_circuit);
    this.circuitvalidationservice.update(_circuit).subscribe({
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

  modalUpdate(_object: circuitvalidationModel){
    this.circuit = _object;
    this.actionModal = "update";
    this.circuitvalidationForm.reset();
    this.dispatchcircuit(_object);
  }

  // loader(){
  //   this.router.navigateByUrl(APP_JOURNAL_CAISSE_JOURNAL).then();
  // }

  modalDelete(item: circuitvalidationModel){
    this.deletecircuit = item;
  }

  deleteConfirmed(){
    if(!this.deletecircuit) return ;
    this.circuitvalidationservice.delete(this.deletecircuit.idcircuitvalidation).subscribe({
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
