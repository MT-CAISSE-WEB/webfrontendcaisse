import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { banqueModel } from '../models/banque.model';
import { BanqueService } from '../services/banque.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { PlancomptableService } from '../services/plancomptable.service';
import { plancomptableModel } from '../models/plancomptable.model';

import { sitemodel } from '../../structure/model/site.model';
import { siteservice } from '../../structure/service/site.service';
import { deviseservice } from '../donnee_base/service/devise.service';

import { ToastrService } from 'ngx-toastr';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { devisemodel } from '../donnee_base/model/devise.model';


// ADD-INS
declare var $: any;

@Component({
  selector: 'app-banque',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './banque.component.html',
  styleUrl: './banque.component.css' 
})

export class BanqueComponent implements OnInit{
  title = "Banques";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  banques : banqueModel[] = [];
  banque : banqueModel = new banqueModel();
  msgErros : string = "";
  loading: Boolean = false;
  banqueForm : FormGroup = this.fb.group({})

  //Faire le check selection **********
  objectsSelected : banqueModel[] = [];
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
  deletebanque : any = null;

  comptes : plancomptableModel[] = [];
  sites : sitemodel[] = [];
  devises : devisemodel[] = [];
 
  ImportForm : FormGroup = this.fb.group({})

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;


  constructor(private banqueservice: BanqueService, 
    private plancomptableservice: PlancomptableService
              , private router: Router
              , private toastr : ToastrService
              , private site : siteservice,
              private deviseservice : deviseservice
            ){}

  ngOnInit(): void {
      //Afficher tous les banques
      this.getAllbanques();
      this.getAllComptes();
      this.getAllSites();
      this.getAllDevises();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette banque");
      this.titleMsg = TITLE_DELETE;

      //Initialiser le formulaire du fichier d'import
      this.initImportForm();
  }

  getAllbanques(){
    this.banqueservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.banques = res.data;
          this.filteredData = [...this.banques];
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
          // Filter les comptes commençant par 52
          this.comptes = this.comptes.filter(compte => compte.numcompte.startsWith('52'));
        }
      }
    });
  }

  getAllSites(){
    this.site.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.sites = res.data;
        }
      }
    });
  }

  getAllDevises(){
    this.deviseservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.devises = res.data;
        }
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }


  //création du formulaire
  initForm(): void{
    this.banqueForm = this.fb.group({
      codebanque : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      numerocompte : ["", [Validators.required]],
      iban : ["", [Validators.required]],
      swift : ["", [Validators.required]],
      solde_initial : [0, [Validators.required]],
      solde_actuel : [0, [Validators.required]],
      idsociete : [this.user.idsociete, [Validators.required]],
      idsite : ["", [Validators.required]],
      idcompte : ["", [Validators.required]],
      iddevise : ["", [Validators.required]],
      actif : [true],
      createdby : [this.user.codeutilisateur],
      updatedby : [this.user.codeutilisateur]
    })
  }

  get form() {
    return this.banqueForm.controls;
  }

  dispatchbanques(_object: banqueModel){
    const status = _object.actif === 1;
    this.banqueForm.patchValue({
      codebanque : _object.codebanque,
      libelle : _object.libelle,
      numerocompte : _object.numerocompte,
      iban : _object.iban,
      swift : _object.swift,
      solde_initial : _object.solde_initial,
      solde_actuel : _object.solde_actuel,
      idsociete: _object.idsociete,
      idsite : _object.idsite,
      idcompte : _object.idcompte,
      iddevise : _object.iddevise,
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
    return this.selectedItems.some(x => x.idbanque === id);
  }

  handleSelectOne(item: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedItems.some(x => x.idbanque === item.idbanque)) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        x => x.idbanque !== item.idbanque
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
    const controls = this.banqueForm.controls;
    if (this.banqueForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.banqueForm.value;

    const _banques: banqueModel = {
      ...this.banque,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
    };

    /** 3. choices action */
    if(this.actionModal == "create")
      this.create(_banques);
    else 
      this.update(_banques);
  }

  //Enregistrement de données
  create(_banques: banqueModel) {
    const {idbanque, ...dataToSend} = _banques;
    this.loading = true;
      console.log(dataToSend);
    this.banqueservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllbanques();
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
  update(_banques: banqueModel){
    this.banqueservice.update(_banques).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllbanques();
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

  modalUpdate(_object: banqueModel){
    this.banque = _object;
    this.actionModal = "update";
    this.banqueForm.reset();
    this.dispatchbanques(_object);
  }

  modalview(_object: banqueModel){
    this.banque = _object;
    this.actionModal = "view";
    this.banqueForm.reset();
    this.dispatchbanques(_object);
  }


  modalDelete(item: banqueModel){
    this.deletebanque = item;
  }

  deleteConfirmed(){
    if(!this.deletebanque) return ;
    this.banqueservice.delete(this.deletebanque.idbanque).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllbanques();
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
      this.banqueservice.delete(this.objectsSelected[i].idbanque).subscribe({})
    }
    this.toastr.success('Fiches supprimées');
    this.getAllbanques();
  }
  
  
  //Importation
  importbanque(event: any){
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

    this.banqueservice.importBanques(file, info).subscribe({
      next: (res) => {
        if (res.success) {
          this.getAllbanques();
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

    this.filteredData = this.banques.filter(item =>
      item.codebanque?.toLowerCase().includes(term) ||
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
    this.getAllbanques();
  }


  exportData = {
    debut: null,
    fin: null,
    format: 'excel'
  };
  
  exporter() {
    this.banqueservice.exportBanques(this.exportData).subscribe({
      next: (blob: Blob) => {

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        a.download = this.exportData.format === 'pdf'
          ? 'Liste_banques.pdf'
          : 'Liste_banques.xlsx';

        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error("Erreur export");
      }
    });
  }

}
