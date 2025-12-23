import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from '../../_core/utils/loaders.service';
import { finalize } from 'rxjs/operators';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);
  console.log('Interceptor called - show loader');
  loader.show();
  return next(req).pipe(
    finalize(() => loader.hide())
  );
};
