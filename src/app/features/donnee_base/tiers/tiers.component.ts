import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { tiersModel } from '../models/tiers.model';
import { TiersService } from '../services/tiers.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


// ADD-INS
declare var $: any;

@Component({
  selector: 'app-tiers',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tiers.component.html',
  styleUrl: './tiers.component.css' 
})

export class TiersComponent implements OnInit{
  title = "Tiers";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  tiers : tiersModel[] = [];
  tier : tiersModel = new tiersModel();
  msgErros : string = "";
  loading: Boolean = false;
  tiersForm : FormGroup = this.fb.group({})

  //Faire le check selection **********
  objectsSelected : tiersModel[] = [];
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
  deleteTiers: any = null;

  ImportForm : FormGroup = this.fb.group({})

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;


  constructor(private tiersservice: TiersService,
              private router: Router
            , private toastr : ToastrService
          ){}

  ngOnInit(): void {
      //Afficher tous les tiers
      this.getAllTiers();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce tiers");
      this.titleMsg = TITLE_DELETE;
  }

  getAllTiers(){
    this.tiersservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.tiers = res.data;
          this.filteredData = [...this.tiers];
          this.updatePagination();
        }
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //création du formulaire
  initForm(): void{
    this.tiersForm = this.fb.group({
      codetiers : ["", [Validators.required]],
      designation : ["", [Validators.required]],
      typetiers : ["", [Validators.required]],
      idsociete : [this.user.idsociete, [Validators.required]],
      actif : [true],
      createdby : [this.user.prenom + " " + this.user.nom],
      updatedby : [this.user.prenom + " " + this.user.nom]
    })
  }

  get form() {
    return this.tiersForm.controls;
  }

  dispatchTiers(_object: tiersModel){
    const status = _object.actif === 1;
    this.tiersForm.patchValue({
      codetiers : _object.codetiers,
      designation : _object.designation,
      typetiers : _object.typetiers,
      idsociete : _object.idsociete,
      codesociete : _object.societe.societe_codesociete,
      raisonsociale : _object.societe.societe_raisonsociale,
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
    const controls = this.tiersForm.controls;
    if (this.tiersForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.tiersForm.value;

    const _tiers: tiersModel = {
      ...this.tier,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
       
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_tiers);
    else this.update(_tiers);
    // if (!_tiers.idtiers) this.create(_tiers);
    // else this.update(_tiers);
  }

  //Enregistrement de données
  create(_tiers: tiersModel) {
    const {idtiers, ...dataToSend} = _tiers;
    this.loading = true;
    this.tiersservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllTiers();
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
        this.toastr.error(this.error);
      }
    })
  }

  //Modification de données
  update(_tiers: tiersModel){
    this.tiersservice.update(_tiers).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllTiers();
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

  modalUpdate(_object: tiersModel){
    this.tier = _object;
    this.actionModal = "update";
    this.tiersForm.reset();
    this.dispatchTiers(_object);
  }

  modalview(_object: tiersModel){
    this.tier = _object;
    this.actionModal = "view";
    this.tiersForm.reset();
    this.dispatchTiers(_object);
  }

  modalDelete(item: tiersModel){
    this.deleteTiers = item;
  }

  deleteConfirmed(){
    if(!this.deleteTiers) return ;
    this.tiersservice.delete(this.deleteTiers.idtiers).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllTiers();
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

  // Suppression multiple
  deleteMultiple(){
    for (let i = 0; i < this.objectsSelected.length; i++) {
      this.tiersservice.delete(this.objectsSelected[i].idtiers).subscribe({})
    }
    this.getAllTiers();
    this.toastr.success('Fiches supprimées');
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
  
    saveAs(data, `Liste_Tiers_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.xlsx`);
  }
    
  exportToCSV(): void {
    const element = document.getElementById('dataTable');
  
    if (!element) {
      console.error('Table non trouvée');
      return;
    }
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    
    // 🔥 forcer le séparateur ;
    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ';'
    });
  
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });

    saveAs(blob, `Liste_Tiers_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.csv`);
  }

  //Importation des tiers
  importTiers(event: any){
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
      idsociete : this.user.idsociete[0],
      createdby : this.user.prenom + " " + this.user.nom
    }

  this.tiersservice.importTiers(file, info).subscribe({
    next: (res) => {
      if (res.success) {
        this.getAllTiers();
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

    this.filteredData = this.tiers.filter(item =>
      item.codetiers?.toLowerCase().includes(term) ||
      item.designation?.toLowerCase().includes(term)
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
    this.getAllTiers();
  }

  exportData = {
  debut: null,
  fin: null,
  typetiers: null,
  format: 'excel'
};

  exporter() {
    this.tiersservice.exportTiers(this.exportData).subscribe({
      next: (blob: Blob) => {

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        a.download = this.exportData.format === 'pdf'
          ? 'Liste_Tiers.pdf'
          : 'Liste_Tiers.xlsx';

        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error("Erreur export");
      }
    });
  }

}
