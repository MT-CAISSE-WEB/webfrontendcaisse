import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from './_core/utils/loaders.service';
import { OnInit } from '@angular/core';
import { AuthService } from './features/administration/service/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'MTCAISSEWEB';
  loading = false;

  constructor(private loader: LoaderService,private auth: AuthService) {}

  ngOnInit() {
    this.loader.loading$.subscribe(state => {
      this.loading = state;
    });

    ['click', 'mousemove', 'keydown'].forEach(event => {
      if (typeof window !== 'undefined') {
           window.addEventListener(event, () => this.auth.resetLogoutTimer());
      }
   
  });
  
  }
}
