import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {

  token: string;

  constructor(public route:ActivatedRoute,private userService: UserService,private appUtilService: AppUtilService, private translateService:TranslateService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.token = params['token'];
    });
  }

  confirm(){
    this.userService.verifyEmail(this.token).subscribe((data:string)=>{
      this.translateService
      .get('custom_dialog.success_title')
      .subscribe((title: string) => {
        this.appUtilService.openDialog(title, data, ()=>{this.appUtilService.goLink('login')}, null, null)
      })
      });
      
  }
}
