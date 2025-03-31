import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Toi } from 'src/app/core/models/toi.model';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { AdminService } from '../../../admin.service';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { TranslateService } from '@ngx-translate/core';

export interface DialogData {
  dialogAction: string;
  toi: Toi;
}

@Component({
  selector: 'app-toi-dialog',
  templateUrl: './toi-dialog.component.html',
  styleUrls: ['./toi-dialog.component.scss']
})
export class ToiDialogComponent implements OnInit {
 
  form: FormGroup = new FormGroup({});
  toi: Toi;
  toiId: number;
  dialogAction: string;
  flag: boolean = false;
  checkValidator: CheckValidator = new CheckValidator(this.translateService);

  translatedDialogAction: string;
  nameItPlaceholder: string;
  nameEnPlaceholder: string;
  descriptionItPlaceholder: string;
  descriptionEnPlaceholder: string;

  constructor(
    public dialogRef: MatDialogRef<ToiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private adminService: AdminService,
    private appUtilService: AppUtilService,
    private translateService: TranslateService
  ) {
    if (this.data.toi != null) {
      this.toi = this.data.toi;
      this.toiId = this.toi.id;
    }
    this.dialogAction = this.data.dialogAction;
  }

  addToi() {
    this.toi = this.form.value;
    this.adminService.addToi(this.toi).subscribe((data:string) => {
      this.translateService.get('custom_dialog.success_title').subscribe((title: string) => {
        this.appUtilService.openDialog(title,data, ()=>{  
          this.dialogRef.close();
          window.location.reload();
        }, null, null)
      });
    });
  }

  updateToi() {
    this.toi = this.form.value;
    this.toi.id = this.toiId;
    this.adminService.updateToi(this.toi).subscribe((data:string) => {
      this.translateService.get('custom_dialog.success_title').subscribe((title: string) => {
        this.appUtilService.openDialog(title,data, ()=>{  
          this.dialogRef.close();
          window.location.reload();
        }, null, null)
      });
    });
  }
  close(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      nome: [null, [Validators.required]],
      description: [null, [Validators.required]],
      descrizione: [null, [Validators.required]],
      color:["#000", [Validators.required]]
    });
    this.translateService.get('admin.action.add').subscribe((res: string) => {
      this.translatedDialogAction = res;
  });

    if (this.dialogAction == 'edit') {
      this.translateService.get('admin.action.edit').subscribe((res: string) => {
        this.translatedDialogAction = res;
    });
      this.form.patchValue({
        name: this.toi.name,
        nome: this.toi.nome,
        description: this.toi.description,
        descrizione: this.toi.descrizione,
        color: this.toi.color
      });
    }
    

    this.translateService.get('admin.placeholder.name_it_toi').subscribe((res: string) => {
      this.nameItPlaceholder = res;
  });
  this.translateService.get('admin.placeholder.name_en_toi').subscribe((res: string) => {
    this.nameEnPlaceholder = res;
});
  this.translateService.get('admin.placeholder.description_it_toi').subscribe((res: string) => {
    this.descriptionItPlaceholder = res;
});
this.translateService.get('admin.placeholder.description_en_toi').subscribe((res: string) => {
  this.descriptionEnPlaceholder = res;
});
  }

}
