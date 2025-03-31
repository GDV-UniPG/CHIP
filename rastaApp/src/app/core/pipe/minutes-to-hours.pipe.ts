import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language-service.service';

@Pipe({
  name: 'minutesToHours'
})
export class MinutesToHoursPipe implements PipeTransform {

  transform(minutes: number): string {

    if (isNaN(minutes) || minutes < 0) {
      return `0 h`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let finalValue
    if (hours == 0) {
      finalValue = ` ${mins > 0 ? ` ${mins} m` : '0 m'}`
    } else {
      finalValue = `${hours} h ${mins > 0 ? ` ${mins} m` : ''}`
    }
    return finalValue;
  }
}
