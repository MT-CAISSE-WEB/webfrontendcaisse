import { Component, OnInit } from '@angular/core';
import { caisseModel } from '../../../features/caisse_journal/models/caisse.model';
import { CaisseService } from '../../../features/caisse_journal/services/caisse.service';
import { caissePeriodeModel } from '../../../features/caisse_journal/models/periodecaisse.model';
import { forkJoin, map, Observable } from 'rxjs';
import { CaissePeriodeService } from '../../../features/caisse_journal/services/caisseperiode.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { AffectationCaisseModel } from '../../../features/caisse_journal/models/affectationcaisse.model';
import { AffectationCaisseService } from '../../../features/caisse_journal/services/affectationcaisse.service';
import { ToastrService } from 'ngx-toastr';
import { APP_ROOT_PARAMETREPAGE_PARAMETRE } from '../../../_core/routes/frontend.root';
import { Route, Router, RouterLink, RouterModule } from '@angular/router';
import { OperationService } from '../../../features/operations/service/operation.service';
import { LoaderService } from '../../../_core/utils/loaders.service';

@Component({
  selector: 'app-layout-header',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, RouterModule],
  templateUrl: './layout-header.component.html',
  styleUrl: './layout-header.component.css'
})
export class LayoutHeaderComponent implements OnInit {
  
  root_changepassword = 'app/administration/changepassword';
  caisserecent : caissePeriodeModel = new caissePeriodeModel();
  caisseperiodes : any[] = [];
  fb: FormBuilder = new FormBuilder();
  caisseperiodeForm : FormGroup = this.fb.group({});
  msgErros: string = "";
  error: string = "";
  loading: boolean = false;
  caisseSolde : any;

  //Liste des routes
  root_parametre = APP_ROOT_PARAMETREPAGE_PARAMETRE;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  loadingCaisses = false;

  caissesStatuses: { [id: string]: string } = {};

  constructor(private caisseuserservice: AffectationCaisseService, private caisseservice: CaisseService, private router: Router, private loader: LoaderService,
    private caisseStatusService: CaissePeriodeService, private caisseService: CaisseService, private toastr : ToastrService,){}

  ngOnInit(): void {
    //récuperer les caisses de l'utilisateur
    this.caisseperiodeForm = this.fb.group({
      caisses: this.fb.array([])
    });

    this.getCaisseUser();
  }

  get caisseStatus() {
    return this.caisseStatusService;
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
  
  logout (){
    localStorage.clear();
  }

  getCaisseUser(){
    this.loadingCaisses = true;
    this.caisseuserservice.getCaisseByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caissesUser = res.data;
          if (this.caissesUser.length > 0) {
            //this.getCaissesPerdiodes();
            this.getcaissesPeriodes();
            //Charger les soldes
            this.getSoldeCaisse();
          }else {
            this.loadingCaisses = false;
            //this.toastr.warning("Aucune caisse affectée à l\'utilisateur");
          }
        }
      },
      error: (err) => {
        this.loadingCaisses = false;
        this.toastr.error(err.error.message);
      }
    });
  }

  reloadPage() {
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  //Récuperer les soldes
  getSoldeCaisse(){
    this.caisseService.getSolde().subscribe({
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

  getSolde(item: any): number {
    return (Number(item?.soldeinitialisation) || 0) + (Number(item?.solde) || 0);
  }

  calculSolde(item: any): string {
    return this.formatCFA(this.getSolde(item));
  }

  getSoldeClass(item: any): string {
    const solde = this.getSolde(item);
    const seuil = Number(item?.seuilmnimal) || 0;

    if (solde == 0){
      return 'text-danger';
    }

    if (solde == seuil){
      return 'text-warning';
    }

    if (solde > seuil){
      return 'text-success';
    }

    return 'text-muted';
  }

  getCaisseClass(item: FormArray<FormGroup<any>>): string {
    const nbr = item.length;

    if (nbr == 1){
      return 'col-xl-12 col-md-12';
    }

    if (nbr == 2){
      return 'col-xl-6 col-md-6 col-sm-6';
    }

    if (nbr > 2){
      return 'col-xl-4 col-md-4';
    }

    return 'col-xl-3 col-md-6';
  }

  //Récuperer les caisses périodes
  getcaissesPeriodes(){
    this.loadingCaisses = true;
    this.caisseuserservice.getCaissePeriodeByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caisseperiodes = res.data;
          this.initForm();
          this.loadingCaisses = false;
        }else{
          this.toastr.error("Echec de récupération de la période")
        }
      },
      error : (err) => {
        this.toastr.error(err.error.message);
      }
    });
  }

  initForm(){
    this.caissesArray.clear(); // si rechargement
    this.caisseperiodes.forEach(c => {
      this.caissesArray.push(
        this.fb.group({
          idperiode: [c.dernierePeriode.idperiode],
          idcaisse: [c.caisse.idcaisse],
          statut: [c.dernierePeriode.statut],
          dateperiode: [c.dernierePeriode.dateperiode],
          caisse: [c.caisse]
      }));
    });
  }

  get caissesArray(): FormArray<FormGroup> {
    return this.caisseperiodeForm.get("caisses") as FormArray<FormGroup>;
  }

  openCaisseUser(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.caisseperiodeForm.controls;
    if (this.caisseperiodeForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.caisseperiodeForm.value;

    const _caisse = {
      ...formValue,
    };

    if (this.isJourneeOuverte()) {
      this.closeCaisse(this.user.idutilisateur, _caisse.caisses);   // Journée ouverte → fermer
    } else {
      this.openCaisse(this.user.idutilisateur, _caisse.caisses);    // Journée fermée → ouvrir
    }

    //Chargement de la page
    this.reloadPage()
  }

  openCaisse(iduser: string, caisses: any){
    this.caisseservice.open(iduser, caisses).subscribe({
      next: (res) => {
        if (res.success) {
          this.error = "Caisse ouverte";
          this.toastr.info("Ouverture de la journée")
        } else {
          this.toastr.error("Erreur serveur des données")
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Modification échec";
        this.loading = false;
        this.toastr.error("Erreur serveur des données", err.error.message)
      }
    })
  }

  formatDate(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  isJourneeOuverte(): boolean {
    return this.caisseperiodes.some(
      p => p.dernierePeriode.statut?.toLowerCase() === "ouverte"
    );
  }

  isJourneeCloturee(): boolean {
    return this.caisseperiodes.some(
      p => p.dernierePeriode.statut?.toLowerCase() === "cloturee"
    );
  }

  isJourneeValide(): boolean {
    return this.caisseperiodes.some(
      p => p.statut?.toLowerCase() === "validee"
    );
  }

  actionJournee() {
    if (this.isJourneeOuverte()) {
      //this.closeCaisseUser();     // journée déjà ouverte → on la clôture
    } else {
      this.openCaisseUser();      // journée fermée → on l’ouvre
    }
  }

  closeCaisse(iduser : string, caisses: any) {
    this.caisseservice.close(iduser, caisses).subscribe({
      next: (res) => {
        res.success ? this.toastr.info("Fermeture de la journée") : this.toastr.error("Erreur serveur de données");
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    });
  }

  handleCaisseAction() {
    /** Vérification du formulaire */
    this.msgErros = '';
    const controls = this.caisseperiodeForm.controls;

    if (this.caisseperiodeForm.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** Récupération des données */
    const formValue = this.caisseperiodeForm.value;
    const caisses = formValue.caisses;

    /** Décision */
    if (this.isJourneeOuverte()) {
      this.closeCaisse(this.user.idutilisateur, caisses);   // Journée ouverte → fermer
    } else {
      this.openCaisse(this.user.idutilisateur, caisses);    // Journée fermée → ouvrir
    }
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

    return `${dayShort} ${day} ${month} ${year}`;
  }
}