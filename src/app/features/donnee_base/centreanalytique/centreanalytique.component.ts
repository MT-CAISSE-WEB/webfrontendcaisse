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


  ImportForm : FormGroup = this.fb.group({})

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;


  constructor(private centreanalytiqueservice: CentreAnalytiqueService,
              private router: Router
            , private toastr : ToastrService){}

  ngOnInit(): void {
    //Afficher tous les centres
    this.getAllcentres();
    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce centre analytique");
    this.titleMsg = TITLE_DELETE;

    //Initialiser le formulaire du fichier d'import
    this.initImportForm();
}

  getAllcentres() {
    this.centreanalytiqueservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.centres = res.data;
          this.filteredData = [...this.centres];
          this.updatePagination();
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
  isChecked(id: string): boolean {
    return this.selectedItems.some(x => x.idnature === id);
  }

  handleSelectOne(item: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedItems.some(x => x.idnature === item.idnature)) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        x => x.idnature !== item.idnature
      );
    }
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checkAllRow = checked;

    if (checked) {
      this.objectsSelected = [...this.paginatedData]; // toutes les données filtrées
    } else {
      this.objectsSelected = [];
    }
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

  modalview(_object: centreanalytiqueModel){
    this.centre = _object;
    this.actionModal = "view";
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
  
  //Importation
  importCentre(event: any){
    const file = event.target.files[0];

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.ImportForm.patchValue({ file });
      this.ImportForm.get('file')?.updateValueAndValidity();
    }
  }

  //Création du formulaire d'importation
  initImportForm(): void{
    this.ImportForm = this.fb.group({
      file : [null, [Validators.required]],
    })
  }

  submitImportFile(input: HTMLInputElement): void {
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    const info = {
      idsociete : this.user.idsociete,
      createdby : this.user.codeutilisateur
    }
    console.log(info.createdby)

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

  // 🔎 Filtrer (Affectees)
  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    this.filteredData = this.centres.filter(item =>
      item.codecentreanalytique?.toLowerCase().includes(term) ||
      item.libelle?.toLowerCase().includes(term)
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  // 📄 Pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedData = this.filteredData.slice(start, end);

    console.log('Données paginées :', this.paginatedData);
  }

  // ▶ Page suivante
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  // ◀ Page précédente
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  actualiser(): void {
    this.getAllcentres();
  }

}
