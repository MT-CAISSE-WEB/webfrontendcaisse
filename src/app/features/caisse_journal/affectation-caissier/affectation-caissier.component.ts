import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { caisseModel } from '../models/caisse.model';
import { CaisseService } from '../services/caisse.service';
import { Router } from 'express';
import { CommonModule } from '@angular/common';
import { AffectationCaisseService } from '../services/affectationcaisse.service';
import { AffectationCaisseModel } from '../models/affectationcaisse.model';
import { usermodel } from '../../administration/model/user.model';
import { userservice } from '../../administration/service/user.service';
import { societeservice } from '../../structure/service/societe.service';
import { societemodel } from '../../structure/model/societe.model';

@Component({
  selector: 'app-affectation-caissier',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './affectation-caissier.component.html',
  styleUrl: './affectation-caissier.component.css'
})
export class AffectationCaissierComponent implements OnInit{
  title = "Caisse";
  params : any = {};
  breadCrumbs : any = {};
  fb: FormBuilder = new FormBuilder();
  caisses : caisseModel[] = [];
  userscaisses: AffectationCaisseModel[] = [];
  users : usermodel[] = [];
  societes : societemodel[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;
  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 5;

  constructor(private utilisateurcaisseservice: AffectationCaisseService, private sc: societeservice,
    private caisseservice: CaisseService, private router: Router, private us: userservice){}

  ngOnInit(): void {
    //Recuperer toutes les caisses
    this.getAllcaisses();
    //Recuperer tous les utilisateurs
    this.getallusers();
    //Recuperer toutes les societés
    this.getallsocietes();
  }

  getAllcaisses(){
    this.params = {
      page: this.currentPage,
      limit: this.limit
    };
    this.caisseservice.getAll(this.params).subscribe({
      next : (res) => {
        if(res.success){
          this.caisses = res.data.data;
          this.totalPages = res.data.totalPages;
        }
      }
    });
  }

  getallusers (){
    this.us.getAll().subscribe({
      next : (res) => {
         if(res.success){
            this.users = res.data;
         }
      }
    });
  }

  getallsocietes(){
    this.sc.getAll().subscribe({
      next : (res) => {
        if(res.success){  
          this.societes = res.data;
        }
      }
    });
  }

}
