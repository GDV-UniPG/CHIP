import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LoginCredentials } from 'src/app/core/models/user.model';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { UserService } from 'src/app/core/services/user.service';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { RecoverPasswordDialogComponent } from './recover-password-dialog/recover-password-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  
  form: FormGroup = new FormGroup({});
  credentials: LoginCredentials=new LoginCredentials()
  showPwd:boolean=false;
  checkValidator:CheckValidator=new CheckValidator(this.translateService);

  constructor(private fb: FormBuilder,
              private user:UserService,
              public appUtil:AppUtilService,
              private dialog:MatDialog,
              private translateService:TranslateService) {

  this.form = this.fb.group({
            email: [null, [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
            pwd: [null, [Validators.required]]
    });

  }

  login(){
    this.credentials.username=this.form.get("email").value;
    this.credentials.pwd=this.form.get("pwd").value;
    this.user.login(this.credentials).subscribe(()=>{    
      this.form.reset();
    });
  }

  onForgotPassword(){
    this.dialog.open(RecoverPasswordDialogComponent)

  }
  ngOnInit(): void {
  }

}
