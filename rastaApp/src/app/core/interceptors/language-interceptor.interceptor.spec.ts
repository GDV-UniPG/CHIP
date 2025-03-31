import { TestBed } from '@angular/core/testing';

import { LanguageInterceptorInterceptor } from './language-interceptor.interceptor';

describe('LanguageInterceptorInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      LanguageInterceptorInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: LanguageInterceptorInterceptor = TestBed.inject(LanguageInterceptorInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
