import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { AppUtilService } from 'src/app/core/services/app-util.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public appUtilService:AppUtilService) { }

  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  @ViewChild('stepperContainer') stepperContainer!: ElementRef;

  stepChanged(event) {const index = event.selectedIndex;
    const stepperEl = this.stepperContainer.nativeElement.querySelector('.mat-horizontal-stepper-header-container');
    const steps = stepperEl.querySelectorAll('.mat-horizontal-stepper-header');
    const selectedStep = steps[index];
  
    if (selectedStep) {
      const isLastStep = index === steps.length - 1;
      const isSecondLastStep = index === steps.length - 2;
  
      selectedStep.scrollIntoView({
        behavior: 'smooth',
        inline: !isLastStep && !isSecondLastStep ? 'center' : 'nearest'
      });
    }
  }
  
  ngOnInit(): void {
  }

}
