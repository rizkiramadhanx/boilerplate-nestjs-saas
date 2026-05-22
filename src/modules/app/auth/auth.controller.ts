import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../common/type/response';
import { LoginDto } from '../users/dto/base-user.dto';
import { UserEntity } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { RegisterWithBranchDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-auth.guard';
import { LogsService } from '../logs/logs.service';
import { SwitchBranchDto } from './dto/switch-branch.dto';
import { CurrentUser, CurrentUserType } from '../../../security/user.decorator';
import { t } from '../../../constant/messages';
import { PakasirWebhookDto } from './dto/pakasir-webhook.dto';
import { CheckPakasirPaymentQueryDto } from './dto/check-pakasir-payment-query.dto';
import { BillingCheckoutDto } from './dto/billing-checkout.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logsService: LogsService,
  ) {}

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(@Body('refresh_token') refreshToken: string) {
    try {
      const { access_token } =
        await this.authService.refreshTokens(refreshToken);
      return createSuccessResponse('Token refreshed', { access_token });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        t('refresh_token_invalid'),
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    try {
      const data = await this.authService.changePassword(
        currentUser.id,
        dto.old_password,
        dto.new_password,
      );
      return createSuccessResponse(data.message);
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        return createErrorResponse(error.message, status);
      }
      return createErrorResponse(t('failed_change_password'), 500);
    }
  }

  @Post('register')
  async register(@Body() registeruser: RegisterWithBranchDto) {
    try {
      await this.authService.registerManualUser(registeruser);
      return createSuccessResponse('register user succes');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('[register] unexpected error:', error);
      throw new BadRequestException(
        error.response?.message ?? 'Pendaftaran gagal',
      );
    }
  }

  @Post('payments/pakasir/webhook')
  async pakasirWebhook(
    @Body() payload: PakasirWebhookDto,
    @Req() req: Request,
  ) {
    const data = await this.authService.handlePakasirWebhook(
      payload,
      req.headers as unknown as Record<string, unknown>,
    );
    return createSuccessResponse('Webhook processed', data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payments/pakasir/status')
  async checkPakasirPaymentStatus(
    @Query() query: CheckPakasirPaymentQueryDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const data = await this.authService.checkPakasirPaymentStatus(
      query.order_id,
      currentUser,
    );
    return createSuccessResponse('Payment status', data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('billing/summary')
  async billingSummary(@CurrentUser() currentUser: CurrentUserType) {
    const data = await this.authService.getBillingSummary(currentUser);
    return createSuccessResponse('Billing summary', data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('billing/subscriptions')
  async billingSubscriptions(@CurrentUser() currentUser: CurrentUserType) {
    const data = await this.authService.listBillingSubscriptions(currentUser);
    return createSuccessResponse('Riwayat langganan', data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('billing/plans')
  async billingPlans() {
    const data = await this.authService.listBillingPlans();
    return createSuccessResponse('Daftar paket langganan', data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('billing/checkout')
  async billingCheckout(
    @Body() dto: BillingCheckoutDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const data = await this.authService.createBillingCheckout(currentUser, dto);
    return createSuccessResponse('Checkout langganan', data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('billing/subscriptions/:id/cancel')
  async cancelBillingSubscription(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    const data = await this.authService.cancelBillingSubscription(
      currentUser,
      id,
    );
    return createSuccessResponse('Langganan dibatalkan', data);
  }

  @Post('verify')
  async verifEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    try {
      await this.authService.verifyEmail(confirmEmailDto.token);
      return createSuccessResponse('Email berhasil diverifikasi');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || t('verification_failed'),
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('resend/verify')
  @UseGuards(JwtAuthGuard)
  async resendVerifEmail(@Req() req: Request) {
    const user = req.user as UserEntity;
    try {
      await this.authService.sendVerificationEmail(user);
    } catch (error) {
      throw new BadRequestException(
        error.message || t('failed_send_verification_email'),
      );
    }
  }

  @Post('login')
  async login(@Body() userLogin: LoginDto) {
    try {
      const { status, access_token, refresh_token, user } =
        await this.authService.login(userLogin);
      const profile = user as {
        id: string;
        branch_id?: string;
        branchId?: string;
        branch?: { id?: string };
      } | null;

      if (status === 'unconfirmed') {
        return createSuccessResponse(t('email_unconfirmed'), {
          status,
          access_token,
          refresh_token,
          user,
        });
      }

      await this.logsService.createLog({
        action: 'auth:login',
        branchId:
          profile?.branch_id ?? profile?.branchId ?? profile?.branch?.id,
        userId: profile?.id ?? '',
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      const data = { status, access_token, refresh_token, user };
      return createSuccessResponse(t('login_success'), data);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : t('generic_failed');
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationByEmail(dto.email);
    return createSuccessResponse(
      'Jika email terdaftar dan belum terverifikasi, link verifikasi telah dikirim',
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
      const result = await this.authService.forgotPassword(dto.email);
      return createSuccessResponse(result.message);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : t('generic_failed');
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      const result = await this.authService.resetPassword(
        dto.token,
        dto.new_password,
      );
      return createSuccessResponse(result.message);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : t('generic_failed');
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('checking-identifier')
  async checkIdentifier(@Body('identifier') identifier: string) {
    const result = await this.authService.checkIdentifierExists(identifier);
    return createSuccessResponse('Identifier check', result);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return createSuccessResponse('Logged out successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-branch-context')
  async myBranchContext(@CurrentUser() currentUser: CurrentUserType) {
    const data = await this.authService.getMyBranchContext(currentUser);
    return createSuccessResponse('My branch context', data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/delegations')
  async myDelegations(@CurrentUser() currentUser: CurrentUserType) {
    const data = await this.authService.listMyDelegations(currentUser);
    return createSuccessResponse('Delegations', data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-branch')
  async switchBranch(
    @Body() dto: SwitchBranchDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const profile = await this.authService.switchActiveBranch(
      currentUser,
      dto.branch_id,
    );
    await this.logsService.createLog({
      action: 'auth:switch-branch',
      branchId: dto.branch_id,
      userId: currentUser.id,
      status: 'SUCCESS',
      statusCode: HttpStatus.OK,
    });
    res.status(HttpStatus.OK);
    return createSuccessResponse('Active branch updated', profile);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as { id: string };

    try {
      const userData = await this.authService.getUserProfile(id);
      res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Get profile success', userData));
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse(t('failed_get_profile'), err.message));
    }
  }
}
