import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TouristService } from 'src/app/features/tourist/tourist.service';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { TranslateService } from '@ngx-translate/core';

export interface DialogData {
  itinerary:{
    start_info,
    id,
    name:"",
    description:"",
    total_duration,
    transport_mean,
    steps:[]
  }
}

@Component({
  selector: 'app-save-itinerary-dialog',
  templateUrl: './save-itinerary-dialog.component.html',
  styleUrls: ['./save-itinerary-dialog.component.scss']
})


export class SaveItineraryDialogComponent implements OnInit {
  form: FormGroup = new FormGroup({});

  constructor( 
    public dialogRef: MatDialogRef<SaveItineraryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,  private fb: FormBuilder,
    private touristService:TouristService,
    private translateService:TranslateService) { }
  
  checkValidator: CheckValidator = new CheckValidator(this.translateService);

  close(id): void {
    this.dialogRef.close(id);
  }

  saveItinerary(){
    this.data.itinerary.name=this.form.get('name').value
    this.data.itinerary.description=this.form.get('description').value
    let dataToSend={
      id:this.data.itinerary.id,
      lat_start:this.data.itinerary.start_info.latitude,
      long_start:this.data.itinerary.start_info.longitude,
      name:this.data.itinerary.name,
      description:this.data.itinerary.description,
      total_duration:this.data.itinerary.total_duration,
      transport_mean:this.data.itinerary.transport_mean,
      steps:this.data.itinerary.steps
    }
    this.touristService.saveItineraryAsFavorite(dataToSend).subscribe((data)=>{
      this.data.itinerary.id=data;
      this.close(data)
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      description: [null, []],
    });
  }

}
