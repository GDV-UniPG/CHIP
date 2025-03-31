import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { LoginComponent } from 'src/app/shared/login/login.component';
import { SignupComponent } from 'src/app/shared/signup/signup.component';
import { ItineraryComponent } from 'src/app/features/itinerary/itinerary.component';
import { SavedTourComponent } from 'src/app/features/tourist/components/saved-tour/saved-tour.component';
import { HandlePoiComponent } from 'src/app/features/admin/components/handle-poi/handle-poi.component';
import { HandleToiComponent } from 'src/app/features/admin/components/handle-toi/handle-toi.component';
import { UserProfileComponent } from 'src/app/shared/user-profile/user-profile.component';
import { NewPasswordComponent } from 'src/app/shared/new-password/new-password.component';
import { VerifyEmailComponent } from 'src/app/shared/signup/verify-email/verify-email.component';
import { AddAdminComponent } from 'src/app/features/admin/components/add-admin/add-admin.component';
import { HomeComponent } from 'src/app/shared/home/home.component';
import { VisualizationComponent } from 'src/app/features/admin/components/visualization/visualization.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'new-password/:token', component: NewPasswordComponent },
  { path: 'verify-email/:token', component: VerifyEmailComponent },
  { path: 'itinerary', component: ItineraryComponent },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard],
    data: {
      expectedRole: 'auth-user',
    }
  },
  {
    path: 'tourist/saved-tour',
    component: SavedTourComponent,
    canActivate: [AuthGuard],
    data: {
      expectedRole: 'tourist',
    },
  },
  {
    path: 'admin/handle-poi',
    component: HandlePoiComponent,
    canActivate: [AuthGuard],
    data: {
      expectedRole: 'admin',
    },
  },
  {
    path: 'admin/handle-toi',
    component: HandleToiComponent,
    canActivate: [AuthGuard],
    data: {
      expectedRole: 'admin',
    },
  },
  {
    path: 'admin/add-admin',
    component: AddAdminComponent,
    canActivate: [AuthGuard],
    data: {
      expectedRole: 'admin',
    },
  },
  {
    path: 'admin/visualization',
    component: VisualizationComponent,
    canActivate: [AuthGuard],
    data: {
      expectedRole: 'admin',
    },
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
