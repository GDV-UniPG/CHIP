import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandlePoiComponent } from './handle-poi.component';

describe('HandlePoiComponent', () => {
  let component: HandlePoiComponent;
  let fixture: ComponentFixture<HandlePoiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandlePoiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandlePoiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
