import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() { }

  private offsetSeconds=60;

  setToken(token:string){
    sessionStorage.setItem("token",token);
  }
  
  getToken(){
    return sessionStorage.getItem("token")
  }
 
  removeToken() {
    sessionStorage.removeItem("token");
  }
 
  isTokenExpired(): boolean {
    const expiry = (JSON.parse(atob(this.getToken().split('.')[1]))).exp;
    if(expiry * 1000 < Date.now()){
      this.removeToken()
      return false;
    }
    return true;
  }

  isTokenExpiringSoon(): boolean {
    const tokenExpirationDate = ((JSON.parse(atob(this.getToken().split('.')[1]))).exp)*1000;
    const offsetDate = (new Date(new Date().getTime() + this.offsetSeconds)).getTime();
    return tokenExpirationDate < offsetDate;
   }


}
