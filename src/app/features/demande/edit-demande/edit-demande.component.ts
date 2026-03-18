import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DemandeService } from '../services/demande.service';
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
import { devisemodel } from '../../donnee_base/donnee_base/model/devise.model';
import { deviseservice } from '../../donnee_base/donnee_base/service/devise.service';
import { tauxdevisemodel } from '../../donnee_base/donnee_base/model/tauxdevise.model';
import { tauxdeviseservice } from '../../donnee_base/donnee_base/service/tauxdevise.service';
import { departementservice } from '../../structure/service/departement.service';
import { CustomFieldSelectComponent } from '../../../_core/custom/custom-field-select/custom-field-select.component';
import { COLUMNS_DEPARTEMENT } from '../../../_core/constantes/tableau.data';

@Component({
  selector: 'app-edit-demande',
  imports: [ReactiveFormsModule, CommonModule, CustomFieldSelectComponent],
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

  //Liste des taux de devises
  tauxdevise : tauxdevisemodel = new tauxdevisemodel();

  //Liste des départements de l'utilisateurs
  departementUser: any = [];
  departementUserFiltered: any = [];
  columnscentre: any[] = COLUMNS_DEPARTEMENT;
  //Liste des natures des départements
  naturesBydepartements: any[] = [];
  //Liste des centres analytiques des natures opérations
  centresBynatures: any[] = [];

  //Changement titre modal
  actionModal: string = "create";

  //Ramener la devise
  devises : devisemodel[] = [];
  devise : devisemodel = new devisemodel();

  //Liste des natures filtrées
  naturesFiltrees: any[] = [];
  natureoperations : natureoperationModel[] = [];

  //Liste des tiers
  tiers : tiersModel[] = [];

  //TITRE ET BOUTON RETOUR
  url: string = "";

  //Liste des centres analytiques
  centres : centreanalytiqueModel[] = [];

  constructor(private service: DemandeService, private natureoperationservice: NatureoperationService, private router : Router, private ds:deviseservice, private ts: tauxdeviseservice,
    private centreanalytiqueservice: CentreAnalytiqueService, private userdepartement: utilisateurdepartementservice, private AffectationDepartementNatureService: AffectationDepartementNatureService,
    private tiersservice: TiersService, private dp : departementservice, private toastr : ToastrService, private activatedRoute: ActivatedRoute,private AffectationNatureCentreService: AffectationNatureCentreService){}

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Demande'},
      {label: 'Création de la demande', active: true}
    ];
    //initialiser le formulaire 
    this.initForm();
    this.title = 'Création';
    //Charger les départements de l'user
    this.loadDepartementsByUser();
    //Afficher toutes les devises
    this.getalldevises();
    //charger les centres analytiques
    this.getAllcentres();
    //charger les tiers
    this.getAllTiers();

    this.activatedRoute.paramMap.subscribe(params =>{
      const id= params.get("id");
      this.iddemande = id;
      if(id && id !="0"){
        this.getDemande();
        this.loading = false;
      }
    });

    this.demandeForm.get('departement')?.valueChanges.subscribe(dept => {
      if(dept){
        //filtrer sur la natures des opérations
        this.onTypeDepartementChange(dept);
      }
    });

    //A la selectionner de la devise
    this.demandeForm.get('devise')?.valueChanges.subscribe(devise => {
      if(devise){
        if (devise === this.user.devise_ref_id) {
          this.demandeForm.patchValue({ taux: 1 });
          return;
        }
        //Charger sur le dernier taux
        this.loadLastdeviseTaux(devise);
      }
    });
  }

  //Get le taux recent
  getderniertaux (payload: any){
    this.service.tauxrecent(payload).subscribe({
      next : (res) => {
         if(res.success){
            this.tauxdevise = res.data;
            if(!this.tauxdevise){
              this.demandeForm.patchValue({ taux: 1 });
              this.toastr.warning("Pas de taux recent trouvé");
            }else{
              this.demandeForm.patchValue({ taux: this.tauxdevise.coefficient });
            }
         }else{
          this.toastr.error("Erreur serveur", res);
         }
      },
      error: (err) => {
        this.toastr.error("Erreur backend", err.error.message)
      }
    });
  }

  //Charger le dernier taux
  loadLastdeviseTaux(devise: any){
    const datePivot = this.demandeForm.get('datedemande')?.value;
    const devises = {
      iddeviseorigine: devise,
      iddevisedestination : this.user.devise_ref_id,
      datepiece : datePivot
    };

    this.getderniertaux(devises);
  }

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
      taux: [1],

      // STEP 2
      lignes: this.fb.array([]),
    });
  }

  //Récupérer les devise
  getalldevises (){
    const params = {
      page: 1,
      limit: 20
    };
    this.ds.getAll(params).subscribe({
      next : (res) => {
         if(res.success){
            this.devises = res.data;
         }
      }
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
              this.dispatchDemande();
              //this.lockFormIfRejected();
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
          this.departementUserFiltered = [...this.departementUser];
          
          // Après avoir chargé les données
          setTimeout(() => {
            this.demandeForm.patchValue({
              departement: this.demande?.iddepartement
            });
          });
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message)
      }
    });
  }

  //Tous les departements
  getalldepartements (){
    this.dp.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.departementUser = res.data;
         }
      }
    });
  }

  loadDepartementsByUser() {
    if (this.user?.typeentitesite === 1 || this.user?.typeentitesociete === 1) {
      this.getalldepartements();
    } else {
      this.getDepartementOfUser();
    }
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

  //Lorsque le departement change
  onTypeDepartementChange(type: string) {
      this.getallAffectationNatures(type);
  
      // Réinitialiser les natures déjà choisies
      this.lignes.controls.forEach((ligne: FormGroup) => {
        ligne.reset();

        ligne.patchValue({
          natureop: "",
          centre: "",
          tiers: "",
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
      circuit: this.demande.idcircuit,
      site: this.demande.site?.idsite,
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

  lockFormIfRejected() {
    if (this.demande?.statut === 3) {
      this.demandeForm.disable({ emitEvent: false });
    }
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

    /** 2. prepare data */
    const formValue = {
      ...this.demande,
      ...this.demandeForm.getRawValue(),
      createdby: this.user.codeutilisateur ?? null,
      updatedby: this.title === 'Modification'
        ? `${this.user.nom} ${this.user.prenom}`
        : null,
    };

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
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    })
  }

  //Chargement des natures
  searchDepartement(event: any){
    const search = event.search || '';
    this.departementUserFiltered = this.departementUser.filter((t: { codedept: string; libelle: string; }) =>
      t.codedept?.toLowerCase().includes((search).toLowerCase()) ||
      t.libelle?.toLowerCase().includes((search).toLowerCase())
    );
  }


}
