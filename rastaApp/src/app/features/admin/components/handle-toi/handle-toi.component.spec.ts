import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleToiComponent } from './handle-toi.component';

describe('HandleToiComponent', () => {
  let component: HandleToiComponent;
  let fixture: ComponentFixture<HandleToiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandleToiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleToiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
