import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';

import { UserService } from '../services/user.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private user:UserService) { }

  intercept(req, next){
    if(this.user.isUserLoggedIn()){ 
      req= req.clone({
        setHeaders:{
          authorization:`Bearer ${sessionStorage.getItem('token')}`
        } 
      })
      return next.handle(req);
    }else{
      return next.handle(req);
    }

  }
}
