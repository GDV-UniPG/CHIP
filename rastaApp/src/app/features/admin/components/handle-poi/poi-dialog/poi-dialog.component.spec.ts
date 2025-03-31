import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoiDialogComponent } from './poi-dialog.component';

describe('PoiDialogComponent', () => {
  let component: PoiDialogComponent;
  let fixture: ComponentFixture<PoiDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoiDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PoiDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
