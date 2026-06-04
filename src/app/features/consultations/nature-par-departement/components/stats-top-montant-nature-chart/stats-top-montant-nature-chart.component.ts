import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ToastrService } from 'ngx-toastr';
import { TopMontantNatureOPService } from '../../../services/topMontantNatureOP.service';

@Component({
  selector: 'app-top-montant-nature-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: ` <div echarts [options]="options" style="height: 400px"></div> `,
})
export class TopMontantNatureChartComponent implements OnInit {
  @Input() idsociete!: string;
  @Input() idsite?: string;

  options: any = {};
  msgErros: string = '';
  loading: Boolean = false;

  constructor(
    private service: TopMontantNatureOPService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadTopMontantNatureOP();
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  loadTopMontantNatureOP() {
    this.loading = true;
    this.service.getTopMontantNatures(this.idsociete, this.idsite).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          const data = res.data.map((item: any) => ({
            name: item.libelle,
            value: parseInt(item.total_montant),
          }));

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

          const devise = this.user.devise_ref_code;

          this.options = {
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
        this.loading = false;
        this.toastr.error(this.msgErros);
      },
    });
  }
}
