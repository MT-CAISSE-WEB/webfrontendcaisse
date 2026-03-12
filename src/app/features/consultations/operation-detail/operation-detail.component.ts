import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { ConsultationOpService } from '../services/operations.service';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';

@Component({
  selector: 'app-operation-detail',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './operation-detail.component.html',
  styleUrl: './operation-detail.component.css'
})
export class OperationDetailComponent implements OnInit {
  title = "Detail operation";
  op: any = [];
  fb: FormBuilder = new FormBuilder();

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});

  msgErros : string = "";
  loading: Boolean = false;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;

  constructor(private service: ConsultationOpService, private caisseuserservice: AffectationCaisseService){}
  
  ngOnInit(): void {
    //Initialisation du formulaire
    this.initSearchForm();

    // Liste des éléments
    //this.getJournalpaiement();

    //Liste des caisses de user
    //this.getCaisseUser();
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      numero: [''],
      montantmin: [''],
      montantmax: [''],
      nature: [''],
      centre: [''],
      tiers: [''],
      datedebut: [''],
      datefin: [''],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite]
    });
  }

  //Utilisateur connecté
  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
  }

  search(data : any){
    this.service.getDetailoperation(data).subscribe({
      next : (res) => {
        console.log(res);
        this.op = res.data;
      },
      error : (err) => {}
    });
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    const controls = this.searchForm.controls;
    if (this.searchForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      //this.toastr.warning(this.msgErros);
      return;
    }

    /** 2. prepare data */
    const formValue = this.searchForm.value;
    console.log(formValue);
    this.search(formValue);
  }

}
