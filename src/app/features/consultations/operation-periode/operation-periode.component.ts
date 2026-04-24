import { Component, OnInit } from '@angular/core';
import { ConsultationOpService } from '../services/operations.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { ToastrService } from 'ngx-toastr';
import { blob } from 'stream/consumers';


@Component({
  selector: 'app-operation-periode',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './operation-periode.component.html',
  styleUrl: './operation-periode.component.css'
})
export class OperationPeriodeComponent implements OnInit {
  title = "Journal de paiement";
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

  constructor(private service: ConsultationOpService, private caisseuserservice: AffectationCaisseService
    , private toastr : ToastrService,
  ){}

  ngOnInit(): void {
    //Initialisation du formulaire
    this.initSearchForm();

    //Liste des caisses de user
    this.getCaisseUser();
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      caisse: [''],
      datedebut: ['', Validators.required],
      datefin: ['', Validators.required],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite]
    });
  }

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
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
    this.closeModal('showModal');
    this.search(formValue);
  }

  search(data : any){
    this.service.getJournalpaiement(data).subscribe({
      next : (res) => {
        this.op = res.data.data;
      },
      error : (err) => {}
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getCaisseUser(){
    this.loading = true;
    this.caisseuserservice.getCaisseByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caissesUser = res.data || [];
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        //this.toastr.error('Erreur chargement caisses utilisateur');
      }
    });
  }


  // Autor : Richard Toulou
  // Impression du journal de caisse
  printJournalCaisse(): void {
    // Préparer les données pour l'impression
    const donnees = {
      idcaisse: this.searchForm.get('caisse')?.value || null,
      idsite: this.searchForm.get('idsite')?.value || null,
      datedebut: this.searchForm.get('datedebut')?.value || null,
      datefin: this.searchForm.get('datefin')?.value || null
    };

    this.service.printJournalCaisse(donnees).subscribe({
       next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error("Erreur d'impression du journal de caisse");
      }
    });
  }

}
