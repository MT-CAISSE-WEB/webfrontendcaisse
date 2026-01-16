import { Component } from '@angular/core';
import { FormBuilder,FormGroup,Validators,ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loading = false;
  errormsg ='';
  form!: FormGroup;

  constructor(private fb:FormBuilder,private auth:AuthService,private router:Router){}
  ngOnInit(): void {
    this.initform();
  }

  initform()
  {
    this.form = this.fb.group({
      login : ['', Validators.required],
      password : ['',Validators.required]
    });
  }

  login(){
    if(this.form.invalid){
      console.log(this.form.value);
      return;
    }

    this.loading =true;
    this.errormsg ='';

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/app']);
      },
       error: err => {
        this.loading = false;
         this.errormsg = err.error.msg; 
        this.errormsg = err.error?.msg || "Identifiants incorrects";
      }
    })
  }
  

 
}

