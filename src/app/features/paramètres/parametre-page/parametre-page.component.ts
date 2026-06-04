import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { motifModel } from '../models/motif.model';
import { ToastrService } from 'ngx-toastr';
import { MotifService } from '../services/motif.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Compteur } from '../models/compteur.model';
import { CompteurService } from '../services/compteur.service';
import { journalModel } from '../../caisse_journal/models/journal.model';
import { JournalService } from '../../caisse_journal/services/journal.service';
import { url } from 'inspector';
import { plancomptableModel } from '../../donnee_base/models/plancomptable.model';
import { PlancomptableService } from '../../donnee_base/services/plancomptable.service';
import { ParametreComptableService } from '../services/parametrecomptable.service';
import { parametreComptableModel } from '../models/parametrecomptable.model';

@Component({
  selector: 'app-parametre-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './parametre-page.component.html',
  styleUrl: './parametre-page.component.css'
})
export class ParametrePageComponent implements OnInit {

  title = 'Paramètres générales';
  //Changement titre modal
  actionModal: string = "create";
  actionModalCompteur: string = "create";

  fb: FormBuilder = new FormBuilder();
  msgErros : string = "";
  loading: Boolean = false;
  motifForm : FormGroup = this.fb.group({});
  // Définissez des propriétés de pagination
  currentPage: number = 1;
  currentPageCompteur: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  totalPagesCompteur: number = 0;
  limit: number = 4;

  motifs : motifModel[] = [];
  motif : motifModel = new motifModel();

  //Faire le check selection **********
  objectsSelected : motifModel[] = [];
  selectedItems : any[] = [];
  optionsSequence2: string[] = [];

  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Message suppression
  msgSup: string = "";
  msgSupCompteur: string = "";
  titleMsg: string ="";

  //Element à supprimer
  deleteMotif: any = null;
  params : any = {};
  journaux: journalModel[] = [];
  comptes : plancomptableModel[] = [];

  paramForm : FormGroup = this.fb.group({});
  currentParam: any;

  constructor(private router: Router, private toastr : ToastrService, private motifservice: MotifService, private compteurService : CompteurService,
    private journalservice: JournalService, private plancomptableservice: PlancomptableService, private serviceparametre: ParametreComptableService
  ) {}

   ngOnInit(): void {
    //Récupérer tous les motifs
    this.getAllMotif();
    // Récupérer tous les compteurs
    this.getAllCompteurs();
    //initialiser le formulaire
    this.initForm();
    // Initialiser le formulaire du compteur
    this.initFormCompteur();
    // Charger les journaux
    this.getAllJournaux();
    // Initialiser le formulaire de paramètre
    this.initFormParametre();
    // Charger les comptes comptables
    this.getAllComptes();
    // Charger les paramètres comptables
    this.getParam();

    // Suppresion du motif
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce motif");
    this.msgSupCompteur = MESSAGE_SUPPRESSION_DESCRIPTION("ce compteur");
    this.titleMsg = TITLE_DELETE;
   }

   //Recuperer tous les motifs
  getAllMotif(){
    this.params = {
      page: this.currentPage,
      limit: this.limit,
      search: '',
      actif: '',
    };
    this.motifservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.motifs = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  // //Listen
  listenSequence(event: Event){
    const value = (event.target as HTMLSelectElement).value;

    this.compteurForm.get('sequence_2')?.reset();
    this.compteurForm.get('prefixe_1')?.reset();
    this.compteurForm.get('prefixe_2')?.reset();

    if (value === 'societe') {
      this.optionsSequence2 = ['site', 'constante'];
    } else if (value === 'site') {
      this.optionsSequence2 = ['constante'];
    } else if (value === 'constante') {
      this.optionsSequence2 = ['societe', 'site', 'constante'];
    } else {
      this.optionsSequence2 = [];
    }
  }

  //Initialiser le formulaire
  initForm(){
    this.motifForm = this.fb.group({
      codemotif : [""],
      libellemotif : [""],
    })
  }

  rafreshpage(){
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.motifForm.controls;
    if (this.motifForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      this.toastr.warning(this.msgErros);
      return;
    }

    /** 2. prepare data */
    const formValue = this.motifForm.getRawValue();

    const _motif: motifModel = {
      ...this.motif,
      ...formValue,
      createdby: this.user.nom + ' ' + this.user.prenom,
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_motif);
    else this.update(_motif);
  }

  //Enregistrement de données
  create(_motif: motifModel) {
    const {idmotif, ...dataToSend} = _motif;
    this.loading = true;
    this.motifservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllMotif();
          this.rafreshpage();
          this.toastr.success('Motif enregistrée avec succès');
        } else {
          this.error = "Erreur de création";
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

  modalUpdate(_object: motifModel){
    //this.isUpdated = false;
    this.motif = _object;
    this.actionModal = "update";
    this.motifForm.reset();
    this.initForm();
    this.dispatchMotif(this.motif);
  }

  //Modification de données
  update(_object: motifModel){
    this.motifservice.update(_object).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllMotif();
          this.toastr.success('Motif modifée avec succès');
        } else {
          this.error = "Erreur de modification";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "échec de Modification";
        this.loading = false;
        this.toastr.error(err.error.message);
      }
    })
  }

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  // Recuperer la devise
  modalCreate(){
    //this.isUpdated = true;
    this.actionModal = "create";
    this.initForm();
  }

  dispatchMotif(_object: motifModel){
    // Patch des champs simples
    this.motifForm.patchValue({
      codemotif :   _object.codemotif,
      libellemotif : _object.libellemotif,
    });
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllMotif(); // recharge les données
  }

  deleteConfirmed(){
    if(!this.deleteMotif) return ;
    this.motifservice.delete(this.deleteMotif.idmotif).subscribe({
      next: (res) => {
        if (res.success) {
          this.deleteMotif = null;
          this.closeModal('deleteOrder');
          this.getAllMotif();
          this.rafreshpage();
          this.toastr.error('Motif supprimée');
        } else {
          this.error = "Erreur de Suppression";
          this.toastr.error(this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Suppression échec";
        this.loading = false;
        this.toastr.error(this.error);
      }
    })
  }

  modalDelete(item: motifModel){
    this.deleteMotif = item;
  }

  // Le compteur
  deleteCompteur: Compteur | null = null;
  compteurForm: FormGroup = this.fb.group({});
  compteurs: Compteur[] = [];
  compteur: Compteur = {} as Compteur;

  initFormCompteur(): void {
    this.compteurForm = this.fb.group(
      {
        codemodelecompteur: ['', [Validators.required]],
        libelle: ['', [Validators.required]],
        typedocument: ['', [Validators.required]],
        sequence_1: ['', [Validators.required]],
        prefixe_1: [''],
        sequence_2: ['', [Validators.required]],
        prefixe_2: ['']
      }
    );
  }

  get formCompteur() {
    return this.compteurForm.controls;
  }

  //validation required
  isValidField(label: string): string {
    let status: string = '';
    this.formCompteur[label].valid && this.formCompteur[label].touched
      ? (status = 'is-valid')
      : this.formCompteur[label].invalid && this.formCompteur[label].touched
        ? (status = 'is-invalid')
        : (status = '');
    return status;
  }

  dispatchBudget(_object: Compteur) {
      this.compteurForm.patchValue({
        codemodelecompteur: _object.codemodelecompteur,
        libelle: _object.libelle,
        typedocument: _object.typedocument,
        sequence_1: _object.sequence_1,
        prefixe_1: _object.prefixe_1,
        sequence_2: _object.sequence_2,
        prefixe_2: _object.prefixe_2
      });
  }

    //Recharger la page
  changeCompteurPage(page: number) {
    this.currentPageCompteur = page;
    this.getAllCompteurs(); // recharge les données
  }

  onSubmitCompteur() {
      /** Check formulaire */
      this.msgErros = '';
      const controls = this.compteurForm.controls;
      if (this.compteurForm.invalid) {
        Object.keys(controls).forEach((controlName) =>
          controls[controlName].markAsTouched()
        );
        this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
        return;
      }

      /** 2. prepare data */
      const formValue = this.compteurForm.getRawValue();
      this.compteur.createdby = `${this.user.nom} ${this.user.prenom}`;
      this.compteur.createdat = new Date();

      const _compteur: Compteur = {
        ...this.compteur,
        ...formValue
      };

      /** 3. choices action */
      if (this.actionModalCompteur == 'create') this.createCompteur(_compteur);
      else {
        this.updateCompteur({
          idmodelecompteur: _compteur.idmodelecompteur,
          codemodelecompteur: formValue.codemodelecompteur,
          libelle: formValue.libelle,
          typedocument: formValue.typedocument,
          sequence_1: formValue.sequence_1,
          prefixe_1: formValue.prefixe_1,
          sequence_2: formValue.sequence_2,
          prefixe_2: formValue.prefixe_2
        });
      }
  }

  createCompteur(_compteur: Compteur) {
      const { idmodelecompteur, ...dataToSend } = _compteur;

      this.loading = true;
      this.compteurService.create(dataToSend).subscribe({
        next: (res: any) => {
          //console.log('Resultat:', res);
          if (res.success) {
            this.closeModal('showModalCompteur');
            this.getAllCompteurs();
            this.toastr.success('Compteur créé avec succès.');
          } else {
            this.error = 'Erreur de création';
          }
          this.loading = false;
        },

        error: (err: any) => {
          this.msgErros = err.error.message;
          this.toastr.error(this.msgErros ?? 'Erreur lors de la création.');
          this.loading = false;
        },
      });
  }

  getAllCompteurs() {
      this.params = {
        page: this.currentPageCompteur,
        limit: 5,
      };
      this.compteurService.getAll(this.params).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.compteurs = res.data.data as Compteur[];
            this.totalPagesCompteur = res.data.page;
          }
        },
        error: (err: any) => {
          this.msgErros = err.error.message;
          this.toastr.error(this.msgErros ?? 'Erreur lors de la récupération.');
        },
      });
  }

  updateCompteur(_compteur: any) {
    _compteur.updatedby = this.user.nom + ' ' + this.user.prenom;
    _compteur.updatedat = new Date();
    this.compteurService.update(_compteur).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.closeModal('showModalCompteur');
          this.getAllCompteurs();
          this.toastr.success('Modification effectuée avec succès');
        } else {
          this.error = 'Erreur de modification';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.msgErros = err.error.message;
        this.toastr.error(this.msgErros ?? 'Erreur lors de la modification.');
        this.loading = false;
      },
    });
  }

  modalCreateCompteur() {
    this.actionModalCompteur = 'create';
    this.initFormCompteur();
  }

  modalUpdateCompteur(_object: Compteur) {
    this.compteur = _object;
    this.actionModalCompteur = 'update';
    this.compteurForm.reset();

    this.dispatchBudget(_object);

    this.compteurForm.get('codemodelecompteur')?.disable({ emitEvent: false });

    this.compteurForm.markAllAsTouched();
    this.compteurForm.updateValueAndValidity();


  }

  modalDeleteCompteur(item: Compteur) {
    this.deleteCompteur = item;
  }

  deleteConfirmedCompteur() {
    if (!this.deleteCompteur) return;
    this.compteurService.delete(this.deleteCompteur.idmodelecompteur).subscribe({
      next: (res: any) => {
        console.log('Res:', res);
        if (res.success) {
          this.deleteCompteur = null;
          this.closeModal('deleteModalCompteur');
          this.getAllCompteurs();
          this.toastr.success('Compteur supprimé avec succès.');
        } else {
          this.error = 'Erreur de Suppression';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.msgErros = err.error.message;
        this.toastr.error(this.msgErros ?? 'Erreur lors de la suppression.');
        this.loading = false;
      },
    });
  }

  //charger les journaux
  getAllJournaux() {
    this.loading = true; // Démarrer le chargement
    this.params = {
      page: 1,
      limit: 50,
      search:  '',
    };
    this.journalservice.getAll(this.params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.journaux = res.data.data;
        }
        this.loading = false; // Arrêter le chargement
      },
      error: (err: any) => {
        this.loading = false; // Arrêter le chargement même en cas d'erreur
        this.error = 'Erreur lors du chargement des données';
        this.toastr.error('Erreur lors du chargement des données.');
      }
    });
  }

  // initialiser le formulaire de paramètre
  initFormParametre() {
    this.paramForm = this.fb.group({
      societe: [this.user.idsociete],
      journal: [''],
      compteintermediaire: [''],
      url: ['']
    });
  }

  // Charger les comptes comptables
  getAllComptes(){
    this.plancomptableservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.comptes = res.data;
        }
      }
    });
  }

  editParam(type: string) {
    const value = this.paramForm.get(type)?.value;

    if (!value) {
      this.toastr.warning("Configuration inexistante. Contactez l'administrateur.");
      return;
    }

    const payload = {
      societe: this.paramForm.get('societe')?.value,
      type: type,
      value: value
    };

    this.saveParam(payload);
  }

  // Save paramètre comptable 
  saveParam(payload: any) {
    this.serviceparametre.save(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success('Paramètre comptable enregistré avec succès.');
        }
      }
    });
  }

  // Get paramètre comptable
  getParam() {
    const payload = {
      societe: this.paramForm.get('societe')?.value
    };

    return this.serviceparametre.getAll(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Handle the retrieved parameter values
          this.currentParam = res.data[0];
          this.paramForm.patchValue({
            journal: this.currentParam.journal.id,
            compteintermediaire: this.currentParam.compte.id,
            url: this.currentParam.url
          });
        }
      }
    });
  }

}
