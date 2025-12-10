import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from './_core/utils/loaders.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'MTCAISSEWEB';
  loading = false;

  constructor(private loader: LoaderService) {}

  ngOnInit() {
    this.loader.loading$.subscribe(state => {
      this.loading = state;
    });
  }
}
