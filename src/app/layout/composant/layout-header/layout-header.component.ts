import { Component, OnInit } from '@angular/core';
import { caisseModel } from '../../../features/caisse_journal/models/caisse.model';
import { CaisseService } from '../../../features/caisse_journal/services/caisse.service';
import { caissePeriodeModel } from '../../../features/caisse_journal/models/periodecaisse.model';
import { forkJoin, map, Observable } from 'rxjs';
import { CaissePeriodeService } from '../../../features/caisse_journal/services/caisseperiode.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';

@Component({
  selector: 'app-layout-header',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './layout-header.component.html',
  styleUrl: './layout-header.component.css'
})
export class LayoutHeaderComponent implements OnInit {

  caisserecent : caissePeriodeModel = new caissePeriodeModel();
  caisseperiodes : caissePeriodeModel[] = [];
  fb: FormBuilder = new FormBuilder();
  caisseperiodeForm : FormGroup = this.fb.group({});
  msgErros: string = "";
  error: string = "";
  loading: boolean = false;

  //Liste de caisse utilisateur
  caissesUser: any[] = [
    {
      idcaisse : "47FCE466-8123-4DEB-942B-9F0E5BB22FD4",
      codecaisse : "CA001",
      libelle : "Caisse principale",
      devise : "XAF"
    },
    {
      idcaisse : "F1DD7EDE-EB9C-41D2-8EE1-55300B21777C",
      codecaisse : "CA002",
      libelle : "Caisse secondaire",
      devise : "USD"
    }
  ];

  caissesStatuses: { [id: string]: string } = {};

  constructor(private caisseservice: CaisseService,private caisseStatusService: CaissePeriodeService){}

  ngOnInit(): void {
    this.caisseperiodeForm = this.fb.group({
      caisses: this.fb.array([])
    });
    this.caisseStatusService.loadStatuses(this.caissesUser);
    this.getCaissesPerdiodes();
    //initialiser le formulaire
    this.initForm();
  }

  get caisseStatus() {
    return this.caisseStatusService;
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }
  
  logout (){
    localStorage.clear();
  }

  getCaissesPerdiodes() {
    const requests = this.caissesUser.map(c =>
      this.caisseservice.getRecentCaisse(c.idcaisse)
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        const statuses : any = {};
        this.caisseperiodes = responses.map((res, index) => {
          const item = res.data;
          const caisseId = this.caissesUser[index].idcaisse;
          statuses[caisseId] = item.statut;
          return item;
        });
        // mise à jour globale
        this.caisseStatusService.updateStatuses(statuses);
        // maintenant que tout est chargé → on initialise le formulaire
        this.initForm();
      },
      error: () => {
        console.log("Erreur de chargement des caisses");
      }
    });
  }

  initForm(){
    this.caissesArray.clear(); // si rechargement
    this.caisseperiodes.forEach(c => {
      this.caissesArray.push(
        this.fb.group({
          idperiode: [c.idperiode],
          idcaisse: [c.idcaisse],
          statut: [c.statut],
          dateperiode: [c.dateperiode]
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
      this.closeCaisse(_caisse.caisses);   // Journée ouverte → fermer
    } else {
      this.openCaisse(_caisse.caisses);    // Journée fermée → ouvrir
    }
  }

  openCaisse(caisse: any[]){
    caisse.forEach(c => {
      this.caisseservice.open(c).subscribe({
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
    })
  }

  formatDate(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  isJourneeOuverte(): boolean {
    return this.caisseperiodes.some(
      p => p.statut?.toLowerCase() === "ouverte"
    );
  }

  isJourneeCloturee(): boolean {
    return this.caisseperiodes.some(
      p => p.statut?.toLowerCase() === "cloturee"
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

  closeCaisse(caisses: any[]) {
    caisses.forEach(c => {
      this.caisseservice.close(c).subscribe({
        next: (res) => {
          this.error = res.success ? "Caisse clôturée" : "Erreur de clôture";
          this.loading = false;
        },
        error: () => {
          this.error = "Clôture échouée";
          this.loading = false;
        }
      });
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
      this.closeCaisse(caisses);   // Journée ouverte → fermer
    } else {
      this.openCaisse(caisses);    // Journée fermée → ouvrir
    }
  }

  // actionJournee() {
  //   this.handleCaisseAction();
  // }

}
