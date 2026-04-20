import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard untuk route yang hanya boleh diakses oleh admin (backoffice).
 * Token dari POST /backoffice/admins/login (payload type: 'admin').
 * Pakai bersama: @UseGuards(AdminAuthGuard)
 */
@Injectable()
export class AdminAuthGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
