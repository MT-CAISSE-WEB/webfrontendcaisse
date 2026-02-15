import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComptabilisationService } from '../services/comptabilisation.service';

@Component({
  selector: 'app-comptabilisation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './comptabilisation.component.html',
  styleUrl: './comptabilisation.component.css'
})
export class ComptabilisationComponent implements OnInit{
  title = "Journal de paiement";
  fb: FormBuilder = new FormBuilder();

  msgErros : string = "";
  loading: Boolean = false;

  //Message suppression
  msgSup: string = "";
  titleMsg: string ="";

  constructor(private service: ComptabilisationService){}

  ngOnInit(): void {}

  search(data : any){
    this.service.getAllEcriture(data).subscribe({
      next : (res) => {
        //this.op = res.data;
      },
      error : (err) => {}
    });
  }
  
}
