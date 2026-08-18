import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DemandesByStatusChartComponent } from '../components/stats-dmd-by-status-chart/stats-dmd-by-status-chart.component';
import { NaturePerDeptChartComponent } from '../components/stats-nature-per-dept-chart/stats-nature-per-dept-chart.component';
import { MontantPerDeptChartComponent } from '../components/stats-montant-per-dept/stats-nature-per-dept-chart.component';
import { BudgetAnnuelChartComponent } from '../components/stats-budget-annuel-chart/stats-budget-annuel-chart.component';
import { BudgetMensuelChartComponent } from '../components/stats-budget-mensuel-chart/stats-budget-mensuel-chart.component';
import { OperationCaisseChartComponent } from '../components/stats-operation-caisse-chart/stats-operation-caisse-chart.component';
import { TopNatureChartComponent } from '../components/stats-top-nature-chart/stats-top-nature-chart.component';
import { TopCentreChartComponent } from '../components/stats-top-centre-chart/stats-top-centre-chart.component';
import { TopMontantNatureChartComponent } from '../components/stats-top-montant-nature-chart/stats-top-montant-nature-chart.component';
import { TopMontantCentreChartComponent } from '../components/stats-top-montant-centre-chart/stats-top-montant-centre-chart.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nature-par-departement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DemandesByStatusChartComponent,
    NaturePerDeptChartComponent,
    MontantPerDeptChartComponent,
    BudgetAnnuelChartComponent,
    BudgetMensuelChartComponent,
    OperationCaisseChartComponent,
    TopNatureChartComponent,
    TopCentreChartComponent,
    TopMontantNatureChartComponent,
    TopMontantCentreChartComponent,
  ],
  templateUrl: './nature-par-departement.component.html',
})
export class NatureOperationByDepartementComponent implements OnInit {
  title = 'Statistiques globales';
  // Filtres pour les mouvements de caisse
  dateDebut: string = '';
  dateFin: string = '';

  ngOnInit(): void {
    // Initialiser les dates par défaut : 30 derniers jours
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.dateFin = today.toISOString().split('T')[0];
    this.dateDebut = thirtyDaysAgo.toISOString().split('T')[0];
  }

  // Méthode pour appliquer les filtres (appelée par le bouton)
  appliquerFiltresCaisse() {
    // Validation simple
    if (this.dateDebut && this.dateFin && this.dateFin < this.dateDebut) {
      // Afficher une erreur via toastr ou autre
      alert('La date de fin doit être postérieure à la date de début.');
      return;
    }
    this.loadStatsMouvementsCaisse();
  }

  loadStatsMouvementsCaisse() {
    let idsite: string | undefined = undefined;
    if (this.user.typeentitesociete !== 1) {
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
  }

  resetFiltresCaisse() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.dateDebut = thirtyDaysAgo.toISOString().split('T')[0];
    this.dateFin = today.toISOString().split('T')[0];
    // Le composant enfant rechargera grâce à ngOnChanges
  }
  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  get idsite(): string | undefined {
    if (this.user.typeentitesociete !== 1 && this.user.typeentitesite === 1) {
      return this.user.idsite;
    }
    return undefined;
  }
}
