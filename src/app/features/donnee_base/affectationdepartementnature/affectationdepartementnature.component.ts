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

  


  constructor( private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private departementservice: departementservice,
    private router: Router) {}


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
        x => x.idnature !== item.idnature
      );
    }
  }


  toggleRight(item: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedRight.push(item);
    } else {
      this.selectedRight = this.selectedRight.filter(
        x => x.idnature !== item.idnature
      );
    }
  }


// Ajouter et retirer des affectations
// ------------------------------------
// Ajouter des natures d'opérations au département
  add() {
    this.selectedLeft.forEach(item => {

      // éviter les doublons
      if (!this.affectees.some(a => a.idnature === item.idnature)) {
        this.affectees = [...this.affectees, item];
      }

      this.nonAffectees = this.nonAffectees
        .filter(x => x.idnature !== item.idnature);
    });

    this.selectedLeft = [];
  }


// Retirer des centres analytiques de la nature d'opération
  remove() {
    this.selectedRight.forEach(item => {

      if (!this.nonAffectees.some(n => n.idnature === item.idnature)) {
        this.nonAffectees = [...this.nonAffectees, item];
      }

      this.affectees = this.affectees
        .filter(x => x.idnature !== item.idnature);
    });

    this.selectedRight = [];
  }


// Ajouter toutes les natures d'opérations au département
// Déplace toutes les natures d'opérations non affectées vers affectees
  addAll() {
    this.nonAffectees.forEach(item => {
      // Évite les doublons
      if (!this.affectees.some(a => a.idnature === item.idnature)) {
        this.affectees.push(item);
      }
    });

    // Vide la liste non affectée
    this.nonAffectees = [];

    // Vider la sélection si besoin
    this.selectedLeft = [];
    this.selectedRight = [];
  }

// Déplace toutes les natures d'opérations affectées vers nonAffectees
  removeAll() {
    this.affectees.forEach(item => {
      if (!this.nonAffectees.some(n => n.idnature === item.idnature)) {
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
    const iddepartement = this.departementForm.get('iddepartement')?.value;

    console.log(iddepartement);

    if (!iddepartement) {
      return;
    }

    const idsNatures = this.affectees;

    this.AffectationDepartementNatureService
      .saveAffectations(iddepartement, idsNatures)
      .subscribe({
        next: (res) => {
          if (res.success) {
            console.log('Affectations enregistrées');
            this.getallAffectations(iddepartement);
          }
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

}
