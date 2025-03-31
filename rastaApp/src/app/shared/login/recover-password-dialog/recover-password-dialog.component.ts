import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { UserService } from 'src/app/core/services/user.service';
import { CheckValidator } from 'src/app/core/validators/check-validator';

@Component({
  selector: 'app-recover-password-dialog',
  templateUrl: './recover-password-dialog.component.html',
  styleUrls: ['./recover-password-dialog.component.scss']
})
export class RecoverPasswordDialogComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  checkValidator:CheckValidator=new CheckValidator(this.translateService);

  constructor( public dialogRef: MatDialogRef<RecoverPasswordDialogComponent>,
     private fb: FormBuilder,
     private userService: UserService,
     private appUtilService: AppUtilService, 
     private translateService:TranslateService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [null, [Validators.required]]
    });
  }
  close(): void {
    this.dialogRef.close();
  }

  sendEmail(): void {
   this.userService.sendEmailToRecoverPassword(this.form.get('email').value).subscribe((data:string)=>{
    this.translateService
      .get('custom_dialog.success_title')
      .subscribe((title: string) => {
        this.appUtilService.openDialog(title, data, ()=>{this.close()}, null, null)
      })
   })
  }

}
