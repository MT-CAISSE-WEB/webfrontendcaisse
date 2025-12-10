import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-layout-header',
  imports: [],
  templateUrl: './layout-header.component.html',
  styleUrl: './layout-header.component.css'
})
export class LayoutHeaderComponent implements OnInit {

  constructor(){}

  ngOnInit(): void {
    
  }

  get user(){
    return JSON.parse(localStorage.getItem('user') || '{}');
  }
  
  logout (){
    localStorage.clear();
  }


}
