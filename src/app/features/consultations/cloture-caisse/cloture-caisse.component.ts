import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AffectationCaisseModel } from '../../caisse_journal/models/affectationcaisse.model';
import { ConsultationOpService } from '../services/operations.service';
import { AffectationCaisseService } from '../../caisse_journal/services/affectationcaisse.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';
import { ExcelService } from '../../../_core/services/exportExcel.service';

@Component({
  selector: 'app-cloture-caisse',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './cloture-caisse.component.html',
  styleUrl: './cloture-caisse.component.css'
})
export class ClotureCaisseComponent implements OnInit {
  title = "Etat cloture caisse";
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

  totalFermeture : any = 0;
  totalPhysique : any = 0;
  totalEcart : any = 0;

  tableau_cloture = [
    { header: 'Journee', field: 'date' },
    { header: 'Caisse', field: 'caisse.libelle' },
    { header: 'Devise', field: 'devise' },
    { header: 'Solde ouverture', field: 'soldes.ouverture' },
    { header: 'Solde fermeture', field: 'soldes.fermeture' },
    { header: 'Montant physique', field: 'numsoldes.physique' },
    { header: 'Ecart', field: 'soldes.ecart' },
    { header: 'Statut', field: 'statut' },
    { header: 'Date cloture', field: 'validation.date' }
  ];

  constructor(private service: ConsultationOpService, private caisseuserservice: AffectationCaisseService
      , private toastr : ToastrService, private excelService : ExcelService
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
      idcaisse: ['', Validators.required],
      datedebut: ['', Validators.required],
      datefin: ['', Validators.required],
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
        this.toastr.error('Erreur chargement caisses utilisateur');
      }
    });
  }

  search(data : any){
    this.service.getEtatcloture(data).subscribe({
      next : (res) => {
        if(res.success){
          this.op = res.data.data;
          this.calculateTotals();
        }
      },
      error : (err) => {
        this.loading = false;
        this.toastr.error('Erreur ', err);
      }
    });
  }

  calculateTotals() {
    const data = this.op;

    this.totalFermeture = data.reduce(
      (sum: any, l: { soldes: { fermeture: any; }; }) => sum + (l.soldes.fermeture || 0),
      0
    );

    this.totalPhysique = data.reduce(
      (sum: any, l: { soldes: { physique: any; }; }) => sum + (l.soldes.physique || 0),
      0
    );

    this.totalEcart = data.reduce(
      (sum: number, l: { soldes: { physique: any; fermeture: any; }; }) =>
        sum + ((l.soldes.physique || 0) - (l.soldes.fermeture || 0)),
      0
    );
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  hasData(): boolean {
    return Array.isArray(this.op) && this.op.length > 0;
  }

  onExportExcel() {
    if (!this.hasData()) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    //export
    this.excelService.exportToExcel(this.op, this.tableau_cloture, 'etatCloture');
  }

  onPrintPDF() {
    if (!this.hasData()) {
      this.toastr.warning('Aucune donnée à imprimer');
      return;
    }

    //impression pdf
    //this.generatePDF();
  }

  // Impression du journal de caisse
  printJournalCaisse(): void {
    // Préparer les données pour l'impression
    const donnees = {
      idcaisse: this.searchForm.get('idcaisse')?.value || null,
      datedebut: this.searchForm.get('datedebut')?.value || null,
      datefin: this.searchForm.get('datefin')?.value || null
    };

    this.service.printEtatcloture(donnees).subscribe({
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
