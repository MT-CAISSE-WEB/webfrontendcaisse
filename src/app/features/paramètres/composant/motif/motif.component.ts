import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-motif',
  imports: [FormsModule],
  templateUrl: './motif.component.html',
  styleUrl: './motif.component.css',
})
export class MotifComponent {
  notifSysteme: boolean = true; // activé par défaut
  notifPush: boolean = true; // activé par défaut
  notifEmail: boolean = false;

  desactiverTout() {
    this.notifSysteme = false;
    this.notifPush = false;
    this.notifEmail = false;
  }
}
