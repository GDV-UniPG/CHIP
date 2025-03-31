
import { Injectable } from '@angular/core';
import {  NativeDateAdapter } from '@angular/material/core';

import moment from 'moment';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter  {
  format(date: Date): string {
    return moment(date).format('DD/MM/YYYY');
  }

  parse(value: any): Date | null {
    if (!moment(value, 'DD/MM/YYYY', true).isValid()) {
      return this.invalid();
    }
    return moment(value, 'DD/MM/YYYY', true).toDate();
  }
}