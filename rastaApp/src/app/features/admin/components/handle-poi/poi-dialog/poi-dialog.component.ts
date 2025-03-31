import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdminService } from '../../../admin.service';
import { Poi } from 'src/app/core/models/poi.model';
import { Toi } from 'src/app/core/models/toi.model';
import { CheckValidator } from 'src/app/core/validators/check-validator';
import { TranslateService } from '@ngx-translate/core';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { LanguageService } from 'src/app/core/services/language-service.service';

export interface DialogData {
  dialogAction: string;
  poi: Poi;
}
@Component({
  selector: 'app-poi-dialog',
  templateUrl: './poi-dialog.component.html',
  styleUrls: ['./poi-dialog.component.scss'],
})
export class PoiDialogComponent implements OnInit {
  externalLinkIndex = 0;
  externalLinkIndex_array: number[];

  visitDurationsIndex = 0;
  visitDurationsIndex_array: number[] = [0];

  form: FormGroup = new FormGroup({});
  toi_json: Toi[];
  poi: Poi;
  poiId: number;
  hashScoreChanged:boolean;
  dialogAction: string;
  translatedDialogAction: string;
  flag: boolean = false;
  checkValidator: CheckValidator= new CheckValidator(this.translateService);

  showMap = false;

  nameItPlaceholder: string;
  nameEnPlaceholder: string;
  descriptionItPlaceholder: string;
  descriptionEnPlaceholder: string;
  primaryURLPlaceholder: string;
  wikiURLPlaceholder: string;
  latitudePlaceholder: string;
  longitudePlaceholder: string;
  visitDurPlaceholder: string;

  mapButtonText: string;

  externalLinkGroup = this.fb.group({});
  durationsGroup = this.fb.group({});

  constructor(
    public dialogRef: MatDialogRef<PoiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private adminService: AdminService,
    public translateService: TranslateService,
    private appUtilService: AppUtilService,    
    public languageService: LanguageService,
  ) {
    if (this.data.poi != null) {
      this.poi = this.data.poi;
      this.poiId = this.poi.id;
      this.hashScoreChanged=this.poi.has_score_changed;
    }
    this.dialogAction = this.data.dialogAction;
  }

  selectedImage: File | null = null;
  imagePreview: string | null = null;

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onScoreChange(event: any): void {
    this.hashScoreChanged = !event.checked;
  }

  onScoreInputChange(): void {
    this.hashScoreChanged = true;
  }

  addExternalLink() {
    this.externalLinkIndex_array = Array.from(
      { length: this.externalLinkIndex + 1 },
      (e, i) => i
    );
    this.externalLinkGroup.addControl(
      this.externalLinkIndex.toString(),
      new FormControl(null)
    );
    this.externalLinkIndex++;
  }
  deleteExternalLink(i) {
    if (i != this.externalLinkIndex) {
      this.externalLinkGroup.get(i.toString()).setValue(
          this.externalLinkGroup.get((this.externalLinkIndex-1).toString()).value
        );
    }
    this.externalLinkGroup.removeControl((this.externalLinkIndex-1).toString());
    this.externalLinkIndex--;
    this.externalLinkIndex_array.length =
      this.externalLinkIndex_array.length - 1;
  }

  addDuration() {
    this.visitDurationsIndex_array = Array.from(
      { length: this.visitDurationsIndex + 1 },
      (e, i) => i
    );
    this.durationsGroup.addControl(
      this.visitDurationsIndex.toString(),
      new FormControl(null)
    );
    this.visitDurationsIndex++;
  }

  deleteVisitDuration(i) {
    if (i != this.visitDurationsIndex) {
      this.durationsGroup.get(i.toString()).setValue(
          this.durationsGroup.get((this.visitDurationsIndex-1).toString()).value
        );
    }
    this.durationsGroup.removeControl((this.visitDurationsIndex-1).toString());
    this.visitDurationsIndex--;
    this.visitDurationsIndex_array.length =
      this.visitDurationsIndex_array.length - 1;
  }

  addPoi() {
    let poiId;
    this.poi = this.form.value;
    this.adminService.addPOI(this.form.value).subscribe((data:{message:string, id:number}) => {
      this.appUtilService.openDialog("",data.message, null, null, null)
      poiId=data.id;
      if(this.selectedImage){
        const formData = new FormData();
        formData.append('poi_id', poiId.toString()); 
        formData.append('image', this.selectedImage);
  
        this.adminService.uploadImage(formData).subscribe(data=>{
          this.dialogRef.close();
        window.location.reload();
        })
  
      }
      else{
        this.dialogRef.close();
        window.location.reload();
      }
      
    });
  }
  getCacheBustedUrl(url: string): string {
    const timestamp = new Date().getTime(); 
    return `${url}?_=${timestamp}`;
  }

  updatePoi() {
    this.poi = this.form.value;
    this.poi.id = this.poiId;
    this.poi.has_score_changed= this.hashScoreChanged
    this.adminService.updatePOI(this.poi).subscribe((data:string) => {
      this.appUtilService.openDialog("",data, null, null, null)
      if(this.selectedImage){
        const formData = new FormData();
        formData.append('poi_id', this.poiId.toString());
        formData.append('image', this.selectedImage);
  
        this.adminService.uploadImage(formData).subscribe(d=>{
          this.dialogRef.close();
          window.location.reload();
        })
  
      }else{
        this.dialogRef.close();
        window.location.reload();
       
      }
    });

    
    

  }

  toggleMap() {
    this.showMap = !this.showMap;
    if(this.showMap){
      this.translateService.get('admin.handle_poi.close_map').subscribe((res: string) => {
        this.mapButtonText = res;
      });
    }else{
      this.translateService.get('admin.handle_poi.open_map').subscribe((res: string) => {
        this.mapButtonText = res;
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  setLatitude(lat: number) {
    this.form.patchValue({ latitude: lat });
  }
  setLongitude(long: number) {
    this.form.patchValue({ longitude: long });
  }
  setName(name: string) {
    this.form.patchValue({ nome: name });
  }

  getUpdatedScores(): any[] {
    const scoresArray = this.form.get('scores') as FormArray;
    return scoresArray.value;
  }

  get scores(): FormArray {
    return this.form.get('scores') as FormArray;
  }

  ngOnInit() {
    if (this.dialogAction == 'add') {
      this.translateService.get('admin.action.add').subscribe((res: string) => {
        this.translatedDialogAction = res;
    });

      this.durationsGroup.addControl(
        this.visitDurationsIndex.toString(),
        new FormControl(null)
      );
      this.visitDurationsIndex++;
    }else{
      if(this.poi.image_url){
        this.imagePreview=this.poi.image_url;
      }
    }
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      nome: [null, [Validators.required]],
      description: [null, [Validators.required]],
      descrizione: [null, [Validators.required]],
      url_primary: [null],
      wiki_url: [null],
      latitude: [null, [Validators.required]],
      longitude: [null, [Validators.required]],
      external_links: this.externalLinkGroup,
      visit_min_durations: this.durationsGroup,
      scores: this.fb.array([]) 
    });


    if (this.dialogAction == 'edit') {
      if(this.poi.scores!=null){
        const scoresArray = this.form.get('scores') as FormArray;
        this.poi.scores.forEach(score => {
        scoresArray.push(
          this.fb.group({
            id: [score.id], 
            name: [score.name], 
            nome: [score.nome], 
            score: [score.score, [Validators.required, Validators.min(0), Validators.max(1)]],
          })
        ) 
      })
    }

      this.translateService.get('admin.action.edit').subscribe((res: string) => {
        this.translatedDialogAction = res;
    });
      this.externalLinkIndex = this.poi.external_links.length;
      this.externalLinkIndex_array = Array.from(
        { length: this.poi.external_links.length },
        (e, i) => i
      );

      this.visitDurationsIndex = this.poi.visit_min_durations.length;
      this.visitDurationsIndex_array = Array.from(
        { length: this.poi.visit_min_durations.length },
        (e, i) => i
      );

      this.poi.external_links.forEach((link, index) => {
        this.externalLinkGroup.addControl(
          index.toString(),
          new FormControl(link.url)
        );
      });
      this.poi.visit_min_durations.forEach((duration, index) => {
        this.durationsGroup.addControl(
          index.toString(),
          new FormControl(duration.duration_min)
        );
      });


      this.form.patchValue({
        name: this.poi.name,
        nome: this.poi.nome,
        description: this.poi.description,
        descrizione: this.poi.descrizione,
        url_primary: this.poi.url_primary,
        wiki_url: this.poi.wiki_url,
        latitude: this.poi.latitude,
        longitude: this.poi.longitude,
        external_links: this.externalLinkGroup,
        visit_min_durations: this.durationsGroup,
      });
    }

    this.translateService.get('admin.placeholder.name_it_poi').subscribe((res: string) => {
      this.nameItPlaceholder = res;
  });
  this.translateService.get('admin.placeholder.name_en_poi').subscribe((res: string) => {
    this.nameEnPlaceholder = res;
});
  this.translateService.get('admin.placeholder.description_it_poi').subscribe((res: string) => {
    this.descriptionItPlaceholder = res;
});
this.translateService.get('admin.placeholder.description_en_poi').subscribe((res: string) => {
  this.descriptionEnPlaceholder = res;
});
this.translateService.get('admin.placeholder.primary_url').subscribe((res: string) => {
  this.primaryURLPlaceholder = res;
});
this.translateService.get('admin.placeholder.wiki_url').subscribe((res: string) => {
  this.wikiURLPlaceholder = res;
});
this.translateService.get('admin.placeholder.latitude').subscribe((res: string) => {
  this.latitudePlaceholder = res;
});
this.translateService.get('admin.placeholder.longitude').subscribe((res: string) => {
  this.longitudePlaceholder = res;
});
this.translateService.get('admin.placeholder.visit_dur').subscribe((res: string) => {
  this.visitDurPlaceholder = res;
});
this.translateService.get('admin.handle_poi.open_map').subscribe((res: string) => {
  this.mapButtonText = res;
});
  }
}
