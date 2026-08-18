import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ToastrService } from 'ngx-toastr';
import { MouvementsCaisseService } from '../../../services/mouvementcaisse.service';

@Component({
  selector: 'app-mouvement-caisse-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: ` <div class="row" style="margin-top: 20px;">
    <div class="col-12">
      <div *ngIf="loading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>
      <div *ngFor="let option of chartCaisseOptions" class="mb-5">
        <div echarts [options]="option" class="h-800"></div>
      </div>
    </div>
  </div>`,
})
export class OperationCaisseChartComponent implements OnInit, OnChanges {
  @Input() idsociete!: string;
  @Input() idsite?: string;
  @Input() dateDebut?: string;
  @Input() dateFin?: string;

  options: any = {};
  msgErros: string = '';
  loading: Boolean = false;
  montantByDeptTab: any = [];

  constructor(
    private service: MouvementsCaisseService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadStatsMouvementsCaisse();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Recharger si les dates changent
    if (changes['dateDebut'] || changes['dateFin']) {
      this.loadStatsMouvementsCaisse();
    }
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  chartCaisseOptions: any[] = [];

  loadStatsMouvementsCaisse() {
    this.loading = true;
    this.service
      .getMouvementsCaisse(
        this.idsociete,
        this.idsite,
        this.dateDebut,
        this.dateFin,
      )
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.loading = false;
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
          this.loading = false;
          this.msgErros = err.error?.error;
          this.toastr.error(this.msgErros);
        },
      });
  }
}
