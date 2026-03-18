// shared/toast/toast.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Toast } from '../models/toast.model'; 

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toastSubject = new Subject<Toast>();
  toast$ = this.toastSubject.asObservable();
  private counter = 0;

  show(message: string, type: Toast['type'] = 'info', delay = 3000) {
    this.toastSubject.next({
      id: ++this.counter,
      message,
      type,
      delay
    });
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error', 5000);
  }

  warning(message: string) {
    this.show(message, 'warning');
  }

  info(message: string) {
    this.show(message, 'info');
  }
}