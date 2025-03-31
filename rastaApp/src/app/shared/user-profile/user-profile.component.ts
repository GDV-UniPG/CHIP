import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { UserService } from 'src/app/core/services/user.service';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { CustomValidators, dateFilter, onDateChange, onPasswordChange } from 'src/app/core/validators/custom-validators.validator';
import { ToiPrefDialogComponent } from './toi-pref-dialog/toi-pref-dialog.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {

  user;
  role: string;
  edit: boolean = false;
  personalInfoButtonText: string;
  changePwdOpened: boolean = false;
  showPwd = false;
  showPwdConf = false;
  showActualPwd = false;
  passwordToggleIcon2 = 'eye';
  checkValidator: CheckValidator = new CheckValidator(this.translateService);

  passwordForm: FormGroup = new FormGroup({});

  regions = [];
  countries = [];
  countriesRegions = [];

  dateOfBirth: string;

  form: FormGroup = new FormGroup({});


  onPasswordChange = onPasswordChange;
  onDateChange = onDateChange;
  dateFilter = dateFilter;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private translateService: TranslateService,
    private appUtilService: AppUtilService,
    private dialog: MatDialog,
  ) {
    this.form = this.fb.group({
      date: new FormControl(null, [Validators.required])
    });
    this.passwordForm = this.fb.group(
      {
        actualPwd: [null, [Validators.required]],
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
        ],
      },
      { validators: CustomValidators.passwordMatching }
    );
  }

  changePassword() {
    this.userService
      .changePassword(
        this.passwordForm.get('actualPwd').value,
        this.passwordForm.get('pwd').value
      )
      .subscribe((data: string) => {
        this.appUtilService.openDialog('', data, null, null, null);
        this.changePwdOpened = false;
        this.passwordForm.reset();
      });
  }

  editpersonalInfo() {
    if (this.countriesRegions.length == 0) {
      this.appUtilService.fetchCountry().subscribe((data: [{ name; region }]) => {
        this.countriesRegions = data.map(el=> {return {
          name:el.name.common,
          region:el.region
        }
        });
        this.countriesRegions.forEach((el) => {
          if (!this.regions.includes(el.region))
            this.regions.push(el.region);
          if (el.region == this.user.region) this.countries.push(el.name);
        });
      });
    }
    if (this.edit) {
      this.translateService
        .get('user_profile.edit_info_button_text')
        .subscribe((res: string) => {
          this.personalInfoButtonText = res;
        });

      let info = null;
      if (this.userService.isAdminLoggedIn()) {
        info = {
          name: this.user.name,
          surname: this.user.surname
        }
      } else {
        this.user.date_of_birth = this.convertDate(new Date(this.form.get('date').value))
        info = {
          name: this.user.name,
          surname: this.user.surname,
          country: this.user.country,
          region: this.user.region,
          gender: this.user.gender,
          date_of_birth: this.user.date_of_birth
        }
      }
      this.userService.changePersonalInfo(info).subscribe((data: string) => {
        this.dateOfBirth = new Date(this.user.date_of_birth).toLocaleDateString('it-IT');
        this.translateService.get('custom_dialog.success_title')
          .subscribe((res: string) => {
            this.appUtilService.openDialog(res, data, null, null, null)
          })

      })
    }
    else {
      this.translateService
        .get('user_profile.save_button_text')
        .subscribe((res: string) => {
          this.personalInfoButtonText = res;
        });
    }
    this.edit = !this.edit;
  }

  toggleChangePassword() {
    this.changePwdOpened = !this.changePwdOpened;
  }

  convertDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  openDeleteDialog() {
    let title: string;
    this.translateService
      .get('custom_dialog.error_title')
      .subscribe((res: string) => {
        title = res;
      });
    this.translateService
      .get('user_profile.delete_dialog_content')
      .subscribe((res: string) => {
        this.appUtilService.openDialog(
          title,
          res,
          null,
          null,
          () => {
            this.translateService
              .get('custom_dialog.success_title')
              .subscribe((res: string) => {
                this.userService.deleteUser().subscribe((data: string) => {
                  this.appUtilService.openDialog(res, data, null, null, null);
                });
                this.userService.logout();
              });
          }
        );
      });
  }

  updateCountry(region) {
    this.user.country = null
    this.countries = [];
    this.countriesRegions.forEach((el) => {
      if (el.region == region) this.countries.push(el.name);
    });
  }

  openPreferenceToiDialog() {
    this.dialog.open(ToiPrefDialogComponent,
      {
        width: '95%',
        maxWidth: '700px'
      })
  }

  async ngOnInit() {
    this.translateService
      .get('user_profile.edit_info_button_text')
      .subscribe((res: string) => {
        this.personalInfoButtonText = res;
      });
    if (this.userService.userObs == null) {
      await this.userService.getCurrentUser()
    }
    this.userService.userObs.subscribe((data) => {
      if (data) {
        this.user = data;
        this.role = this.userService.getUserRole();
        if (this.role == 'tourist') {
          this.dateOfBirth = new Date(this.user.date_of_birth).toLocaleDateString('it-IT');
          this.form.patchValue({ date: this.user.date_of_birth });
        }
      }
    });

  }



}
