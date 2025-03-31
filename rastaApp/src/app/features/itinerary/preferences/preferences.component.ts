import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TouristService } from '../../tourist/tourist.service';
import { Toi } from 'src/app/core/models/toi.model';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { Poi, PoiForRanking } from 'src/app/core/models/poi.model';
import { ItineraryService } from '../itinerary.service';
import { UserService } from 'src/app/core/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { ToiPrefDialogComponent } from 'src/app/shared/user-profile/toi-pref-dialog/toi-pref-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { AdminUser, TouristUser } from 'src/app/core/models/user.model';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements  OnInit {

  @Input() itinerary: boolean;
  @Input() dialogRef: MatDialogRef<ToiPrefDialogComponent>;

  toi_json: Toi[];

  constructor(private touristService:TouristService,
      private userService:UserService,
     private itineraryService:ItineraryService,
      private appUtilService: AppUtilService,
      private translateService: TranslateService,
      private cdr: ChangeDetectorRef) {
   }

 initTois(){
    this.appUtilService.getTois().subscribe((data)=>{ 
      this.toi_json=data;
      if(this.userService.isTouristLoggedIn()){
        if(this.user!=null){
          data.forEach((toi)=>{
            let index=this.user.toi_pref.findIndex((e)=>e.id===toi.id)
            if(this.user.toi_pref[index]!=undefined)
              toi.preference_score= this.user.toi_pref[index].score_preference
            else
              toi.preference_score=5
            this.cdr.detectChanges();
          })
        }
      }else { data.forEach((toi)=>toi.preference_score=5); this.cdr.detectChanges();}
    }, err=>console.log(err))
 }

 sendUserPreferences(){
  let preferences=this.toi_json.map((el)=>({"id_toi":el.id, "preference_score":el.preference_score/2}));
  this.touristService.saveUserToiPreferences(preferences).subscribe(async(data:string)=>{
    this.translateService.get('custom_dialog.success_title').subscribe((title: string) => {
      this.appUtilService.openDialog(title ,  data, null, null, null)
    });    
    if(this.dialogRef!==null){
      this.dialogRef.close()  
      await this.userService.updatePreferences();
    }
  });
 }

sendPreferences(){
  let preferences=this.toi_json.map((el)=>({"id_toi":el.id, "preference_score":el.preference_score/2}));
  this.itineraryService.sendToiPreferences(preferences).subscribe((data:PoiForRanking[])=>{
    this.itineraryService.updateVariable(data)
    if(this.userService.isTouristLoggedIn()){
      this.translateService.get('itinerary.preferences.dialog.title').subscribe((title: string) => {
      this.translateService.get('itinerary.preferences.dialog.content').subscribe((content: string) => {
        this.appUtilService.openDialog(title,content,null, null, ()=>{
          this.sendUserPreferences()
        })
      });
    });
      
    }
  });
}


districts=[
  "Alto Tevere",
  "Alto Chiascio",
  "Perugino",
  "Trasimeno",
  "Foligno",
  "Assiano",
  "Media Valle del Tevere",
  "Orvieto",
  "Valnerina",
  "Spoleto",
  "Terni",
  "Narni e Amelia"
]



@Output() next = new EventEmitter<void>();

onNext() {
  this.next.emit();
}

user;
  async ngOnInit(): Promise<void> {
    if(this.userService.userObs==null){
      await this.userService.getCurrentUser()
    }
    this.userService.userObs.subscribe((data) => {
      this.user = data;
      this.initTois()
    });
  }

}
