import { Component, OnInit } from '@angular/core';
import { APP_ROOT_OPERATION_GENERAL } from '../../../_core/routes/frontend.root';
import { RouterModule } from '@angular/router';
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
import { DENOMINATION_BILLETAGE } from '../../../_core/constantes/tableau.data';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-layout-content',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule, InterfaceCaissierComponent, InterfaceUserComponent, NgbModalModule],
  templateUrl: './layout-content.component.html',
  styleUrl: './layout-content.component.css'
})
export class LayoutContentComponent implements OnInit{
  root_operation = APP_ROOT_OPERATION_GENERAL;
  caisseperiodes : any[] = [];
  //fb: FormBuilder = new FormBuilder();
  caisseperiodeForm : any;
  msgErros: string = "";
  error: string = "";
  loading: boolean = false;

  //Liste de caisse utilisateur
  caissesUser: AffectationCaisseModel[] = [];
  loadingCaisses = false;
  class : string = "";
  dateInput: string = "";

  billetageForm!: FormGroup;

  denominations: any = DENOMINATION_BILLETAGE;
  modalRef: any;

  //Caisse solde
  caisseSolde : any = [];

  activeTab = 0;
  billetageValidated: boolean = false; // pour savoir si le billetage est validé
  validatedCaisseIndex: number | null = null; // indice de la caisse validée
  billetageValidatedIndexes: number[] = []; // indices des caisses validées

  constructor(private fb: FormBuilder, private modalService: NgbModal, private caisseuserservice: AffectationCaisseService, private caisseservice: CaisseService,private caisseStatusService: CaissePeriodeService,
    private toastr : ToastrService
  ){}

  ngOnInit(): void {
    this.caisseperiodeForm = this.fb.group({
        dateperiode: [''],   //
        caisses: this.fb.array([])
    });

    this.billetageForm = this.fb.group({
      caissesBillet: this.fb.array([])
    });

    //Charger les caisses de l'utilisateur 
    this.getCaisseUser();

    //Ramener les soldes de caisses 
    // this.getSoldeCaisse();
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
            //Charger les soldes
            this.getSoldeCaisse();
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
    this.caisseservice.getSolde().subscribe({
      next : (res) => {
        if(res.success){
          this.caisseSolde = res.data;
          this.caisseSolde = this.caisseSolde.filter((cs: any) =>
              this.caissesUser.some(cu => cu.idcaisse === cs.idcaisse)
          );
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

  initBilletageForm(caisses:any[]){
    const caissesArray = this.billetageForm.get('caissesBillet') as FormArray;
    caissesArray.clear();

    caisses.forEach(c=>{
      const deviseData = this.denominations[c.caisse.codedevise];
      const billetsArray = this.fb.array<FormGroup>([]);
      const piecesArray = this.fb.array<FormGroup>([]);

      // Billets
      deviseData.billets.forEach((v:number)=>{
        billetsArray.push( this.fb.group({ valeur:[v], quantite:[0] }));
      });

      // Pièces
      deviseData.pieces.forEach((v:number)=>{
        piecesArray.push( this.fb.group({ valeur:[v], quantite:[0] }) );
      });

      caissesArray.push(
        this.fb.group({
          idperiode:[c.idperiode],
          idcaisse:[c.idcaisse],
          caisse:[c.caisse.codecaisse],
          devise:[c.caisse.codedevise],
          billets:billetsArray,
          pieces:piecesArray,
          totalPhysique:[0],
          ecart:[0]
      }))
    });
  }

  get caissesBilletArray():FormArray{
    return this.billetageForm.get('caissesBillet') as FormArray;
  }

  getBillets(i:number):FormArray{
    return this.caissesBilletArray.at(i).get('billets') as FormArray;
  }

  getPieces(i:number):FormArray{
    return this.caissesBilletArray.at(i).get('pieces') as FormArray;
  }

  getTotalCaisse(index:number){
    let billets = this.getBillets(index).value;
    return billets.reduce((sum:any,b:any)=> {
      return sum + (b.valeur * b.quantite); },0
    );
  }

  openBilletageModal(content:any){
    const caisses = this.caisseperiodeForm.value.caisses;
    this.initBilletageForm(caisses);
    this.modalRef = this.modalService.open(content,{
      size:'lg',
      backdrop:'static',
      centered:true
    });
  }

  getTotalBillets(i:number){
    const billets = this.getBillets(i).value;
    return billets.reduce((sum:any,b:any)=> sum + (b.valeur * b.quantite),0);
  }

  getTotalPieces(i:number){
    const pieces = this.getPieces(i).value;
    return pieces.reduce((sum:any,p:any)=> sum + (p.valeur * p.quantite),0);
  }

  getTotalPhysique(i:number){
    return this.getTotalBillets(i) + this.getTotalPieces(i);
  }

  selectTab(i:number){
    this.activeTab = i;
  }

  // Valider une caisse
  validateBilletage(i: number) {
    if (!this.billetageValidatedIndexes.includes(i)) {
      this.billetageValidatedIndexes.push(i);
    }

    // IMPORTANT
    this.billetageValidated = true;
    this.validatedCaisseIndex = i;
    const totalPhysique = this.getTotalPhysique(i);
    const caisseId = this.caissesBilletArray.at(i).value.idcaisse;
    const soldeCaisse = this.caisseSolde.find(
      (s: any) => s.idcaisse === caisseId
    );
    const totalAttendu = soldeCaisse ? this.getSolde(soldeCaisse) || 0 : 0;
    const ecart = totalPhysique - totalAttendu;
    (this.caissesBilletArray.at(i) as FormGroup).patchValue({
      ecart: ecart,
      totalPhysique: totalPhysique
    });
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
      //this.openBilletageModal(this.modalBilletage); //
    } else {
      this.openCaisse(this.user.idutilisateur, _caisse.caisses);
    }

    this.reloadPage();
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

  // Soumettre toutes les caisses validées
  submitBilletage() {
    const caissesToSubmit = this.caissesBilletArray.controls.filter((_, i) => this.billetageValidatedIndexes.includes(i)).map(c => c.value);
    if (caissesToSubmit.length === 0) {
      this.toastr.warning("Aucune caisse validée");
      return;
    }

    this.caisseBilletage(caissesToSubmit);
  }

  caisseBilletage(data: any) {
    this.loading = true;
    this.caisseservice.createBilletage(data).subscribe({
      next: (res) => {
        if (res.success) {
          const formValue = this.caisseperiodeForm.value;
          // const _caisse = { ...formValue };

          const caissesEnrichies = formValue.caisses.map((c: any) => {
            const caisseBillet = this.caissesBilletArray.controls.find(
              (cb: any) => cb.value.idcaisse === c.idcaisse)?.value;

            return {
              ...c,
              montantphysique: caisseBillet ? this.getTotalPhysiqueById(c.idcaisse) : 0,
              ecart: caisseBillet?.ecart ?? 0
            };
          });

          const _caisse = {
            ...formValue,
            caisses: caissesEnrichies
          };

          //ensuite clôturer
          this.closeCaisseAfterBilletage(_caisse.caisses);

        } else {
          this.loading = false;
          this.toastr.error("Erreur lors du billetage");
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    });
  }

  getTotalPhysiqueById(idcaisse: string) {
    const index = this.caissesBilletArray.controls.findIndex(
      (c: any) => c.value.idcaisse === idcaisse
    );

    return index !== -1 ? this.getTotalPhysique(index) : 0;
  }

  closeCaisseAfterBilletage(caisses: any) {
    this.caisseservice.close(this.user.idutilisateur, caisses).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastr.success("Caisse clôturée avec succès");

          //fermer modal ici (AU BON MOMENT)
          if (this.modalRef) {
            this.modalRef.close();
          }

          this.reloadPage();
        } else {
          this.toastr.error("Erreur de clôture");
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    });
  }

  // Annuler le billetage
  cancelBilletage() {
    this.billetageValidatedIndexes = [];
    // remettre les quantités à 0 si besoin
    this.caissesBilletArray.controls.forEach(c => {
      (c.get('billets') as FormArray).controls.forEach(b => b.patchValue({ quantite: 0 }));
      (c.get('pieces') as FormArray).controls.forEach(p => p.patchValue({ quantite: 0 }));
      c.patchValue({ ecart: 0 });
    });
    this.activeTab = 0;
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  getSolde(item: any): number {
    return (Number(item?.soldeinitialisation) || 0) + (Number(item?.solde) || 0);
  }

  calculSolde(item: any): string {
    return this.formatCFA(this.getSolde(item));
  }

}
