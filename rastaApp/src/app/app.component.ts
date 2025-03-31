import { Component, OnInit } from '@angular/core';
import { AuthAdminActions, AuthTouristActions, NoAuthUserActions } from './core/constants/user-action';
import { UserService } from './core/services/user.service';
import { Action } from './core/constants/action.interface';
import { Observable } from 'rxjs';
import { LanguageService } from 'src/app/core/services/language-service.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private languageService: LanguageService,
     private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer) {
    this.matIconRegistry.addSvgIcon(
      '1_empty',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/1_empty.svg')
    );this.matIconRegistry.addSvgIcon(
      '2_empty',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/2_empty.svg')
    );this.matIconRegistry.addSvgIcon(
      '3_empty',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/3_empty.svg')
    );this.matIconRegistry.addSvgIcon(
      '4_empty',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/4_empty.svg')
    );this.matIconRegistry.addSvgIcon(
      '5_empty',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/5_empty.svg')
    );
    this.matIconRegistry.addSvgIcon(
      '1_full',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/1_full.svg')
    );
    this.matIconRegistry.addSvgIcon(
      '2_full',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/2_full.svg')
    );
    this.matIconRegistry.addSvgIcon(
      '3_full',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/3_full.svg')
    );
    this.matIconRegistry.addSvgIcon(
      '4_full',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/4_full.svg')
    );
    this.matIconRegistry.addSvgIcon(
      '5_full',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/5_full.svg')
    );
  }

  ngOnInit() {
    this.languageService.initializeLanguage();
  }
 
  
 }


