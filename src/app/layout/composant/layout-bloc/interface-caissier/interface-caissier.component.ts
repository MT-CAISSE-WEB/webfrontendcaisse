import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { CaissePeriodeService } from '../../../../features/caisse_journal/services/caisseperiode.service';
import { CaisseService } from '../../../../features/caisse_journal/services/caisse.service';
import { ToastrService } from 'ngx-toastr';
import { OperationService } from '../../../../features/operations/service/operation.service';
import { AffectationCaisseModel } from '../../../../features/caisse_journal/models/affectationcaisse.model';
import { AffectationCaisseService } from '../../../../features/caisse_journal/services/affectationcaisse.service';
import { ConsultationService } from '../../../../features/consultations/services/operations.service';
import { APP_ROOT_OPERATION_GENERAL } from '../../../../_core/routes/frontend.root';

@Component({
  selector: 'app-interface-caissier',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './interface-caissier.component.html',
  styleUrl: './interface-caissier.component.css'
})
export class InterfaceCaissierComponent implements OnInit{
  root_operation = APP_ROOT_OPERATION_GENERAL;
  caisseSolde : any;
  msgErros: string = "";
  error: string = "";
  loading: boolean = false;

  // Définissez des propriétés de pagination
  currentPageL: number = 1;
  currentPageH: number = 1;

  // Nombre d'éléments par page
  totalPagesL: number = 0;
  totalPagesH: number = 0;
  limitL: number = 6;
  limitH: number = 6;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  loadingCaisses: boolean = false;
  loadingHistory: boolean = false;
  loadingLast: boolean = false;

  opLast: any = [];
  opHistory : any = [];
  caisseperiodes : any[] = [];
  params : any = {};

  constructor(private caisseservice: CaisseService,private caisseStatusService: CaissePeriodeService,
      private caisseuserservice: AffectationCaisseService, private toastr : ToastrService, private service: ConsultationService){}


  ngOnInit(): void {
    //Charger les périodes caisses
    this.getcaissesPeriodes();
    //Charger les caisses du caissier et ses soldes
    this.getCaisseUser();
    //Chargement des paiements de caisses
    // this.getAllpayment();
  }

  //Récuperer les soldes
  getSoldeCaisse(){
    this.caisseservice.getSolde().subscribe({
      next : (res) => {
        if(res.success){
          this.caisseSolde = res.data ;
          this.caisseSolde = this.caisseSolde.filter((cs: any) =>
              this.caissesUser.some(cu => cu.idcaisse === cs.idcaisse)
            );
        }
      }
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getCaisseUser(){
    this.loadingCaisses = true;
    this.caisseuserservice.getCaisseByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caissesUser = res.data || [];
          if(this.caissesUser.length > 0){
            const caisse_ = this.caissesUser.map(c => c.idcaisse);
            this.params.caisses = caisse_;
          }
          this.getSoldeCaisse();
          //Get data 
          this.sendParams();
        }
      },
      error: (err) => {
        this.loadingCaisses = false;
        this.toastr.error(err.error.message);
      }
    });
  }

  getSolde(item: any): number {
    return (Number(item?.soldeinitialisation) || 0) + (Number(item?.solde) || 0);
  }

  getcaissesPeriodes(){
    this.loadingCaisses = true;
    this.caisseuserservice.getCaissePeriodeByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caisseperiodes = res.data;
          if(this.caisseperiodes.length > 0){
            this.params.date = this.formatDateInput(new Date(this.caisseperiodes[0].dernierePeriode.dateperiode));
          }
          this.loadingCaisses = false;
        }
      },
      error : (err) => {
        console.log(err);
        this.toastr.error(err.error.message);
      }
    });
  }

  calculSolde(item: any): string {
    return this.formatCFA(this.getSolde(item));
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  getEntree(item: any): number {
    return (Number(item?.soldeinitialisation) || 0) + (Number(item?.encaissement) || 0);
  }

  calculEntree(item: any): string {
    return this.formatCFA(this.getSolde(item));
  }

  getCaisseClass(item: any[]): string {
    const nbr = item.length;

    if (nbr == 1){
      return 'col-xl-4 col-md-6';
    }

    if (nbr == 2){
      return 'col-xl-4 col-md-6';
    }

    if (nbr > 2){
      return 'col-xl-4 col-md-4';
    }

    return 'col-xl-3 col-md-6';
  }

  getSoldeClass(item: any): string {
    const solde = this.getSolde(item);
    const seuil = Number(item?.seuilmnimal) || 0;

    if (solde == 0){
      return 'bx bx-dollar-circle text-danger';
    }

    if (solde == seuil){
      return 'bx bx-dollar-circle text-warning';
    }

    if (solde > seuil){
      return 'bx bx-dollar-circle text-success';
    }

    return 'bx bx-dollar-circle text-info';
  }
  
  getLastOperation(data : any){
    data.page = this.currentPageL;
    data.limit = this.limitL;
    this.loadingLast = true ;
    this.service.getLastOperation(data).subscribe({
      next : (res) => {
        this.opLast = res.data.data;
        this.totalPagesL = res.data.totalPages;
        this.loadingLast = false;
      },
      error : (err) => {
        this.loadingLast = true ;
      }
    });
  }

  getAllpayment(){
    this.service.getAllpayment().subscribe({
      next : (res) => {
        console.log(res);
      },
      error : (err) => {
        this.loadingLast = true ;
      }
    });
  }

  getHistoryOperation(data : any){
    data.page = this.currentPageH;
    data.limit = this.limitH;
    this.loadingHistory = true ;
    this.service.getHistoryOperation(data).subscribe({
      next : (res) => {
        this.opHistory = res.data.data;
        this.totalPagesH = res.data.totalPages;
        this.loadingHistory = false ;
      },
      error : (err) => {
        this.loadingHistory = true ;
      }
    });
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  sendParams(){
    //Dernières opérations
    this.getLastOperation(this.params);
    //Historiques opérations
    this.getHistoryOperation(this.params);
  }

  formatDateFR(dateInput: string | Date): string {
    const date = new Date(dateInput);

    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(date)
      .replace('.', '');

    const day = date.getDate();
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(date)
      .replace('.', '');

    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  //Recharger la page des dernieres données 
  changePageLast(page: number) {
    this.currentPageL = page;
    this.getLastOperation(this.params); // recharge les données
  }

  //Recharger la table des historiques
  changePageHistory(page: number) {
    this.currentPageH = page;
    this.getHistoryOperation(this.params); // recharge les données
  }

}
