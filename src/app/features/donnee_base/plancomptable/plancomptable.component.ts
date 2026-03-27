import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { plancomptableModel } from '../models/plancomptable.model';
import { societeModel } from '../models/societe.model';
import { PlancomptableService } from '../services/plancomptable.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ADD-INS
declare var $: any;


@Component({
  selector: 'app-plancomptable',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './plancomptable.component.html',
  styleUrl: './plancomptable.component.css' 
})

export class PlancomptableComponent implements OnInit{
  title = "Plan comptable";
  // params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  comptes : plancomptableModel[] = [];
  societes : societeModel[] = [];
  compte : plancomptableModel = new plancomptableModel();
  msgErros : string = "";
  loading: Boolean = false;
  plancomptableForm : FormGroup = this.fb.group({})

  //Faire le check selection **********
  objectsSelected : plancomptableModel[] = [];
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
  deleteCompte: any = null;

  ImportForm : FormGroup = this.fb.group({})

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;


  constructor(private plancomptableservice: PlancomptableService
    // private autreservice: AutreService,
    , private toastr : ToastrService
    , private router: Router){}

  ngOnInit(): void {
      //Afficher tous les comptes
      this.getAllComptes();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce compte");
      this.titleMsg = TITLE_DELETE;
  }


  getAllComptes(){
    this.plancomptableservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.comptes = res.data;
          this.filteredData = [...this.comptes];
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
    this.plancomptableForm = this.fb.group({
      numcompte : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      ventillable: [false],
      auxiliaire: [false],
      suivibudgetaire: [true],
      suivibudgetairemensuel: [false],
      idsociete : [this.user.idsociete, [Validators.required]],
      actif : [true],
      createdby : [this.user.codeutilisateur],
      updatedby : [this.user.codeutilisateur]
    })
  }

  get form() {
    return this.plancomptableForm.controls;
  }

  dispatchComptes(_object: plancomptableModel){
    const status = _object.actif === 1;
    this.plancomptableForm.patchValue({
      numcompte : _object.numcompte,
      libelle : _object.libelle,
      ventillable : _object.ventillable,
      auxiliaire : _object.auxiliaire,
      suivibudgetaire : _object.suivibudgetaire,
      suivibudgetairemensuel : _object.suivibudgetairemensuel,
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
  // isChecked(_id: string) {
  //   const ids: string[] = this.objectsSelected.map((el) => el.idcompte);
  //   return ids.includes(_id);
  // }

  isChecked(id: string): boolean {
    return this.selectedItems.some(x => x.idcompte === id);
  }

  handleSelectOne(item: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedItems.some(x => x.idcompte === item.idcompte)) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        x => x.idcompte !== item.idcompte
      );
    }
  }

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
    const controls = this.plancomptableForm.controls;
    if (this.plancomptableForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.plancomptableForm.value;

    const _comptes: plancomptableModel = {
      ...this.compte,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
      ventillable: formValue.ventillable ? 1 : 0,
      auxiliaire: formValue.auxiliaire ? 1 : 0,
      suivibudgetaire: formValue.suivibudgetaire ? 1 : 0,
      suivibudgetairemensuel: formValue.suivibudgetairemensuel ? 1 : 0,
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_comptes);
    else this.update(_comptes);
    // if (!_comptes.idcomptes) this.create(_comptes);
    // else this.update(_comptes);
  }

  //Enregistrement de données
  create(_comptes: plancomptableModel) {
    const {idcompte, ...dataToSend} = _comptes;
    this.loading = true;
    this.plancomptableservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllComptes();
          this.toastr.success('Fiche créée');

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
  update(_comptes: plancomptableModel){
    this.plancomptableservice.update(_comptes).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllComptes();
          this.toastr.success('Fiche modifée');
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

  modalview(_object: plancomptableModel){
    this.compte = _object;
    this.actionModal = "view";
    this.plancomptableForm.reset();
    this.dispatchComptes(_object);
  }

  modalUpdate(_object: plancomptableModel){
    this.compte = _object;
    this.actionModal = "update";
    this.plancomptableForm.reset();
    this.dispatchComptes(_object);
  }

  modalDelete(item: plancomptableModel){
    this.deleteCompte = item;
  }

  deleteConfirmed(){
    if(!this.deleteCompte) return ;
    this.plancomptableservice.delete(this.deleteCompte.idcompte).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.toastr.success('Fiche supprimée');
          this.getAllComptes();
        } else {
          this.error = "Erreur de Suppression";
        }
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Erreur lors de la suppression');
        this.error = "Suppression échec";
        this.loading = false;
      }
    })
  }

  deleteMultiple(){
    for (let i = 0; i < this.objectsSelected.length; i++) {
      this.plancomptableservice.delete(this.objectsSelected[i].idcompte).subscribe({})
    }
    this.toastr.success('Fiches supprimées');
    this.getAllComptes();
  }

    //Importation
  importPlanComptable(event: any){
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

    this.plancomptableservice.importPlanComptable(file, info).subscribe({
      next: (res) => {
        if (res.success) {
          this.getAllComptes();
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

    this.filteredData = this.comptes.filter(item =>
      item.numcompte?.toLowerCase().includes(term) ||
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
    this.getAllComptes();
  }


  exportData = {
  debut: null,
  fin: null,
  format: 'excel'
};

  exporter() {
    this.plancomptableservice.exportComptes(this.exportData).subscribe({
      next: (blob: Blob) => {

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        a.download = this.exportData.format === 'pdf'
          ? 'comptes.pdf'
          : 'comptes.xlsx';

        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error("Erreur export");
      }
    });
  }

}
