import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const refreshToken = req.cookies['refresh_token']; // Ambil refresh token dari cookie
    // Jika refresh token ada di cookie, izinkan akses
    return !!refreshToken;
  }
}
