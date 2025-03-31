import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Toi } from 'src/app/core/models/toi.model';
import { AdminService } from '../../admin.service';
import { ToiDialogComponent } from './toi-dialog/toi-dialog.component';
import { LanguageService } from 'src/app/core/services/language-service.service';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-handle-toi',
  templateUrl: './handle-toi.component.html',
  styleUrls: ['./handle-toi.component.scss']
})
export class HandleToiComponent implements OnInit {


  listOfToi: MatTableDataSource<Toi>;
  pageSize:number=10;
  pageSizeOptions=[2,5, 10, 20, 50];

  @ViewChild('paginator') paginator: MatPaginator;

  displayedColumns: string[] = [
    'name',
    "description",
    "color",
    "action",
    "modified"
  ];
 
  constructor(private dialog:MatDialog,
              private adminService:AdminService,
              public languageService:LanguageService,
              private appUtilService: AppUtilService,
              private translateService:TranslateService) {
   }

  openAddToiDialog(): void { 
    this.dialog.open(ToiDialogComponent, { 
          data: {
            dialogAction:'add',
            poi:null
          }
      })
  }

  openEditToiDialog(toi:Toi): void { 
    this.dialog.open(ToiDialogComponent, { 
          data: {
            dialogAction:'edit',
            toi:toi
          }
      })
  }

  addToi(){
    this.openAddToiDialog()
  }


  editToi(toiToUpdate:Toi){
    this.openEditToiDialog(toiToUpdate)
  }

  deleteToi(element:Toi){
    this.adminService.deleteToi(element.id).subscribe(
      (data:string)=>{
        this.translateService.get('custom_dialog.success_title').subscribe((title: string) => {
          this.appUtilService.openDialog(title,data, ()=>{  
            window.location.reload();
          }, null, null)
        });
      });
  }

  
  startPoiToiComputation() {
    this.adminService.startPoiToiScoreComputation().subscribe((data:string)=>{
      this.translateService.get('custom_dialog.success_title').subscribe((title: string) => {
        this.appUtilService.openDialog(title, data, ()=> window.location.reload(), null, null)
      })
    });
  }


  ngOnInit(){
    this.adminService.getAllToi().subscribe((data:Toi[])=>{
      this.listOfToi = new MatTableDataSource(data);
      this.listOfToi.paginator = this.paginator;
    })
  }

}
