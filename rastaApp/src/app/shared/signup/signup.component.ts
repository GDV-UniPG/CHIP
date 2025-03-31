import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TouristUser } from 'src/app/core/models/user.model';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { UserService } from 'src/app/core/services/user.service';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { CustomValidators, dateFilter, onDateChange, onPasswordChange } from 'src/app/core/validators/custom-validators.validator';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  regions = [];
  countries = [];
  countriesRegions = [];

  form: FormGroup = new FormGroup({});
  showPwd = false;
  showPwdConf = false;
  passwordToggleIcon2 = 'eye';
  user: TouristUser = new TouristUser();
  checkValidator: CheckValidator = new CheckValidator(this.translateService);

  onPasswordChange=onPasswordChange;
  onDateChange=onDateChange;
  dateFilter=dateFilter;

  constructor(private fb: FormBuilder, private userService: UserService, 
    private appUtilService: AppUtilService, 
    private translateService:TranslateService) {
    this.form = this.fb.group(
      {
        name: [null, [Validators.required]],
        surname: [null, [Validators.required]],
        email: [
          null,
          [
            Validators.required,
            Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'),
          ],
        ],
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
        date: [null, [Validators.required]],
        gender: [null, [Validators.required]],
        region: [null, [Validators.required]],
        country: [{ value: null, disabled: true }, [Validators.required]],
      },
      { validators: CustomValidators.passwordMatching }
    );
  }

  convertDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }


  signup() {
    this.user = this.form.value;
    this.user.date_of_birth = this.convertDate(this.form.get('date').value);
    this.userService.signup(this.user).subscribe((data: string) => {
      this.translateService.get('custom_dialog.success_title').subscribe(title=>{
        this.appUtilService.openDialog(title, data, null, null, null);
        this.form.reset();
      })
      
    });
  }

  ngOnInit(): void {
    this.appUtilService.fetchCountry().subscribe((data: [{ name; region }]) => {
      this.countriesRegions = data.map(el=> {return {
        name:el.name.common,
        region:el.region
      }
      });
      this.countriesRegions.forEach((element) => {
        if (!this.regions.includes(element.region))
          this.regions.push(element.region);
      });
    });

    this.form.get('region').valueChanges.subscribe((region) => {
      if (region != null) {
        this.countries = [];
        this.form.get('country').enable();
        this.countriesRegions.forEach((el) => {
          if (el.region == region) this.countries.push(el.name);
        });
      }
    });
  }

 

}
