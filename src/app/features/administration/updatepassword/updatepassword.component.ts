import { Component } from '@angular/core';
import { userservice } from '../service/user.service';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-updatepassword',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './updatepassword.component.html',
  styleUrl: './updatepassword.component.css',
})
export class UpdatepasswordComponent {
  passwordForm!: FormGroup;
  loading = false;

  ngOnInit() {
    this.passwordForm = this.fb.group(
      {
        currentpassword: ['', Validators.required],
        newpassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmpassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  constructor(
    private fb: FormBuilder,
    private toast: ToastrService,
    private us: userservice,
    public router: Router,
  ) {}
  get user() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  passwordMatchValidator(form: AbstractControl) {
    const newpassword = form.get('newpassword')?.value;
    const confirmpassword = form.get('confirmpassword')?.value;

    return newpassword === confirmpassword ? null : { passwordMismatch: true };
  }

  isInvalid(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit() {
    if (this.passwordForm.invalid) return;

    this.loading = true;

    const payload = {
      currentpassword: this.passwordForm.value.currentpassword,
      newpassword: this.passwordForm.value.newpassword,
    };

    this.us.changepassword(payload, this.user.idutilisateur).subscribe({
      next: (res) => {
        this.loading = false;
        this.passwordForm.reset();
        this.toast.success(res.message);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error.message);
      },
    });
  }

  get hasPasswordMismatch(): boolean {
    return this.passwordForm.hasError('passwordMismatch');
  }
}
