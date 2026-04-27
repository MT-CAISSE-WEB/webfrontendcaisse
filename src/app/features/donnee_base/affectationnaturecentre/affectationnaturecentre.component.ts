import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { affectationnaturecentreModel } from '../models/affectationnaturecentre.model';
import { AffectationNatureCentreService } from '../services/affectationnaturecentre.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { natureoperationModel } from '../models/natureoperation.model';
import { NatureoperationService } from '../services/natureoperation.service';
import { ToastrService } from 'ngx-toastr';
import { format } from 'node:path';

// ADD-INS
declare var $: any;

@Component({
  selector: 'app-affectationnaturecentre',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './affectationnaturecentre.component.html',
  styleUrl: './affectationnaturecentre.component.css'
})


export class AffectationNatureCentreComponent implements OnInit{
  title = "Affectation nature centre analytique";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  affectationnaturecentres : affectationnaturecentreModel[] = [];
  affectationnaturecentre : affectationnaturecentreModel = new affectationnaturecentreModel();
  msgErros : string = "";
  loading: Boolean = false;
  affectationnaturecentreForm : FormGroup = this.fb.group({});

  //Faire le check selection **********
  objectsSelected : affectationnaturecentreModel[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Changement titre modal
  actionModal: string = "create";

  natureoperations : natureoperationModel[] = [];
  

  nonAffectees: any[] = [];
  affectees: any[] = [];

  selectedLeft: any[] = [];
  selectedRight: any[] = [];
  natureoperationForm!: FormGroup;

  // Ajout pour fonctions de recherche et pagination
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchTerm: string = '';

  filteredDataNA: any[] = [];
  paginatedDataNA: any[] = [];
  searchTermNA: string = '';

  currentPage: number = 1;
  currentPageNA: number = 1;
  pageSize: number = 15;
  totalPages: number = 1;

  ImportForm : FormGroup = this.fb.group({})

  ExportForm : FormGroup = this.fb.group({})

  selectedNatureCode: string = '';

  exportData = {
    debut: this.selectedNatureCode || '',
    fin: this.selectedNatureCode || '',
    format: 'excel'
  };

  constructor( private AffectationNatureCentreService: AffectationNatureCentreService,
    private natureoperationservice: NatureoperationService,
    private router: Router
  , private toastr : ToastrService) {}


  ngOnInit(): void {

    this.natureoperationForm = this.fb.group({
      idnature : ["", Validators.required],
      idsociete : [this.user.idsociete, [Validators.required]],
      idsCentres: [[]]
    });

    this.getAllNatureoperations();

    // ✅ Écoute du changement de nature
    this.natureoperationForm.get('idnature')?.valueChanges.subscribe(idnature => {
      if (idnature) {
        this.getallAffectations(idnature);
        this.getOneNatureoperation(idnature);
      } else {
        this.affectees = [];
        this.nonAffectees = [];
      }
    });

    
    //Initialiser le formulaire du fichier d'import
    this.initImportForm();

  }

  getAllNatureoperations() {
    this.natureoperationservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.natureoperations = res.data;
          // filtrer sur les natures dont les comptes sont ventillables
          this.natureoperations = this.natureoperations.filter(nature => nature.compte.ventillable === 1);
        }
      }
    });
  }


  getallAffectations(idnature: string) {
    this.AffectationNatureCentreService.getAll(idnature).subscribe({
      next: (res) => {
        if (res.success) {
          this.affectees = res.data.centresaffectes;
          this.nonAffectees = res.data.centresnonaffectes;
          this.nonAffectees = this.nonAffectees.filter((centre) => centre.actif === 1);

          // Ajout pour fonctions de recherche et pagination
          this.filteredData = [...this.affectees];
          this.updatePagination();

          this.filteredDataNA = [...this.nonAffectees];
          this.updatePaginationNA();
        }
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  toggleSelection(list: any[], item: any, event: Event): any[] {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      // éviter doublon
      if (!list.some(x => x.idcentreanalytique === item.idcentreanalytique)) {
        return [...list, item];
      }
      return list;
    } else {
      return list.filter(x => x.idcentreanalytique !== item.idcentreanalytique);
    }
  }

  toggleLeft(item: any, event: Event): void {
    this.selectedLeft = this.toggleSelection(this.selectedLeft, item, event);
  }

  toggleRight(item: any, event: Event): void {
    this.selectedRight = this.toggleSelection(this.selectedRight, item, event);
  }


// Ajouter et retirer des affectations
// ------------------------------------
// Enregistrer les affectations
  save() {
    const idnature = this.natureoperationForm.get('idnature')?.value;

    const info = {
      idsociete: this.user.idsociete,
      createdby: this.user.prenom + ' ' + this.user.nom
    }

    if (!idnature) {
      return;
    }

    const idsCentres = this.affectees;

    this.AffectationNatureCentreService
      .saveAffectations(idnature, idsCentres, info)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Affectations enregistrées avec succès');
            this.getallAffectations(idnature);
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Erreur lors de l\'enregistrement des affectations');
        }
      });
  }

  add(): void {
    if (!this.selectedLeft.length) return;

    const idsExistants = new Set(this.affectees.map(a => a.idcentreanalytique));

    // Filtrer les nouveaux éléments à ajouter
    const nouveaux = this.selectedLeft.filter(item => !idsExistants.has(item.idcentreanalytique));

    // Ajouter en une seule fois
    this.affectees = [...this.affectees, ...nouveaux];

    // Retirer UNIQUEMENT ceux réellement ajoutés
    const idsAjoutes = new Set(nouveaux.map(i => i.idcentreanalytique));
    this.nonAffectees = this.nonAffectees.filter(x => !idsAjoutes.has(x.idcentreanalytique));

    // Reset sélection
    this.selectedLeft = [];

    // 🔎 Mise à jour pagination DROITE
    this.filteredData = [...this.affectees];
    this.currentPage = 1;
    this.updatePagination();

    // 🔎 Mise à jour pagination GAUCHE
    this.filteredDataNA = [...this.nonAffectees];
    this.currentPageNA = 1;
    this.updatePaginationNA();
  }

// Retirer des natures d'opérations au département
  remove(): void {

    if (!this.selectedRight.length) return;

    const idsExistants = new Set(this.nonAffectees.map(n => n.idcentreanalytique));

    // Nouveaux éléments à remettre à gauche
    const nouveaux = this.selectedRight.filter(item => !idsExistants.has(item.idcentreanalytique));

    // Ajouter à gauche
    this.nonAffectees = [...this.nonAffectees, ...nouveaux];

    // Supprimer UNIQUEMENT ceux réellement déplacés
    const idsSupprimes = new Set(nouveaux.map(i => i.idcentreanalytique));
    this.affectees = this.affectees.filter(x => !idsSupprimes.has(x.idcentreanalytique));

    // Reset sélection
    this.selectedRight = [];

    // 🔎 Mise à jour pagination DROITE
    this.filteredData = [...this.affectees];
    this.currentPage = 1;
    this.updatePagination();

    // 🔎 Mise à jour pagination GAUCHE
    this.filteredDataNA = [...this.nonAffectees];
    this.currentPageNA = 1;
    this.updatePaginationNA();
  }

// Ajouter toutes les natures d'opérations au département
  addAll(): void {

    // Utiliser un Set pour éviter les doublons (plus performant)
    const idsExistants = new Set(this.affectees.map(a => a.idcentreanalytique));

    const nouveaux = this.nonAffectees.filter(item => !idsExistants.has(item.idcentreanalytique));

    // Ajouter uniquement les nouveaux
    this.affectees = [...this.affectees, ...nouveaux];

    // Vider la liste non affectée
    this.nonAffectees = [];

    // Réinitialiser les sélections
    this.selectedLeft = [];
    this.selectedRight = [];

    // 🔎 Mettre à jour la recherche + pagination
    this.filteredData = [...this.affectees];
    this.filteredDataNA = [...this.nonAffectees];
    this.currentPage = 1;
    this.updatePagination();
    this.updatePaginationNA();
  }

// Déplace toutes les natures d'opérations affectées vers nonAffectees
  removeAll(): void {
    // Set pour éviter les doublons
    const idsExistants = new Set(this.nonAffectees.map(n => n.idcentreanalytique));

    const nouveaux = this.affectees.filter(item => !idsExistants.has(item.idcentreanalytique));

    // Ajouter dans non affectées
    this.nonAffectees = [...this.nonAffectees, ...nouveaux];
    this.filteredDataNA = [...this.nonAffectees];

    this.updatePaginationNA();

    // Vider la liste affectée
    this.affectees = [];

    // Réinitialiser les sélections
    this.selectedLeft = [];
    this.selectedRight = [];

    // 🔎 Mise à jour pagination + recherche
    this.filteredData = [];
    this.paginatedData = [];
    this.currentPage = 1;
    this.totalPages = 1;
  }


// Ajout pour fonctions de recherche et pagination

  // 🔎 Filtrer (Non affectées)
  applyFilterNA() {
    const term = this.searchTermNA.toLowerCase();

    this.filteredDataNA = this.nonAffectees.filter(item =>
      item.codecentreanalytique?.toLowerCase().includes(term) ||
      item.libelle?.toLowerCase().includes(term)
    );

    this.currentPage = 1;
    this.updatePaginationNA();
  }

  // 📄 Pagination
  updatePaginationNA() {
    this.totalPages = Math.ceil(this.filteredDataNA.length / this.pageSize);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.paginatedDataNA = this.filteredDataNA.slice(start, end);
  }

  // ▶ Page suivante
  nextPageNA() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginationNA();
    }
  }

  // ◀ Page précédente
  prevPageNA() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginationNA();
    }
  }

  // 🔎 Filtrer (Affectees)
  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    this.filteredData = this.affectees.filter(item =>
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

  abandonner(): void {
    const idnature = this.natureoperationForm.get('idnature')?.value;
    this.getallAffectations(idnature);
  }

  actualiser(): void {
    this.getAllNatureoperations();
    this.paginatedDataNA = [];
    this.paginatedData = [];
    this.selectedLeft = [];
    this.selectedRight = [];
    this.natureoperationForm.reset();
  }


  //Importation
  importAffectation(event: any){
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
      createdby : this.user.prenom + " " + this.user.nom
    };

    this.AffectationNatureCentreService.import_affectations(file, info).subscribe({
      next: (res) => {
        if (res.success) {
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


  // OK
  getOneNatureoperation(id: string){
    this.natureoperationservice.getOne(id).subscribe({
      next : (res) => {
        if(res.success){
          this.selectedNatureCode = res.data.codenature;
          this.exportData = {
            debut: this.selectedNatureCode || '',
            fin: this.selectedNatureCode || '',
            format: 'excel'
          };
        }
      }
    });
  }

  // OK
  exporter() {
    this.AffectationNatureCentreService.exportAffectations(this.exportData).subscribe({
      next: (blob: Blob) => {

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        a.download = this.exportData.format === 'pdf'
          ? 'Affectations_natures.pdf'
          : 'Affectations_natures.xlsx';

        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error("Erreur export");
      }
    });
  }

}
