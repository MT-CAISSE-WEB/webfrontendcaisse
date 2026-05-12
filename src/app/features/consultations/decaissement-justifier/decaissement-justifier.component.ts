import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConsultationDecaissementaj } from '../services/decaissementaj.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { TiersService } from '../../donnee_base/services/tiers.service';

@Component({
  selector: 'app-decaissement-justifier',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './decaissement-justifier.component.html',
  styleUrl: './decaissement-justifier.component.css'
})
export class DecaissementJustifierComponent implements OnInit {
  title = "Consultation des justificatifs";
  op: any = [];
  fb: FormBuilder = new FormBuilder();

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});

  msgErros : string = "";
  loading: Boolean = false;

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  tiers : tiersModel[] = [];

  constructor(private service: ConsultationDecaissementaj, private tiersservice: TiersService){}

  ngOnInit(): void{
    //Initialisation du formulaire
    this.initSearchForm();

    //Recharge des tiers
    this.getAllTiers();
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      typeoperation: ['decaissementaj'],
      tiers: [null],
      codeoperation: [null],
      datedebut: [null],
      datefin: [null]
    });
  }

  //Fermer le modal
  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  getAllTiers(){
    this.tiersservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.tiers = res.data;
        }
      }
    });
  }

  //Action submit
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
    this.closeModal('showModal');
    this.search(formValue);
  }

  search(data : any){
    this.service.getAlldecaissemenaj(data).subscribe({
      next : (res) => {
        this.op = res.data;
      },
      error : (err) => {}
    });
  }

  //User connect
  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  formatNumber(montant: number | string): string {
    if (montant === null || montant === undefined || montant === "") return "";
    const valeur = Number(montant);
    if (isNaN(valeur)) return "";

    return valeur
      .toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
  }

}
