import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  means_icon,
  means_label,
} from 'src/app/core/constants/transportMeans-icon-dict';
import { ItineraryService } from '../itinerary.service';
import { Poi, PoiForRanking } from 'src/app/core/models/poi.model';
import { Constraints } from 'src/app/core/models/constraints.model';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-constraints',
  templateUrl: './constraints.component.html',
  styleUrls: ['./constraints.component.scss'],
})
export class ConstraintsComponent implements OnInit {
  form: FormGroup = new FormGroup({});

  total_duration_options: number[] = [];
  number_days_options: number[] = [];
  poi_duration_options: any[] = [];
  userPrefPois: PoiForRanking[];
  locations: number[][] = [];
  latitude: number;
  longitude: number;
  constraints: Constraints;
  means_icon_dict = means_icon;
  means_label_dict = means_label;



  transport_means = [];

  pois;

  constructor(private fb: FormBuilder, public itineraryService: ItineraryService, private appUtilService: AppUtilService, private translateService: TranslateService) {
    this.generateTotalDurationOptions();
    this.poi_duration_options.push("unbounded")
    this.generatePoiDurationOptions();
    this.form = this.fb.group({
      starter_point: [null, [Validators.required]],
      total_duration: [this.total_duration_options[this.total_duration_options.length - 1], [Validators.required]],
      number_day: [this.number_days_options[0], [Validators.required]],
      poi_visit_max_duration: [
        this.poi_duration_options[0],
      ],
      n_alternatives: [1, Validators.required],
      transport_mean: ['driving-car', [Validators.required]],
    });
  }

  selectMean(mean: string): void {
    this.form.get('transport_mean').setValue(mean);
  }

  generateTotalDurationOptions() {
    for (let i = 1; i <= 480; i++) {
      if (i % 60 === 0) {
        this.total_duration_options.push(i);
      }
    }

    for (let i = 1; i <= 5; i++) {
      this.number_days_options.push(i);
    }
  }
  generatePoiDurationOptions(){
    let min, max;
    this.itineraryService.getMinMaxDuration().subscribe((data:{min_duration:number, max_duration:number})=>{
      min=data.min_duration;
      max=data.max_duration;
      for (let i = min; i <= max; i=i+15) {
          this.poi_duration_options.push(i);
      }
    })
  }

  @Output() next = new EventEmitter<void>();
  onNext() {
    this.next.emit();
  }

  sendConstraints() {
    this.setLocationArray()
    let poi_duration:number;
    if(this.form.get('poi_visit_max_duration').value=="unbounded"){
      poi_duration=this.poi_duration_options[this.poi_duration_options.length-2];
    }
    else{
      poi_duration=this.form.get('poi_visit_max_duration').value;
    }
   
    if (this.form.get('starter_point').value == 'current') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            this.latitude = 43.37941888485066;
            this.longitude = 12.117809847481954;
            this.constraints = {
              pois: this.pois,
              id_start: 0,
              lat_start: this.latitude,
              long_start: this.longitude, 
              day_duration: this.form.get('total_duration').value,
              days: this.form.get('number_day').value,
              poi_max_duration:poi_duration*60,
              ids_to_exclude: this.itineraryService.listPoiToExclude,
              ids_to_include: this.itineraryService.listPoiToInclude,
              transport_mean: this.form.get('transport_mean').value,
              n_alternatives: this.form.get('n_alternatives').value
            };
            this.itineraryService.trasport_mean=this.constraints.transport_mean;
            this.itineraryService
              .sendConstraints(this.constraints)
              .subscribe((data: [{}]) => {
                data.forEach(itinerary => {
                  itinerary['transport_mean'] = this.constraints.transport_mean;
                });
                this.itineraryService.setResult(data)
                this.onNext()
              });
          },
          (error) => {
            this.translateService.get('custom_dialog.error_title').subscribe((title: string) => {
              this.translateService.get('itinerary.constraints.current_position_error').subscribe((content: string) => {
                this.appUtilService.openDialog(title,content,null, null, null)
              })
            })
          },
          {
            enableHighAccuracy: true
          }
        );
      } else {
        this.translateService.get('custom_dialog.error_title').subscribe((title: string) => {
          this.translateService.get('itinerary.constraints.current_position_error').subscribe((content: string) => {
            this.appUtilService.openDialog(title,content,null, null, null)
          })
        })
        console.error('Geolocalizzazione non supportata dal browser.');
      }

    } else {

      this.constraints = {
        pois: this.pois, 
        id_start: this.form.get('starter_point').value,
        lat_start: null,
        long_start: null,
        day_duration: this.form.get('total_duration').value,
        days: this.form.get('number_day').value,
        poi_max_duration: poi_duration*60,
        ids_to_exclude: this.itineraryService.listPoiToExclude,
        ids_to_include: this.itineraryService.listPoiToInclude,
        transport_mean: this.form.get('transport_mean').value,
        n_alternatives: this.form.get('n_alternatives').value
      };
      this.itineraryService.trasport_mean=this.constraints.transport_mean;
      this.itineraryService
        .sendConstraints(this.constraints)
        .subscribe((data) => {
          this.itineraryService.setResult(data)
          this.onNext()
        });
    }
    this.itineraryService.setResult(null)
  }

  setLocationArray() {
    this.locations = [];
    for (let i = 0; i < this.userPrefPois.length; i++) {
      this.locations[i] = [
        this.userPrefPois[i].longitude,
        this.userPrefPois[i].latitude,
      ];
    }
  }
  ngOnInit(): void {
    setTimeout(() => {
      this.form.controls['starter_point'].setValue('current');
    });
    this.itineraryService.variable.subscribe((value) => {
      if (value != null) {
        this.userPrefPois = value;
        this.pois = this.userPrefPois.map(el => { return { id_geo: el.id, score: el.score } })
      }
    });
    this.itineraryService
      .getTransportMeans()
      .subscribe((data: [{ name: string }]) => {
        this.transport_means = data.map((el) => el.name);
      });

    this.itineraryService.getMunicipalities().subscribe((data: []) => {
      this.itineraryService.municipalities = data;
    })
  }
}


