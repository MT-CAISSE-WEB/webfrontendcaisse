import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { centreanalytiqueModel } from '../models/centreanalytique.model';
import { CentreAnalytiqueService } from '../services/centreanalytique.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';

import { ToastrService } from 'ngx-toastr';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ADD-INS
declare var $: any;

@Component({
  selector: 'app-centreanalytique',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTablesModule],
  templateUrl: './centreanalytique.component.html',
  styleUrl: './centreanalytique.component.css'
})

export class CentreanalytiqueComponent implements OnInit{
  title = "Centre analytique";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  centres : centreanalytiqueModel[] = [];
  centre : centreanalytiqueModel = new centreanalytiqueModel();
  msgErros : string = "";
  loading: Boolean = false;
  centreanalytiqueForm : FormGroup = this.fb.group({});


  //Faire le check selection **********
  objectsSelected : centreanalytiqueModel[] = [];
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
  deletecentre: any = null;

  // dtOptions: DataTables.Settings = {};
  dtOptions: any = {};

  dtTrigger: Subject<any> = new Subject<any>(); 



/**
 * Constructor
 * @param centreanalytiqueservice - Service du centre analytique
 * @param router - Router pour la navigation
 */
  constructor(private centreanalytiqueservice: CentreAnalytiqueService,
              private router: Router
            , private toastr : ToastrService
          ){}

  ngOnInit(): void {
    //Afficher tous les centres
    this.getAllcentres();
    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce centre analytique");
    this.titleMsg = TITLE_DELETE;
}

  getAllcentres() {
    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.centres = res.data;

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

          // $('#dataTable').DataTable().destroy()
        }
      }
    });
  }


  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }



  //Création du formulaire
  initForm(): void{
    this.centreanalytiqueForm = this.fb.group({
      codecentreanalytique : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      idsociete : [this.user.idsociete, [Validators.required]],
      actif : [true],
      createdby : [this.user.codeutilisateur],
      updatedby : [this.user.codeutilisateur]
    })
  }

  get form() {
    return this.centreanalytiqueForm.controls;
  }

  dispatchcentres(_object: centreanalytiqueModel){
    const status = _object.actif === 1;
    this.centreanalytiqueForm.patchValue({
      codecentreanalytique : _object.codecentreanalytique,
      libelle : _object.libelle,
      idsociete: _object.idsociete,
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
    const ids: string[] = this.objectsSelected.map((el) => el.idcentreanalytique);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(centre: centreanalytiqueModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcentreanalytique == centre.idcentreanalytique
    );
    if (index == -1 && actif) this.objectsSelected.push(centre);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.centres?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.centres.slice();
    else this.objectsSelected = [];
  }


  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.centreanalytiqueForm.controls;
    if (this.centreanalytiqueForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.centreanalytiqueForm.value;

    const _centres: centreanalytiqueModel = {
      ...this.centre,
      ...formValue,
      actif: formValue.actif ? 1 : 0  
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_centres);
    else this.update(_centres);
    // if (!_centres.idcentreanalytiques) this.create(_centres);
    // else this.update(_centres);
  }

  //Enregistrement de données
  create(_centres: centreanalytiqueModel) {
    const {idcentreanalytique, ...dataToSend} = _centres;
    this.loading = true;
    this.centreanalytiqueservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcentres();
          this.toastr.success("Fiche créée");
        } else {
          this.error = "Erreur de création";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de création";
        this.loading = false;
        this.toastr.error(this.error);
      }
    })
  }

  //Modification de données
  update(_centres: centreanalytiqueModel){
    this.centreanalytiqueservice.update(_centres).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcentres();
          this.toastr.success("Fiche modifiée");
        } else {
          this.error = "Erreur de modification";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de modification";
        this.loading = false;
        this.toastr.error(this.error);
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

  modalUpdate(_object: centreanalytiqueModel){
    this.centre = _object;
    this.actionModal = "update";
    this.centreanalytiqueForm.reset();
    this.dispatchcentres(_object);
  }

  modalDelete(item: centreanalytiqueModel){
    this.deletecentre = item;
  }

  deleteConfirmed(){
    if(!this.deletecentre) return ;
    this.centreanalytiqueservice.delete(this.deletecentre.idcentreanalytique).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllcentres();
          this.toastr.success('Fiche supprimée');
        } else {
          this.error = "Erreur de Suppression";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Suppression échec";
        this.loading = false;
        this.toastr.error(this.error);

      }
    })
  }


  deleteMultiple(){
    for (let i = 0; i < this.objectsSelected.length; i++) {
      this.centreanalytiqueservice.delete(this.objectsSelected[i].idcentreanalytique).subscribe({})
    }
    this.toastr.success('Fiches supprimées');
    this.getAllcentres();
  }


  exportToExcel(): void {
    const element = document.getElementById('dataTable');
  
    if (!element) {
      console.error('Table non trouvée');
      return;
    }
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Evolution Budget': worksheet },
      SheetNames: ['Evolution Budget']
    };
  
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
  
    const data: Blob = new Blob(
      [excelBuffer],
      { type: 'application/octet-stream' }
    );
  
    saveAs(data, `Evolution_budget_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.xlsx`);
  }
      
  exportToCSV(): void {
    const element = document.getElementById('dataTable');
  
    if (!element) {
      console.error('Table non trouvée');
      return;
    }
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    
    // forcer le séparateur ;
    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ';'
    });
  
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });

    saveAs(blob, `centres_analytiques_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.csv`);
    this.toastr.success('Fiches exportées avec succès');
  }
  
  //Importation du plan comptable
  importCentre(event: any){
    const file = event.target.files[0];
    const info = {
      idsociete : this.user.idsociete,
      createdby : this.user.codeutilisateur
    }
    
    this.centreanalytiqueservice.importCentreAnalytique(file, info).subscribe({
      next: (res) => {
        if (res.success) {
          this.getAllcentres();
          this.toastr.success('Importation effectuée avec succès');
        } else {
          this.error = "Echec de l'importation";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de l'importation";
        this.loading = false;
        this.toastr.error(err);
      }
    })
  }
}
