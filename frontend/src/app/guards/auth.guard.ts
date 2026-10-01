import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (!token) {
    router.navigate(['/']);
    return false;
  }

  // Verify session with the backend (e.g. GET /api/auth/me)
  return authService.verifySession().pipe(
    map(isValid => {
      if (isValid) {
        return true;
      }
      // Silently redirect to home without exposing any admin hints
      router.navigate(['/']);
      return false;
    })
  );
};
