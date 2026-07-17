import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CaisseService } from '../../caisse_journal/services/caisse.service';
import { ConsultationOpService } from '../services/operations.service';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';

export interface JournalEncaissement {
  jour: string; // 'YYYY-MM-DD'
  caisses: CaisseEncaissement[];
}

export interface CaisseEncaissement {
  idcaisse: number;
  codecaisse: string;
  libellecaisse: string;
  devise: Devise;
  operations: OperationEncaissement[];
}

export interface Devise {
  iddevise: number;
  code: string;
  libelle: string;
}

export interface OperationEncaissement {
  idoperation: number;
  codeoperation: string;
  dateoperation: string;
  beneficiaire: string;
  montantoperation: number;
  tauxoperation: number;
  montantreference: number;
  montantcaisse: number;
  deviseoperation: Devise;
  lignes: LigneEncaissement[];
}

export interface LigneEncaissement {
  idligneoperation: number;
  libelle: string;
  montant: number;
  comptabilise: boolean;
  nature: { idnature: number; code: string; libelle: string };
  centre: { idcentre: number; code: string; libelle: string };
  tiers: { idtiers: number; code: string; nom: string };
}

@Component({
  selector: 'app-encaissement-operation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './encaissement-operation.component.html',
  styleUrl: './encaissement-operation.component.css'
})

export class EncaissementOperationComponent implements OnInit {

  private caisseUserService = inject(AffectationCaisseService);
  caissesUser: any[] = [];
  
  // Liste des caisses pour le select
  caissesList: any[] = [];
  // Résultat
  journal: JournalEncaissement[] = [];
  loading = false;
  hasSearched = false;

  // Formulaire
  filterForm: FormGroup;

  // Regroupement choisi (par défaut on affiche tout)
  expandedDays: Set<string> = new Set();
  expandedCaisses: Set<string> = new Set();

  constructor(
    private fb: FormBuilder,
    private encaissementService: ConsultationOpService,
    private caisseService: CaisseService,
    private toastr: ToastrService
  ) {
    this.filterForm = this.fb.group({
      selectedCaisse: ['all'],   // valeur par défaut : toutes les caisses
      datedebut: [''],
      datefin: ['']
    });
  }

  ngOnInit(): void {
    this.loadCaissesUser();
  }


  // ========== RECHERCHE ==========
  search() {
    const formValue = this.filterForm.value;
  if (!formValue.datedebut || !formValue.datefin) {
    this.toastr.warning('Veuillez sélectionner une période');
    return;
  }

  let idcaisses: string[];

  if (formValue.selectedCaisse === 'all') {
    idcaisses = this.caissesList.map(item => item.caisse.idcaisse);
  } else if (formValue.selectedCaisse?.caisse) {
    idcaisses = [formValue.selectedCaisse.caisse.idcaisse];
  } else {
    this.toastr.warning('Veuillez sélectionner une caisse valide');
    return;
  }

  this.loading = true;
  this.hasSearched = true;
  this.encaissementService.getJournalEncaissements(idcaisses, formValue.datedebut, formValue.datefin)
      .subscribe({
        next: (res: any) => {
          this.journal = res.success ? res.data : [];
          console.log('Journal chargé :', this.journal);
          if (!res.success) this.toastr.error(res.message || 'Erreur inconnue');
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement du journal');
          this.loading = false;
        }
      });
  }
  // Gestion de l'expand/collapse
  toggleDay(jour: string) {
    this.expandedDays.has(jour) ? this.expandedDays.delete(jour) : this.expandedDays.add(jour);
  }

  toggleCaisse(jour: string, idcaisse: number) {
    const key = `${jour}-${idcaisse}`;
    this.expandedCaisses.has(key) ? this.expandedCaisses.delete(key) : this.expandedCaisses.add(key);
  }

  isDayExpanded(jour: string): boolean {
    return this.expandedDays.has(jour);
  }

  isCaisseExpanded(jour: string, idcaisse: number): boolean {
    return this.expandedCaisses.has(`${jour}-${idcaisse}`);
  }

  // User
  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // ========== CHARGEMENT DES CAISSES ==========
  // Dans loadAllCaisses()
private loadAllCaisses(): void {
  this.caisseService.getAll().subscribe({
    next: (res: any) => {
      if (res.success) {
        // On filtre les caisses actives et on encapsule dans { caisse: ... }
        const rawCaisses = res.data.data.filter((c: any) => c.actif === 1);
        this.caissesList = rawCaisses.map((c: any) => ({ caisse: c }));
        console.log('Caisses chargées :', this.caissesList);
      } else {
        this.toastr.error('Impossible de charger toutes les caisses');
      }
    },
    error: () => this.toastr.error('Erreur lors du chargement des caisses')
  });
}


private loadCaissesUser(): void {
  this.caisseUserService.getCaisseByUser(this.user.idutilisateur ?? null)
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.caissesUser = res.data || [];
          if (this.user.typeentitesociete == 1) {
            this.loadAllCaisses();
          } else {

            this.caissesList = this.caissesUser
              .filter((c: any) => c.actif === 1)
              .map(c => ({ caisse: c }));
          }
        } else {
          this.toastr.error('Erreur de chargement des caisses utilisateur');
        }
      },
      error: () => this.toastr.error('Erreur de chargement des caisses utilisateur')
    });
}

}
