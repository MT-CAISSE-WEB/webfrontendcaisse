import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MESSAGE_SUPPRESSION_DESCRIPTION, TITLE_DELETE } from '../../../_core/constantes/messages.contantes';

@Component({
  selector: 'app-operation-caisse',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './operation-caisse.component.html',
  styleUrl: './operation-caisse.component.css'
})
export class OperationCaisseComponent implements OnInit{
  title = "Opération";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  msgErros : string = "";
  loading: Boolean = false;
  operationForm : FormGroup = this.fb.group({});
  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  //Faire le check selection **********
  //objectsSelected : caisseModel[] = [];
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
  deleteCaisse: any = null;

  ngOnInit(): void {
        //Initialisation du formulaire
        //this.initForm();
        this.msgSup = MESSAGE_SUPPRESSION_DESCRIPTION("cette opération");
        this.titleMsg = TITLE_DELETE
    }
}
