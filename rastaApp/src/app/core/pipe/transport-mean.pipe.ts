import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language-service.service';

@Pipe({
  name: 'transportMean',
  pure:false
})
export class TransportMeanPipe implements PipeTransform {
  constructor(private translate: LanguageService) {}

  transform(value: unknown): string {
    if(value=="driving-car") return this.translate.getCodeSiteLanguage()=='it'? "Macchina": "Car";
    if(value=="cycling-regular") return this.translate.getCodeSiteLanguage()=='it'? "In bici":"By bike";
    if(value=="foot-walking") return this.translate.getCodeSiteLanguage()=='it'? "A piedi": "On foot";
  }

}
