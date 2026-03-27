import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { natureoperationModel } from '../models/natureoperation.model';
import { NatureoperationService } from '../services/natureoperation.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { PlancomptableService } from '../services/plancomptable.service';
import { plancomptableModel } from '../models/plancomptable.model';

import { ToastrService } from 'ngx-toastr';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


// ADD-INS
declare var $: any;

@Component({
  selector: 'app-natureoperation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './natureoperation.component.html',
  styleUrl: './natureoperation.component.css' 
})

export class NatureoperationComponent implements OnInit{
  title = "Natures d'operations";
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

  ImportForm : FormGroup = this.fb.group({})

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;


  constructor(private natureoperationservice: NatureoperationService, 
    private plancomptableservice: PlancomptableService,
              private router: Router
              , private toastr : ToastrService
            ){}

  ngOnInit(): void {
      //Afficher tous les natureoperations
      this.getAllNatureoperations();
      this.getAllComptes();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette nature d'operation");
      this.titleMsg = TITLE_DELETE;

      //Initialiser le formulaire du fichier d'import
      this.initImportForm();
  }

  getAllNatureoperations(){
    this.natureoperationservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = res.data;
          this.filteredData = [...this.natureoperations];
          this.updatePagination();
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

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }


  //création du formulaire
  initForm(): void{
    this.natureoperationForm = this.fb.group({
      codenature : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      decajustifier : [false],
      imputationtiers : [false],
      demandedecaissement : [true],
      typeoperation : ["", [Validators.required]],
      idsociete : [this.user.idsociete, [Validators.required]],
      idcompte : ["", [Validators.required]],
      actif : [true],
      createdby : [this.user.codeutilisateur],
      updatedby : [this.user.codeutilisateur]
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
      typeoperation : _object.typeoperation,
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
    if(this.actionModal == "create")
      this.create(_natureoperations);
    else 
      this.update(_natureoperations);
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
          this.toastr.success('Fiche créée avec succès');
        } else {
          this.error = "Erreur de création";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de création";
        this.loading = false;
        this.toastr.error(err);
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
          this.toastr.success('Fiche modifée avec succès');
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

  modalUpdate(_object: natureoperationModel){
    this.natureoperation = _object;
    this.actionModal = "update";
    this.natureoperationForm.reset();
    this.dispatchNatureoperations(_object);
  }

  modalview(_object: natureoperationModel){
    this.natureoperation = _object;
    this.actionModal = "view";
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
          this.toastr.success('Fiche supprimée avec succès');
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
      this.natureoperationservice.delete(this.objectsSelected[i].idnature).subscribe({})
    }
    this.toastr.success('Fiches supprimées');
    this.getAllNatureoperations();
  }
  
  
  //Importation
  importNatureOperation(event: any){
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

    this.natureoperationservice.importNatureOperation(file, info).subscribe({
      next: (res) => {
        if (res.success) {
          this.getAllNatureoperations();
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

    this.filteredData = this.natureoperations.filter(item =>
      item.codenature?.toLowerCase().includes(term) ||
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
    this.getAllNatureoperations();
  }


  exportData = {
    debut: null,
    fin: null,
    format: 'excel'
  };
  
  exporter() {
    this.natureoperationservice.exportNatures(this.exportData).subscribe({
      next: (blob: Blob) => {

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        a.download = this.exportData.format === 'pdf'
          ? 'Liste_natures.pdf'
          : 'Liste_natures.xlsx';

        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error("Erreur export");
      }
    });
  }

}
