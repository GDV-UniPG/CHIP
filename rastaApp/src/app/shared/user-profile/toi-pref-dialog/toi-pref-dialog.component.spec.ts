import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToiPrefDialogComponent } from './toi-pref-dialog.component';

describe('ToiPrefDialogComponent', () => {
  let component: ToiPrefDialogComponent;
  let fixture: ComponentFixture<ToiPrefDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToiPrefDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToiPrefDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
