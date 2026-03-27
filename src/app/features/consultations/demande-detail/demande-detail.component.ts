import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConsultationOpService } from '../services/operations.service';
import { ToastrService } from 'ngx-toastr';
import { MESSAGE_CHAMPS_OBLIGATOIRE } from '../../../_core/constantes/messages.contantes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-demande-detail',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './demande-detail.component.html',
  styleUrl: './demande-detail.component.css'
})
export class DemandeDetailComponent implements OnInit {
  title = "Détail des demandes";
  demandes: any = [];
  fb: FormBuilder = new FormBuilder();

  //Formulaire de recherche
  searchForm : FormGroup = this.fb.group({});

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 10;

  msgErros : string = "";
  loading: Boolean = false;

  constructor(private service: ConsultationOpService, private toastr : ToastrService){}

  ngOnInit(): void {
    //Initialisation du formulaire
    this.initSearchForm();
  }

  //Initialiser le formulaire de recherche
  initSearchForm() {
    this.searchForm = this.fb.group({
      codedemande: [null],
      page: [''],
      limit: [''],
      datedebut: [null],
      datefin: [null],
      typeentitesociete: [this.user.typeentitesociete],
      idsite: [this.user.idsite]
    });
  }

  closeModal(modal: string){
    const modalEl = document.getElementById(modal);
    modalEl?.classList.remove('show');
    modalEl?.setAttribute('aria-hidden', 'true');
    (document.querySelector('.modal-backdrop') as HTMLElement)?.remove();
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  //Soumission du formulaire
  onSubmit(){
    /** Check formulaire */
    const controls = this.searchForm.controls;
    if (this.searchForm.invalid) {
      Object.keys(controls).forEach(controlName => controls[controlName].markAsTouched());
      this.msgErros = MESSAGE_CHAMPS_OBLIGATOIRE;
      //this.toastr.warning(this.msgErros);
      return;
    }

    /** 2. prepare data */
    const formValue = this.searchForm.value;
    formValue.page = this.currentPage;
    formValue.limit = this.limit;
    console.log(formValue);
    this.search(formValue);
  }

  search(data : any){
    this.service.getdemandeDetail(data).subscribe({
      next : (res) => {
        this.demandes = res.data.data;
        this.totalPages = res.data.totalPages;
      },
      error : (err) => {}
    });
  }

  //Recharger la page
  changePage(page: number) {
    this.currentPage = page;
  }

}
