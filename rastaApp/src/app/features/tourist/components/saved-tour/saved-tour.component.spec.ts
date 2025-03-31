import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedTourComponent } from './saved-tour.component';

describe('SavedTourComponent', () => {
  let component: SavedTourComponent;
  let fixture: ComponentFixture<SavedTourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SavedTourComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SavedTourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
