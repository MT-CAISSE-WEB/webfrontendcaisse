import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { affectationanalytiqueModel } from '../models/affectationanalytique.model';
import { AffectationAnalytiqueService } from '../services/affectationanalytique.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { CentreAnalytiqueService } from '../services/centreanalytique.service';
import { centreanalytiqueModel } from '../models/centreanalytique.model';
import { NatureoperationService } from '../services/natureoperation.service';
import { natureoperationModel } from '../models/natureoperation.model';
import { departementservice } from '../../structure/service/departement.service';
import { departementmodel } from '../../structure/model/departement.model';
import { siteservice } from '../../structure/service/site.service';
import { sitemodel } from '../../structure/model/site.model';

// ADD-INS
declare var $: any;


@Component({
  selector: 'app-affectationanalytique',

  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './affectationanalytique.component.html',
  styleUrl: './affectationanalytique.component.css'
})

export class AffectationanalytiqueComponent implements OnInit{
  title = "Affectation analytique";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  affectations : affectationanalytiqueModel[] = [];
  affectation : affectationanalytiqueModel = new affectationanalytiqueModel();
  msgErros : string = "";
  loading: Boolean = false; 
  affectationanalytiqueForm : FormGroup = this.fb.group({})

  //Faire le check selection **********
  objectsSelected : affectationanalytiqueModel[] = [];
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
  deleteaffectation: any = null;

  centres : centreanalytiqueModel[] = [];
  natureoperations : natureoperationModel[] = [];
  sites : sitemodel[] = []
  departements : departementmodel[] = [];



  constructor(private affectationanalytiqueservice: AffectationAnalytiqueService,
              private centreanalytiqueservice: CentreAnalytiqueService,
              private natureoperationservice: NatureoperationService,
              private siteservice: siteservice,
              private departementservice: departementservice,
              private router: Router){}


  ngOnInit(): void {
      //Afficher tous les affectations
      this.getAllaffectations();
      this.getAllNatureoperations();
      this.getAllcentres();
      this.getAllSites();
      this.getAllDepartements();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette affectation");
      this.titleMsg = TITLE_DELETE;
  }

  getAllaffectations(){
    this.affectationanalytiqueservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.affectations = res.data;

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


  // centre analytique
  getAllcentres(){
    this.centreanalytiqueservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.centres = res.data;
        }
      }
    });
  }


  getAllNatureoperations(){
    this.natureoperationservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = res.data;
        }
      }
    });
  }

  getAllSites(){
    this.siteservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.sites = res.data;
        }
      }
    });
  }


  getAllDepartements(){
    this.departementservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.departements = res.data;
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


  //Création du formulaire
  initForm(): void{
    this.affectationanalytiqueForm = this.fb.group({
      codeaffectation : ["", [Validators.required]],
      idsociete : ["58B53CD2-686A-4CED-9E64-3BA2A5A6D664", [Validators.required]],
      idsite : ["", [Validators.required]],
      iddepartement : ["", [Validators.required]],
      idcentreanalytique : ["", [Validators.required]],
      idnature : ["", [Validators.required]],
      actif : [true],
    })
  }

  
  get form() {
    return this.affectationanalytiqueForm.controls;
  }

  dispatchaffectations(_object: affectationanalytiqueModel){
    const status = _object.actif === 1;
    this.affectationanalytiqueForm.patchValue({
      codeaffectation : _object.codeaffectation,
      idsociete: _object.idsociete,
      idsite: _object.idsite,
      iddepartement: _object.iddepartement,
      idcentreanalytique: _object.idcentreanalytique,
      idnature: _object.idnature,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idaffectation);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(affectation: affectationanalytiqueModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idaffectation == affectation.idaffectation
    );
    if (index == -1 && actif) this.objectsSelected.push(affectation);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.affectations?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.affectations.slice();
    else this.objectsSelected = [];
  }


  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.affectationanalytiqueForm.controls;
    if (this.affectationanalytiqueForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.affectationanalytiqueForm.value;

    const _affectations: affectationanalytiqueModel = {
      ...this.affectation,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_affectations);
    else this.update(_affectations);
    // if (!_affectations.idaffectations) this.create(_affectations);
    // else this.update(_affectations);
  }

  //Enregistrement de données
  create(_affectations: affectationanalytiqueModel) {
    const {idaffectation, ...dataToSend} = _affectations;
    this.loading = true;
    this.affectationanalytiqueservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllaffectations();
        } else {
          this.error = "Erreur de création";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de création";
        this.loading = false;
      }
    })
  }

  //Modification de données
  update(_affectations: affectationanalytiqueModel){
    this.affectationanalytiqueservice.update(_affectations).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllaffectations();
        } else {
          this.error = "Erreur de modification";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de modification";
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

  modalUpdate(_object: affectationanalytiqueModel){
    this.affectation = _object;
    this.actionModal = "update";
    this.affectationanalytiqueForm.reset();
    this.dispatchaffectations(_object);
  }

  modalDelete(item: affectationanalytiqueModel){
    this.deleteaffectation = item;
  }

  deleteConfirmed(){
    if(!this.deleteaffectation) return ;
    this.affectationanalytiqueservice.delete(this.deleteaffectation.idaffectation).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllaffectations();
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
