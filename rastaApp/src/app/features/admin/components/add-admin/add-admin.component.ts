import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { AdminService } from '../../admin.service';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-admin',
  templateUrl: './add-admin.component.html',
  styleUrls: ['./add-admin.component.scss'],
})
export class AddAdminComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  checkValidator: CheckValidator = new CheckValidator(this.translateService);
  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private appUtilService: AppUtilService,
    private translateService: TranslateService
  ) {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      surname: [null, [Validators.required]],
      email: [
        null,
        [
          Validators.required,
          Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'),
        ],
      ],
    });
  }

  ngOnInit(): void {}

  addAdmin() {
    let name = this.form.get('name').value;
    let surname = this.form.get('surname').value;
    let email = this.form.get('email').value;
    this.adminService
      .addAdmin(name, surname, email)
      .subscribe((data: string) => {
        this.translateService
          .get('custom_dialog.success_title')
          .subscribe((title: string) => {
            this.appUtilService.openDialog(title, data, null, null, null);
          });
        this.form.reset();
      },(err)=>this.form.reset());
  }
}
