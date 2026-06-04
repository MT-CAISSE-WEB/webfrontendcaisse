import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { StatsDemandeByStatusService } from '../../../services/demandebystatus.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-demandes-by-status-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `<div echarts [options]="options" style="height:400px"></div>`,
})
export class DemandesByStatusChartComponent implements OnInit {
  @Input() idsociete!: string;
  @Input() idsite?: string;

  options: any = {};
  msgErros: string = '';
  loading: Boolean = false;

  constructor(
    private service: StatsDemandeByStatusService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadStatsDemandeParStatus();
  }

  loadStatsDemandeParStatus() {
    this.loading = true;
    this.service.getDemandesParStatut(this.idsociete, this.idsite).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loading = false;
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

          this.options = {
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
        this.loading = false;
        this.msgErros = err.error.error;
        this.toastr.error(this.msgErros);
      },
    });
  }
}
