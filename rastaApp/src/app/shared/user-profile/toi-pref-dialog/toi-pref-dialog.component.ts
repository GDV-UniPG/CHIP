import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-toi-pref-dialog',
  templateUrl: './toi-pref-dialog.component.html',
  styleUrls: ['./toi-pref-dialog.component.scss']
})
export class ToiPrefDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ToiPrefDialogComponent>) {
  }

  close(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
  }

}
