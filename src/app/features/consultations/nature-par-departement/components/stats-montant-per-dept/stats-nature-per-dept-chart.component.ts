import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ToastrService } from 'ngx-toastr';
import { StatsMontantbyDeptService } from '../../../services/montantByDept.service';

@Component({
  selector: 'app-montant-per-dept-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `@if (montantByDeptTab.length === 0) {
      <div class="text-center">
        <h4 class="mt-2 fw-bold">Montant par département</h4>
        Aucune donnée disponible pour cette année
      </div>
    } @else {
      <div echarts [options]="options" style="height: 400px"></div>
    }`,
})
export class MontantPerDeptChartComponent implements OnInit {
  @Input() idsociete!: string;
  @Input() idsite?: string;

  options: any = {};
  msgErros: string = '';
  loading: Boolean = false;
  montantByDeptTab: any = [];

  constructor(
    private service: StatsMontantbyDeptService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadMontantByDept();
  }

  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  loadMontantByDept() {
    this.service.getMontantByDept(this.idsociete, this.idsite).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data.map((item: any) => ({
            name: item.libelleDepartement,
            value: parseInt(item.total),
          }));

          this.montantByDeptTab = data;

          const devise = this.user.devise_ref_code;

          this.options = {
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
}
