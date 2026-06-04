import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { NaturePerDeptChartComponent } from "../../../../features/consultations/nature-par-departement/components/stats-nature-per-dept-chart/stats-nature-per-dept-chart.component";

@Component({
  selector: 'app-interface-user',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule, NaturePerDeptChartComponent],
  templateUrl: './interface-user.component.html',
  styleUrl: './interface-user.component.css'
})
export class InterfaceUserComponent implements OnInit{

  constructor(){}
  
  ngOnInit(): void {}

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }
  
}
