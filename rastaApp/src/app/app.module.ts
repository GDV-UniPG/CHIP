import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PoiDialogComponent } from './features/admin/components/handle-poi/poi-dialog/poi-dialog.component';
import { AppRoutingModule } from './core/routing/app-routing.module';
import { AppComponent } from './app.component';
import { ToolbarComponent } from './shared/toolbar/toolbar.component';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { NgMaterialModule } from './core/ng-material/ng-material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './shared/login/login.component';
import { SignupComponent } from './shared/signup/signup.component';
import { ItineraryComponent } from './features/itinerary/itinerary.component';
import { SavedTourComponent } from './features/tourist/components/saved-tour/saved-tour.component';
import { HandlePoiComponent } from './features/admin/components/handle-poi/handle-poi.component';
import { HandleToiComponent } from './features/admin/components/handle-toi/handle-toi.component';
import { PreferencesComponent } from './features/itinerary/preferences/preferences.component';
import { RankingComponent } from './features/itinerary/ranking/ranking.component';
import { ConstraintsComponent } from './features/itinerary/constraints/constraints.component';
import { MapComponent } from './shared/map/map.component';
import { CustomDialogComponent } from './shared/custom-dialog/custom-dialog.component';
import { UserProfileComponent } from './shared/user-profile/user-profile.component';
import { ToiDialogComponent } from './features/admin/components/handle-toi/toi-dialog/toi-dialog.component'; 
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LanguageInterceptorInterceptor } from './core/interceptors/language-interceptor.interceptor';
import { RecoverPasswordDialogComponent } from './shared/login/recover-password-dialog/recover-password-dialog.component';
import { NewPasswordComponent } from './shared/new-password/new-password.component';
import { VerifyEmailComponent } from './shared/signup/verify-email/verify-email.component';
import { AddAdminComponent } from './features/admin/components/add-admin/add-admin.component';
import { ToiPrefDialogComponent } from './shared/user-profile/toi-pref-dialog/toi-pref-dialog.component';
import { ResultComponent } from './features/itinerary/result/result.component';
import { ItineraryMapComponent } from './features/itinerary/result/itinerary-map/itinerary-map.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { LoaderInterceptor } from './core/interceptors/loader.interceptor';
import { SaveItineraryDialogComponent } from './features/itinerary/result/save-itinerary-dialog/save-itinerary-dialog.component';
import { UpdateItineraryDialogComponent } from './features/tourist/components/saved-tour/update-itinerary-dialog/update-itinerary-dialog.component';
import { ItineraryDetailsComponent } from './features/itinerary/result/itinerary-details/itinerary-details.component';
import { HomeComponent } from './shared/home/home.component'
import { VisualizationComponent } from './features/admin/components/visualization/visualization.component';
import { MinutesToHoursPipe } from './core/pipe/minutes-to-hours.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SentimentTooltipComponent } from './features/itinerary/ranking/sentiment-tooltip/sentiment-tooltip.component';
import { TransportMeanPipe } from './core/pipe/transport-mean.pipe';
import { TitleDialogComponent } from './features/itinerary/result/itinerary-details/title-dialog/title-dialog.component';
import { NgxChartsModule }from '@swimlane/ngx-charts'; 

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http,
    './assets/i18n/',
    '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    ToolbarComponent,
    LoginComponent,
    SignupComponent,
    ItineraryComponent,
    SavedTourComponent,
    HandlePoiComponent,
    HandleToiComponent,
    PreferencesComponent,
    RankingComponent,
    ConstraintsComponent,
    MapComponent,
    PoiDialogComponent,
    CustomDialogComponent,
    UserProfileComponent,
    ToiDialogComponent,
    RecoverPasswordDialogComponent,
    NewPasswordComponent,
    VerifyEmailComponent,
    AddAdminComponent,
    ToiPrefDialogComponent,
    ResultComponent,
    ItineraryMapComponent,
    LoaderComponent,
    SaveItineraryDialogComponent,
    UpdateItineraryDialogComponent,
    ItineraryDetailsComponent,
    HomeComponent,
    VisualizationComponent,
    MinutesToHoursPipe,
    SentimentTooltipComponent,
    TransportMeanPipe,
    TitleDialogComponent
  ],
  imports: [
    NgxChartsModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    AppRoutingModule,
     NgMaterialModule,
     BrowserAnimationsModule,
     HttpClientModule,
     TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),

  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: TokenInterceptor,
    multi:true
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi:true
  },{
    provide: HTTP_INTERCEPTORS,
    useClass: LanguageInterceptorInterceptor,
    multi:true
  },{
    provide: HTTP_INTERCEPTORS,
    useClass: LoaderInterceptor,
    multi:true
  }
 ],
  bootstrap: [AppComponent]
})
export class AppModule { }
