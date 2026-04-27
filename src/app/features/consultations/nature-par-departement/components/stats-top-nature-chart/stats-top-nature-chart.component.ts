import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ToastrService } from 'ngx-toastr';
import { TopNatureOPService } from '../../../services/topNatureOP.service';

@Component({
  selector: 'app-top-nature-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: ` <div echarts [options]="options" style="height: 400px"></div> `,
})
export class TopNatureChartComponent implements OnInit {
  @Input() idsociete!: string;
  @Input() idsite?: string;

  options: any = {};
  msgErros: string = '';
  loading: Boolean = false;
  topNaturesTab: any[] = [];

  constructor(
    private service: TopNatureOPService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadTopNatures();
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  loadTopNatures() {
    this.service.getTopNatures(this.idsociete, this.idsite).subscribe({
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
      this.options = {
        title: {
          text: 'Aucune donnée disponible',
          left: 'center',
          top: 'center',
        },
      };
      return;
    }
    this.options = {
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
}
