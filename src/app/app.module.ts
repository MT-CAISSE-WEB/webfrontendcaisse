import { importProvidersFrom, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { NgxDocViewerModule } from 'ngx-doc-viewer';

registerLocaleData(localeFr);

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
    }),
    NgxDocViewerModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    importProvidersFrom(NgxDocViewerModule),
  ],
  bootstrap: [],
})
export class AppModule {}
