import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { SuiviBudgetService } from '../services/suivibudget.service';

@Component({
  selector: 'app-suivibudget',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './suivibudget.component.html',
  styleUrl: './suivibudget.component.css'
})


export class SuiviBudgetComponent implements OnInit{
  title = "Evolution budgetaire";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  msgErros : string = "";
  loading: Boolean = false;

  //Faire le check selection **********
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  evolutionbudget : any[] = [];





  constructor( private SuiviBudgetService: SuiviBudgetService,
    private router: Router) {}


  ngOnInit(): void {

    // this.natureoperationForm = this.fb.group({
    //   idnature: ["", Validators.required],
    //   idsociete : [this.user.idsociete, [Validators.required]],
    //   idsCentres: [[]]
    // });

    this.getAllEvolBudget();

    // ✅ Écoute du changement de nature
    // this.natureoperationForm.get('idnature')?.valueChanges.subscribe(idnature => {
    //   if (idnature) {
    //     this.getallAffectations(idnature);
    //   }
    };
  


  getAllEvolBudget() {
    this.SuiviBudgetService.getEvolBudget().subscribe({
      next: (res) => {
        if (res.success) {
          this.evolutionbudget = res.data.data;
        }
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

}
