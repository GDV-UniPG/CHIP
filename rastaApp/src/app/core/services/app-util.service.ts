import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  POI_TOI_MANAGER_ADDRESS,
  countryApiUrl,
} from 'src/environments/environment.prod';
import { Toi } from '../models/toi.model';
import { MatDialog } from '@angular/material/dialog';
import { CustomDialogComponent } from 'src/app/shared/custom-dialog/custom-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class AppUtilService {
  constructor(private router: Router, private http: HttpClient, private dialog: MatDialog) {}

  goLink(link: string) {
    this.router.navigateByUrl(link);
  }

  openDialog(title: String, content: String, onButtonClick:any, onButtonNoClick:any, onButtonYesClick:any): void {
    this.dialog.open(CustomDialogComponent, {
      data: { title: title, content: content, onButtonClick:onButtonClick, onButtonNoClick:onButtonNoClick, onButtonYesClick:onButtonYesClick },
    });
  }

  //used to fetch country in signup
  countries = [];

  fetchCountry() {
    const apiUrl = countryApiUrl;
    return this.http.get(apiUrl);
  }

 
  getTois(): Observable<Toi[]> {
    return this.http.get<Toi[]>(POI_TOI_MANAGER_ADDRESS + 'get-tois');
  }

}
