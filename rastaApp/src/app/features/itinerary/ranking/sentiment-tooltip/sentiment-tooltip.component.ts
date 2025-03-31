import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-sentiment-tooltip',
  templateUrl: './sentiment-tooltip.component.html',
  styleUrls: ['./sentiment-tooltip.component.scss']
})
export class SentimentTooltipComponent {

  @Input() positive: number = 0;
  @Input() negative: number = 0;
  @Input() neutral: number = 0;

  get formattedPositive(): string {
    const value =this.positive * 100;
    return value.toString().slice(0, 4); 
  }
  get formattedNegative(): string {
    const value =this.negative * 100;
    return value.toString().slice(0, 4); 
  }
  get formattedNeutral(): string {
    const value =this.neutral * 100;
    return value.toString().slice(0, 4); 
  }

}
