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
import { ConsultationOpService } from '../../../../features/consultations/services/operations.service';
import { APP_ROOT_DMD_DECAISSEMENT, APP_ROOT_OPERATION_GENERAL } from '../../../../_core/routes/frontend.root';
import { DemandeService } from '../../../../features/demande/services/demande.service';
import { EnteteDemande } from '../../../../features/demande/models/entete-demande.model';



@Component({
  selector: 'app-interface-caissier',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './interface-caissier.component.html',
  styleUrl: './interface-caissier.component.css'
})
export class InterfaceCaissierComponent implements OnInit{
  root_operation = APP_ROOT_OPERATION_GENERAL;
  root_demande_decaissement = APP_ROOT_DMD_DECAISSEMENT;
  caisseSolde : any;
  msgErros: string = "";
  error: string = "";
  loading: boolean = false;
  loadingDmd: boolean = false;

  // Définissez des propriétés de pagination
  currentPageL: number = 1;
  currentPageH: number = 1;

  // Nombre d'éléments par page
  totalPagesL: number = 0;
  totalPagesH: number = 0;
  limitL: number = 6;
  limitH: number = 6;

  //Valeurs des operations
  operationGlobal: any[] = [];
  totalEncaissementGlobal = 0;
  totalDecaissementGlobal = 0;
  totalDemandesPayeesJour = 0;

  totalEncaissementJour = 0;
  totalDecaissementJour = 0;

  pourcentageEncaissementJour = 0;
  pourcentageDecaissementJour = 0;
  ratioDemandesJour = 0;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  loadingCaisses: boolean = false;
  loadingHistory: boolean = false;
  loadingLast: boolean = false;

  //Caisse du caissier
  caissesDuCaissier: any[] = [];

  opLast: any = [];
  opHistory : any = [];
  caisseperiodes : any[] = [];
  params : any = {};

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  entetesDmd: EnteteDemande[] = [];

  // tout sélectionné/désélectionné
  allSelected = false;

  objectsSelected : EnteteDemande[] = [];
  selectedItems : any[] = [];

  caissier : boolean = false;

  constructor(private caisseservice: CaisseService,private caisseStatusService: CaissePeriodeService,
      private caisseuserservice: AffectationCaisseService
      , private toastr : ToastrService
      , private service: ConsultationOpService
      , private demandeService: DemandeService,
      
    ){}


  ngOnInit(): void {
    //Charger les périodes caisses
    this.getcaissesPeriodes();
    //Charger les caisses du caissier et ses soldes
    this.getCaisseUser();

    this.loadAllDemandes();
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
            this.caissesDuCaissier = this.caissesUser.map(c => c.idcaisse);
            this.params.caisses = this.caissesDuCaissier;

            //Chargement des paiements de caisses
            this.getAllOp();
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

  //Filter les operations de la caisse du caissier
  filtrerOperationsDuCaissier(operations: any[], caissesDuCaissier: any[]): any[] {
    return operations.filter(op =>
      caissesDuCaissier.includes(op.idcaisse)
    );
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
          console.log(this.caisseperiodes)
          if(this.caisseperiodes.length > 0){
            this.params.date = this.formatDateInput(new Date(this.caisseperiodes[0].dernierePeriode.dateperiode));
          }
          this.loadingCaisses = false;
        }
      },
      error : (err) => {
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
    return this.formatCFA(this.getEntree(item));
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
        if(res.success){
          this.opLast = res.data.data;
          this.totalPagesL = res.data.totalPages;
          this.loadingLast = false;
        }else{
          this.loadingLast = false;
        }
      },
      error : (err) => {
        this.loadingLast = false ;
      }
    });
  }

  getAllOp(){
    this.loadingLast = true;
    const params = {}
    this.service.getAllpayment(params).subscribe({
      next : (res) => {
        if(res.success){
          this.operationGlobal = res.data.data || [];
          if(this.operationGlobal.length != 0) this.calculerIndicateurs() ;
          this.loadingLast = false ;
        }else{
          this.loadingLast = false ;
        }
      },
      error : (err) => {
        console.log(err)
        this.loadingLast = false ;
      }
    });
  }

  //Calcul des indicateurs
  calculerIndicateurs() {
    const jour = this.formatDateInput(new Date(this.caisseperiodes[0].dernierePeriode.dateperiode));

    //Filtrer les operations du caissier
    const operations = this.filtrerOperationsDuCaissier(this.operationGlobal, this.caissesDuCaissier);
    
    // Filtrer les opérations du jour
    const operationsJour = operations.filter(o =>
      o.dateoperation.startsWith(jour)
    );

    // Grouper par demande
    const demandesMap = new Map<string, number>();

    const demandesGlobalMap = new Map<string, number>();

    operationsJour.forEach(o => {
      if (!o.iddemande) return;

      const montant = o.decaissement || 0;
      if (demandesMap.has(o.iddemande)) {
        demandesMap.set(
          o.iddemande,
          demandesMap.get(o.iddemande)! + montant
        );
      } else {
        demandesMap.set(o.iddemande, montant);
      }
    });

    operations.forEach(o => {
      if (!o.iddemande) return;

      const montant = o.decaissement || 0;

      if (demandesGlobalMap.has(o.iddemande)) {
        demandesGlobalMap.set(
          o.iddemande,
          demandesGlobalMap.get(o.iddemande)! + montant
        );
      } else {
        demandesGlobalMap.set(o.iddemande, montant);
      }
    });

    const totalDemandesGlobal = Array.from(demandesGlobalMap.values())
      .reduce((sum, m) => sum + m, 0);

    //Total des demandes payées
    this.totalDemandesPayeesJour = Array.from(demandesMap.values())
      .reduce((sum, m) => sum + m, 0);

    //Totaux globaux
    this.totalEncaissementGlobal = operations.reduce(
      (sum, o) => sum + o.encaissement, 0
    );

    this.totalDecaissementGlobal = operations.reduce(
      (sum, o) => sum + o.decaissement, 0
    );

    //Totaux du jour
    this.totalEncaissementJour = operations
      .filter(o => o.dateoperation.startsWith(jour))
      .reduce((sum, o) => sum + o.encaissement, 0);

    this.totalDecaissementJour = operations
      .filter(o => o.dateoperation.startsWith(jour))
      .reduce((sum, o) => sum + o.decaissement, 0);

    //Pourcentages
    this.pourcentageEncaissementJour =
      this.totalEncaissementGlobal > 0
        ? (this.totalEncaissementJour / this.totalEncaissementGlobal) * 100
        : 0;

    this.pourcentageDecaissementJour =
      this.totalDecaissementGlobal > 0
        ? (this.totalDecaissementJour / this.totalDecaissementGlobal) * 100
        : 0;

    this.ratioDemandesJour =
      totalDemandesGlobal > 0
        ? (this.totalDemandesPayeesJour / totalDemandesGlobal) * 100
        : 0;
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

  // afficher toutes les demandes
  loadAllDemandes() {
    this.loadingDmd = true;
    const params = {
      page: this.currentPage,
      limit: 30,
      search: '',
      date: '',
      status: '',
      user: this.user.idutilisateur,
    };
    this.demandeService.getAllEntetes(params).subscribe({
      next : (res) => {
        if(res.success){
          // this.entetesDmd = res.data.data;
           this.entetesDmd = res.data.data.map((item: any) => ({
            ...item,
          }));

          // filtre statut validé
            this.entetesDmd = this.entetesDmd.filter((d: any) => d.statut === 3 && d.decaisse === 0);
            
          this.totalPages = res.data.totalPages;
          this.loadingDmd = false;
        }else{
          this.loadingDmd = false;
          this.toastr.error("Erreur de récuperation des données");
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message);
        this.loadingDmd = false;
      }
    });
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.loadAllDemandes(); // recharge les données
  }

  getTotalDemande(demande: EnteteDemande): number {
    return demande.lignes.reduce((sum, l) => sum + l.montantdemande, 0);
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.iddemande);
    return ids.includes(_id);
  }

  iscaissier (): boolean {
    if (typeof window !== 'undefined') {
          const user =JSON.parse(localStorage.getItem('user') || '{}') ;
      for (let index = 0; index < user.roles.length; index++) {
          const element = user.roles[index];
          if (element['code'] ==='04')
              {
                  this.caissier = true;  
              }
      }
    }
     return  this.caissier;
  }

}