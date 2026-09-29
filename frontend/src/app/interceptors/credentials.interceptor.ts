import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Ensure credentials (cookies/auth) are sent on all backend API requests
  const isApiRequest =
    req.url.startsWith(environment.apiUrl) ||
    req.url.includes('prof-blog.runasp.net') ||
    req.url.startsWith('/api') ||
    req.url.includes('localhost:5000');

  if (isApiRequest) {
    const credReq = req.clone({
      withCredentials: true
    });
    return next(credReq);
  }

  return next(req);
};
