import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { natureoperationModel } from '../models/natureoperation.model';
import { NatureoperationService } from '../services/natureoperation.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { PlancomptableService } from '../services/plancomptable.service';
import { plancomptableModel } from '../models/plancomptable.model';

// import { ToastrService } from 'ngx-toastr';

// ADD-INS
declare var $: any;

@Component({
  selector: 'app-natureoperation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './natureoperation.component.html',
  styleUrl: './natureoperation.component.css' 
})

export class NatureoperationComponent implements OnInit{
  title = "Gestion des natures d'operations";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  natureoperations : natureoperationModel[] = [];
  natureoperation : natureoperationModel = new natureoperationModel();
  msgErros : string = "";
  loading: Boolean = false;
  natureoperationForm : FormGroup = this.fb.group({})

  //Faire le check selection **********
  objectsSelected : natureoperationModel[] = [];
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
  deleteNatureoperation : any = null;

  comptes : plancomptableModel[] = [];


  constructor(private natureoperationservice: NatureoperationService, 
    private plancomptableservice: PlancomptableService,
              private router: Router
              // , private toastr : ToastrService
            ){}

  ngOnInit(): void {
      //Afficher tous les natureoperations
      this.getAllNatureoperations();
      this.getAllComptes();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette nature d'operation");
      this.titleMsg = TITLE_DELETE;
  }

  getAllNatureoperations(){

    this.natureoperationservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = res.data;

          const table = $('#dataTable').DataTable();
          table.destroy();

          setTimeout(() => $('#dataTable').DataTable({
            language: {
            search: "Rechercher :",
            lengthMenu: "Afficher _MENU_ éléments",
            info: "Affichage de _START_ à _END_ sur _TOTAL_ éléments",
            infoEmpty: "Affichage de 0 à 0 sur 0 élément",
            infoFiltered: "(filtré de _MAX_ éléments au total)",
            loadingRecords: "Chargement...",
            processing: "Traitement...",
            zeroRecords: "Aucun élément correspondant trouvé",
            emptyTable: "Aucune donnée disponible dans le tableau",
            paginate: {
              first: "Premier",
              previous: "Précédent",
              next: "Suivant",
              last: "Dernier"
            },
            aria: {
              sortAscending: ": activer pour trier la colonne par ordre croissant",
              sortDescending: ": activer pour trier la colonne par ordre décroissant"
            }
          },
            responsive: true,
            ordering: true,
            lengthMenu: [
                [10, 25, 50, 100, 250, 500, -1],
                [10, 25, 50, 100, 250, 500, "Tous"]
              ]

          }), 0);
        }
      }
    });
  }

    getAllComptes(){
    this.plancomptableservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.comptes = res.data;
        }
      }
    });
  }

    ngAfterViewInit(): void {
    // Attendre que le DOM soit chargé
    $('#dataTable').DataTable({
      paging: true,
      searching: true,
      ordering: true,
      info: true,
      responsive: true,
      language: {
        search: "Rechercher :",
        lengthMenu: "Afficher _MENU_ lignes",
        info: "Affichage de _START_ à _END_ sur _TOTAL_ lignes",
        paginate: {
          previous: "Précédent",
          next: "Suivant"
        }
      }
    });
  }


  //création du formulaire
  initForm(): void{
    this.natureoperationForm = this.fb.group({
      codenature : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      decajustifier : [false],
      imputationtiers : [false],
      demandedecaissement : [true],
      typoeration : ["", [Validators.required]],
      idsociete : ["6591AC47-11AA-4664-838E-B977292814FE", [Validators.required]],
      idcompte : ["", [Validators.required]],
      actif : [true],
    })
  }

  get form() {
    return this.natureoperationForm.controls;
  }

  dispatchNatureoperations(_object: natureoperationModel){
    const status = _object.actif === 1;
    this.natureoperationForm.patchValue({
      codenature : _object.codenature,
      libelle : _object.libelle,
      decajustifier : _object.decajustifier,
      imputationtiers : _object.imputationtiers,
      demandedecaissement : _object.demandedecaissement,
      typoeration : _object.typeoperation,
      idsociete: _object.idsociete,
      idcompte : _object.idcompte,
      numcompte : _object.compte.compte_numcompte,
      libellecompte : _object.compte.compte_libelle,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idnature);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(natureoperation: natureoperationModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idnature == natureoperation.idnature
    );
    if (index == -1 && actif) this.objectsSelected.push(natureoperation);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.natureoperations?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.natureoperations.slice();
    else this.objectsSelected = [];
  }


  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.natureoperationForm.controls;
    if (this.natureoperationForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.natureoperationForm.value;

    const _natureoperations: natureoperationModel = {
      ...this.natureoperation,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
      decajustifier : formValue.decajustifier ? 1 : 0,
      imputationtiers : formValue.imputationtiers ? 1 : 0,
      demandedecaissement : formValue.demandedecaissement ? 1 : 0,
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_natureoperations);
    else this.update(_natureoperations);
    // if (!_natureoperations.idnatureoperations) this.create(_natureoperations);
    // else this.update(_natureoperations);
  }

  //Enregistrement de données
  create(_natureoperations: natureoperationModel) {
    const {idnature, ...dataToSend} = _natureoperations;
    this.loading = true;
    this.natureoperationservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllNatureoperations();
        } else {
          this.error = "Erreur de création";
          // this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de création";
        this.loading = false;
        // this.toastr.error(err);
      }
    })
  }

  //Modification de données
  update(_natureoperations: natureoperationModel){
    this.natureoperationservice.update(_natureoperations).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllNatureoperations();
          // this.toastr.success('Fiche modifée avec succès');
        } else {
          this.error = "Erreur de modification";
          // this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de modification";
        this.loading = false;
        // this.toastr.error(this.error);
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

  modalUpdate(_object: natureoperationModel){
    this.natureoperation = _object;
    this.actionModal = "update";
    this.natureoperationForm.reset();
    this.dispatchNatureoperations(_object);
  }
 

  modalDelete(item: natureoperationModel){
    this.deleteNatureoperation = item;
  }

  deleteConfirmed(){
    if(!this.deleteNatureoperation) return ;
    this.natureoperationservice.delete(this.deleteNatureoperation.idnature).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllNatureoperations();
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
