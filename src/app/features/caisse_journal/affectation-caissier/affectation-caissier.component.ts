import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AffectationCaisseModel } from '../models/affectationcaisse.model';
import { CommonModule } from '@angular/common';
import { CaisseService } from '../services/caisse.service';
import { caisseModel } from '../models/caisse.model';
import { usermodel } from '../../administration/model/user.model';
import { userservice } from '../../administration/service/user.service';
import { AffectationCaisseService } from '../services/affectationcaisse.service';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-affectation-caissier',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './affectation-caissier.component.html',
  styleUrl: './affectation-caissier.component.css'
})
export class AffectationCaissierComponent implements OnInit{
  title = "Affectation caissier";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  //Formulaire user caisse
  usercaisseForm : FormGroup = this.fb.group({});
  msgErros : string = "";
  loading: Boolean = false;
  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;
  caisses : caisseModel[] = [];
  allCaisses: caisseModel[] = [];
  users : usermodel[] = [];
  //Utilisateur caisse
  usercaisses : AffectationCaisseModel[] = [];
  usercaisse : AffectationCaisseModel = new AffectationCaisseModel();
  usedCaisses : any[] = [];

  //Changement titre modal
  actionModal: string = 'create';

  //Faire le check selection **********
  objectsSelected : AffectationCaisseModel[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";
  //Element à supprimer 
  deleteElement: any = null;

  indexToDelete: number | null = null;

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});
  //initialiser le filtre
  filters = {
    search: '',
    date: '',
    status: '',
    page: 1
  };

  constructor(private router : Router, private usercaisseservice : AffectationCaisseService,private caisseservice: CaisseService, private us: userservice){}

  ngOnInit(): void{
    //Formulaire de recherche
    this.initSearchForm();
    //Initialiser le formulaire
    this.initForm();
    //Récuperer les utilisateurs caisses
    this.getAllUserCaisse();
    //Récupérer toutes les caisses
    this.getAllcaisses();
    //Obtenir les utilisateurs
    this.getallusers();
    //Formulaire
    // this.filterCaissesForAllRows();

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette affectation");
    this.titleMsg = TITLE_DELETE;

    // écoute du changement
    this.usercaisseForm.get('idcaisse')?.valueChanges.subscribe(() => {
      // this.filterCaissesForAllRows();
    });

    this.searchForm.valueChanges
      .pipe(debounceTime(400),distinctUntilChanged()).subscribe(values => {
      this.applyFilters(values);});
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      search: [''],
      date: [''],
      status: ['']
    });
  }

  //application du filtre
  applyFilters(filters: any) {
    const params = {
      page: this.currentPage,
      limit: this.limit,
      search: filters.search || '',
      actif: filters.status || ''
    };

    this.usercaisseservice.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.usercaisses = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  //Obtenir que les caisses actif
  getAllcaisses(){
    const allactif = {
      page: 1,
      limit: 1000,
      search: '',
      actif: 1,
    };
    this.caisseservice.getAll(allactif).subscribe({
      next : (res) => {
        if(res.success){
          // Toutes les caisses
          this.allCaisses = res.data.data;
          this.caisses = this.allCaisses.filter(caisse => !this.usedCaisses.includes(caisse.idcaisse));
        }
      }
    });
  }

  //Initialiser le formulaire
  initForm(){
    this.usercaisseForm = this.fb.group({
      idutilisateurcaisse: [""],
      idcaisse : ["", [Validators.required]],
      actif: [0],
      idutilisateur: ["", [Validators.required]],
      idsociete : [this.userConnect.idsociete ?? null],
    });
  }

  get form() {
    return this.usercaisseForm.controls;
  }

  //Obtenir les utilisateurs
  getallusers (){
    this.us.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.users = res.data;
         }
      }
    });
  }

  get userConnect(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Récupérer toutes les caisses des caissiers
  getAllUserCaisse(){
    this.params = {
      page: this.currentPage,
      limit: this.limit,
      search: '',
      status: '',
    };
    this.usercaisseservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.usercaisses = res.data.data;
          this.usedCaisses = this.usercaisses.map(u => u.idcaisse).filter(id => id !== null);
          }
      }
    });
  }

  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  //Confirmer la suppression
  modalDelete(item: AffectationCaisseModel){
    this.deleteElement = item;
  }

  //Creation du modal
  modalCreate(){
    this.actionModal = 'create';
    //Initialiser le formulaire
    this.initForm();
    //Charger les utilisateurs caisses
    this.getAllUserCaisse();
    //charger les caisses
    this.getAllcaisses();
  }

  //Modification du modal
  modalUpdate(item: AffectationCaisseModel){
    this.usercaisse = item;
    this.actionModal = 'update';
    this.usercaisseForm.reset();
    //Renitialiser le chargement de la caisse
    this.getAllcaisses();
    //Ajouter que la caisse à modifier
    this.caisses.push(this.usercaisse.caisse);
    //Remplir le formulaire
    this.dispatchAffectation(this.usercaisse);
  }

  dispatchAffectation(_object: AffectationCaisseModel) {
    const status = _object.actif === 1;
    this.usercaisseForm.patchValue({
      idutilisateurcaisse: _object.idutilisateurcaisse,
      idcaisse : _object.idcaisse,
      actif: status,
      idutilisateur: _object.idutilisateur,
      idsociete : _object.idsociete
    });
  }

  deleteConfirmed(){
    if(!this.deleteElement) return ;
    this.usercaisseservice.delete(this.deleteElement.idutilisateurcaisse).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('deleteOrder');
          this.deleteElement = null;
          this.getAllUserCaisse();
        } else {
          this.error = "Erreur de Suppression";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Suppression échec";
        this.loading = false;
      }
    })
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
    this.getAllUserCaisse(); // recharge les données
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.usercaisseForm.controls;
    if (this.usercaisseForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.usercaisseForm.value;
    const _affectation: any = {...formValue, createdby: this.userConnect.nom + ' ' + this.userConnect.prenom};

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_affectation);
    else this.update(_affectation);
  }

  rafreshpage(){
    const currentUrl = this.router.url; 
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  saveLigne() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.usercaisseForm.controls;
    if (this.usercaisseForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    const ligne = this.usercaisseForm.value;
    const _affectation: any = {...ligne, actif: ligne.actif ? 1 : 0, createdby : this.userConnect.codeutilisateur ?? null, updatedby : this.userConnect.codeutilisateur ?? null};
    // Appel API
    if(!_affectation.idutilisateurcaisse){
      this.create(_affectation);
    }else this.update(_affectation);
    
  }

  //Enregistrement de données
  create(_affectation: AffectationCaisseModel) {
    const {idutilisateurcaisse, ...dataToSend} = _affectation;
    this.loading = true;
    this.usercaisseservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllUserCaisse();
          this.rafreshpage();
        } else {
          this.error = "Erreur de création";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Création échec";
        this.loading = false;
      }
    })
  }

  //Modification de données
  update(_affectation: caisseModel){
    this.usercaisseservice.update(_affectation).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllUserCaisse();
          this.rafreshpage();
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
  handleSelectOne(usercaisse: AffectationCaisseModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcaisse == usercaisse.idutilisateurcaisse
    );
    if (index == -1 && actif) this.objectsSelected.push(usercaisse);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.caisses?.length;
  }

}
