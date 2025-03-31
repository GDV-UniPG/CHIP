import { Injectable } from '@angular/core';
import {  HttpInterceptor} from '@angular/common/http';

@Injectable()
export class LanguageInterceptorInterceptor implements HttpInterceptor {

  constructor(){}

  intercept(req, next){
   
    const language = localStorage.getItem('selectedLanguage'); 
    req= req.clone({
      setHeaders:{
        'accept-language': language
      } 
    });
    return next.handle(req);
  }
}
