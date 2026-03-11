import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConsultationStatsDeptNatureService } from '../services/statsDeptnaure.service';
import { ConsultationStatsDeptNatureModel } from '../models/consultationStatsDeptNature.model';
import { NgxEchartsDirective } from 'ngx-echarts';
import { StatsDemandeByStatusService } from '../services/demandebystatus.service';
import { StatsbudgetValideService } from '../services/budgetvalide.service';
import { StatsMontantbyDeptService } from '../services/montantByDept.service';

@Component({
  selector: 'app-nature-par-departement',
  imports: [
    NgxEchartsDirective,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './nature-par-departement.component.html',
  styleUrl: './nature-par-departement.component.css',
})
export class NatureOperationByDepartementComponent implements OnInit {
  title = 'Statistiques globales';
  statsDeptNature: ConsultationStatsDeptNatureModel[] = [];
  msgErros: string = '';
  loading: Boolean = false;
  departement: string[] = [];
  totalNbreNatures: number[] = [];
  naturesUtilisees: number[] = [];
  tauxConsommation: number[] = [];
  naturesAffectees: string[] = [];
  naturesUtiliseesLibelle: string[] = [];
  chartDmdByStatusOption: any = {};
  chartBudgetAnnuel: any = {};
  chartmontantbyDept: any = {};
  chartBudgetMensuel: any = {};
  options: any = {};

  constructor(
    private statsDeptNaureService: ConsultationStatsDeptNatureService,
    private statsDemandeByStatusService: StatsDemandeByStatusService,
    private statsbudgetValideService: StatsbudgetValideService,
    private statsMontantbyDeptService: StatsMontantbyDeptService,
  ) {}

  ngOnInit(): void {
    this.getAllStatsDeptNature();
    this.loadStatsDemandeParStatus();
    this.loadBudgetAnnuel(this.user.idsociete);
    this.loadMontantByDept();
  }

  // récupération du current user
  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  getAllStatsDeptNature() {
    this.loading = true;

    this.statsDeptNaureService.getStatsDeptNature().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.statsDeptNature = res.data as ConsultationStatsDeptNatureModel[];

          this.departement = [];
          this.totalNbreNatures = [];
          this.naturesUtilisees = [];
          this.tauxConsommation = [];
          this.naturesAffectees = [];
          this.naturesUtiliseesLibelle = [];

          this.statsDeptNature.forEach(
            (item: ConsultationStatsDeptNatureModel) => {
              this.departement.push(item.libelle);
              this.totalNbreNatures.push(Number(item.totalNatures));
              this.naturesUtilisees.push(Number(item.naturesUtilisees));
              this.tauxConsommation.push(Number(item.tauxConsommation));
              this.naturesAffectees.push(item.naturesAffectees);
              this.naturesUtiliseesLibelle.push(item.naturesUtiliseesLibelle);
            },
          );

          this.options = {
            title: { text: 'Taux de consommation des natures par département' },

            tooltip: {
              trigger: 'axis',
            },

            legend: {
              data: [
                'Nbre natures affectées',
                'Nbre natures utilisées',
                'Taux (%)',
              ],
            },

            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true,
            },

            xAxis: {
              type: 'category',
              data: this.departement,
            },

            yAxis: [
              {
                type: 'value',
                name: 'Nombre',
              },
              {
                type: 'value',
                name: 'Taux (%)',
                min: 0,
                max: 100,
              },
            ],

            series: [
              {
                name: 'Nbre natures affectées',
                type: 'bar',
                data: this.totalNbreNatures,
              },
              {
                name: 'Nbre natures utilisées',
                type: 'bar',
                data: this.naturesUtilisees,
              },
              {
                name: 'Natures affectées',
                type: 'bar',
                data: this.naturesAffectees,
              },
              {
                name: 'Natures utilisées',
                type: 'bar',
                data: this.naturesUtiliseesLibelle,
              },
              {
                name: 'Taux (%)',
                type: 'line',
                yAxisIndex: 1,
                data: this.tauxConsommation,
              },
            ],
          };

          this.loading = false;
        }
      },
      error: (err: any) => {
        this.msgErros = err.error?.error;
        this.loading = false;
      },
    });
  }

  // Stats des demandes par statut
  loadStatsDemandeParStatus() {
    this.statsDemandeByStatusService.getDemandesParStatut().subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data.map((item: any) => {
            let color = '#605DF5';
            if (item.libelleStatut === 'rejeté') {
              color = '#D94021'; // rouge foncé
            }

            return {
              name: item.typedemande + ' (' + item.libelleStatut + ')',
              value: parseInt(item.total),
              itemStyle: { color: color },
            };
          });

          this.chartDmdByStatusOption = {
            title: {
              text: 'Demandes par statut',
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b} : {c} ({d}%)',
            },
            legend: {
              bottom: 0,
            },
            toolbox: {
              show: true,
              feature: {
                mark: { show: true },
                dataView: { show: true, readOnly: false },
                restore: { show: true },
                saveAsImage: { show: true },
              },
            },
            series: [
              {
                name: 'Demandes',
                type: 'pie',
                radius: [20, 140],
                center: ['25%', '50%'],
                roseType: 'radius',
                itemStyle: {
                  borderRadius: 5,
                },
                label: {
                  show: false,
                },
                emphasis: {
                  label: {
                    show: true,
                  },
                },
                data: data,
              },
            ],
          };
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
        console.log(this.msgErros);
      },
    });
  }

  // Stats des demandes par statut
  loadBudgetAnnuel(idsociete: string) {
    this.statsbudgetValideService.getBudgetValide(idsociete).subscribe({
      next: (res: any) => {
        if (res.success) {
          const totaux = res.data.totaux_annuels;

          const previsionnel = Number(totaux.total_previsionnel);
          const consomme = Number(totaux.total_consomme);
          const restant = previsionnel - consomme;
          const taux = Number(totaux.taux_consommation_annuel);
          const devise = this.user.devise_ref_code;

          const mois = res.data.budgets_mensuels.map((m: any) => m.mois_nom);
          const tauxMensuel = res.data.budgets_mensuels.map(
            (m: any) => m.taux_consommation,
          );

          this.chartBudgetMensuel = {
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

          this.chartBudgetAnnuel = {
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
        this.msgErros = err.error.error;
        console.error(err);
      },
    });
  }

  // Stats des montants par département
  loadMontantByDept() {
    this.statsMontantbyDeptService.getMontantByDept().subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data.map((item: any) => ({
            name: item.libelleDepartement,
            value: parseInt(item.total),
          }));

          const devise = this.user.devise_ref_code;

          this.chartmontantbyDept = {
            title: { text: 'Montants par département' },
            tooltip: {
              trigger: 'item',
              formatter: (params: any) => {
                return `${params.name}: ${params.value} ${devise} (${params.percent}%)`;
              },
            },
            legend: { bottom: 0 },
            series: [
              {
                name: 'Montant',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '70%'],
                startAngle: 180,
                endAngle: 360,
                label: {
                  show: true,
                  formatter: (params: any) => {
                    return `${params.name}: ${params.value} ${devise}`;
                  },
                },
                emphasis: {
                  label: { show: true, fontSize: 13, fontWeight: 'bold' },
                },
                data: data,
              },
            ],
          };
        }
      },
      error: (err: any) => {
        this.msgErros = err.error.error;
        console.log(this.msgErros);
      },
    });
  }
}
