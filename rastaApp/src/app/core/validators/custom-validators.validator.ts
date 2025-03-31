import { AbstractControl} from '@angular/forms';


export class CustomValidators {
   
    static passwordMatching(control: AbstractControl):{[key:string]: boolean}|null {
        const password = control.get('pwd').value;
        const confirmPassword = control.get('pwdConf').value;

        if(confirmPassword!==null && password!==null)
            if (password !== confirmPassword) {
                control.get('pwdConf').setErrors({passwordsNotMatching: true});
            } else {
                control.get('pwdConf').setErrors(null);
                return null;
            }
    }
}

export function onPasswordChange(form, event, name) {
    let pwd = event.target.value;
    if (pwd.length < 8) {
      form.get(name).setErrors({ min: true });
      return;
    }
    if (pwd.length > 30) {
      form.get(name).setErrors({ max: true });
      return;
    }
    if (!(/[A-Z]/.test(pwd))) {
      form.get(name).setErrors({ uppercase: true });
      return;
    }
    if (!(/[a-z]/.test(pwd))) {
      form.get(name).setErrors({ lowercase: true });
      return;
    }
    if (!(/[@$!%*#?&^_-]/.test(pwd))) {
      form.get(name).setErrors({ symbol: true });
      return;
    }
    if (!(/\d/.test(pwd))) {
      form.get(name).setErrors({ number: true });
      return;
    }
  }

  export function  onDateChange(form, event) {
    let date = event.target.value;
    let day = date.split('/')[0];
    let month = date.split('/')[1];
    let year = date.split('/')[2];

    month = Number(month);
    day = Number(day);
    year = Number(year);
    
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
     form.get('date').setErrors({ dateInvalid: true });
     return;
    }
    if (month < 1 || month > 12) {
     form.get('date').setErrors({ monthInvalid: true });
      return;
    }
    if (day < 1 || day > 31) {
     form.get('date').setErrors({ dayInvalid: true });
      return;
    }
    var currentYear = Number(new Date().getFullYear());
    var currentMonth = Number(new Date().getMonth() + 1);
    var currentDay = Number(new Date().getDate());

    if (
      year > currentYear ||
      (year == currentYear && month > currentMonth) ||
      (year == currentYear && month == currentMonth && day > currentDay)
    ) {
     form.get('date').setErrors({ yearTooLarge: true });
      return;
    }
    month = ('0' + month).slice(-2);
    day = ('0' + day).slice(-2);
    event.target.value = day + '/' + month + '/' + String(year);
   form.get('date').setErrors(null);
  }

  export function dateFilter(d: Date | null): boolean {
    const date = d || new Date();
    let currenteDate = new Date();
    return date <= currenteDate;
  }
