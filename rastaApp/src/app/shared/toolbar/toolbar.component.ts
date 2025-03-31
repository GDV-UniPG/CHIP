import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { Action } from '../../core/constants/action.interface';
import { Observable } from 'rxjs';
import {
  AuthAdminActions,
  AuthTouristActions,
  NoAuthUserActions,
} from '../../core/constants/user-action';

import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from 'src/app/core/services/language-service.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  sidenav: boolean = false;
  actionObs: Observable<Action[]>;
  actions: Action[];

  title = 'RASTA';

  languageList;

  constructor(
    public userService: UserService,
    public languageService: LanguageService,
    private translateService: TranslateService
  ) {
    this.actionObs = this.userService.getUserAction();
    this.languageList = languageService.getLanguageList();
  }

  changeSiteLanguage(localeCode: string) {
    this.languageService.changeSiteLanguage(localeCode);
  }

  logout() {
    this.userService.logout();
  }

  toggleSidenav() {
    this.sidenav = !this.sidenav;
  }

  ngOnInit(): void {
    this.actionObs.subscribe((data) => {
      this.actions = data;
      this.actions.forEach((action) => {
        this.translateService.get(action.action).subscribe((translation) => {
          action.action = translation;
        });
      });
    });
   
  }
}
