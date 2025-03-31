import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Poi } from 'src/app/core/models/poi.model';
import { PoiDialogComponent } from './poi-dialog/poi-dialog.component';
import { AdminService } from '../../admin.service';
import { MatDialog } from '@angular/material/dialog';
import { Toi } from 'src/app/core/models/toi.model';
import { MatPaginator } from '@angular/material/paginator';
import { LanguageService } from 'src/app/core/services/language-service.service';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-handle-poi',
  templateUrl: './handle-poi.component.html',
  styleUrls: ['./handle-poi.component.scss']
})
export class HandlePoiComponent implements OnInit {

  listOfPOI: MatTableDataSource<Poi>;
  pageSize: number = 10;
  pageSizeOptions = [2, 5, 10, 20, 50];

  @ViewChild('paginator') paginator: MatPaginator;//used to handle paginator
  displayedColumns: string[] = [
    'name',
    "description",
    "url_primary",
    "wiki_url-external_links",
    "latitude",
    "longitude",
    "visit_min_durations",
    "scores",
    "action",
    "modified"
  ];

  constructor(private dialog: MatDialog,
    private appUtilService: AppUtilService,
    private adminService: AdminService,
    public languageService: LanguageService,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer) {
  }

  openAddPoiDialog(): void {
    this.dialog.open(PoiDialogComponent, {
      data: {
        dialogAction: 'add',
        poi: null
      }
    })
  }
  openEditPoiDialog(poi: Poi): void {
    this.dialog.open(PoiDialogComponent, {
      data: {
        dialogAction: 'edit',
        poi: poi
      }
    })
  }

  addPOI() {
    this.openAddPoiDialog()
  }

  deletePOI(element: Poi) {
    this.translateService.get('custom_dialog.error_title').subscribe((title: string) => {
      this.translateService.get('admin.handle_poi.delete_poi').subscribe((content: string) => {
        this.appUtilService.openDialog(title, content, null, null,()=>
          this.adminService.deletePOI(element.id).subscribe(
            (data: string) => {
              this.translateService.get('custom_dialog.success_title').subscribe((title: string) => {
                this.appUtilService.openDialog(title, data, ()=> window.location.reload(), null, null)
              })

             
            }))
      })
    })
  }

  editPOI(poiToUpdate: Poi) {
    this.openEditPoiDialog(poiToUpdate)
  }

  startPoiToiComputation() {
    this.adminService.startPoiToiScoreComputation().subscribe((data:string)=>{
      this.translateService.get('custom_dialog.success_title').subscribe((title: string) => {
        this.appUtilService.openDialog(title, data, ()=> window.location.reload(), null, null)
      })
    });
  }

  applyFilter(event: Event) {
    let data = this.pois;
    this.listOfPOI.filterPredicate = function (data, filter: string): boolean {
      if (this.languageService.getCodeSiteLanguage() == 'en')
        return data.name.toLowerCase().includes(filter);
      else {
        return data.nome.toLowerCase().includes(filter);
      }
    }.bind(this);

    const filterValue = (event.target as HTMLInputElement).value;
    this.listOfPOI.filter = filterValue.trim().toLowerCase();
  }
  imageFilterActive = false;
  primaryURLFilterActive = false;
  primaryChangedFilterActive = false;
  primaryScoreChangedFilterActive=false;
  
  toggleFilters(filterType: string, checked: boolean) {
    if (filterType === 'image') {
      this.imageFilterActive = checked;
    } else if (filterType === 'primary_url') {
      this.primaryURLFilterActive = checked;
    } else if (filterType === 'has_been_changed') {
      this.primaryChangedFilterActive = checked;
    }else if (filterType === 'has_score_changed') {
      this.primaryScoreChangedFilterActive = checked;
    }
  
    this.listOfPOI.filterPredicate = (data, filter: string) => {
      let imageCondition = this.imageFilterActive ? data.image_url == null : true;
      let primaryURLCondition = this.primaryURLFilterActive ? data.url_primary == null : true;
      let scoreChangedCondition = this.primaryScoreChangedFilterActive ? data.has_score_changed == true : data.has_score_changed == false || true;
      let changedCondition = this.primaryChangedFilterActive ? data.has_been_changed == true : data.has_been_changed == false || true;
      return imageCondition && primaryURLCondition && changedCondition && scoreChangedCondition; 
    };
  
    this.listOfPOI.filter = Math.random().toString(); 
  }
  poiSearchControl = new FormControl();

  pois;
  tois;
  ngOnInit() {
    this.adminService.getAllToi().subscribe((tois: Toi[]) => {
      this.tois = tois;
    })

    this.adminService.getPois().subscribe((data: Poi[]) => {
      this.listOfPOI = new MatTableDataSource(data.reverse());
      this.listOfPOI.paginator = this.paginator;
      this.pois = data;
      this.route.queryParams.subscribe(params => {
        const poiName = params['poiName'];
        if (poiName) {
          this.poiSearchControl.setValue(decodeURIComponent(poiName));

          this.applyFilter({ target: { value: decodeURIComponent(poiName) } } as unknown as Event);
        }
      });
    })

  }

}
