import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Compteur } from '../../models/compteur.model';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../../_core/constantes/messages.contantes';
import { ToastrService } from 'ngx-toastr';
import { JournalService } from '../../../caisse_journal/services/journal.service';
import { CompteurService } from '../../services/compteur.service';
import { PlancomptableService } from '../../../donnee_base/services/plancomptable.service';
import { ParametreComptableService } from '../../services/parametrecomptable.service';

@Component({
  selector: 'app-compteur',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './compteur.component.html',
  styleUrl: './compteur.component.css'
})
export class CompteurComponent implements OnInit {

  actionModalCompteur: string = "create";
  optionsSequence2: string[] = [];

  // Définissez des propriétés de pagination
  currentPageCompteur: number = 1;

  // Nombre d'éléments par page
  totalPagesCompteur: number = 0;
  limit: number = 4;

  // Le compteur
  fb: FormBuilder = new FormBuilder();
  deleteCompteur: Compteur | null = null;
  compteurForm: FormGroup = this.fb.group({});
  compteurs: Compteur[] = [];
  compteur: Compteur = {} as Compteur;

  //Message suppression
  msgSup: string = "";
  msgSupCompteur: string = "";
  titleMsg: string = "";

  msgErros : string = "";
  params : any = {};

  loading: Boolean = false;
  error : string = "";

  constructor(private toastr : ToastrService, private compteurService : CompteurService,private journalservice: JournalService, 
    private plancomptableservice: PlancomptableService, private serviceparametre: ParametreComptableService
  ) {}

  ngOnInit(): void {
    // Récupérer tous les compteurs
    this.getAllCompteurs();
    // Initialiser le formulaire du compteur
    this.initFormCompteur();

    // Suppresion du motif
    this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce motif");
    this.msgSupCompteur = MESSAGE_SUPPRESSION_DESCRIPTION("ce compteur");
    this.titleMsg = TITLE_DELETE;
  }

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

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
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

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
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

  //Recharger la page
  changePage(page: number) {
    this.currentPageCompteur = page;
    this.getAllCompteurs(); // recharge les données
  }

}
