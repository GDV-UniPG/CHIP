import { Component, OnInit } from '@angular/core';
import { TouristService } from '../../tourist.service';
import { Itinerary } from 'src/app/core/models/itinerary.model';
import { MatDialog } from '@angular/material/dialog';
import { UpdateItineraryDialogComponent } from './update-itinerary-dialog/update-itinerary-dialog.component';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-saved-tour',
  templateUrl: './saved-tour.component.html',
  styleUrls: ['./saved-tour.component.scss']
})

export class SavedTourComponent implements OnInit {

  constructor(private touristService: TouristService,
     private dialog: MatDialog,
      public appUtilService:AppUtilService,
       private translateService:TranslateService) { }

  favoriteItineraries:Itinerary[]=[];
  ratedItineraries:Itinerary[]=[];

  openDetails(index: number, kind:string){
    if(kind=='favorite'){
      let is_open=this.favoriteItineraries[index].open_details;
      this.ratedItineraries.map((it)=>it.open_details=false)
      this.favoriteItineraries.map((it)=>it.open_details=false)
      if(!is_open){
        this.touristService.getStarterPointInfo(this.favoriteItineraries[index].steps[0].id_geo).subscribe((data:{name, latitude, longitude})=>{
          this.favoriteItineraries[index].start_info=data;
          this.favoriteItineraries[index].open_details=true
        })
      }
    }
    else{
      let is_open=this.ratedItineraries[index].open_details;
      this.ratedItineraries.map((it)=>it.open_details=false)
      this.favoriteItineraries.map((it)=>it.open_details=false)
      if(!is_open){
        this.touristService.getStarterPointInfo(this.ratedItineraries[index].steps[0].id_geo).subscribe((data:{name, latitude, longitude})=>{
          this.ratedItineraries[index].start_info=data;
          this.ratedItineraries[index].open_details=true
        })
      }
      }
  }

  ngOnInit(): void {
    this.touristService.getFavoriteItineraries().subscribe((data:[Itinerary])=>{
      if(data.length>0){
        this.favoriteItineraries=data;  
        this.favoriteItineraries.forEach(itinerary=>{
          itinerary['total_duration_min']=Math.ceil(itinerary.total_duration/60)
          itinerary.steps['n_days']=Math.max(...itinerary.steps.map(x => +x.day))+1
        }
        )
      }
    })

    this.touristService.getRatedItineraries().subscribe((data:[Itinerary])=>{
      if(data.length>0)
      {
        this.ratedItineraries=data;
        this.ratedItineraries.forEach(itinerary=>{
          itinerary['total_duration_min']=Math.ceil(itinerary.total_duration/60)
          itinerary.steps['n_days']=Math.max(...itinerary.steps.map(x => +x.day))+1
        }
        )
      }
    })

  }

  removeItineraryFromFavorites(event, i: number){
    event.preventDefault();
    this.translateService.get("itinerary.saved.remove_from_favorite_title").subscribe((title)=>{
      this.translateService.get("itinerary.saved.remove_from_favorite_description").subscribe((description)=>{
      this.appUtilService.openDialog(title, description, null, null, ()=>{
        this.touristService.removeItineraryAsFavorite(this.favoriteItineraries[i].id).subscribe((data)=>{
          if(data || data==null){
            if(data!=null){
              this.favoriteItineraries[i].name=null
              this.favoriteItineraries[i].description=null
              this.ratedItineraries.push(this.favoriteItineraries[i])
            }
            this.favoriteItineraries.splice(i, 1)  
          }
        })
      })
    })
  })
  }

  addItineraryToFavorite(event, i: number){
    event.preventDefault();
      this.dialog
        .open(UpdateItineraryDialogComponent, {
          data: {
            itinerary:{
              id:this.ratedItineraries[i].id,
              name:this.ratedItineraries[i].name,
              description:this.ratedItineraries[i].description
            }
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if(result){
            this.ratedItineraries[i].name=result.newName;
            this.ratedItineraries[i].description=result.newDescription
            this.favoriteItineraries.push(this.ratedItineraries[i])
            this.ratedItineraries.splice(i, 1)  
          }
        });
  }

  removeItinerary(event, i: number){
    event.preventDefault();
    this.translateService.get("itinerary.saved.remove_title").subscribe((title)=>{
      this.translateService.get("itinerary.saved.remove_description").subscribe((description)=>{
      this.appUtilService.openDialog(title, description, null, null, ()=>{
        this.touristService.removeRatingFromItinerary(this.ratedItineraries[i].id).subscribe((data)=>{
          if(data || data==null){
            this.ratedItineraries.splice(i, 1)
          }
        })
      })
    })
  })
  }

  updateItinerarynfo(event, i: number){
    event.preventDefault();
    this.dialog
    .open(UpdateItineraryDialogComponent, {
      data: {
        itinerary:{
          id:this.favoriteItineraries[i].id,
          name:this.favoriteItineraries[i].name,
          description:this.favoriteItineraries[i].description
        }
      },
    })
    .afterClosed()
    .subscribe((data) => {
      if(data){
        this.favoriteItineraries[i].name = data.newName;
        this.favoriteItineraries[i].description = data.newDescription;
      }
    })
  }

  updateItineraryScore(event, i: number, kind:string) {
    event.preventDefault();
    if(kind=='favorite')
      this.touristService.updateItineraryScore(
        this.favoriteItineraries[i].id,
        this.favoriteItineraries[i].score
      ).subscribe();
    else
    this.touristService.updateItineraryScore(
      this.ratedItineraries[i].id,
      this.ratedItineraries[i].score
    ).subscribe();
  }

}
