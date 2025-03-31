import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveItineraryDialogComponent } from './save-itinerary-dialog.component';

describe('SaveItineraryDialogComponent', () => {
  let component: SaveItineraryDialogComponent;
  let fixture: ComponentFixture<SaveItineraryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SaveItineraryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveItineraryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
