import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ConsultationDecaissementaj } from '../../../../features/consultations/services/decaissementaj.service';
import { EnteteDemande } from '../../../../features/demande/models/entete-demande.model';
import { NaturePerDeptChartComponent } from "../../../../features/consultations/nature-par-departement/components/stats-nature-per-dept-chart/stats-nature-per-dept-chart.component";

@Component({
  selector: 'app-interface-demande-user',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './interface-demande-user.component.html',
  styleUrl: './interface-demande-user.component.css'
})
export class InterfaceDemandeUserComponent implements OnInit {

  loadingRequest : boolean = false;
  //Valeurs des operations
  demandesGlobal: any[] = [];

  // Définissez des propriétés de pagination
  currentPage: number = 1;

  // Nombre d'éléments par page
  totalPages: number = 0;
  limit: number = 6;

  constructor(private toastr : ToastrService, private service: ConsultationDecaissementaj){}

  ngOnInit(): void {
    //charger les demandes de l'utilisateur
    this.loadDemandeUser();
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  formatCFA(montant: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant ?? 0);
  }

  formatDateFR(dateInput: string | Date): string {
    const date = new Date(dateInput);

    const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
      .format(date)
      .replace('.', '');

    const day = date.getDate();
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(date)
      .replace('.', '');

    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  //Recharger la page des dernieres données 
  changePage(page: number) {
    this.currentPage = page;
    //this.getLastOperation(this.params); // recharge les données
  }

  loadDemandeUser(){
    const data = {
      page: this.currentPage,
      limit: this.limit,
      idutilisateur: this.user.idutilisateur
    }
    this.loadingRequest = true ;
    this.service.getdemandeByuser(data).subscribe({
      next : (res) => {
        if(res.success){
          this.demandesGlobal = res.data.data;
          this.totalPages = res.data.totalPages;
          this.loadingRequest = false;
        }else{
          this.loadingRequest = false;
        }
      },
      error : (err) => {
        this.loadingRequest = false;
      }
    });
  }

  getTotalDemande(demande: EnteteDemande): number {
      return demande.lignes.reduce((sum, l) => sum + l.montantdemande, 0);
  }

}
