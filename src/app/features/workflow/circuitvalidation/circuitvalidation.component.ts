import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { circuitvalidationmodel } from '../model/circuitvalidation.model';
import { circuitvalidationservice } from '../service/circuitvalidation.service';
import { Router } from '@angular/router';
import {
  MESSAGE_CHAMPS_OBLIGATOIRE,
  MESSAGE_SUPPRESSION_DESCRIPTION,
  TITLE_DELETE,
} from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';
import { societemodel } from '../../structure/model/societe.model';
import { sitemodel } from '../../structure/model/site.model';
import { departementmodel } from '../../structure/model/departement.model';
import { societeservice } from '../../structure/service/societe.service';
import { siteservice } from '../../structure/service/site.service';
import { departementservice } from '../../structure/service/departement.service';
import { usermodel } from '../../administration/model/user.model';
import { userservice } from '../../administration/service/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-circuitvalidation',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './circuitvalidation.component.html',
  styleUrl: './circuitvalidation.component.css',
})
export class CircuitvalidationComponent implements OnInit {
  title = 'Circuit Validation ';
  params: any = {};
  breadCrumbs: any = {};
  fb: FormBuilder = new FormBuilder();
  circuitvalidations: circuitvalidationmodel[] = [];
  circuitvalidation: circuitvalidationmodel = new circuitvalidationmodel();
  filtrecircuitvalidation: circuitvalidationmodel[] = [];
  msgErros: string = '';
  loading: Boolean = false;
  circuitvalidationForm: FormGroup = this.fb.group({});
  iscircuitvalidateur: Boolean = false;
  iscircuitvalidation: Boolean = false;

  //Société Site Dept
  societes: societemodel[] = [];
  sites: sitemodel[] = [];
  departements: departementmodel[] = [];
  utilisateurs: usermodel[] = [];

  //Tri et recherche
  searchtext: string = '';
  sortby: string = 'code';
  sortdirection: 'asc' | 'desc' = 'asc';
  selectedstatus: string = '';
  activeTab: string = 'all';
  selectedOrigine: string = '';
  selectedDestination: string = '';
  selecteddate: string = '';

  // Détermine si toutes les lignes sont selectionnées
  checkAllRow: any;
  error: string = '';

  //Pagination
  pageSize: number = 10;
  currentPage: number = 1;

  // Définissez des propriétés de pagination
  //currentPage: number = 1;
  // Nombre d'éléments par page
  limit: number = 5;

  //Faire le check selection **********
  objectsSelected: circuitvalidationmodel[] = [];
  selectedItems: any[] = [];

  //Changement titre modal
  actionModal: string = 'create';

  //Message suppression
  msgSup: string = '';
  titleMsg: string = '';

  //Element à supprimer
  deletetcircuitvalidation: any = null;

  utilisateursFiltres: usermodel[] = [];

  currentStep = 1;
  totalSteps = 3;

  constructor(
    private cv: circuitvalidationservice,
    private soc: societeservice,
    private st: siteservice,
    private dep: departementservice,
    private us: userservice,
    private toast: ToastrService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    //Afficher toutes les devises
    this.getallcircuitvalidation();
    this.loadsociete();
    this.loadsite();
    this.loaddepartement();
    this.loadutilisateur();
    //Initialisation du formulaire
    this.initForm();
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION('ce Circuit de validation');
    this.titleMsg = TITLE_DELETE;

    // Quand typeentite change, on filtre les utilisateurs et on clear les validateurs
    this.circuitvalidationForm
      .get('typeentite')
      ?.valueChanges.subscribe((value) => {
        console.log('typeentite changed:', value);
        this.filtrerUtilisateurs(value);
        // this.etapes.controls.forEach(etapeGroup => {
        //   const validateurs = etapeGroup.get('validateurs') as FormArray;
        //   validateurs.clear();
        // });
      });
  }

  getallcircuitvalidation() {
    this.cv.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.circuitvalidations = res.data;
          this.filtrecircuitvalidation = [...this.circuitvalidations];
        }
      },
    });
  }

  // Navigation vers une étape spécifique
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  // Étape suivante
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  // Étape précédente
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  loadsociete() {
    this.soc.getAll().subscribe({
      next: (res) => {
        this.societes = res.data;
      },
    });
  }

  loadsite() {
    this.st.getAll().subscribe({
      next: (res) => {
        this.sites = res.data;
      },
    });
  }

  loaddepartement() {
    this.dep.getAll().subscribe({
      next: (res) => {
        this.departements = res.data;
      },
    });
  }

  loadutilisateur() {
    this.us.getAll().subscribe({
      next: (res) => {
        this.utilisateurs = res.data;
      },
    });
  }

  filtrerUtilisateurs(typeEntite: string | null) {
    if (!this.utilisateurs?.length) {
      this.utilisateursFiltres = [];
      return;
    }

    if (!typeEntite) {
      this.utilisateursFiltres = [...this.utilisateurs];
      return;
    }

    this.utilisateursFiltres = this.utilisateurs.filter((u) => {
      switch (typeEntite) {
        case 'societe':
          return u.typeentitesociete === 1;

        case 'site':
          return u.typeentitesite === 1;

        default:
          return true;
      }
    });
  }

  getSocieteName(id: string): string {
    const soc = this.societes.find((s) => s.idsociete === id);
    return soc ? soc.raisonsociale : '-';
  }

  getSiteName(id: string): string {
    const site = this.sites.find((s) => s.idsite === id);
    return site ? site.libelle : '-';
  }

  // filterByDevise() {
  //   this.filtretauxdevises = this.tauxdevises.filter(item => {
  //     const matchOrigine = this.selectedOrigine === "" || item.iddeviseorigine === this.selectedOrigine;
  //     const matchDest = this.selectedDestination === "" || item.iddevisedestination === this.selectedDestination;
  //     return matchOrigine && matchDest;
  // });
  // }

  // filterByDate() {
  //   const selected = (this.selecteddate || "").toString().substring(0, 10);

  //   this.filtretauxdevises = this.tauxdevises.filter(item => {
  //     const itemDate = item.datecours
  //       ? item.datecours.toString().substring(0, 10)
  //       : "";

  //     return selected === "" || itemDate === selected;
  //   });

  //   this.currentPage = 1; // pour réinitialiser la pagination
  // }

  // Nombre total de pages calculé dynamiquement
  get totalPages(): number {
    return Math.ceil(this.filtrecircuitvalidation.length / this.pageSize);
  }

  // Liste des éléments visibles pour la page courante
  get pagedcircuitvalidation(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtrecircuitvalidation.slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  searchtauxdevise() {
    const term = this.normalize(this.searchtext);

    this.filtrecircuitvalidation = this.circuitvalidations.filter((c) => {
      const idcircuitvalidation = this.normalize(c.idcircuitvalidation);
      const codecircuitvalidation = this.normalize(c.codecircuitvalidation);
      const typeentite = this.normalize(c.typeentite);
      const typeaction = this.normalize(c.typeaction);
      const idsociete = this.normalize(c.idsociete);
      const idsite = this.normalize(c.idsite);

      const matchtext =
        idcircuitvalidation.includes(term) ||
        codecircuitvalidation.includes(term) ||
        typeentite.includes(term) ||
        typeaction.includes(term) ||
        idsociete.includes(term) ||
        idsite.includes(term);

      // const matchstatus =
      //   this.selectedstatus === ""
      //     ? true
      //     : tauxdevise.actif.toString() === this.selectedstatus;

      return matchtext;
    });

    this.currentPage = 1;
  }

  //normaliser le test pour la recherche
  normalize(value: any): string {
    return (value || '')
      .toString()
      .toLowerCase()
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .trim();
  }

  initForm(): void {
    this.circuitvalidationForm = this.fb.group({
      idcircuitvalidation: [null],
      codecircuitvalidation: ['', Validators.required],
      typeentite: [''],
      typeaction: [''],
      idsociete: [null],
      idsite: [null],
      etapes: this.fb.array([]),
    });
  }

  //Gestion des étapes et des validateurs
  get etapes(): FormArray {
    return this.circuitvalidationForm.get('etapes') as FormArray;
  }

  addEtape() {
    this.etapes.push(
      this.fb.group({
        rang: [this.etapes.length + 1],
        nombrevalidateur: [0],
        validateurs: this.fb.array([]),
      }),
    );
  }

  getValidateurs(index: number): FormArray {
    return this.etapes.at(index).get('validateurs') as FormArray;
  }

  addValidateur(etapeIndex: number) {
    this.getValidateurs(etapeIndex).push(
      this.fb.group({
        idutilisateur: ['', Validators.required],
      }),
    );
  }

  removeValidateur(etapeIndex: number, valIndex: number) {
    this.getValidateurs(etapeIndex).removeAt(valIndex);
  }

  removeEtape(index: number) {
    this.etapes.removeAt(index);

    // Recalcul du rang (optionnel mais propre)
    this.etapes.controls.forEach((ctrl, i) => {
      ctrl.get('rang')?.setValue(i + 1);
    });
  }

  get form() {
    return this.circuitvalidationForm.controls;
  }

  dispatchcircuitvalidation(item: circuitvalidationmodel) {
    this.circuitvalidation = item;

    this.circuitvalidationForm.patchValue({
      idcircuitvalidation: item.idcircuitvalidation,
      codecircuitvalidation: item.codecircuitvalidation,
      typeentite: item.typeentite,
      typeaction: item.typeaction,
      idsociete: item.idsociete,
      idsite: item.idsite,
    });
  }

  //   // Important : recalculer la liste destination après patch
  //   setTimeout(() => this.filterDestinationList(), 10);
  // }

  dispatchcircuitvalidationduplicate(item: circuitvalidationmodel) {
    this.circuitvalidation = item;

    this.circuitvalidationForm.patchValue({
      codecircuitvalidation: '',
      typeentite: item.typeentite,
      typeaction: item.typeaction,
      idsociete: item.typeaction,
      idsite: item.idsite,
    });
  }

  //   // Important : recalculer la liste destination après patch
  //   setTimeout(() => this.filterDestinationList(), 10);
  // }

  isValidField(field: string): string {
    const control = this.circuitvalidationForm.get(field);
    return control && control.invalid && (control.touched || control.dirty)
      ? 'is-invalid'
      : '';
  }

  //selectionner une instance dans une liste
  // handleSelectOne(tauxdevise: tauxdevisemodel, actif: any) {
  //   const index = this.objectsSelected.findIndex(
  //     (el) => el.idtauxdevise ==tauxdevise.idtauxdevise
  //   );
  //   if (index == -1) this.objectsSelected.push(tauxdevise);
  //   if (index != -1) this.objectsSelected.splice(index, 1);
  //   this.checkAllRow = this.objectsSelected?.length == this.tauxdevise?.length;
  // }

  //Soumission du formulaire
  onsubmit() {
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.circuitvalidationForm.controls;
    if (this.circuitvalidationForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched(),
      );
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.circuitvalidationForm.value;

    if (formValue.etapes && Array.isArray(formValue.etapes)) {
      formValue.etapes = formValue.etapes.map((etape: any) => ({
        ...etape,
        nombrevalidateur: etape.validateurs ? etape.validateurs.length : 0,
      }));
    }

    const _circuitvalidation: circuitvalidationmodel = {
      ...this.circuitvalidation,
      ...formValue,
    };

    if (this.actionModal === 'create') {
      this.create(_circuitvalidation);
      this.refreshpage();
    } else if (this.actionModal === 'update') {
      this.update(_circuitvalidation);
      this.refreshpage();
    } else {
      this.create(_circuitvalidation);
      this.refreshpage();
    }
  }

  refreshpage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  create(circuitvalidation: any) {
    this.cv.createcomplete(circuitvalidation).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getallcircuitvalidation();
          this.refreshpage();
          this.toast.success(res.message);
          //this.router.navigate(["/"])
        }
      },
      error: (err) => {
        this.toast.error(err.error.message);
      },
    });
  }

  update(circuitvalidation: circuitvalidationmodel) {
    this.cv.update(circuitvalidation).subscribe({
      next: (res: any) => {
        this.getallcircuitvalidation();
        this.refreshpage();
        this.toast.success(res.message);
        //this.router.navigate(["/"])
      },
      error: (err) => {
        this.toast.error(err.error.message);
      },
    });
  }

  closeModal(modal: string) {
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  modalCreate() {
    this.actionModal = 'create';
    this.circuitvalidationForm.reset();
    this.etapes.clear();
  }

  modalUpdate(circuit: any) {
    this.actionModal = 'update';
    this.circuitvalidation = circuit;

    this.initForm();
    this.dispatchcircuitvalidation(circuit);

    const etapesFA = this.etapes;
    etapesFA.clear();

    circuit.etapes.forEach((etape: any) => {
      const validateursFA = this.fb.array<FormGroup>([]);

      etape.validateurs.forEach((validateur: any) => {
        validateursFA.push(
          this.fb.group({
            idutilisateur: [validateur.idutilisateur, Validators.required],
          }),
        );
      });

      etapesFA.push(
        this.fb.group({
          rang: [etape.rang, Validators.required],
          validateurs: validateursFA,
        }),
      );
    });

    const typeEntite = this.circuitvalidationForm.get('typeentite')?.value;
    this.filtrerUtilisateurs(typeEntite);
  }

  modalDuplicate(_object: circuitvalidationmodel) {
    this.circuitvalidation = _object;
    this.actionModal = 'duplicate';
    this.circuitvalidationForm.reset();

    this.dispatchcircuitvalidationduplicate(this.circuitvalidation);
  }

  modalView(_object: circuitvalidationmodel) {
    this.circuitvalidation = _object;
    this.actionModal = 'view';
    this.circuitvalidationForm.reset();
    this.dispatchcircuitvalidation(_object);
  }

  modalDelete(item: circuitvalidationmodel) {
    this.deletetcircuitvalidation = item;
  }

  deleteConfirmed() {
    if (!this.deletetcircuitvalidation) return;
    this.cv
      .delete(this.deletetcircuitvalidation.idcircuitvalidation)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.deletetcircuitvalidation = null;
            this.closeModal('deleteOrder');
            this.getallcircuitvalidation();
            this.refreshpage();
            this.toast.warning(res.message);
          } else {
            this.error = 'Erreur de Suppression';
            this.toast.error(res.message);
          }
          this.loading = false;
        },
        error: (err) => {
          this.toast.error(err.error.message);
          this.error = 'Suppression échec';
          this.loading = false;
        },
      });
  }
}
