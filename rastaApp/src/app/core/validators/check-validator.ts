import { FormGroup } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";

export class CheckValidator {
  constructor(private translate:TranslateService){

  }
    checkValidation(input: string, form:FormGroup){
      if(form.get(input)!=null)
        return form.get(input).invalid && (form.get(input).dirty || form.get(input).touched)
      else
        return true;
    }
    
    emailErrors(form:FormGroup) {    
      return form.get('email').hasError('required') ? this.translate.instant(this.translate.instant('validator_strings.required_field')): 
        form.get('email').hasError('pattern') ? this.translate.instant('validator_strings.not_valid_email_address'):''
    }

    dateErrors(form:FormGroup) {
      return form.get('date').hasError('yearTooLarge') ?this.translate.instant('validator_strings.not_valid_year') :
      form.get('date').hasError('monthInvalid') ? this.translate.instant('validator_strings.not_valid_month') :
      form.get('date').hasError('dayInvalid') ? this.translate.instant('validator_strings.not_valid_day') :
      form.get('date').hasError('dateInvalid') ? this.translate.instant('validator_strings.not_valid_date'):
      form.get('date').hasError('required') ? this.translate.instant('validator_strings.required_field') :''
    }
    
    pwdErrors(name:string, form:FormGroup) {
      return form.get(name).hasError('required') ? this.translate.instant('validator_strings.required_field') :
      form.get(name).hasError('min') ? this.translate.instant('validator_strings.min_pwd') : 
      form.get(name).hasError('uppercase') ? this.translate.instant('validator_strings.uppercase_pwd') : 
      form.get(name).hasError('lowercase') ? this.translate.instant('validator_strings.lowercase_pwd') : 
      form.get(name).hasError('symbol') ?  this.translate.instant('validator_strings.symbol_pwd'): 
      form.get(name).hasError('max') ? this.translate.instant('validator_strings.max_pwd') : 
      form.get(name).hasError('number') ?this.translate.instant('validator_strings.number_pwd') : 
      form.get(name).hasError('pattern') ? this.translate.instant('validator_strings.not_valid_pwd'): 
      form.get(name).hasError('passwordsNotMatching') ? this.translate.instant('validator_strings.matching_pwd') :''
    }
    
    toiErrors(name:string,form:FormGroup) {
      if( form.get(name)!=null)
        return form.get(name).hasError('required') ? this.translate.instant('validator_strings.required_field') :
          form.get(name).hasError('min') ? this.translate.instant('validator_strings.min_toi'):
          form.get(name).hasError('max') ? this.translate.instant('validator_strings.max_toi') :''
    }
}