import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToiDialogComponent } from './toi-dialog.component';

describe('ToiDialogComponent', () => {
  let component: ToiDialogComponent;
  let fixture: ComponentFixture<ToiDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToiDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToiDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
