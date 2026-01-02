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
import { utilisateurdepartementservice } from '../../administration/service/userdepartement.service';
import { affectationdepartementnatureModel } from '../../donnee_base/models/affectationdepartementnature.model';
import { AffectationDepartementNatureService } from '../../donnee_base/services/affectationdepartementnature.service';
import { affectationnaturecentreModel } from '../../donnee_base/models/affectationnaturecentre.model';
import { AffectationNatureCentreService } from '../../donnee_base/services/affectationnaturecentre.service';

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

  //Liste des départements de l'utilisateurs
  departementUser: any = [];
  //Liste des natures des départements
  naturesBydepartements: any[] = [];
  //Liste des centres analytiques des natures opérations
  centresBynatures: any[] = [];

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
    private centreanalytiqueservice: CentreAnalytiqueService, private userdepartement: utilisateurdepartementservice, private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private tiersservice: TiersService, private toastr : ToastrService, private activatedRoute: ActivatedRoute,private AffectationNatureCentreService: AffectationNatureCentreService){}

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
    //this.getAllNatureoperations();
    //charger les centres analytiques
    this.getAllcentres();
    //charger les tiers
    this.getAllTiers();
    //Charger les départements de l'user
    this.getDepartementOfUser();
    //charger la demande 
    //this.iddemande = this.activatedRoute.snapshot.paramMap.get('id')!;

    this.demandeForm.get('departement')?.valueChanges.subscribe(dept => {
      if(dept){
        //filtrer sur la natures des opérations
        this.onTypeDepartementChange(dept);
      }
    });
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

  //Récupérer les affectations departements natures

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
    this.natureoperationservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.natureoperations = (res.data || []).filter(
            (n: any) => n.actif === 1
          );
        }
      }
    });
  }

  //Récuperer le departement de l'utilisateur
  getDepartementOfUser(){
    this.userdepartement.getutilisateurdepartement(this.user.idutilisateur).subscribe({
      next : (res) => {
        if(res.success){
          this.departementUser = res.data[0];
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message)
      }
    });
  }

  //Affectation natures departements
  getallAffectationNatures(iddepartement: string) {
    this.AffectationDepartementNatureService.getAll(iddepartement).subscribe({
      next: (res) => {
        if (res.success) {
          //this.naturesBydepartements = res.data.naturesaffectes;
          this.naturesBydepartements = (res.data.naturesaffectes || []).filter(
            (n: any) => n.actif === 1
          );
        }
      }
    });
  }

  //Affectation natures centre
  getallAffectationCentres(idnature: string) {
    this.AffectationNatureCentreService.getAll(idnature).subscribe({
      next: (res) => {
        if (res.success) {
          this.centresBynatures = (res.data.centresaffectes || []).filter(
            (n: any) => n.actif === 1
          );
        }
      }
    });
  }

  //Affectation natures centre for modify
  getallCentresDispatch(natureId: string, ligne: FormGroup, centreId?: string) {
    this.AffectationNatureCentreService.getAll(natureId).subscribe(res => {
      if (res.success) {
        const centres = (res.data.centresaffectes || [])
          .filter((c: any) => c.actif === 1);

        //stocker les centres dans la ligne
        ligne.get('centres')?.setValue(centres);

        //activer le champ centre
        ligne.get('centre')?.enable({ emitEvent: false });

        //positionner le centre APRÈS chargement
        if (centreId) {
          ligne.get('centre')?.setValue(centreId, { emitEvent: false });
        }
      }
  });
  }


  //Recuperer le departement selectionné
  get departement() {
    return this.demandeForm.get("departement")?.value;
  }

  //
  onTypeDepartementChange(type: string) {
      this.getallAffectationNatures(type);
  
      // Réinitialiser les natures déjà choisies
      this.lignes.controls.forEach((ligne: FormGroup) => {
        ligne.reset();

        ligne.patchValue({
          natureop: null,
          centre: null,
          tiers: null,
          montantdemande: ""
        });
  
        ligne.get('centre')?.disable();
        ligne.get('tiers')?.disable();
        ligne.get('montantdemande')?.disable();
      });
  }

  //Recuperer la nature

  //Recupérer les centres analytiques
  getAllcentres(){
    this.centreanalytiqueservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.centres = (res.data || []).filter(
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
      datedemande: this.formatDateForInput(this.demande.datedemande!),
      departement: this.demande.iddepartement
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

      //charger centres + positionner centre
      this.getallCentresDispatch(ligne.natureoperation.idnature, ligneGroup, ligne.centreanalytique.idcentre );
    });
  }

  //Recupérer les tiers
  getAllTiers(){
    this.tiersservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.tiers = (res.data || []).filter(
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
    const ligneOf = this.fb.group({
      idlignedemande: [ligne?.idlignedemande || null],
      numligne: [ligne?.numligne || null],
      natureop: [ligne?.natureoperation.idnature || '', Validators.required],
      centre: [{ value: ligne?.centreanalytique?.idcentre || null, disabled: true }, Validators.required],
      tiers: [{ value: ligne?.tiers?.idtiers || null, disabled: true }],
      montantdemande: [{ value: ligne?.montantdemande || 0, disabled: true }, Validators.required],
      details: this.fb.array([]),
      //CENTRES PAR LIGNE
      centres: this.fb.control<any[]>([])
    });

    //ÉCOUTE CORRECTE
    ligneOf.get('natureop')?.valueChanges.subscribe(nature => {
      if (!nature) {
        ligneOf.get('centre')?.disable();
        ligneOf.get('tiers')?.disable();
        ligneOf.get('montantdemande')?.disable();
        ligneOf.patchValue({ centre: null });
        ligneOf.get('centres')?.setValue([]);
        return;
      }

      ligneOf.get('centre')?.enable();
      ligneOf.get('montantdemande')?.enable();

      //charger centres POUR CETTE LIGNE
      this.loadCentresForLigne(ligneOf, nature);

      // règle métier tiers
      this.handleNatureChange(ligneOf, nature);
    });

    return ligneOf;
  }

  //Selection de la nature / Activer ou desactiver imputation tiers
  handleNatureChange(ligne: FormGroup, natureId: string) {
    const nature = this.naturesBydepartements.find(
      n => n.idnature === natureId
    );

    console.log(nature);

    if (!nature) {
      ligne.get('tiers')?.disable();
      ligne.get('tiers')?.reset();
      return;
    }

    if (nature.imputationtiers === 1) {
      ligne.get('tiers')?.enable();
    } else {
      ligne.get('tiers')?.disable();
      ligne.get('tiers')?.reset();
    }
  }

  addLigne() {
    this.lignes.push(this.newLigne());
  }

  //Charger les centres de chaque ligne
  loadCentresForLigne(ligne: FormGroup, idnature: string) {
    this.AffectationNatureCentreService.getAll(idnature).subscribe({
      next: (res) => {
        if (res.success) {
          const centres = (res.data.centresaffectes || [])
            .filter((c: any) => c.actif === 1);

          //stocké dans la ligne
          ligne.get('centres')?.setValue(centres);

          // reset centre sélectionné
          ligne.get('centre')?.reset();
        }
      }
    });
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
