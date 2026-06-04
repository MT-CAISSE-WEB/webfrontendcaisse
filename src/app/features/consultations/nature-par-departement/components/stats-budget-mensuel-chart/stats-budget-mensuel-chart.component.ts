import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ToastrService } from 'ngx-toastr';
import { StatsbudgetValideService } from '../../../services/budgetvalide.service';

@Component({
  selector: 'app-stats-budget-mensuel-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: ` @if (budgetAnnuelValideTab.length === 0) {
      <div class="text-center" style="height: 400px">
        <h4 class="mt-2 fw-bold">Budget annuel {{ anneeCourante }}</h4>
        Aucune donnée disponible pour cette année
      </div>
    } @else {
      <div echarts [options]="optionsMensuelles" style="height: 400px"></div>
    }`,
})
export class BudgetMensuelChartComponent implements OnInit {
  @Input() idsociete!: string;
  @Input() idsite?: string;

  optionsMensuelles: any = {};
  optionsAnnuelles: any = {};
  msgErros: string = '';
  loading: Boolean = false;
  budgetAnnuelValideTab: any[] = [];
  budgetMensuelValideTab: any[] = [];
  anneeCourante: number = new Date().getFullYear();

  constructor(
    private service: StatsbudgetValideService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadBudgetAnnuel();
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  loadBudgetAnnuel() {
    this.loading = true;
    this.service.getBudgetValide(this.idsociete, this.idsite).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loading = false;
          const totaux = res.data.totaux_annuels;
          this.budgetAnnuelValideTab = totaux;

          const previsionnel = Number(totaux.total_previsionnel);
          const consomme = Number(totaux.total_consomme);
          const restant = previsionnel - consomme;
          const taux = Number(totaux.taux_consommation_annuel);
          const devise = this.user.devise_ref_code;

          const mois = res.data.budgets_mensuels.map((m: any) => m.mois_nom);
          this.budgetMensuelValideTab = mois;
          const tauxMensuel = res.data.budgets_mensuels.map(
            (m: any) => m.taux_consommation,
          );

          this.optionsMensuelles = {
            title: { text: 'Taux mensuel (%)' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: mois },
            yAxis: { type: 'value', max: 100 },
            series: [
              {
                type: 'bar',
                data: tauxMensuel,
              },
            ],
          };

          this.optionsAnnuelles = {
            title: {
              text: `Consommation annuelle ${res.data.annee}`,
              left: 'center',
            },

            tooltip: {
              trigger: 'item',
              formatter: (params: any) => {
                const value = params.value.toLocaleString('fr-FR');
                return `${params.name}<br/>${value}`;
              },
            },

            legend: {
              bottom: 0,
            },

            series: [
              {
                name: 'Budget annuel',
                type: 'pie',
                radius: ['50%', '75%'], // Donut

                label: {
                  formatter: '{b}\n{d}%',
                },

                data: [
                  {
                    name: 'Consommé',
                    value: consomme,
                    itemStyle: { color: '#28a745' }, // vert
                    tooltip: {
                      trigger: 'item',
                      formatter: (params: any) => {
                        return `${params.value} ${devise}`;
                      },
                    },
                  },
                  {
                    name: 'Restant',
                    value: restant,
                    itemStyle: { color: '#dc3545' }, // rouge
                    tooltip: {
                      trigger: 'item',
                      formatter: (params: any) => {
                        return `${params.value} ${devise}`;
                      },
                    },
                  },
                ],
              },
            ],

            graphic: {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: `${taux}%`,
                fontSize: 22,
                fontWeight: 'bold',
              },
            },
          };
        }
      },

      error: (err: any) => {
        this.loading = false;
        this.msgErros = err.error.error;
        this.toastr.error(this.msgErros);
      },
    });
  }
}
