import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { motifModel } from '../models/motif.model';
import { ToastrService } from 'ngx-toastr';
import { MotifService } from '../services/motif.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { CompteurService } from '../services/compteur.service';
import { JournalService } from '../../caisse_journal/services/journal.service';
import { url } from 'inspector';
import { PlancomptableService } from '../../donnee_base/services/plancomptable.service';
import { ParametreComptableService } from '../services/parametrecomptable.service';
import { MotifComponent } from "../composant/motif/motif.component";
import { ConfigComptableComponent } from "../composant/config-comptable/config-comptable.component";
import { CompteurComponent } from "../composant/compteur/compteur.component";
import { ParametreDiverseComponent } from "../composant/parametre-diverse/parametre-diverse.component";

@Component({
  selector: 'app-parametre-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MotifComponent, ConfigComptableComponent, CompteurComponent, ParametreDiverseComponent],
  templateUrl: './parametre-page.component.html',
  styleUrl: './parametre-page.component.css'
})
export class ParametrePageComponent implements OnInit {
  title = 'Paramètres générales';
  //Changement titre modal
  actionModal: string = "create";

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

  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";
  params : any = {};

  //Message suppression
  msgSup: string = "";
  msgSupCompteur: string = "";
  titleMsg: string ="";

  //Element à supprimer
  deleteMotif: any = null;

  activeTab: 'general' | 'notifications' | 'accounting' | 'counter' = 'general';

  constructor(private router: Router, private toastr : ToastrService, private motifservice: MotifService, private compteurService : CompteurService,
    private journalservice: JournalService, private plancomptableservice: PlancomptableService, private serviceparametre: ParametreComptableService
  ) {}

   ngOnInit(): void {
    //Récupérer tous les motifs
    this.getAllMotif();
    //initialiser le formulaire
    this.initForm();

    // Suppresion du motif
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce motif");
    this.msgSupCompteur = MESSAGE_SUPPRESSION_DESCRIPTION("ce compteur");
    this.titleMsg = TITLE_DELETE;
   }

  setActiveTab(tab: 'general' | 'notifications' | 'accounting' | 'counter') {
    this.activeTab = tab;
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

  
}
