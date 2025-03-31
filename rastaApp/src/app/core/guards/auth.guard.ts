import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { UserService } from '../services/user.service';
import { AppUtilService } from '../services/app-util.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService, private appService:AppUtilService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data.expectedRole;
   if (!this.userService.isUserLoggedIn()) {
      this.appService.goLink("login")
      return false;
    }else if(expectedRole!=='auth-user' &&  this.userService.getUserRole() !== expectedRole){
      this.appService.goLink("login")
      return false;
    } 
    return true;
  }
  
}
