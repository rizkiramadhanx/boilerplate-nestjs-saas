import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('PermissionsGuard');
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as any;

    // const isAdmin = !!user?.role?.isAdmin;
    // if (isAdmin) return true;

    const modules: string[] = user?.role?.modules || [];
    const has = required.every((p) => modules.includes(p));

    if (!has)
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    return true;
  }
}
