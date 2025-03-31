import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppUtilService } from '../services/app-util.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private appUtilService: AppUtilService,
    private injector: Injector
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    return next.handle(request).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          const translateService = this.injector.get(TranslateService);
          translateService.get('custom_dialog.error_title')
            .subscribe((res: string) => {
              this.appUtilService.openDialog(
                res,
                error.error,
                null,
                null,
                null
              );
           });
        }

        return throwError(error);
      })
    );
  }
}
