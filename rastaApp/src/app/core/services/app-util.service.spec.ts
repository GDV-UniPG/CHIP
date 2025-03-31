import { TestBed } from '@angular/core/testing';

import { AppUtilService } from './app-util.service';

describe('AppUtilService', () => {
  let service: AppUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
