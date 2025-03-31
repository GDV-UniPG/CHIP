import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import{ MatSidenavModule } from '@angular/material/sidenav';
import{ MatDialogModule } from '@angular/material/dialog';
import{ MatToolbarModule } from '@angular/material/toolbar';
import{ MatListModule } from '@angular/material/list';
import{ MatSliderModule } from '@angular/material/slider';
import{ MatTooltipModule } from '@angular/material/tooltip';
import{ MatStepperModule } from '@angular/material/stepper';
import{ MatCardModule } from '@angular/material/card';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatMenuModule} from '@angular/material/menu';
import { CustomDateAdapter } from '../validators/custom.date.adapter';
import {Platform, PlatformModule} from '@angular/cdk/platform';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

export const MY_FORMATS = {
    parse: {
        dateInput: 'DD/MM/YYYY',
      },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
      },
  };

@NgModule({
    declarations: [],
    imports: [
        PlatformModule,
        CommonModule,
        MatTableModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatSelectModule,
        MatRadioModule,
        MatButtonModule,
        MatSidenavModule,
        MatDialogModule,
        MatToolbarModule,
        MatListModule,
        MatSliderModule,
        MatTooltipModule,
        MatStepperModule,
        MatCardModule,
        MatPaginatorModule,
        MatMenuModule,
        MatTabsModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule,
        MatAutocompleteModule,
        MatCheckboxModule,
        MatSlideToggleModule
    ],
    exports: [
        PlatformModule,
        CommonModule,
        MatTableModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatSelectModule,
        MatRadioModule,
        MatButtonModule,
        MatSidenavModule,
        MatDialogModule,
        MatToolbarModule,
        MatListModule,
        MatSliderModule,
        MatTooltipModule,
        MatStepperModule,
        MatCardModule,
        MatPaginatorModule,
        MatMenuModule,
        MatTabsModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule,
        MatAutocompleteModule,
        MatCheckboxModule,
        MatSlideToggleModule
    ],
    providers: [
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
        { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE,  Platform] },
      ]
})
export class NgMaterialModule { }