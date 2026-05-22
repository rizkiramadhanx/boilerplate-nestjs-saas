import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { t } from '../../../../constant/messages';

export type JwtPayload = {
  sub: string;
  email: string;
  role: number;
};
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.body?.refresh_token,
      ]),
      secretOrKey: configService.get('config.refresh.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.body?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException(t('refresh_token_malformed'));
    }

    // Validasi kadaluarsa token
    try {
      const isValid = await this.validateRefreshToken(refreshToken);
      if (!isValid) {
        throw new UnauthorizedException(t('refresh_token_expired'));
      }
    } catch (error) {
      throw new UnauthorizedException(t('refresh_token_invalid'));
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(t('user_not_found_auth'));
    }

    return {
      ...user,
      refreshToken,
    };
  }

  private async validateRefreshToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('config.refresh.secret'),
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
