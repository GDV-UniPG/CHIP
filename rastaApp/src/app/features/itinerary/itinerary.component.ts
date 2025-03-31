import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-itinerary',
  templateUrl: './itinerary.component.html',
  styleUrls: ['./itinerary.component.scss'],
})
export class ItineraryComponent implements OnInit, AfterViewInit {
  constructor() {}

  @ViewChild('stepper', { static: false }) stepper: MatStepper;

  ngAfterViewInit() {
    this.Initialize()
  }
  Initialize() {
    this.stepper.steps.forEach(Step => {
      Step.completed = false;
    });
  }
 

  isPreferenceCompleted=false;

  onNextStep(stepNumber: number) {
    this.stepper.steps.get(stepNumber).completed = true;
    this.stepper.next();
  }


  ngOnInit(): void {}
}
