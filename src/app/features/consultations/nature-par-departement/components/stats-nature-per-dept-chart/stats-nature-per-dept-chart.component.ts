import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ToastrService } from 'ngx-toastr';
import { ConsultationStatsDeptNatureService } from '../../../services/statsDeptnaure.service';
import { ConsultationStatsDeptNatureModel } from '../../../models/consultationStatsDeptNature.model';

@Component({
  selector: 'app-nature-per-dept-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `<div echarts [options]="options" style="height:400px"></div>`,
})
export class NaturePerDeptChartComponent implements OnInit {
  @Input() idsociete!: string;
  @Input() idsite?: string;

  options: any = {};
  msgErros: string = '';
  loading: Boolean = false;
  statsDeptNature: ConsultationStatsDeptNatureModel[] = [];
  departement: string[] = [];
  totalNbreNatures: number[] = [];
  naturesUtilisees: number[] = [];
  tauxConsommation: number[] = [];
  naturesAffectees: string[] = [];
  naturesUtiliseesLibelle: string[] = [];

  constructor(
    private service: ConsultationStatsDeptNatureService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.getAllStatsDeptNature();
  }

  getAllStatsDeptNature() {
    this.loading = true;

    this.service.getStatsDeptNature(this.idsociete, this.idsite).subscribe({
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
        this.toastr.error(this.msgErros);
      },
    });
  }
}
