import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { caisseModel } from '../models/caisse.model';
import { CaisseService } from '../services/caisse.service';
import { Router } from '@angular/router';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';
import { journalModel } from '../models/journal.model';
import { JournalService } from '../services/journal.service';

import { PlancomptableService } from '../../donnee_base/services/plancomptable.service';
import { plancomptableModel } from '../../donnee_base/models/plancomptable.model';
import { devisemodel } from '../../donnee_base/donnee_base/model/devise.model';
import { deviseservice } from '../../donnee_base/donnee_base/service/devise.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-caisse',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbModalModule],
  templateUrl: './caisse.component.html',
  styleUrl: './caisse.component.css'
})
export class CaisseComponent implements OnInit{
  title = "Caisse";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  caisses : caisseModel[] = [];
  allCaisses : caisseModel[] = []; // Toutes les caisses non filtrées
  caisse : caisseModel = new caisseModel();
  msgErros : string = "";
  loading: Boolean = false;
  caisseForm : FormGroup = this.fb.group({});
  journaux : journalModel[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  //Faire le check selection **********
  objectsSelected : caisseModel[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Ramener la devise
  devises : devisemodel[] = [];
  devise : devisemodel = new devisemodel();

  //Changement titre modal
  actionModal: string = "create";

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  //Element à supprimer 
  deleteCaisse: any = null;

  // Indicateur pour la suppression multiple
  isMultipleDelete: boolean = false;

  comptes : plancomptableModel[] = [];

  // Filtre actif pour les onglets (all, active, inactive)
  activeFilter: string = 'all';

  //Méthode pour obtenir le nombre d'éléments par statut
  getStatusCount(status: number | ''): number {
    if (status === '') return this.allCaisses.length;
    return this.allCaisses.filter(caisse => caisse.actif === status).length;
  }

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});
  // Formulaire pour le recalcul du solde
  recalcForm: FormGroup = this.fb.group({});
  // Caisse ciblée pour le recalcul
  recalcCaisse: caisseModel | null = null;
  @ViewChild('recalcModalTemplate') recalcModalTemplate!: TemplateRef<any>;
  modalRef?: NgbModalRef;
  recalcLoading: boolean = false;
  recalcProgress: number = 0;
  private recalcProgressInterval?: number;

  constructor(private caisseservice: CaisseService, private toastr : ToastrService,
              private journalservice: JournalService,
              private plancomptableservice: PlancomptableService,
              private router: Router, private ds:deviseservice,
              private modalService: NgbModal){}

  ngOnInit(): void {
      //Afficher toutes les devises
      this.getalldevises();
      //Afficher tous les caisses
      this.getAllcaisses();
      //Ramener tous les journaux
      this.getAllJournaux();
      // Ramener tous les comptes
      this.getAllComptes();
      //Initialisation du formulaire
      this.initForm();
      //Initialisation du formulaire de recherche
      this.initSearchForm();
      // Initialisation du formulaire de recalcul
      this.initRecalcForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette caisse");
      this.titleMsg = TITLE_DELETE

      this.searchForm.valueChanges
            .pipe(debounceTime(400),distinctUntilChanged()).subscribe(values => {
            this.applyFilters(values);});
  }

  initRecalcForm(){
    this.recalcForm = this.fb.group({
      startDate: [null, [Validators.required]]
    });
  }

  openRecalcModal(caisse?: caisseModel): void {
    this.recalcForm.reset();
    this.recalcCaisse = caisse || null;
    this.recalcProgress = 0;
    this.recalcLoading = false;
    if (this.recalcModalTemplate) {
      this.modalRef = this.modalService.open(this.recalcModalTemplate, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'lg'
      });
    }
  }

  submitRecalc(): void {
    if (this.recalcForm.invalid) {
      Object.keys(this.recalcForm.controls).forEach(controlName => this.recalcForm.get(controlName)?.markAsTouched());
      this.toastr.warning('Veuillez sélectionner une date de départ.');
      return;
    }

    const startDate = this.recalcForm.value.startDate;
    const payload: any = { startDate };
    if (this.recalcCaisse && this.recalcCaisse.idcaisse) payload.idcaisse = this.recalcCaisse.idcaisse;

    this.recalcLoading = true;
    this.startRecalcProgress();

    this.caisseservice.recalculate(payload).subscribe({
      next: (res) => {
        this.stopRecalcProgress();
        this.recalcProgress = 100;
        if (res?.success) {
          this.toastr.success('Recalcul lancé avec succès.');
          this.refreshData();
          setTimeout(() => this.closeRecalcModal(), 200);
        } else {
          this.toastr.error('Échec du recalcul.');
        }
        this.recalcLoading = false;
      },
      error: (err) => {
        this.stopRecalcProgress();
        this.recalcProgress = 100;
        this.recalcLoading = false;
        this.toastr.error('Erreur lors du recalcul.', err?.message || '');
      }
    });
  }

  private startRecalcProgress(): void {
    this.recalcProgress = 0;
    this.recalcProgressInterval = window.setInterval(() => {
      if (this.recalcProgress < 90) {
        this.recalcProgress = Math.min(90, this.recalcProgress + Math.floor(Math.random() * 8) + 2);
      } else if (this.recalcProgress < 98) {
        this.recalcProgress += 1;
      }
    }, 300);
  }

  private stopRecalcProgress(): void {
    if (this.recalcProgressInterval) {
      clearInterval(this.recalcProgressInterval);
      this.recalcProgressInterval = undefined;
    }
  }

  closeRecalcModal(): void {
    this.modalRef?.close();
    this.stopRecalcProgress();
    this.recalcLoading = false;
    this.recalcProgress = 0;
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      search: [''],
      date: [''],
      status: ['']
    });
  }

  //application du filtre de recherche
  applyFilters(filters: any) {
    let filteredCaisses = [...this.allCaisses];

    // Appliquer le filtre de recherche textuelle
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredCaisses = filteredCaisses.filter(caisse =>
        caisse.codecaisse?.toLowerCase().includes(searchTerm) ||
        caisse.libelle?.toLowerCase().includes(searchTerm) ||
        caisse.devise?.codedevise?.toLowerCase().includes(searchTerm) ||
        caisse.compte?.numcompte?.toLowerCase().includes(searchTerm) ||
        caisse.journal?.codejournal?.toLowerCase().includes(searchTerm)
      );
    }

    // Appliquer le filtre de statut depuis le formulaire de recherche
    if (filters.status && filters.status !== '') {
      if (filters.status === '1') {
        filteredCaisses = filteredCaisses.filter(caisse => caisse.actif === 1);
      } else if (filters.status === '0') {
        filteredCaisses = filteredCaisses.filter(caisse => caisse.actif === 0);
      }
    } else {
      // Si pas de filtre de statut dans la recherche, appliquer le filtre des onglets
      this.applyFilterToFilteredData(filteredCaisses);
      return;
    }

    // Appliquer le filtre des onglets sur les données déjà filtrées
    this.applyFilterToFilteredData(filteredCaisses);
  }

  // Appliquer le filtre des onglets sur des données déjà filtrées
  private applyFilterToFilteredData(filteredData: caisseModel[]): void {
    switch (this.activeFilter) {
      case 'active':
        this.caisses = filteredData.filter(caisse => caisse.actif === 1);
        break;
      case 'inactive':
        this.caisses = filteredData.filter(caisse => caisse.actif === 0);
        break;
      default: // 'all'
        this.caisses = filteredData;
        break;
    }
  }

  getAllcaisses(){
    this.loading = true; // Démarrer le chargement
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.caisseservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.allCaisses = res.data.data; // Stocker toutes les caisses
          this.totalPages = res.data.totalPages;
          this.applyFilter(); // Appliquer le filtre actif
        }
        this.loading = false; // Arrêter le chargement
      },
      error: (err) => {
        this.loading = false; // Arrêter le chargement même en cas d'erreur
        this.toastr.error('Erreur lors du chargement des caisses. Veuillez réessayer.');
      }
    });
  }

  getalldevises (){
    this.params = {
      page: this.currentPage,
      limit: 20
    };
    this.ds.getAll(this.params).subscribe({
      next : (res) => {
         if(res.success){
            this.devises = res.data;
         }
      }
    });
  }

  getAllJournaux(){
    const params = {
      page: 1,
      limit: 1000
    };
    this.journalservice.getAll(params).subscribe({
      next : (res) => {
        if(res.success){
          this.journaux = res.data.data;
        }
      }
    });
  }

  getAllComptes(){
    this.plancomptableservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.comptes = res.data;
          this.comptes = this.comptes.filter(compte => compte.numcompte.startsWith('5'));
        }
      }
    });
  }

  //création du formulaire
  initForm(): void{
    this.caisseForm = this.fb.group({
      codecaisse : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      idjournal : ["", [Validators.required]],
      iddevise : ["", [Validators.required]],
      idcompte : ["", [Validators.required]],
      dateinitialisation : ["", [Validators.required]],
      soldeinitialisation : [0],
      seuilminimal : [0],
      idsite : [this.user.idsite ?? null],
      idsociete : [this.user.idsociete ?? null],
      actif : [true],
    })
  }

  get form() {
    return this.caisseForm.controls;
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatDate(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  dispatchCaisse(_object: caisseModel){
    const status = _object.actif === 1;
    this.caisseForm.patchValue({
      codecaisse : _object.codecaisse,
      libelle : _object.libelle,
      idsociete: _object.societe.idsociete,
      iddevise: _object.devise.iddevise,
      idjournal: _object.journal.idjournal,
      idsite: _object.site.idsite,
      idcompte: _object.compte.idcompte,
      dateinitialisation: _object.dateinitialisation ? this.formatDate(_object.dateinitialisation) : null,
      soldeinitialisation: _object.soldeinitialisation,
      seuilminimal : _object.seuilminimal,
      actif : status
    });

    if(_object.dateinitialisation){
      this.caisseForm.get('dateinitialisation')?.disable({ emitEvent : false});
    }else{
      this.caisseForm.get('dateinitialisation')?.enable({ emitEvent : false});
    }

    if (_object.soldeinitialisation !== null && _object.soldeinitialisation !== undefined) {
      this.caisseForm.get("soldeinitialisation")?.disable({ emitEvent: false });
    } else {
      this.caisseForm.get("soldeinitialisation")?.enable({ emitEvent: false });
    }
  }

  //validation required
  isValidField(label: string): string {
    let status: string = "";
    this.form[label].valid && this.form[label].touched ? status = 'is-valid' :
      this.form[label].invalid && this.form[label].touched ? status = 'is-invalid' : status = '';
    return status;
  }

  //vérifie si _id est inclus dans un tableau d'IDs stocké
  isChecked(_id: string) {
    const ids: string[] = this.objectsSelected.map((el) => el.idcaisse);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(journal: caisseModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcaisse == journal.idcaisse
    );
    if (index == -1 && actif) this.objectsSelected.push(journal);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.caisses?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.caisses.slice();
    else this.objectsSelected = [];
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllcaisses(); // recharge les données
  }

  // Actualiser les données sans refresh complet de la page
  refreshData(): void {
    this.currentPage = 1; // Remettre à la première page
    this.objectsSelected = []; // Vider la sélection
    this.checkAllRow = false; // Désélectionner tout
    this.getAllcaisses(); // Recharger les données
  }

  // Appliquer le filtre selon le statut actif/inactif
  applyFilter(): void {
    switch (this.activeFilter) {
      case 'active':
        this.caisses = this.allCaisses.filter(caisse => caisse.actif === 1);
        break;
      case 'inactive':
        this.caisses = this.allCaisses.filter(caisse => caisse.actif === 0);
        break;
      default: // 'all'
        this.caisses = [...this.allCaisses];
        break;
    }
  }

  // Changer le filtre actif
  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1; // Remettre à la première page
    this.objectsSelected = []; // Vider la sélection
    this.checkAllRow = false; // Désélectionner tout
    this.applyFilter();
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.caisseForm.controls;
    if (this.caisseForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.caisseForm.value;

    const _caisse: caisseModel = {
      ...this.caisse,
      ...formValue,
      actif: formValue.actif ? 1 : 0,
      createdby: this.user.nom + '' + this.user.prenom  
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_caisse);
    else this.update(_caisse);
  }

  //Enregistrement de données
  create(_caisse: caisseModel) {
    const {idcaisse, ...dataToSend} = _caisse;
    this.loading = true;
    this.caisseservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.toastr.success('Caisse créée avec succès.');
          // Recharger la page après l'affichage du toast
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          this.error = "Erreur de création";
          this.toastr.error('Erreur lors de la création de la caisse.');
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Création échec";
        this.loading = false;
        this.toastr.error('Échec de la création de la caisse.');
      }
    })
  }

  //Modification de données
  update(_caisse: caisseModel){
    this.loading = true;
    this.caisseservice.update(_caisse).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.toastr.success('Caisse modifiée avec succès.');
          // Recharger la page après l'affichage du toast
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          this.error = "Erreur de modification";
          this.toastr.error('Erreur lors de la modification de la caisse.');
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Modification échec";
        this.loading = false;
        this.toastr.error('Échec de la modification de la caisse.');
      }
    })
  }

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  modalCreate(){
    this.actionModal = "create";
    this.initForm();
  }

  modalUpdate(_object: caisseModel){
    this.caisse = _object;
    this.actionModal = "update";
    this.caisseForm.reset();
    this.dispatchCaisse(_object);
  }

  modalDelete(item: caisseModel){
    this.deleteCaisse = item;
  }

  // Suppression individuelle d'une caisse
  deleteCaisseItem(caisse: caisseModel): void {
    // Configurer le modal pour la suppression individuelle
    this.isMultipleDelete = false;
    this.deleteCaisse = caisse;
    this.titleMsg = 'Suppression individuelle';
    this.msgSup = `Êtes-vous sûr de vouloir supprimer la caisse "${caisse.libelle}" ?`;

    // Ouvrir le modal de suppression
    this.openDeleteModal();
  }

  // Suppression en masse des caisses sélectionnées
  deleteMultiple(): void {
    if (this.objectsSelected.length === 0) {
      this.toastr.warning('Veuillez sélectionner au moins une caisse à supprimer.');
      return;
    }

    // Configurer le modal pour la suppression multiple
    this.isMultipleDelete = true;
    this.titleMsg = 'Suppression multiple';
    this.msgSup = this.objectsSelected.length === 1
      ? `Êtes-vous sûr de vouloir supprimer la caisse "${this.objectsSelected[0].libelle}" ?`
      : `Êtes-vous sûr de vouloir supprimer ${this.objectsSelected.length} caisses sélectionnées ?`;

    // Ouvrir le modal de suppression
    this.openDeleteModal();
  }

  // Méthode pour ouvrir le modal de suppression
  openDeleteModal(): void {
    const modalEl = document.getElementById('deleteOrder');
    if (modalEl) {
      modalEl.classList.add('show');
      modalEl.setAttribute('aria-hidden', 'false');
      modalEl.style.display = 'block';
      document.body.classList.add('modal-open');

      // Créer et ajouter le backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  deleteConfirmed(){
    if (this.isMultipleDelete) {
      // Suppression multiple
      this.loading = true;
      let successCount = 0;
      let errorCount = 0;

      // Boucler sur chaque élément sélectionné et appeler l'API de suppression
      const deletePromises = this.objectsSelected.map(caisse =>
        this.caisseservice.delete(caisse.idcaisse).toPromise()
          .then(() => {
            successCount++;
          })
          .catch(() => {
            errorCount++;
          })
      );

      Promise.allSettled(deletePromises)
        .then(() => {
          this.closeModal('deleteOrder');
          this.objectsSelected = []; // Vider la sélection
          this.checkAllRow = false; // Désélectionner tout
          this.isMultipleDelete = false; // Réinitialiser l'indicateur
          this.loading = false;

          if (errorCount === 0) {
            this.toastr.success(`${successCount} caisse(s) supprimée(s) avec succès.`);
          } else if (successCount === 0) {
            this.toastr.error('Échec de la suppression de toutes les caisses.');
          } else {
            this.toastr.warning(`${successCount} caisse(s) supprimée(s), ${errorCount} échec(s).`);
          }

          // Recharger la page après la suppression
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        });
    } else {
      // Suppression individuelle
      if (!this.deleteCaisse) return;
      this.loading = true;
      this.caisseservice.delete(this.deleteCaisse.idcaisse).subscribe({
        next: (res) => {
          if (res.success) {
            this.deleteCaisse = null;
            this.closeModal('deleteOrder');
            this.toastr.success('Caisse supprimée avec succès.');
            // Recharger la page après la suppression individuelle aussi
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            this.error = "Erreur de Suppression";
            this.toastr.error('Erreur lors de la suppression de la caisse.');
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = "Suppression échec";
          this.loading = false;
          this.toastr.error('Échec de la suppression de la caisse.');
        }
      })
    }
  }
  
}