import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})

export class LanguageService {

  private defaultLanguage: string = 'en';
  private languageList = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
  ];
  
  private siteLanguage = 'English';

  constructor(private translateService: TranslateService) {}

  initializeLanguage() {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const languageToSet = savedLanguage || this.defaultLanguage;
    this.setLanguage(languageToSet);
  }

  setLanguage(localeCode: string) {
    this.translateService.use(localeCode);
    localStorage.setItem('selectedLanguage', localeCode);
    this.siteLanguage = this.languageList
    .find((language) => language.code === localeCode)
    ?.label.toString();
  }


  changeSiteLanguage(localeCode: string): void {
    const selectedLanguage = this.languageList
      .find((language) => language.code === localeCode)
      ?.label.toString();
    if (selectedLanguage) {
      this.siteLanguage = selectedLanguage;
      this.translateService.use(localeCode);
    }
    this.setLanguage(localeCode)
    window.location.reload();

  }

  getSiteLanguage():string{
    return this.siteLanguage;
  }

  getCodeSiteLanguage(){
    let localeCode = this.languageList
    .find((language) => language.label === this.siteLanguage)
    ?.code.toString();
    return localeCode
  }
  
  getLanguageList(){
    return this.languageList;
  }
}
