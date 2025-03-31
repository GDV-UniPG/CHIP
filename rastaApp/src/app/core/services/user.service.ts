import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  map,
  distinctUntilChanged,
  tap,
  shareReplay,
  catchError,
} from 'rxjs/operators';

import { JwtService } from './jwt.service';
import {LoginCredentials, TouristUser, AdminUser } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { POI_TOI_MANAGER_ADDRESS } from 'src/environments/environment.prod';
import { AppUtilService } from './app-util.service';
import { Action } from '../constants/action.interface';
import {
  AuthAdminActions,
  AuthTouristActions,
  NoAuthUserActions,
} from '../constants/user-action';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  userObs: Observable<AdminUser | TouristUser> =null;
  private currentUserSubject = new BehaviorSubject<AdminUser|TouristUser>(null);
  currentUser = this.currentUserSubject.asObservable();

  private userActionsSubject = new BehaviorSubject<Action[]>(NoAuthUserActions);
  private userActions = this.userActionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtService: JwtService,
    private router: Router,
    private app: AppUtilService
  ) {}

  login(credentials: LoginCredentials): Observable<void | string> {
    return this.http
      .post<void | string>(POI_TOI_MANAGER_ADDRESS + 'user/login', credentials)
      .pipe(
        tap(async (token: any) => {
          await this.setUserToken(token);
          await this.setActions();
          await this.getCurrentUserLogin();
          await this.app.goLink('/profile');
        })
      );
  }

  private setActions() {
    if (this.getUserRole() === 'admin') {
      this.userActionsSubject.next(AuthAdminActions);
    } else if (this.getUserRole() === 'tourist') {
      this.userActionsSubject.next(AuthTouristActions);
    }
  }

  getUserAction() {
    if (this.isUserLoggedIn()) {
      this.setActions();
    }
    return this.userActions;
  }
  
  private removeActions() {
    this.userActionsSubject.next(NoAuthUserActions);
  }

  private setUserToken(token: string) {
    this.jwtService.setToken(token);
  }

  async getCurrentUser(){
    try {
      if (this.isUserLoggedIn() && this.currentUserSubject.value === null) {
        const userInfo = await this.getUserInfo();
        this.currentUserSubject.next(userInfo);
      } 
      this.userObs = await this.currentUser
      
    } catch (error) {
      console.log(error)
  }
  }

  async getCurrentUserLogin(){
    try {
      if (this.isUserLoggedIn()) {
        const userInfo = await this.getUserInfo();
        this.currentUserSubject.next(userInfo);
      } 
      this.userObs = await this.currentUser
      
    } catch (error) {
      console.log(error)
  }
  }

  private removeUser(): void {
    this.jwtService.removeToken();
  }

  logout(): void {
    this.removeUser();
    this.removeActions();
    this.router.navigate(['/']);
  }

  isUserLoggedIn() {
    return (
      this.jwtService.getToken() != undefined &&
      this.jwtService.getToken() != null &&
      this.jwtService.isTokenExpired()
    );
  }

  isTouristLoggedIn(): boolean {
    if (this.isUserLoggedIn()) if (this.getUserRole() == 'tourist') return true;
    return false;
  }

  isAdminLoggedIn(): boolean {
    if (this.isUserLoggedIn()) if (this.getUserRole() == 'admin') return true;
    return false;
  }

  getUserRole(): string {
    return JSON.parse(atob(this.jwtService.getToken().split('.')[1])).role;
  }

  signup(user: TouristUser): Observable<void | string> {
    return this.http
      .post<void | string>(POI_TOI_MANAGER_ADDRESS + 'user/signup', user)
      .pipe(
        tap(() => {
          this.app.goLink('/');
        })
      );
  }


  changePassword(currentPwd:string, newPwd:string){
    return this.http.put(POI_TOI_MANAGER_ADDRESS + 'user/change-password', {currentPwd, newPwd})
  }

  changePersonalInfo(info:{}){
    return this.http.put(POI_TOI_MANAGER_ADDRESS + 'user/change-personal-info', {info})
  }


  private async getUserInfo(): Promise<any> {
    if(this.getUserRole()=="admin"){
      try {
        return this.http
          .get(POI_TOI_MANAGER_ADDRESS + 'user/admin/get-admin-info')
          .toPromise();
      } catch (error) {
        console.log(error);
      }
    }else{
      try {
        let user:any=await this.http
          .get(POI_TOI_MANAGER_ADDRESS + 'user/auth-tourist/get-tourist-info')
          .toPromise();
        user.toi_pref=await this.getUserToiPreference();
        user.toi_pref= user.toi_pref.sort((a, b) => a.id - b.id)
        user.toi_pref.map(toi=>toi.score_preference=toi.score_preference*2);
        user.saved_tour=await this.getSavedTour();
        return user
      } catch (error) {
        console.log(error);
      }
    }
    
  }

  async updatePreferences(){
    const userInfo = await this.getUserInfo();
    this.currentUserSubject.next(userInfo);
    this.userObs = await this.currentUser;
  }
    
  getUserToiPreference(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+"user/auth-tourist/get-user-toi-preference").toPromise();
  }

  getSavedTour(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/get-favorite-itineraries').toPromise()
  }

  sendEmailToRecoverPassword(email:string){
    return this.http.post(POI_TOI_MANAGER_ADDRESS + 'user/send-email-recover-password', {email})
  }
  recoverPassword(password:string, token:string){
    return this.http.put(POI_TOI_MANAGER_ADDRESS + 'user/recover-password', {password, token})
  }

  verifyEmail(token:string){
    return this.http.get(POI_TOI_MANAGER_ADDRESS + 'user/verify-email/'+token)
  }

  deleteUser(){
    return this.http.delete(POI_TOI_MANAGER_ADDRESS + 'user/delete-user')
  }
}
