import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { centreanalytiqueModel } from '../models/centreanalytique.model';
import { CentreAnalytiqueService } from '../services/centreanalytique.service';
import { CommonModule } from '@angular/common';
import { MESSAGE_CHAMPS_OBLIGATOIRE, MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';
import { Router } from '@angular/router';

// ADD-INS
declare var $: any;

@Component({
  selector: 'app-centreanalytique',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './centreanalytique.component.html',
  styleUrl: './centreanalytique.component.css'
})

export class CentreanalytiqueComponent implements OnInit{
  title = "Centre analytique";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  centres : centreanalytiqueModel[] = [];
  centre : centreanalytiqueModel = new centreanalytiqueModel();
  msgErros : string = "";
  loading: Boolean = false;
  centreanalytiqueForm : FormGroup = this.fb.group({});


  //Faire le check selection **********
  objectsSelected : centreanalytiqueModel[] = [];
  selectedItems : any[] = [];
  // Détermine si toutes les lignes sont selectionnées
  checkAllRow : any;
  error : string = "";

  //Changement titre modal
  actionModal: string = "create";

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  //Element à supprimer 
  deletecentre: any = null;


  constructor(private centreanalytiqueservice: CentreAnalytiqueService,
              private router: Router){}

  ngOnInit(): void {
      //Afficher tous les centres
      this.getAllcentres();
      //Initialisation du formulaire
      this.initForm();
      this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("ce centre analytique");
      this.titleMsg = TITLE_DELETE;
  }

  getAllcentres(){
    this.centreanalytiqueservice.getAll().subscribe({
      next : (res) => {
        if(res.success){
          this.centres = res.data;

          const table = $('#dataTable').DataTable();
          table.destroy();

          setTimeout(() => $('#dataTable').DataTable({
            language: {
            search: "Rechercher :",
            lengthMenu: "Afficher _MENU_ éléments",
            info: "Affichage de _START_ à _END_ sur _TOTAL_ éléments",
            infoEmpty: "Affichage de 0 à 0 sur 0 élément",
            infoFiltered: "(filtré de _MAX_ éléments au total)",
            loadingRecords: "Chargement...",
            processing: "Traitement...",
            zeroRecords: "Aucun élément correspondant trouvé",
            emptyTable: "Aucune donnée disponible dans le tableau",
            paginate: {
              first: "Premier",
              previous: "Précédent",
              next: "Suivant",
              last: "Dernier"
            },
            aria: {
              sortAscending: ": activer pour trier la colonne par ordre croissant",
              sortDescending: ": activer pour trier la colonne par ordre décroissant"
            }
            },
            responsive: true,
            ordering: true,
            lengthMenu: [
                [10, 25, 50, 100, 250, 500, -1],
                [10, 25, 50, 100, 250, 500, "Tous"]
              ]
          }), 0);
        }
      }
    });
  }

  //Création du formulaire
  initForm(): void{
    this.centreanalytiqueForm = this.fb.group({
      codecentreanalytique : ["", [Validators.required]],
      libelle : ["", [Validators.required]],
      idsociete : ["6591AC47-11AA-4664-838E-B977292814FE", [Validators.required]],
      actif : [true],
    })
  }

  ngAfterViewInit(): void {
    // Attendre que le DOM soit chargé
    $('#dataTable').DataTable({
      paging: true,
      searching: true,
      ordering: true,
      info: true,
      responsive: true,
      language: {
        search: "Rechercher :",
        lengthMenu: "Afficher _MENU_ lignes",
        info: "Affichage de _START_ à _END_ sur _TOTAL_ lignes",
        paginate: {
          previous: "Précédent",
          next: "Suivant"
        }
      }
    });
  }

  get form() {
    return this.centreanalytiqueForm.controls;
  }

  dispatchcentres(_object: centreanalytiqueModel){
    const status = _object.actif === 1;
    this.centreanalytiqueForm.patchValue({
      codecentreanalytique : _object.codecentreanalytique,
      libelle : _object.libelle,
      idsociete: _object.idsociete,
      actif : status
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
    const ids: string[] = this.objectsSelected.map((el) => el.idcentreanalytique);
    return ids.includes(_id);
  }

  //selectionner une instance dans une liste
  handleSelectOne(centre: centreanalytiqueModel, actif: any) {
    const index = this.objectsSelected.findIndex(
      (el) => el.idcentreanalytique == centre.idcentreanalytique
    );
    if (index == -1 && actif) this.objectsSelected.push(centre);
    if (index != -1 && !actif) this.objectsSelected.splice(index, 1);
    this.checkAllRow = this.objectsSelected?.length == this.centres?.length;
  }

  //Sélection/ Désélection de tous les éléments
  handleSelectAll($event: any) {
    this.checkAllRow = $event;
    if (this.checkAllRow) this.objectsSelected = this.centres.slice();
    else this.objectsSelected = [];
  }


  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    this.msgErros = '';
    const controls = this.centreanalytiqueForm.controls;
    if (this.centreanalytiqueForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      return;
    }

    /** 2. prepare data */
    const formValue = this.centreanalytiqueForm.value;

    const _centres: centreanalytiqueModel = {
      ...this.centre,
      ...formValue,
      actif: formValue.actif ? 1 : 0  
    };

    /** 3. choices action */
    if(this.actionModal == "create")this.create(_centres);
    else this.update(_centres);
    // if (!_centres.idcentreanalytiques) this.create(_centres);
    // else this.update(_centres);
  }

  //Enregistrement de données
  create(_centres: centreanalytiqueModel) {
    const {idcentreanalytique, ...dataToSend} = _centres;
    this.loading = true;
    this.centreanalytiqueservice.create(dataToSend).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcentres();
        } else {
          this.error = "Erreur de création";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de création";
        this.loading = false;
      }
    })
  }

  //Modification de données
  update(_centres: centreanalytiqueModel){
    this.centreanalytiqueservice.update(_centres).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('showModal');
          this.getAllcentres();
        } else {
          this.error = "Erreur de modification";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Echec de modification";
        this.loading = false;
      }
    })
  }

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  modalCreate(){
    this.actionModal = "create";
    this.initForm();
  }

  modalUpdate(_object: centreanalytiqueModel){
    this.centre = _object;
    this.actionModal = "update";
    this.centreanalytiqueForm.reset();
    this.dispatchcentres(_object);
  }

  modalDelete(item: centreanalytiqueModel){
    this.deletecentre = item;
  }

  deleteConfirmed(){
    if(!this.deletecentre) return ;
    this.centreanalytiqueservice.delete(this.deletecentre.idcentreanalytique).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModal('delete');
          this.getAllcentres();
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
}
