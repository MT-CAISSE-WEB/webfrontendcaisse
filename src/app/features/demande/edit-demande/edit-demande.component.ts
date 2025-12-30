import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DemandeService } from '../services/demande.service';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { natureoperationModel } from '../../donnee_base/models/natureoperation.model';
import { tiersModel } from '../../donnee_base/models/tiers.model';
import { centreanalytiqueModel } from '../../donnee_base/models/centreanalytique.model';
import { NatureoperationService } from '../../donnee_base/services/natureoperation.service';
import { CentreAnalytiqueService } from '../../donnee_base/services/centreanalytique.service';
import { TiersService } from '../../donnee_base/services/tiers.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { EnteteDemande } from '../models/entete-demande.model';

@Component({
  selector: 'app-edit-demande',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-demande.component.html',
  styleUrl: './edit-demande.component.css'
})
export class EditDemandeComponent implements OnInit {
  title = 'Création de la demande';
  fb: FormBuilder = new FormBuilder();
  demandeForm: FormGroup = this.fb.group({});

  loading = false;
  error = '';
  msgErros = '';
  msgSuccess = '';

  //AFFICHER L ELEMENT EN COURS
  breadCrumbItems: any;

  //Demande 
  demande!: EnteteDemande;

  iddemande: any = "0";

  //Changement titre modal
  actionModal: string = "create";

  //Liste des natures filtrées
  naturesFiltrees: any[] = [];
  natureoperations : natureoperationModel[] = [];

  //Liste des tiers
  tiers : tiersModel[] = [];

  //TITRE ET BOUTON RETOUR
  url: string = "";

  //Liste des centres analytiques
  centres : centreanalytiqueModel[] = [];

  constructor(private service: DemandeService, private natureoperationservice: NatureoperationService, private router : Router,
    private centreanalytiqueservice: CentreAnalytiqueService,
    private tiersservice: TiersService, private toastr : ToastrService, private activatedRoute: ActivatedRoute,){}

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Demande'},
      {label: 'Création de la demande', active: true}
    ];
    //initialiser le formulaire 
    this.initForm();
    this.title = 'Création';
    this.activatedRoute.paramMap.subscribe(params =>{
      const id= params.get("id");
      this.iddemande = id;
      if(id && id !="0"){
        this.getDemande();
        this.loading = false;
      }
    });
    //Charger les natures opérations
    this.getAllNatureoperations();
    //charger les centres analytiques
    this.getAllcentres();
    //charger les tiers
    this.getAllTiers();
    //charger la demande 
    //this.iddemande = this.activatedRoute.snapshot.paramMap.get('id')!;
  }

  //Retour
  // back() {
  //   this.location.back();
  // }

  //Initialiser le formulaire
  initForm(){
    this.demandeForm = this.fb.group({
      // STEP 1
      iddemande : [''],
      codedemande: [''],
      demandeur: [this.user.idutilisateur],
      typedemande: ['', Validators.required],
      libelledemande: ['', Validators.required],
      datedemande: [this.formatDateInput(new Date()), Validators.required],
      circuit: [''],
      societe: [this.user.idsociete],
      site: [this.user.idsite],
      departement: [''],
      devise: [''],

      // STEP 2
      lignes: this.fb.array([]),
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //recupere et afficher une demande
  getDemande(){
    this.activatedRoute.paramMap.subscribe(params =>{
      const id= params.get("id");
      this.iddemande = id;
      if(id && id !="0"){
        this.loading = true;
        this.service.getEntete(id).subscribe({
          next: (res)=> {
            if(res.success) {
              this.demande = res.data;
              this.breadCrumbItems = [
                {label: 'Demande'},
                {label: 'Modification de la demande', active: true}
              ];
              this.title = 'Modification';
              this.dispatchDemande()
              //this.toastr.success("Récuperation réussi")
            }
            this.loading = false;
          },
          error: (err)=> {
            this.loading = false;
            this.toastr.error("Erreur backend", err.error.message)
          }
        })
      }
    })
  }

  //Recuperer les natures opérations
  getAllNatureoperations(){
    const params = {
      page: 1,
      limit: 100
    };
    this.natureoperationservice.getAll(params).subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = (res.data.data || []).filter(
            (n: any) => n.actif === 1
          );
        }
      }
    });
  }

  //Recupérer les centres analytiques
  getAllcentres(){
    const params = {
      page: 1,
      limit: 100
    };
    this.centreanalytiqueservice.getAll(params).subscribe({
      next : (res) => {
        if(res.success){
          this.centres = (res.data.data || []).filter(
            (n: any) => n.actif === 1
          )
        }
      }
    });
  }

  formatDateForInput(date: string) {
    return date ? date.substring(0, 10) : "";
  }

  dispatchDemande(){
    this.demandeForm.patchValue({
      iddemande : this.demande.iddemande,
      codedemande: this.demande.codedemande,
      typedemande: this.demande.typedemande,
      libelledemande: this.demande.libelledemande,
      devise: this.demande.iddevise,
      datedemande: this.formatDateForInput(this.demande.datedemande!)
    });

    // Lignes
    this.lignes.clear();
    this.demande.lignes.forEach((ligne: any, index: number) => {
      const ligneGroup = this.newLigne(ligne);
      this.lignes.push(ligneGroup);

      //DÉTAILS DE LA LIGNE
      const detailsArray = ligneGroup.get('details') as FormArray;
      detailsArray.clear();

      ligne.details.forEach((detail: any) => {
        detailsArray.push(this.newDetail(detail));
      });
    });
  }

  //Recupérer les tiers
  getAllTiers(){
    const params = {
      page: 1,
      limit: 100
    };
    this.tiersservice.getAll(params).subscribe({
      next : (res) => {
        if(res.success){
          this.tiers = (res.data.data || []).filter(
            (n: any) => n.actif === 1
          )
        }
      }
    });
  }

  formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // ============================
  // LIGNES
  // ============================
  get lignes(): FormArray<FormGroup> {
    return this.demandeForm.get('lignes') as FormArray<FormGroup>;
  }

  newLigne(ligne?: any): FormGroup {
    return this.fb.group({
      idlignedemande: [ligne?.idlignedemande || null],
      numligne: [ligne?.numligne || null],
      natureop: [ligne?.natureoperation.idnature || '', Validators.required],
      centre: [ligne?.centreanalytique.idcentre || '', Validators.required],
      tiers: [ligne?.tiers.idtiers || null],
      montantdemande: [ligne?.montantdemande || 0, Validators.required],
      details: this.fb.array([])
    });
  }

  addLigne() {
    this.lignes.push(this.newLigne());
  }

  removeLigne(ligneIndex: number) {
    const ligneGroup = this.lignes.at(ligneIndex) as FormGroup;
    const id = ligneGroup.get('idlignedemande')?.value;

    // Ligne jamais persistée
    if (!id) {
      this.lignes.removeAt(ligneIndex);
      return;
    }

    this.loading = true;
    this.service.deleteLigne(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.lignes.removeAt(ligneIndex);
          //this.toastr.success('Detail supprimée avec succès');
        } else {
          this.error = "Erreur de suppression";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Erreur de suppression";
        this.toastr.error(this.error);
      }
    });
  }

  // ============================
  // DETAILS
  // ============================
  getDetailsArray(ligneIndex: number): FormArray {
    return this.lignes.at(ligneIndex).get('details') as FormArray;
  }

  newDetail(detail?: any): FormGroup {
    return this.fb.group({
      iddetailsdemande: [detail?.iddetailsdemande || null],
      quantite: [detail?.quantite || 1, Validators.required],
      montant: [detail?.montant || 0, Validators.required],
      description: [detail?.description || '']
    });
  }

  addDetail(ligneIndex: number) {
    this.getDetailsArray(ligneIndex).push(this.newDetail());
  }

  get form() {
    return this.demandeForm.controls;
  }

  //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  removeDetail(indexLigne: number, indexDetail: number) {
    const ligneFG = this.lignesFormArray.at(indexLigne) as FormGroup;
    const detailsFA = ligneFG.get('details') as FormArray;

    const detailFG = detailsFA.at(indexDetail) as FormGroup;
    const idDetail = detailFG.get('iddetailsdemande')?.value;

    if (!idDetail) {
      detailsFA.removeAt(indexDetail);
      return;
    }

    this.service.deleteDetail(idDetail).subscribe({
      next: (res) => {
        if (res.success) {
          detailsFA.removeAt(indexDetail);
          //this.toastr.success('Detail supprimée avec succès');
        } else {
          this.error = "Erreur de suppression";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Erreur de suppression";
        this.toastr.error(this.error);
      }
    });
  }

  submit() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.demandeForm.controls;
    if (this.demandeForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      this.toastr.warning(this.msgErros);
      return;
    }

    // for (let i = 0; i < this.lignes.length; i++) {
    //   const details = this.getDetailsArray(i);
    //   if (details.length === 0) {
    //     this.msgErros = `La ligne ${i + 1} doit contenir au moins un détail`;
    //     return;
    //   }
    // }

    /** 2. prepare data */
    const formValue = this.demandeForm.value;

    /** 3. choices action */
    if(this.title == "Création")this.create(formValue);
    else this.update(formValue);

    // if (!formValue.iddemande) this.create(formValue);
    // else this.update(formValue);
  }

  resetForm(){
    this.demandeForm.reset();
    this.rafreshpage();
  }

  rafreshpage(){
    const currentUrl = this.router.url; 
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  checkMontantLigne(ligneIndex: number): boolean {
    const ligne = this.lignes.at(ligneIndex);
    const totalDetails = this.getDetailsArray(ligneIndex).value
      .reduce((sum: number, d: any) => sum + d.montant, 0);

    return totalDetails === ligne.get('montantdemande')?.value;
  }

  get lignesFormArray(): FormArray<FormGroup> {
    return this.demandeForm.get('lignes') as FormArray<FormGroup>;
  }

  //Enregistrement de données
  create(_demande: any) {
    console.log("create");
    const {iddemande, ...dataToSend} = _demande;
    this.loading = true;
    this.service.createEntete(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          //this.rafreshpage();
          this.toastr.success('Demande enregistrée avec succès');
        } else {
          this.error = "Erreur de création";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error("Erreur backend ", err.error.message);
      }
    })
  }

  //Modification de données
  update(_demande: any){
    this.service.updateEntete(_demande.iddemande, _demande).subscribe({
      next: (res) => {
        if (res.success) {
          this.rafreshpage();
          this.toastr.success('Demande modifée avec succès');
        } else {
          this.error = "Erreur de modification";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "échec de Modification";
        this.loading = false;
        this.toastr.error(this.error);
      }
    })
  }

}
