import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  title: string;
  content: string;
  onButtonClick: any;
  onButtonNoClick: any;
  onButtonYesClick: any;
}

@Component({
  selector: 'app-custom-dialog',
  templateUrl: './custom-dialog.component.html',
  styleUrls: ['./custom-dialog.component.scss']
})
export class CustomDialogComponent  {
  constructor(public dialogRef: MatDialogRef<CustomDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {
   }

  onButtonYesClick(): void {
    this.data.onButtonYesClick();
    this.dialogRef.close();
    }
    onButtonOkClick(): void {
      if(this.data.onButtonClick !==null) this.data.onButtonClick();
      this.dialogRef.close();
      }
}
