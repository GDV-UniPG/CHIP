import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoverPasswordDialogComponent } from './recover-password-dialog.component';

describe('RecoverPasswordDialogComponent', () => {
  let component: RecoverPasswordDialogComponent;
  let fixture: ComponentFixture<RecoverPasswordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecoverPasswordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoverPasswordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
