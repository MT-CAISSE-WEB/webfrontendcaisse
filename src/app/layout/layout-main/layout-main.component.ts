import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { LayoutCustomeComponent } from "../composant/layout-custome/layout-custome.component";
import { LayoutHeaderComponent } from "../composant/layout-header/layout-header.component";
import { LayoutMenuComponent } from "../composant/layout-menu/layout-menu.component";

@Component({
  selector: 'app-layout-main',
  imports: [RouterOutlet, LayoutCustomeComponent, LayoutHeaderComponent, LayoutMenuComponent],
  templateUrl: './layout-main.component.html',
  styleUrl: './layout-main.component.css'
})
export class LayoutMainComponent {

}
