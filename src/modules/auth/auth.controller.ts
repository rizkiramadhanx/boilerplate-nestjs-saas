import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../common/type/response';
import { LoginDto } from '../users/dto/base-user.dto';
import { UserEntity } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { RegisterWithOutletDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    try {
      const { access_token } = await this.authService.refreshTokens(
        req.cookies['refresh_token'],
      );

      return res.json({ access_token });
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        return res
          .status(status)
          .json(createErrorResponse(error.message, status));
      }
      console.error('Token refresh error:', error);
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(createErrorResponse(error.response.message, 401));
    }
  }
  @Post('register')
  async register(@Body() registeruser: RegisterWithOutletDto) {
    try {
      await this.authService.registerManualUser(registeruser);
      return createSuccessResponse('register user succes');
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        return createErrorResponse(error.message, status);
      }
      return createErrorResponse(error.response?.message, 401);
    }
  }

  @Post('verify')
  async verifEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    try {
      await this.authService.verifyEmail(confirmEmailDto.token);
      return createSuccessResponse('succes verified email');
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        return createErrorResponse(error.message, status);
      }
      return createErrorResponse(error.response?.message, 401);
    }
  }

  @Post('resend/verify')
  async resendVerifEmail(@Req() req: Request): Promise<void> {
    const user = req.user as UserEntity;
    try {
      await this.authService.sendVerificationEmail(user);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Gagal mengirim email verifikasi',
      );
    }
  }

  @Post('login')
  async login(@Body() userLogin: LoginDto, @Res() res: Response) {
    try {
      const { access_token, refresh_token, user } =
        await this.authService.login(userLogin);
      this.setRefreshTokenCookie(res, refresh_token);
      const data = { access_token, user };
      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Login Success', data));
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        return res
          .status(status)
          .json(createErrorResponse(error.message, status));
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(error.message || 'Internal Server Error', 500),
        );
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response) {
    this.clearRefreshTokenCookie(res);
    return res.json(createSuccessResponse('Logged out successfully'));
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as {
      id: string;
    };

    try {
      const userData = await this.authService.getUserProfile(id);

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Get profile success', userData));
    } catch (err) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse('Failed to get profile', err.message));
    }
  }

  private setRefreshTokenCookie(res: Response, refresh_token: string) {
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      maxAge: 3 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
