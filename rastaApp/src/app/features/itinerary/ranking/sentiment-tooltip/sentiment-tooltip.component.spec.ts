import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentimentTooltipComponent } from './sentiment-tooltip.component';

describe('SentimentTooltipComponent', () => {
  let component: SentimentTooltipComponent;
  let fixture: ComponentFixture<SentimentTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SentimentTooltipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SentimentTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
