import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateItineraryDialogComponent } from './update-itinerary-dialog.component';

describe('UpdateItineraryDialogComponent', () => {
  let component: UpdateItineraryDialogComponent;
  let fixture: ComponentFixture<UpdateItineraryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateItineraryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateItineraryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
