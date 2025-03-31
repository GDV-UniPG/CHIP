import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { UserService } from 'src/app/core/services/user.service';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { CustomValidators, onPasswordChange } from 'src/app/core/validators/custom-validators.validator';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss']
})
export class NewPasswordComponent implements OnInit {

  token: string;
  form: FormGroup = new FormGroup({});
  showPwd = false;
  showPwdConf = false;
  passwordToggleIcon2 = 'eye';
  checkValidator: CheckValidator = new CheckValidator(this.translateService);
  onPasswordChange=onPasswordChange;
  
  constructor(public route:ActivatedRoute, private userService: UserService,private fb: FormBuilder,
    private appUtilService: AppUtilService, private translateService:TranslateService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.token = params['token'];
    });

    this.form = this.fb.group({
      pwd: [
        null,
        [
          Validators.required,
          Validators.pattern(
            '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,30}'
          ),
        ],
      ],
      pwdConf: [
        null,
        [
          Validators.required,
          Validators.pattern(
            '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*#?&^_-]).{8,30}'
          ),
        ],
      ]
    },
    { validators: CustomValidators.passwordMatching });
  }

  sendNewPassword(){
    this.userService.recoverPassword(this.form.get('pwd').value, this.token).subscribe((data:string)=>{
      this.translateService
      .get('custom_dialog.success_title')
      .subscribe((title: string) => {
        this.appUtilService.openDialog(title, data, ()=>{this.appUtilService.goLink('login')}, null, null)
      })
    })
  }

}
