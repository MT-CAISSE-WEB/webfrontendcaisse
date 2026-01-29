import { Component, OnInit } from '@angular/core';
import { APP_ROOT_OPERATION_GENERAL } from '../../../_core/routes/frontend.root';
import { RouterLink, RouterModule } from '@angular/router';
import { caissePeriodeModel } from '../../../features/caisse_journal/models/periodecaisse.model';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AffectationCaisseModel } from '../../../features/caisse_journal/models/affectationcaisse.model';
import { CaisseService } from '../../../features/caisse_journal/services/caisse.service';
import { AffectationCaisseService } from '../../../features/caisse_journal/services/affectationcaisse.service';
import { CaissePeriodeService } from '../../../features/caisse_journal/services/caisseperiode.service';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { OperationService } from '../../../features/operations/service/operation.service';
import { ToastrService } from 'ngx-toastr';
import { InterfaceCaissierComponent } from "../layout-bloc/interface-caissier/interface-caissier.component";
import { InterfaceUserComponent } from "../layout-bloc/interface-user/interface-user.component";

@Component({
  selector: 'app-layout-content',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule, InterfaceCaissierComponent, InterfaceUserComponent],
  templateUrl: './layout-content.component.html',
  styleUrl: './layout-content.component.css'
})
export class LayoutContentComponent implements OnInit{
  root_operation = APP_ROOT_OPERATION_GENERAL;
  caisseperiodes : any[] = [];
  fb: FormBuilder = new FormBuilder();
  caisseperiodeForm : FormGroup = this.fb.group({});
  msgErros: string = "";
  error: string = "";
  loading: boolean = false;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  loadingCaisses = false;
  class : string = "";
  dateInput: string = "";

  //Caisse solde
  caisseSolde : any = [];

  constructor(private caisseuserservice: AffectationCaisseService, private caisseservice: CaisseService,private caisseStatusService: CaissePeriodeService,
    private operationservice: OperationService, private toastr : ToastrService
  ){}

  ngOnInit(): void {
    this.caisseperiodeForm = this.fb.group({
        dateperiode: [''],   //
        caisses: this.fb.array([])
      });

    //Charger les caisses de l'utilisateur 
    this.getCaisseUser();

    //Ramener les soldes de caisses 
    this.getSoldeCaisse();
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getcaissesPeriodes(){
    this.loadingCaisses = true;
    this.caisseuserservice.getCaissePeriodeByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caisseperiodes = res.data;
          if(this.caisseperiodes.length != 0){
            this.caisseperiodeForm.patchValue({
              dateperiode : this.formatDateInput(new Date(this.caisseperiodes[0].dernierePeriode.dateperiode))
            });
          }
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

  getCaisseUser(){
    this.loadingCaisses = true;
    this.caisseuserservice.getCaisseByUser(this.user.idutilisateur ?? null).subscribe({
      next : (res) => {
        if(res.success){
          this.caissesUser = res.data;
          if (this.caissesUser.length > 0) {
            this.getcaissesPeriodes();
          }else {
            this.loadingCaisses = false;
            this.toastr.warning("Aucune caisse affectée à l\'utilisateur");
          }
        }
      },
      error: (err) => {
        this.loadingCaisses = false;
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

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  //Récuperer les soldes
  getSoldeCaisse(){
    this.operationservice.getSoldeCaisse().subscribe({
      next : (res) => {
        if(res.success){
          this.caisseSolde = res.data;
          console.log(this.caisseperiodes[0].dernierePeriode?.dateperiode);
        }
      }
    });
  }

  //Les colonnes
  getColClass(): string {
    const count = this.caisseSolde.length;
    if (count === 1) return 'col-lg-12 col-md-12';
    if (count === 2) return 'col-lg-6 col-md-6';
    if (count === 3) return 'col-lg-4 col-md-6';
    if (count >= 4) return 'col-lg-6 col-md-6';

    return 'col-lg-4 col-md-6';
  }

  get caissesArray(): FormArray<FormGroup> {
    return this.caisseperiodeForm.get("caisses") as FormArray<FormGroup>;
  }

  isJourneeOuverte(): boolean {
    return this.caisseperiodes.some(
      p => p.dernierePeriode.statut?.toLowerCase() === "ouverte"
    );
  }

  reloadPage() {
    setTimeout(() => {
      window.location.reload();
    }, 300);
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

    this.reloadPage();
  }

  closeCaisse(iduser : string, caisses: any) {
    this.caisseservice.close(iduser, caisses).subscribe({
      next: (res) => {
        this.error = res.success ? "Caisse clôturée" : "Erreur de clôture";
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    });
  }

  openCaisse(iduser: string, caisses: any){
    this.caisseservice.open(iduser, caisses).subscribe({
      next: (res) => {
        if (res.success) {
          this.error = "Caisse ouverte";
        } else {
          this.error = "Erreur de modification";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Modification échec";
        this.loading = false;
      }
    })
  }

  checkSameDatePeriodes() {
    if (!this.caisseperiodes || this.caisseperiodes.length === 0) return null;
    const firstDate = this.caisseperiodes[0].dateperiode;
    const allSame = this.caisseperiodes.every(
      p => p.dateperiode === firstDate
    );

    return allSame ? firstDate : null;
  }

  dateDujour(){
    const sameDate = this.checkSameDatePeriodes();
    this.dateInput = this.formatDateFR(sameDate);
    if (sameDate) {
      this.caisseperiodeForm.patchValue({
        dateperiode: this.formatDateForInput(sameDate)
      });
    }
  }

  formatDateFR(dateInput: string | null): string {
    if (!dateInput) return '';
    
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

  formatDateForInput(date: string) {
    return date ? date.substring(0, 10) : "";
  }

}
