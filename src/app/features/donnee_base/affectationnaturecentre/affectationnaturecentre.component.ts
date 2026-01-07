import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { affectationnaturecentreModel } from '../models/affectationnaturecentre.model';
import { AffectationNatureCentreService } from '../services/affectationnaturecentre.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

import { natureoperationModel } from '../models/natureoperation.model';
import { NatureoperationService } from '../services/natureoperation.service';

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

  


  constructor( private AffectationNatureCentreService: AffectationNatureCentreService,
    private natureoperationservice: NatureoperationService,
    private router: Router) {}


  ngOnInit(): void {

    this.natureoperationForm = this.fb.group({
      idnature: ["", Validators.required],
      idsociete : [this.user.idsociete, [Validators.required]],
      idsCentres: [[]]
    });

    this.getAllNatureoperations();

    // ✅ Écoute du changement de nature
    this.natureoperationForm.get('idnature')?.valueChanges.subscribe(idnature => {
      if (idnature) {
        this.getallAffectations(idnature);
      } else {
        this.affectees = [];
        this.nonAffectees = [];
      }
    });
  }


  getAllNatureoperations() {
    this.natureoperationservice.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.natureoperations = res.data;
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
        }
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }


  toggleLeft(item: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedLeft.push(item);
    } else {
      this.selectedLeft = this.selectedLeft.filter(
        x => x.idcentreanalytique !== item.idcentreanalytique
      );
    }
  }


  toggleRight(item: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedRight.push(item);
    } else {
      this.selectedRight = this.selectedRight.filter(
        x => x.idcentreanalytique !== item.idcentreanalytique
      );
    }
  }


// Ajouter et retirer des affectations
// ------------------------------------
// Ajouter des centres analytiques à la nature d'opération
  add() {
    this.selectedLeft.forEach(item => {

      // éviter les doublons
      if (!this.affectees.some(a => a.idcentreanalytique === item.idcentreanalytique)) {
        this.affectees = [...this.affectees, item];
      }

      this.nonAffectees = this.nonAffectees
        .filter(x => x.idcentreanalytique !== item.idcentreanalytique);
    });

    this.selectedLeft = [];
  }


// Retirer des centres analytiques de la nature d'opération
  remove() {
    this.selectedRight.forEach(item => {

      if (!this.nonAffectees.some(n => n.idcentreanalytique === item.idcentreanalytique)) {
        this.nonAffectees = [...this.nonAffectees, item];
      }

      this.affectees = this.affectees
        .filter(x => x.idcentreanalytique !== item.idcentreanalytique);
    });

    this.selectedRight = [];
  }


// Ajouter tous les centres analytiques à la nature d'opération
// Déplace tous les centres NON affectés vers affectees
  addAll() {
    this.nonAffectees.forEach(item => {
      // Évite les doublons
      if (!this.affectees.some(a => a.idcentreanalytique === item.idcentreanalytique)) {
        this.affectees.push(item);
      }
    });

    // Vide la liste non affectée
    this.nonAffectees = [];

    // Vider la sélection si besoin
    this.selectedLeft = [];
    this.selectedRight = [];
  }


  // Déplace tous les centres affectés vers nonAffectees
  removeAll() {
    this.affectees.forEach(item => {
      if (!this.nonAffectees.some(n => n.idcentreanalytique === item.idcentreanalytique)) {
        this.nonAffectees.push(item);
      }
    });

    // Vide la liste affectée
    this.affectees = [];

    // Vider la sélection
    this.selectedLeft = [];
    this.selectedRight = [];
  }


// Enregistrer les affectations
  save() {
    const idnature = this.natureoperationForm.get('idnature')?.value;

    if (!idnature) {
      return;
    }

    const idsCentres = this.affectees;

    this.AffectationNatureCentreService
      .saveAffectations(idnature, idsCentres)
      .subscribe({
        next: (res) => {
          if (res.success) {
            console.log('Affectations enregistrées');
            this.getallAffectations(idnature);
          }
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

}
