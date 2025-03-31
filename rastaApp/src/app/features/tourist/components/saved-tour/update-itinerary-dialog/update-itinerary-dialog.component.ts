import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { TouristService } from '../../../tourist.service';
import { CheckValidator } from 'src/app/core/validators/check-validator';

export interface DialogData {
  itinerary:{
    id: number,
    name: string | null,
    description: string | null
  }
}
@Component({
  selector: 'app-update-itinerary-dialog',
  templateUrl: './update-itinerary-dialog.component.html',
  styleUrls: ['./update-itinerary-dialog.component.scss']
})
export class UpdateItineraryDialogComponent implements OnInit {

  form: FormGroup = new FormGroup({});

  constructor( 
    public dialogRef: MatDialogRef<UpdateItineraryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,  private fb: FormBuilder,
    private touristService:TouristService,
    private translateService:TranslateService) {
     }
  
  checkValidator: CheckValidator = new CheckValidator(this.translateService);

  close(newName: string, newDescription:string): void {
    this.dialogRef.close({newName, newDescription});
  }

  updateItinerary(){
    this.data.itinerary.name=this.form.get('name').value
    this.data.itinerary.description=this.form.get('description').value
    this.touristService.updateItineraryInfo(this.data.itinerary).subscribe(()=>{
      this.close(this.data.itinerary.name, this.data.itinerary.description)
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.required]],
    });
    if(this.data.itinerary.name!=null && this.data.itinerary.description!=null)
      this.form.patchValue({
        name:  this.data.itinerary.name,
        description: this.data.itinerary.description
      });
  }

}
