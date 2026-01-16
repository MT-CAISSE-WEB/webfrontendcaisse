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
  users : usermodel[] = [];
  //Utilisateur caisse
  usercaisses : AffectationCaisseModel[] = [];
  usercaisse : AffectationCaisseModel = new AffectationCaisseModel();
  usedCaisses : any[] = [];

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

    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette affectation");
    this.titleMsg = TITLE_DELETE;
    this.caisseUsers;

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
          this.caisses = res.data.data;

          // this.usedCaisses = this.caisseUsers.controls
          //   .map((fg: any) => fg.value.idcaisse)
          //   .filter((x: any) => x);

          // this.caisseUsers.controls.forEach((ligne: any) => {
          //   const currentId = ligne.value.idcaisse;

          //   ligne.patchValue({
          //     filteredCaisses: allCaisses.filter((c: any) =>
          //       c.idcaisse === currentId || !this.usedCaisses.includes(c.idcaisse)
          //     )
          //   });
          // });
        }
      }
    });
  }

  filterCaissesForAllRows() {
    const allCaisses =  this.caisses;// les caisses chargées depuis le backend

    // récupérer toutes les caisses déjà choisies
    const used = this.caisseUsers.controls
      .map((fg: any) => fg.value.idcaisse)
      .filter((x: any) => x);

    this.caisseUsers.controls.forEach((ligne: any) => {
      const currentId = ligne.value.idcaisse;

      ligne.patchValue({
        filteredCaisses: allCaisses.filter((c: any) =>
          c.idcaisse === currentId || !used.includes(c.idcaisse)
        )
      }, { emitEvent: false });
    });
  }

  //Initialiser le formulaire
  initForm(){
    this.usercaisseForm = this.fb.group({
      caisseUsers : this.fb.array([]),
      idsociete : [this.userConnect.idsociete ?? null]
    })
  }

  get form() {
    return this.usercaisseForm.controls;
  }

  openDeleteModal(index: number) {
    this.indexToDelete = index;
  }

  // confirmDelete() {
  //   if (this.indexToDelete !== null) {
  //     this.caisseUsers.removeAt(this.indexToDelete);
  //     this.indexToDelete = null;
  //   }
  // }

  confirmDelete() {
    const ligne = this.caisseUsers.at(this.indexToDelete!);
    const id = ligne.value.idutilisateurcaisse;

    this.usercaisseservice.delete(id).subscribe({
      next: (res) => {
        if(res.success){
          this.caisseUsers.removeAt(this.indexToDelete!);
          this.indexToDelete = null;
          this.getAllUserCaisse();
          this.rafreshpage();
        }
      },
      error: err => {
        console.error(err)
      }
    });
  }

  get caisseUsers(): FormArray<FormGroup> {
    return this.usercaisseForm.get('caisseUsers') as FormArray<FormGroup>;
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
          this.usedCaisses = this.usercaisses.map(u => u.idcaisse);
          if(this.usercaisses.length !== 0){
            this.usercaisses.forEach(item => {
              this.caisseUsers.push(
                this.fb.group({  
                  idutilisateurcaisse: [item.idutilisateurcaisse],
                  idcaisse : [item.idcaisse, [Validators.required]],
                  actif: [item.actif],
                  idutilisateur: [item.idutilisateur, [Validators.required]],
                  idsociete : [this.userConnect.idsociete ?? null]
                })
              );
            })
          }
        }
      }
    });
  }

  //Ajouter la ligne dans le tableau
  addLine() {
    const ligne = this.fb.group({
      idutilisateurcaisse: [""],
      idcaisse : ["", [Validators.required]],
      actif: [0],
      idutilisateur: ["", [Validators.required]],
      idsociete : [this.userConnect.idsociete ?? null],
      filteredCaisses: [[]] //Ligne filtrée
    });

    // écoute du changement
    ligne.get('idcaisse')?.valueChanges.subscribe(() => {
      this.filterCaissesForAllRows();
    });

    this.caisseUsers.push(ligne);
  }

  removeLine(index: number) {
    this.caisseUsers.removeAt(index);
  }

  //Confirmer la suppression
  modalDelete(item: AffectationCaisseModel){
    this.deleteElement = item;
  }

  deleteConfirmed(){
    if(!this.deleteElement) return ;
    this.usercaisseservice.delete(this.deleteElement.idutilisateurcaisse).subscribe({
      next: (res) => {
        if (res.success) {
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
    const formValue = this.usercaisseForm.getRawValue();

    const _affectation: any = {...formValue};

    console.log(_affectation);

    /** 3. choices action */
    // if(this.actionModal == "create")this.create(_operation);
    // else this.update(_operation);
    // if (!_caisse.idcaisse) this.create(_caisse);
    // else this.update(_caisse);
  }

  rafreshpage(){
    const currentUrl = this.router.url; 
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  saveLigne(index: number) {
    const ligne = this.caisseUsers.at(index).value;
    
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.usercaisseForm.controls;
    if (this.usercaisseForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

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
