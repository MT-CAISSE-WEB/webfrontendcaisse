import { Component,OnInit } from '@angular/core';
import { ToastService } from './toast.service';
import { Toast } from '../models/toast.model';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
     toasts: Toast[] = [];

  constructor(private toastService: ToastService,private cdr:ChangeDetectorRef) {}

  ngOnInit() {
    this.toastService.toast$.subscribe(toast => {
      console.log("toast actionné : ",toast);
      this.toasts.push(toast);
      this.cdr.detectChanges();

      setTimeout(() => {
        this.remove(toast.id!);
      }, toast.delay);
    });
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  getClass(type: string) {
    return {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info'
    }[type];
  }

   getAlertClass(type: string) {
    return {
      success: 'alert-success',
      error: 'alert-danger',
      warning: 'alert-warning',
      info: 'alert-info'
    }[type] || 'alert-primary';
  }

  getIconClass(type: string) {
    return {
      success: 'ri-check-double-line text-success',
      error: 'ri-error-warning-line text-danger',
      warning: 'ri-alert-line text-warning',
      info: 'ri-airplay-line text-info'
    }[type] || 'ri-notification-line text-primary';
  }

  getTitle(type: string) {
    return {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Info'
    }[type] || 'Message';
  }
}
