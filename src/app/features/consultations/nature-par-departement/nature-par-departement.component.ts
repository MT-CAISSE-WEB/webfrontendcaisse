import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConsultationStatsDeptNatureService } from '../services/statsDeptnaure.service';
import { ConsultationStatsDeptNatureModel } from '../models/consultationStatsDeptNature.model';
import { NgxEchartsDirective } from 'ngx-echarts';
import { StatsDemandeByStatusService } from '../services/demandebystatus.service';
import { StatsbudgetValideService } from '../services/budgetvalide.service';
import { StatsMontantbyDeptService } from '../services/montantByDept.service';
import { MouvementsCaisseService } from '../services/mouvementcaisse.service';
import { TopNatureOPService } from '../services/topNatureOP.service';
import { TopCentreAnalytiqueService } from '../services/topCentreAnalytique.service';
import { TopMontantNatureOPService } from '../services/topMontantNatureOP.service';
import { TopMontantCentreAnalytiqueService } from '../services/topMontantCentre.service';
import { ToastrService } from 'ngx-toastr';

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
  chartCaisseOptions: any[] = [];
  montantByDeptTab: any = [];
  budgetAnnuelValideTab: any = [];
  budgetMensuelValideTab: any = [];
  anneeCourante: number = new Date().getFullYear();
  chartTopNatures: any;
  topNaturesTab: any[] = [];
  chartTopMontantNature: any = {};
  chartTopMontantCentre: any = {};

  chartTopCentres: any;
  topCentresTab: any[] = [];

  options: any = {};

  dateDebut: string = '';
  dateFin: string = '';

  constructor(
    private statsDeptNaureService: ConsultationStatsDeptNatureService,
    private statsDemandeByStatusService: StatsDemandeByStatusService,
    private statsbudgetValideService: StatsbudgetValideService,
    private statsMontantbyDeptService: StatsMontantbyDeptService,
    private statsMouvementsCaisseService: MouvementsCaisseService,
    private statsTopNatureOPService: TopNatureOPService,
    private statsTopCentreAnalytiqueService: TopCentreAnalytiqueService,
    private statsTopMontantNatureOPService: TopMontantNatureOPService,
    private statsTopMontantCentreAnalytiqueService: TopMontantCentreAnalytiqueService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    // Initialisation des dates par défaut : 30 derniers jours
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.dateDebut = thirtyDaysAgo.toISOString().split('T')[0];
    this.dateFin = today.toISOString().split('T')[0];

    this.getAllStatsDeptNature();
    this.loadStatsDemandeParStatus();
    this.loadBudgetAnnuel();
    this.loadMontantByDept();
    this.loadStatsMouvementsCaisse();
    this.loadTopNatures();
    this.loadTopCentres();
    this.loadTopMontantNatureOP();
    this.loadTopMontantCentreAnalytique();
  }

  // récupération du current user
  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // ========== MÉTHODES DE FILTRAGE ==========
  appliquerFiltresCaisse() {
    if (this.dateDebut && this.dateFin && this.dateFin < this.dateDebut) {
      this.toastr?.error(
        'La date de fin doit être postérieure à la date de début.',
      );
      return;
    }
    this.loadStatsMouvementsCaisse();
  }

  resetFiltresCaisse() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.dateDebut = thirtyDaysAgo.toISOString().split('T')[0];
    this.dateFin = today.toISOString().split('T')[0];
    this.loadStatsMouvementsCaisse();
  }

  getAllStatsDeptNature() {
    this.loading = true;

    this.statsDeptNaureService
      .getStatsDeptNature(this.user.idsociete, this.user.idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.statsDeptNature =
              res.data as ConsultationStatsDeptNatureModel[];

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
              title: {
                text: 'Taux de consommation des natures par département',
              },

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
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsDemandeByStatusService
      .getDemandesParStatut(this.user.idsociete, idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const data = res.data.map((item: any) => {
              let color = '#605DF5';
              if (item.libelleStatut === 'rejeté') {
                color = '#D94021'; // rouge foncé
              } else if (item.libelleStatut === 'en attente') {
                color = '#FFC107'; // jaune
              } else if (item.libelleStatut === 'accepté') {
                color = '#28A745'; // vert
              } else {
                color = '#605DF5'; // orange
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
        },
      });
  }

  // Mouvements caisse
  // loadStatsMouvementsCaisse() {
  //   this.statsMouvementsCaisseService
  //     .getMouvementsCaisse(this.user.idsociete, this.user.idsite)
  //     .subscribe({
  //       next: (res: any) => {
  //         if (res.success) {
  //           const stats = res.data;

  //           /**
  //            * 🔥 Grouper par caisse
  //            */
  //           const groupedByCaisse: any = {};

  //           stats.forEach((item: any) => {
  //             if (!groupedByCaisse[item.idcaisse]) {
  //               groupedByCaisse[item.idcaisse] = {
  //                 libelle: item.libellecaisse,
  //                 periode: item.periode,
  //                 jours: [],
  //                 entrees: [],
  //                 sorties: [],
  //                 soldes: [],
  //               };
  //             }

  //             groupedByCaisse[item.idcaisse].jours.push(item.jour);
  //             groupedByCaisse[item.idcaisse].entrees.push(
  //               parseFloat(item.total_entrees),
  //             );
  //             groupedByCaisse[item.idcaisse].sorties.push(
  //               parseFloat(item.total_sorties),
  //             );
  //             groupedByCaisse[item.idcaisse].soldes.push(
  //               parseFloat(item.solde_reel),
  //             );
  //           });

  //           /**
  //            * 🔥 Construire les graphes
  //            */
  //           this.chartCaisseOptions = Object.keys(groupedByCaisse).map(
  //             (key: any) => {
  //               const caisse = groupedByCaisse[key];

  //               return {
  //                 title: {
  //                   text: `Mouvements - ${caisse.libelle} (${caisse.periode})`,
  //                   left: 'center',
  //                 },
  //                 tooltip: {
  //                   trigger: 'axis',
  //                 },
  //                 legend: {
  //                   top: 30,
  //                 },
  //                 toolbox: {
  //                   show: true,
  //                   feature: {
  //                     saveAsImage: { show: true },
  //                   },
  //                 },
  //                 xAxis: {
  //                   type: 'category',
  //                   name: 'Jour',
  //                   data: caisse.jours,
  //                 },
  //                 yAxis: {
  //                   type: 'value',
  //                   name: 'Montant',
  //                 },
  //                 series: [
  //                   {
  //                     name: 'Encaissement',
  //                     type: 'bar',
  //                     data: caisse.entrees,
  //                   },
  //                   {
  //                     name: 'Décaissement',
  //                     type: 'bar',
  //                     data: caisse.sorties,
  //                   },
  //                   {
  //                     name: 'Solde',
  //                     type: 'line',
  //                     data: caisse.soldes,
  //                   },
  //                 ],
  //               };
  //             },
  //           );
  //         }
  //       },
  //       error: (err: any) => {
  //         this.msgErros = err.error?.error;
  //       },
  //     });
  // }
  loadStatsMouvementsCaisse() {
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsMouvementsCaisseService
      .getMouvementsCaisse(
        this.user.idsociete,
        idsite,
        this.dateDebut,
        this.dateFin,
      )
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const stats = res.data;

            const groupedByCaisse: any = {};

            // ✅ Format date SAFE (évite décalage timezone)
            const formatDate = (date: string) => {
              if (!date) return '';
              return date.substring(8, 10) + '/' + date.substring(5, 7);
            };

            // ✅ Sécurisation nombre
            const toNumber = (val: any) => Number(val) || 0;

            stats.forEach((item: any) => {
              if (!groupedByCaisse[item.idcaisse]) {
                groupedByCaisse[item.idcaisse] = {
                  libelle: item.libellecaisse,
                  data: [],
                };
              }

              groupedByCaisse[item.idcaisse].data.push({
                jourRaw: item.jour,
                jour: formatDate(item.jour),
                entree: toNumber(item.total_entrees),
                sortie: toNumber(item.total_sorties),
                solde: toNumber(item.solde),
              });
            });

            this.chartCaisseOptions = Object.keys(groupedByCaisse).map(
              (key: any) => {
                const caisse = groupedByCaisse[key];

                // ✅ Tri sécurisé par date
                caisse.data.sort(
                  (a: any, b: any) =>
                    new Date(a.jourRaw).getTime() -
                    new Date(b.jourRaw).getTime(),
                );

                const jours = caisse.data.map((d: any) => d.jour);
                const entrees = caisse.data.map((d: any) => d.entree);
                const sorties = caisse.data.map((d: any) => d.sortie);
                const soldes = caisse.data.map((d: any) => d.solde);

                const periode = `${jours[0]} → ${jours[jours.length - 1]}`;

                return {
                  title: {
                    text: `Mouvements - ${caisse.libelle} (${periode})`,
                    left: 'center',
                  },
                  tooltip: {
                    trigger: 'axis',
                  },
                  legend: {
                    top: 30,
                  },
                  toolbox: {
                    show: true,
                    feature: {
                      saveAsImage: { show: true },
                    },
                  },
                  xAxis: {
                    type: 'category',
                    name: 'Jour',
                    data: jours,
                  },
                  yAxis: {
                    type: 'value',
                    name: 'Montant',
                  },
                  series: [
                    {
                      name: 'Encaissement',
                      type: 'bar',
                      data: entrees,
                    },
                    {
                      name: 'Décaissement',
                      type: 'bar',
                      data: sorties,
                    },
                    {
                      name: 'Solde',
                      type: 'line',
                      smooth: true,
                      connectNulls: true,
                      areaStyle: {}, // 🔥 visuel pro
                      data: soldes,
                    },
                  ],
                };
              },
            );
          }
        },
        error: (err: any) => {
          this.msgErros = err.error?.error;
        },
      });
  }

  // Stats des demandes par statut
  loadBudgetAnnuel() {
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsbudgetValideService
      .getBudgetValide(this.user.idsociete, idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
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
        },
      });
  }

  // Stats des montants par département
  loadMontantByDept() {
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsMontantbyDeptService
      .getMontantByDept(this.user.idsociete, idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const data = res.data.map((item: any) => ({
              name: item.libelleDepartement,
              value: parseInt(item.total),
            }));

            this.montantByDeptTab = data;

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
        },
      });
  }

  loadTopNatures() {
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsTopNatureOPService
      .getTopNatures(this.user.idsociete, idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const data = res.data.map((item: any) => ({
              name: item.libelle,
              value: item.total_utilisations,
            }));

            this.topNaturesTab = data;

            this.buildChartTopNatures(data);
          }
        },
        error: (err: any) => {
          console.error(err);
        },
      });
  }

  buildChartTopNatures(data: any[]) {
    if (!data || data.length === 0) {
      this.chartTopNatures = {
        title: {
          text: 'Aucune donnée disponible',
          left: 'center',
          top: 'center',
        },
      };
      return;
    }
    this.chartTopNatures = {
      title: {
        text: "Top 10 Natures d'opération les plus utilisées",
        left: 'center',
        top: 10,
      },

      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `
          <b>${params.name}</b><br/>
          Utilisations: ${params.value}<br/>
          (${params.percent}%)
        `;
        },
      },

      legend: {
        orient: 'horizontal',
        bottom: 0,
      },

      color: [
        '#3b82f6', // bleu
        '#10b981', // vert
        '#f59e0b', // orange
        '#ef4444', // rouge
        '#8b5cf6', // violet
        '#14b8a6', // teal
        '#f97316', // deep orange
        '#6366f1',
        '#22c55e',
        '#eab308',
      ],

      series: [
        {
          name: 'Utilisations',
          type: 'pie',

          radius: ['45%', '75%'], // donut
          center: ['50%', '60%'],

          avoidLabelOverlap: true,

          label: {
            show: true,
            formatter: (params: any) => {
              return `${params.name}\n${params.value}`;
            },
          },

          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },

          labelLine: {
            show: true,
          },

          data: data,
        },
      ],
    };
  }

  // top 10 centres analytique
  loadTopCentres() {
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsTopCentreAnalytiqueService
      .getTopCentres(this.user.idsociete, idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const data = res.data.map((item: any) => ({
              name: item.libelle,
              value: item.total_utilisations,
            }));

            this.topCentresTab = data;

            this.buildChartTopCentres(data);
          }
        },
        error: (err: any) => {
          console.error(err);
        },
      });
  }

  buildChartTopCentres(data: any[]) {
    if (!data || data.length === 0) {
      this.chartTopCentres = {
        title: {
          text: 'Aucune donnée disponible',
          left: 'center',
          top: 'center',
        },
      };
      return;
    }
    this.chartTopCentres = {
      title: {
        text: 'Top 10 centres les plus utilisés',
        left: 'center',
        top: 10,
      },

      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `
          <b>${params.name}</b><br/>
          Utilisations: ${params.value}<br/>
          (${params.percent}%)
        `;
        },
      },

      legend: {
        orient: 'horizontal',
        bottom: 0,
      },

      color: [
        '#3b82f6', // bleu
        '#10b981', // vert
        '#f59e0b', // orange
        '#ef4444', // rouge
        '#8b5cf6', // violet
        '#14b8a6', // teal
        '#f97316', // deep orange
        '#6366f1',
        '#22c55e',
        '#eab308',
      ],

      series: [
        {
          name: 'Utilisations',
          type: 'pie',

          radius: ['45%', '75%'], // donut
          center: ['50%', '60%'],

          avoidLabelOverlap: true,

          label: {
            show: true,
            formatter: (params: any) => {
              return `${params.name}\n${params.value}`;
            },
          },

          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },

          labelLine: {
            show: true,
          },

          data: data,
        },
      ],
    };
  }

  loadTopMontantNatureOP() {
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsTopMontantNatureOPService
      .getTopMontantNatures(this.user.idsociete, idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const data = res.data.map((item: any) => ({
              name: item.libelle,
              value: parseInt(item.total_montant),
            }));

            if (!data || data.length === 0) {
              this.chartTopMontantNature = {
                title: {
                  text: 'Aucune donnée disponible',
                  left: 'center',
                  top: 'center',
                },
              };
              return;
            }

            const devise = this.user.devise_ref_code;

            this.chartTopMontantNature = {
              title: { text: 'Top 10 natures opération par montant' },
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
        },
      });
  }

  loadTopMontantCentreAnalytique() {
    let idsite: string | undefined = undefined;

    /**
     * PRIORITÉ : SOCIÉTÉ
     * si l'utilisateur est au niveau société
     * on ignore complètement le site
     */
    if (this.user.typeentitesociete !== 1) {
      /**
       * utilisateur limité au site
       */
      if (this.user.typeentitesite === 1) {
        idsite = this.user.idsite;
      }
    }
    this.statsTopMontantCentreAnalytiqueService
      .getTopMontantCentre(this.user.idsociete, idsite)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            const data = res.data.map((item: any) => ({
              name: item.libelle,
              value: parseInt(item.total_montant),
            }));

            if (!data || data.length === 0) {
              this.chartTopMontantNature = {
                title: {
                  text: 'Aucune donnée disponible',
                  left: 'center',
                  top: 'center',
                },
              };
              return;
            }

            const devise = this.user.devise_ref_code;

            this.chartTopMontantCentre = {
              title: { text: 'Top 10 centres analytiques par montant' },
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
        },
      });
  }
}
