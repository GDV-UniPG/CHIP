import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, Sanitizer, ViewChild } from '@angular/core';
import { Itinerary } from 'src/app/core/models/itinerary.model';
import { Poi } from 'src/app/core/models/poi.model';
import { ItineraryService } from '../../itinerary.service';
import { MatStepper } from '@angular/material/stepper';
import { TitleDialogComponent } from './title-dialog/title-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LanguageService } from 'src/app/core/services/language-service.service';
import { DomSanitizer } from '@angular/platform-browser';
import { element } from 'protractor';

@Component({
  selector: 'app-itinerary-details',
  templateUrl: './itinerary-details.component.html',
  styleUrls: ['./itinerary-details.component.scss']
})
export class ItineraryDetailsComponent implements OnInit, AfterViewInit {

  @Input('steps') steps: any[];
  @Input('itineraryIndex') itineraryIndex: number;

  @Input('transportMean') transportMean: string;
  @Input('start_info') start_info: {
    name,
    latitude,
    longitude
  };


  poi_ids = [];
  showMap = false;

  constructor(private itineraryService: ItineraryService, private dialog: MatDialog,
     private translate: LanguageService, private sanitizer:DomSanitizer) { }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setChartView();
    }, 0);
  }
  @ViewChild('stepperContainer') stepperContainer!: ElementRef;
  @ViewChild('imageDiv') contentDiv!: ElementRef;

  stepChanged(event, j: number) {
    const selectedPoiIndex = event.selectedIndex;
    const stepperEl = this.stepperContainer.nativeElement.querySelector('.mat-horizontal-stepper-header-container');
    const steps = stepperEl.querySelectorAll('.mat-horizontal-stepper-header');
    const selectedStep = steps[selectedPoiIndex];

    if (selectedStep) {
      const isLastStep = selectedPoiIndex === steps.length - 1;
      const isSecondLastStep = selectedPoiIndex === steps.length - 2;
      selectedStep.scrollIntoView({
        behavior: 'smooth',
        inline: !isLastStep && !isSecondLastStep ? 'center' : 'nearest'
      });
    }

    this.steps[j].selectedPoi = this.steps[j].pois[selectedPoiIndex];

  }

  @ViewChild('stepperPoi') stepper: MatStepper;

  onPoiSelected(poi: any, dayIndex: number) {
    this.steps[dayIndex].selectedPOI = poi;
    const poiIndex = this.steps[dayIndex].pois.findIndex(p => p === poi);
    if (poiIndex !== -1) {
      this.stepper.selectedIndex = poiIndex;
    }
  }

  changeMapDescriptionTab(event, j: number) {
    if (event.index === 1) {
      this.steps[j].showMap = true;
    } else {
      this.steps[j].showMap = false;
    }
  }

  goLink(url) {
    window.open(url, '_blank');
  }

  getInfoFromPOI(id: number, pois, t_visit_min, t_end) {
    let poi = pois.find((poi) => poi.id === id)
    
    let colorScheme = {
      domain: poi.toi_scores.map(score => score.color) 
    }
    let chartData = poi.toi_scores.map(score => ({
      name: score.name, 
      value: score.score 
    }));
    poi.chartData=chartData;
    poi.colorScheme=colorScheme;
    poi.t_visit_min = Math.ceil(t_visit_min / 60);
    poi.t_end = Math.ceil(t_end / 60)
    return poi;
  }

  view: [number, number] = [700, 150];
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setChartView(); 
  }

    sanitizeHtml(description: string) {
      return this.sanitizer.bypassSecurityTrustHtml(description);
    }
  

  setChartView() {
    let width, height;
    if(this.contentDiv){
      const rect = this.contentDiv.nativeElement.getBoundingClientRect();
      width = rect.width * 1;
      height = 150;
       
      this.view = [width, height];
    }
   
    
  }

  printItinerary() {
    const dialogRef = this.dialog.open(TitleDialogComponent, {
      width: '400px',
    });


    dialogRef.afterClosed().subscribe((itineraryTitle: string | null) => {
      if (!itineraryTitle) return;
      const printDiv = document.getElementById("printableContent");
      if (!printDiv) {
        console.error("Print item not found.");
        return;
      }

      const titleElement = printDiv.querySelector("#print-title");
      if (titleElement) {
        titleElement.innerHTML = itineraryTitle;
      }

      const printWindow = window.open('', '', 'width=900,height=700');
      if (!printWindow) {
        console.error("Unable to open print window.");
        return;
      }

      const printContent = `
    <html>
    <head>
      <title>CHIP Itinerary</title>
      <style>
      body{
      font-family: "Arial", sans-serif;
      }
        #header {
            background-color: #e2e2ff;
            padding: 10px;
        }

        h1 {
            font-size: 24px;
            margin-bottom: 20px;
        }

        h2 {
            font-size: 20px;
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 10px;
        }

        p {  
          font-size: 14px;          
            margin: 5px 0;
        }

        .stepper {
            list-style: none;
            padding-left: 20px;
            counter-reset: step-counter;
        }

        .stepper>li {
            margin-bottom: 20px;
            padding-left: 20px;
            position: relative;
        }

        .stepper>li:before {
            content: counter(step-counter);
            counter-increment: step-counter;
            position: absolute;
            left: -12px;
            top: -3px;
            background-color: #3f51b5;
            color: #fff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
        }

        .step-header {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
        }

        .poi-details {
            font-size: 12px;
            list-style: none;
            padding-left: 5px;
            margin: 5px 0;
        }

        .poi-details li {
            margin-bottom: 5px;
        }

        .poi-content {
            display: flex;
            padding: 0 2%;
            align-items: center;
            border-radius: 5px;
            background-color: #f9f9f9;
            justify-content: space-around;
          }

          .poi-details {
            flex: 1; 
          }


          .poi-image img {
            margin-top: 5px;
            width: 150px!important;
            height: 100px;
            border-radius: 5px;
          }
      </style>
    </head>
    <body>
      ${printDiv.innerHTML}
    </body>
    </html>
  `;
  

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    })
  }

  ngOnInit(): void {
    this.poi_ids = this.steps.map(step => {
      return step.id_geo 
    });

    let groupedSteps = this.steps.reduce((acc, step) => {
      (acc[step.day] = acc[step.day] || []).push(step);
      return acc;
    }, {});

    let sortedGroupedSteps = Object.keys(groupedSteps).map(day =>
      groupedSteps[+day].sort((a, b) => a.step_number - b.step_number)
    );
    this.steps = sortedGroupedSteps;

    this.itineraryService
      .getPoisDetails(this.poi_ids) 
      .subscribe((data: Poi[]) => {
        this.steps.forEach((dailyItinerary) => {
          dailyItinerary.pois = dailyItinerary.map((poi, index) => {
            if (index == 0 || index == dailyItinerary.length - 1) {
              let poi1 = {}
              if (this.start_info.name == null) {
                poi1['name'] = "Current position"
              } else {
                poi1['name'] = this.start_info.name
              }
              poi1['latitude'] = this.start_info.latitude,
                poi1['longitude'] = this.start_info.longitude,
                poi1['t_visit_min'] = Math.ceil(poi.t_visit_min / 60),
                poi1['t_end'] = Math.ceil(poi.t_end / 60),
                poi1['url_primary'] = null
              return poi1;
            } else {
              if(poi.id_geo==null){
                  if(this.translate.getCodeSiteLanguage()=='it')
                    {poi.name ="POI rimosso"; poi.description="Il POI è stato rimosso dal sistema"}
                  else  {poi.name ="Removed POI"; poi.description="The POI has been removed from the system"}
                  poi.url_primary=null;
                  poi.t_visit_min = Math.ceil(poi.t_visit_min / 60);
                  poi.t_end = Math.ceil(poi.t_end / 60)
                  poi.id_geo=poi.geo;
                  return poi;
              }
              else
              return this.getInfoFromPOI(poi.id_geo, data, poi.t_visit_min, poi.t_end) 
            }
          })
          dailyItinerary.showMap = false;
          dailyItinerary.selectedPoi = dailyItinerary.pois[0]
        });
      });
      
   
  }


}
function html2pdf() {
  throw new Error('Function not implemented.');
}

