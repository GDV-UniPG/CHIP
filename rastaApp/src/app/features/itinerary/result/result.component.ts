import { Component, OnInit } from '@angular/core';
import { ItineraryService } from '../itinerary.service';
import { UserService } from 'src/app/core/services/user.service';
import { TouristService } from '../../tourist/tourist.service';
import { MatDialog } from '@angular/material/dialog';
import { SaveItineraryDialogComponent } from './save-itinerary-dialog/save-itinerary-dialog.component';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss'],
})
export class ResultComponent implements OnInit {
  role: string;
  result = [];

  constructor(
    private itineraryService: ItineraryService,
    private touristService: TouristService,
    public userService: UserService,
    private dialog: MatDialog){
  }
  
  saveItineraryScore(event, i: number) {
    event.preventDefault();
    this.touristService
      .saveItineraryScore({
        id: this.result[i].id,
        lat_start:this.result[i].start_info.latitude,
        long_start:this.result[i].start_info.longitude,
        score: this.result[i].score,
        total_duration: this.result[i].total_duration,
        transport_mean: this.result[i].transport_mean, 
        steps: this.result[i].steps,
      })
      .subscribe((data) => {
        this.result[i].id = data;
      });
  }

  saveItinerary(event, i: number) {
    event.preventDefault();
    if (!this.result[i].favorite) {
      this.dialog
        .open(SaveItineraryDialogComponent, {
          data: {
            itinerary: this.result[i],
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if(result){
            this.result[i].id = result;
            this.result[i].favorite = true;
          }
        });
    } else {
      this.touristService
        .removeItineraryAsFavorite(this.result[i].id)
        .subscribe((data) => {
          this.result[i].id = data;
          this.result[i].favorite = false;
        });
    }
  }


  ngOnInit(): void {
    this.itineraryService.result.subscribe((res) => {
      if (res != null) {
        if (res.length > 0)
          for (let i = 0; i < res.length; i++) {
            this.result[i]=res[i]
            this.result[i].id = null;
            this.result[i].favorite = false;
            this.result[i].score = null;
            this.result[i].transport_mean=this.itineraryService.trasport_mean;
            if(res[i].id_start==0){
              this.result[i].start_info={
                name: null, latitude: res[i].lat_start, longitude: res[i].long_start
              }
            }else{ 
              let municipality=this.itineraryService.municipalities.find(m => m.id === res[i].id_start).name
              this.result[i].start_info={
                name: municipality, latitude: res[i].lat_start, longitude: res[i].long_start
              }
            }
          }
      } else {
        this.result = [];
      }
    });
  }
}
