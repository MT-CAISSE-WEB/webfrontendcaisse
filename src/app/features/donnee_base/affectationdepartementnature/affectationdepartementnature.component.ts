import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { affectationdepartementnatureModel } from '../models/affectationdepartementnature.model';
import { AffectationDepartementNatureService } from '../services/affectationdepartementnature.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } 
from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { departementmodel } from '../../structure/model/departement.model';
import { departementservice } from '../../structure/service/departement.service';
import { ToastrService } from 'ngx-toastr';


// ADD-INS
declare var $: any;

@Component({
  selector: 'app-affectationdepartementnature',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './affectationdepartementnature.component.html',
  styleUrl: './affectationdepartementnature.component.css'
})


export class AffectationDepartementNatureComponent implements OnInit{
  title = "Affectation département nature";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  affectationdepartementnatures : affectationdepartementnatureModel[] = [];
  affectationdepartementnature : affectationdepartementnatureModel = new affectationdepartementnatureModel();
  msgErros : string = "";
  loading: Boolean = false;
  affectationdepartementnatureForm : FormGroup = this.fb.group({});
  //Faire le check selection **********
  objectsSelected : affectationdepartementnatureModel[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Changement titre modal
  actionModal: string = "create";

  departements : departementmodel[] = [];
  

  nonAffectees: any[] = [];
  affectees: any[] = [];

  selectedLeft: any[] = [];
  selectedRight: any[] = [];
  departementForm!: FormGroup;


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


  constructor( private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private departementservice: departementservice,
    private router: Router
  , private toastr : ToastrService) {}


  ngOnInit(): void {

    this.departementForm = this.fb.group({
      iddepartement: ["", Validators.required],
      idsociete : [this.user.idsociete, [Validators.required]],
      idsNatures: [[]]
    });

    this.getAllDepartements();

    // ✅ Écoute du changement de departement
    this.departementForm.get('iddepartement')?.valueChanges.subscribe(iddepartement => {
      if (iddepartement) {
        this.getallAffectations(iddepartement);
      } else {
        this.affectees = [];
        this.nonAffectees = [];
      }
    });
  }


  getAllDepartements() {
    this.departementservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.departements = res.data;
        }
      }
    });
  }


  getallAffectations(iddepartement: string) {
    this.AffectationDepartementNatureService.getAll(iddepartement).subscribe({
      next: (res) => {
        if (res.success) {
          this.affectees = res.data.naturesaffectes;
          this.nonAffectees = res.data.naturesnonaffectes;

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
      if (!list.some(x => x.idnature === item.idnature)) {
        return [...list, item];
      }
      return list;
    } else {
      return list.filter(x => x.idnature !== item.idnature);
    }
  }

  toggleLeft(item: any, event: Event): void {
    this.selectedLeft = this.toggleSelection(this.selectedLeft, item, event);
  }

  toggleRight(item: any, event: Event): void {
    this.selectedRight = this.toggleSelection(this.selectedRight, item, event);
  }

  add(): void {
    if (!this.selectedLeft.length) return;

    const idsExistants = new Set(this.affectees.map(a => a.idnature));

    // Filtrer les nouveaux éléments à ajouter
    const nouveaux = this.selectedLeft.filter(item => !idsExistants.has(item.idnature));

    // Ajouter en une seule fois
    this.affectees = [...this.affectees, ...nouveaux];

    // Retirer UNIQUEMENT ceux réellement ajoutés
    const idsAjoutes = new Set(nouveaux.map(i => i.idnature));
    this.nonAffectees = this.nonAffectees.filter(x => !idsAjoutes.has(x.idnature));

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

    const idsExistants = new Set(this.nonAffectees.map(n => n.idnature));

    // Nouveaux éléments à remettre à gauche
    const nouveaux = this.selectedRight.filter(item => !idsExistants.has(item.idnature));

    // Ajouter à gauche
    this.nonAffectees = [...this.nonAffectees, ...nouveaux];

    // Supprimer UNIQUEMENT ceux réellement déplacés
    const idsSupprimes = new Set(nouveaux.map(i => i.idnature));
    this.affectees = this.affectees.filter(x => !idsSupprimes.has(x.idnature));

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
    const idsExistants = new Set(this.affectees.map(a => a.idnature));

    const nouveaux = this.nonAffectees.filter(item => !idsExistants.has(item.idnature));

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
    const idsExistants = new Set(this.nonAffectees.map(n => n.idnature));

    const nouveaux = this.affectees.filter(item => !idsExistants.has(item.idnature));

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


// Enregistrer les affectations
  save() {
    const iddepartement = this.departementForm.get('iddepartement')?.value;

    if (!iddepartement) {
      return;
    }

    const idsNatures = this.affectees;

    this.AffectationDepartementNatureService
      .saveAffectations(iddepartement, idsNatures)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Affectations enregistrées avec succès');
            this.getallAffectations(iddepartement);
          }
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Erreur lors de l\'enregistrement des affectations');
        }
      });
  }

  // Ajout pour fonctions de recherche et pagination

    // 🔎 Filtrer (Non affectées)
  applyFilterNA() {
    const term = this.searchTermNA.toLowerCase();

    this.filteredDataNA = this.nonAffectees.filter(item =>
      item.codenature?.toLowerCase().includes(term) ||
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
    const iddepartement = this.departementForm.get('iddepartement')?.value;
    this.getallAffectations(iddepartement);
  }

  actualiser(): void {
    this.getAllDepartements();
    this.paginatedDataNA = [];
    this.paginatedData = [];
    this.selectedLeft = [];
    this.selectedRight = [];
    this.departementForm.reset();
  }


  exportData = {
    debut: null,
    fin: null,
    format: 'excel'
};

  exporter() {
    this.AffectationDepartementNatureService.exportAffectations(this.exportData).subscribe({
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
