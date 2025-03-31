import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-title-dialog',
  templateUrl: './title-dialog.component.html',
  styleUrls: ['./title-dialog.component.scss']
})
export class TitleDialogComponent {
  title: string = '';

  constructor(public dialogRef: MatDialogRef<TitleDialogComponent>) {}

  confirm() {
    this.dialogRef.close(this.title); 
  }

  cancel() {
    this.dialogRef.close(null); 
  }
}
