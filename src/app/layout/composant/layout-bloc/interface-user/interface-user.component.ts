import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';

@Component({
  selector: 'app-interface-user',
  standalone: true,
  imports: [NgxEchartsDirective ,RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './interface-user.component.html',
  styleUrl: './interface-user.component.css'
})
export class InterfaceUserComponent implements OnInit{

  options = {
    title: { text: 'Suivi des soldes' },
    tooltip: {},
    xAxis: { data: ['Caisse A', 'Caisse B', 'Caisse C'] },
    yAxis: {},
    series: [
      {
        type: 'bar',
        data: [500000, 350000, 120000]
      }
    ]
  };

  constructor(){}
  
  ngOnInit(): void {}
}
