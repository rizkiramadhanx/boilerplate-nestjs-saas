import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import ACTION_ROLES from 'src/constant/action-roles';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { generateFromEmail } from 'unique-username-generator';
import { MailService } from '../mailer/mailer.service';
import { BranchEntity } from '../branches/entities/branch.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { TenantEntity, TenantPlan } from '../tenants/entities/tenant.entity';
import { LoginDto } from '../users/dto/base-user.dto';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { UserEntity } from '../users/entities/user.entity';
import { UserBranchEntity } from '../users/entities/user-branch.entity';
import { UserBranchResponseDto } from '../users/dto/user-branch.dto';
import { RegisterWithBranchDto } from './dto/register.dto';
import { CurrentUserType } from '../../../security/user.decorator';
import { t } from '../../../constant/messages';
import { PricingConfigEntity } from '../../backoffice/pricing/entities/pricing-config.entity';
import { SubscriptionEntity } from '../../backoffice/subscriptions/entities/subscription.entity';
import { PaymentAttemptEntity } from '../../backoffice/payments/entities/payment-attempt.entity';
import { PaymentWebhookLogEntity } from '../../backoffice/payments/entities/payment-webhook-log.entity';
import axios from 'axios';
import { PakasirWebhookDto } from './dto/pakasir-webhook.dto';
import { BillingCheckoutDto } from './dto/billing-checkout.dto';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Tambahkan N bulan ke `start` (kalender WIB), lalu set ke 23:59:59.999 WIB.
 * Mengembalikan Date UTC yang setara dengan akhir hari WIB tsb.
 */
function endOfDayWib(start: Date, addMonths: number): Date {
  const wib = new Date(start.getTime() + WIB_OFFSET_MS);
  wib.setUTCMonth(wib.getUTCMonth() + addMonths);
  return new Date(
    Date.UTC(
      wib.getUTCFullYear(),
      wib.getUTCMonth(),
      wib.getUTCDate(),
      16,
      59,
      59,
      999,
    ),
  );
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('ACCESS_TOKEN_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('REFRESH_TOKEN_SERVICE')
    private readonly refreshTokenService: JwtService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BranchEntity)
    private branchRepository: Repository<BranchEntity>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(TenantEntity)
    private tenantRepository: Repository<TenantEntity>,
    @InjectRepository(UserBranchEntity)
    private readonly userBranchRepository: Repository<UserBranchEntity>,
    @InjectRepository(PricingConfigEntity)
    private readonly pricingConfigRepository: Repository<PricingConfigEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(PaymentAttemptEntity)
    private readonly paymentAttemptRepository: Repository<PaymentAttemptEntity>,
    @InjectRepository(PaymentWebhookLogEntity)
    private readonly paymentWebhookLogRepository: Repository<PaymentWebhookLogEntity>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  generateJwt(payload) {
    return this.accessTokenService.sign(payload);
  }

  generateRefresh(payload) {
    return this.refreshTokenService.sign(payload);
  }

  async hashingPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(t('user_not_found'));
    }
    if (!user.password) {
      throw new BadRequestException(t('change_password_no_password_set'));
    }
    const valid = await this.comparePassword(oldPassword, user.password);
    if (!valid) {
      throw new BadRequestException(t('change_password_old_invalid'));
    }
    const sameAsOld = await this.comparePassword(newPassword, user.password);
    if (sameAsOld) {
      throw new BadRequestException(t('change_password_same_as_old'));
    }
    user.password = await this.hashingPassword(newPassword);
    await this.userRepository.save(user);
    return { message: 'Password berhasil diubah' };
  }

  async sendVerificationEmail(user: UserEntity) {
    if (user.isConfirmed)
      throw new BadRequestException(t('email_already_verified'));
    const payload = { sub: user.id, email: user.email };
    const isProduction =
      this.configService.get<string>('config.node_env') === 'production';
    const expiresIn = isProduction ? '15m' : '1d';
    const token = this.accessTokenService.sign(payload, { expiresIn });
    const confirmationUrl = `${this.configService.get<string>('FRONT_END_URL')}/auth/confirm?code=${token}`;

    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      confirmationUrl,
    );
  }

  async forgotPassword(email: string) {
    email = email.toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(t('user_not_found'));
    }

    const payload = { sub: user.id, email: user.email };
    const isProduction =
      this.configService.get<string>('config.node_env') === 'production';
    const expiresIn = isProduction ? '15m' : '1d';
    const token = this.accessTokenService.sign(payload, { expiresIn });
    const resetUrl = `${this.configService.get<string>('FRONT_END_URL')}/auth/reset-password?token=${token}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl,
    );

    return { message: 'Link reset password telah dikirim ke email Anda' };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub?: string; email?: string };
    try {
      payload = await this.accessTokenService.verifyAsync(token, {
        secret: this.configService.get('config.jwt.secret'),
      });
    } catch (error) {
      if ((error as Error)?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(t('reset_password_link_expired'));
      }
      throw new UnauthorizedException(t('reset_password_link_invalid'));
    }

    if (!payload?.sub) {
      throw new UnauthorizedException(t('reset_password_link_invalid'));
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(t('reset_password_link_invalid'));
    }

    user.password = await this.hashingPassword(newPassword);
    await this.userRepository.save(user);

    return { message: 'Password berhasil direset' };
  }

  async verifyEmail(token: string) {
    let payload: { email?: string };
    try {
      payload = await this.accessTokenService.verifyAsync(token, {
        secret: this.configService.get('config.jwt.secret'),
      });
    } catch (error) {
      if ((error as Error)?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(t('verification_link_expired'));
      }
      throw new UnauthorizedException(t('verification_link_invalid'));
    }

    if (!payload?.email) {
      throw new UnauthorizedException(t('verification_link_invalid'));
    }

    const user = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (!user) {
      throw new UnauthorizedException(t('verification_link_invalid'));
    }

    if (user.isConfirmed) {
      throw new BadRequestException(t('email_already_verified_previously'));
    }

    user.isConfirmed = true;
    await this.userRepository.save(user);
  }

  async registerManualUser(user: RegisterWithBranchDto) {
    user.email = user.email.toLowerCase();

    const userExists = await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (userExists) throw new ConflictException(t('email_already_in_use'));

    const tenantExists = await this.tenantRepository.findOne({
      where: { ownerEmail: user.email },
    });
    if (tenantExists) throw new ConflictException(t('email_already_in_use'));

    if (user.phone) {
      const digits = user.phone.replace(/\D/g, '');
      user.phone = digits.startsWith('0') ? '62' + digits.slice(1) : digits;

      const phoneExists = await this.userRepository.findOne({
        where: { phone: user.phone },
      });
      if (phoneExists) throw new ConflictException(t('phone_already_in_use'));
    }

    const pricing = await this.pricingConfigRepository.findOne({
      where: { isActive: true },
      order: { periodMonths: 'ASC' },
    });

    const trialDays = pricing?.trialDays ?? 14;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const userQuota = pricing?.defaultUserQuota ?? 3;
    const branchQuota = pricing?.defaultBranchQuota ?? 1;

    const savedUser = await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const newUser = this.userRepository.create(user);
        newUser.name = user.username;
        newUser.password = await this.hashingPassword(user.password);
        newUser.isOwner = true;
        newUser.isConfirmed = process.env.NODE_ENV !== 'production';

        const newTenant = this.tenantRepository.create({
          name: user.branch_name,
          ownerName: user.username,
          ownerEmail: user.email,
          ownerPhone: user.phone ?? null,
          status: 'trial',
          userQuota,
          branchQuota,
          trialEndsAt,
        });
        await transactionalEntityManager.save(newTenant);
        newUser.tenant = newTenant;

        const newBranch = this.branchRepository.create({
          name: user.branch_name,
          tenantId: newTenant.id,
        });
        await transactionalEntityManager.save(newBranch);
        newUser.branch = newBranch;

        const roleAdmin = this.roleRepository.create({
          name: 'Owner (tidak bisa dihapus)',
          isAdmin: true,
          modules: ACTION_ROLES.flatMap((item) =>
            item.actions.map((a) => a.value),
          ),
          tenant: newTenant,
        });
        await transactionalEntityManager.save(roleAdmin);
        newUser.role = roleAdmin;

        // Role Kasir — fokus operasi POS, tanpa void/CRUD master data.
        const roleKasir = this.roleRepository.create({
          name: 'Kasir',
          isAdmin: false,
          modules: [
            'dashboard:read',
            'transaction:read',
            'transaction:create',
            'transaction:dashboard',
            'pos:read',
            'pos:create',
            'pos:dashboard',
            'product:read',
            'account:read',
            'account:update',
            'stock_movement:read',
            'customer:read',
            'customer:create',
            'customer:update',
            'customer:delete',
            'debt:read',
            'debt:create',
            'debt:pay',
            'debt:void',
            'debt:delete',
            'option:product',
            'option:account',
            'option:category',
            'option:customer',
          ],
          tenant: newTenant,
        });
        await transactionalEntityManager.save(roleKasir);

        await transactionalEntityManager.save(newUser);

        return newUser;
      },
    );

    try {
      await this.sendVerificationEmail(savedUser);
    } catch (err) {
      console.error(
        `Register succeeded but verification email failed for ${savedUser.email}:`,
        err,
      );
    }

    return savedUser;
  }

  /** Nominal rupiah bulat untuk URL & API Pakasir (tanpa desimal di path). */
  private pakasirAmountRupiahInteger(amount: string | number): number {
    const n = Number(String(amount).replace(/,/g, ''));
    if (Number.isNaN(n) || n < 0) {
      return 0;
    }
    return Math.round(n);
  }

  private pakasirApiOrigin(): string {
    const override = this.configService
      .get<string>('PAKASIR_API_ORIGIN')
      ?.trim();
    if (override) {
      return override.replace(/\/$/, '');
    }
    const isSandbox =
      String(this.configService.get('PAKASIR_SANDBOX')).toLowerCase() ===
      'true';
    return isSandbox
      ? 'https://sandbox.pakasir.com'
      : 'https://app.pakasir.com';
  }

  private buildPakasirPaymentUrl(params: {
    projectSlug: string;
    amount: string;
    orderId: string;
    /** Tambahkan order_id ke URL redirect supaya halaman callback bisa sinkron status. */
    includeOrderIdInRedirect?: boolean;
  }) {
    const { projectSlug, amount, orderId, includeOrderIdInRedirect } = params;
    if (!projectSlug) {
      return undefined;
    }

    const amountInt = this.pakasirAmountRupiahInteger(amount);
    const payOrigin = this.pakasirApiOrigin();
    const baseUrl = `${payOrigin}/pay`;

    // Pakasir B.1 — tombol "Kembali ke halaman merchant" memakai query `redirect`
    let redirectUrl = this.resolvePakasirMerchantRedirectUrl();
    if (redirectUrl && includeOrderIdInRedirect) {
      redirectUrl = this.appendQueryParam(redirectUrl, 'order_id', orderId);
    }

    const query = new URLSearchParams({ order_id: orderId });
    if (redirectUrl) {
      query.set('redirect', redirectUrl);
    }
    // Pakasir B.2 — hanya QRIS
    query.set('qris_only', '1');

    return `${baseUrl}/${projectSlug}/${amountInt}?${query.toString()}`;
  }

  private appendQueryParam(url: string, key: string, value: string): string {
    try {
      const u = new URL(url);
      u.searchParams.set(key, value);
      return u.toString();
    } catch {
      return url;
    }
  }

  /** URL lengkap setelah bayar (override). Kalau kosong: FRONT_END_URL/billing/callback lalu APP_URL/billing/callback. */
  private resolvePakasirMerchantRedirectUrl(): string | undefined {
    const explicit = this.configService
      .get<string>('PAKASIR_REDIRECT_URL')
      ?.trim();
    if (explicit) {
      return explicit.replace(/\/$/, '');
    }
    const front = this.configService.get<string>('FRONT_END_URL')?.trim();
    if (front) {
      return `${front.replace(/\/$/, '')}/billing/callback`;
    }
    const appUrl = this.configService.get<string>('APP_URL')?.trim();
    if (appUrl) {
      return `${appUrl.replace(/\/$/, '')}/billing/callback`;
    }
    return undefined;
  }

  async checkPakasirPaymentStatus(
    orderId: string,
    currentUser: CurrentUserType,
  ): Promise<Record<string, unknown>> {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const paymentAttempt = await this.paymentAttemptRepository.findOne({
      where: { orderId, tenantId },
      relations: ['subscription'],
    });
    if (!paymentAttempt?.subscription) {
      throw new NotFoundException(t('payment_not_found'));
    }

    const result = await this.reconcilePakasirPaymentAttempt(paymentAttempt);
    return this.formatPakasirReconcileResponse(result);
  }

  async adminCheckPakasirPaymentStatus(
    orderId: string,
  ): Promise<Record<string, unknown>> {
    const paymentAttempt = await this.paymentAttemptRepository.findOne({
      where: { orderId },
      relations: ['subscription'],
    });
    if (!paymentAttempt?.subscription) {
      throw new NotFoundException(t('payment_not_found'));
    }
    const result = await this.reconcilePakasirPaymentAttempt(paymentAttempt);
    return this.formatPakasirReconcileResponse(result);
  }

  async getBillingSummary(currentUser: CurrentUserType) {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: [
        'id',
        'status',
        'plan',
        'userQuota',
        'branchQuota',
        'currentPeriodStart',
        'currentPeriodEnd',
        'trialEndsAt',
      ],
    });
    if (!tenant) {
      throw new NotFoundException(t('tenant_not_found'));
    }

    const now = new Date();
    const activeSub = await this.subscriptionRepository.findOne({
      where: {
        tenantId,
        periodStart: LessThanOrEqual(now),
        periodEnd: MoreThan(now),
      },
      order: { periodEnd: 'DESC' },
    });
    const subscription =
      activeSub ??
      (await this.subscriptionRepository.findOne({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      })) ??
      null;

    let payment: PaymentAttemptEntity | null = null;
    if (subscription) {
      const attempts = await this.paymentAttemptRepository.find({
        where: { subscriptionId: subscription.id },
        order: { createdAt: 'DESC' },
        take: 1,
      });
      payment = attempts[0] ?? null;
    }

    return {
      is_owner: Boolean(currentUser.isOwner),
      tenant: {
        id: tenant.id,
        status: tenant.status,
        plan: tenant.plan ?? null,
        user_quota: tenant.userQuota,
        branch_quota: tenant.branchQuota,
        current_period_start: tenant.currentPeriodStart?.toISOString() ?? null,
        current_period_end: tenant.currentPeriodEnd?.toISOString() ?? null,
        trial_ends_at: tenant.trialEndsAt?.toISOString() ?? null,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan,
            amount: subscription.amount,
            period_start: subscription.periodStart?.toISOString() ?? null,
            period_end: subscription.periodEnd?.toISOString() ?? null,
            is_trial: subscription.isTrial,
          }
        : null,
      payment: payment
        ? {
            order_id: payment.orderId,
            payment_url: payment.paymentUrl ?? null,
            status: payment.status,
            amount: payment.amount,
          }
        : null,
    };
  }

  async listBillingSubscriptions(currentUser: CurrentUserType) {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const subs = await this.subscriptionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const items = [];
    for (const sub of subs) {
      const attempts = await this.paymentAttemptRepository.find({
        where: { subscriptionId: sub.id },
        order: { createdAt: 'DESC' },
        take: 1,
      });
      const pay = attempts[0] ?? null;
      items.push({
        id: sub.id,
        status: sub.status,
        plan: sub.plan,
        amount: sub.amount,
        period_start: sub.periodStart?.toISOString() ?? null,
        period_end: sub.periodEnd?.toISOString() ?? null,
        is_trial: sub.isTrial,
        created_at: sub.createdAt.toISOString(),
        payment: pay
          ? {
              order_id: pay.orderId,
              status: pay.status,
              payment_url: pay.paymentUrl ?? null,
              amount: pay.amount,
              created_at: pay.createdAt.toISOString(),
            }
          : null,
      });
    }

    return { items };
  }

  async listBillingPlans() {
    const plans = await this.pricingConfigRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
    return {
      items: plans.map((p) => ({
        id: p.id,
        plan: p.plan,
        price: p.price,
        period_months: p.periodMonths,
        default_user_quota: p.defaultUserQuota,
        default_branch_quota: p.defaultBranchQuota,
        extra_user_price: p.extraUserPrice,
        extra_branch_price: p.extraBranchPrice,
        trial_days: p.trialDays,
        trial_max_transactions: p.trialMaxTransactions,
        is_landing: p.isLanding,
      })),
    };
  }

  async createBillingCheckout(
    currentUser: CurrentUserType,
    dto: BillingCheckoutDto,
  ) {
    if (!currentUser.isOwner) {
      throw new ForbiddenException(t('tenant_owner_only_billing'));
    }
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const pricing = await this.pricingConfigRepository.findOne({
      where: { id: dto.pricing_id, isActive: true },
    });
    const plan: TenantPlan = pricing?.plan ?? '';
    if (!pricing) {
      throw new BadRequestException(t('subscription_plan_unavailable'));
    }

    const pendingSub = await this.subscriptionRepository.findOne({
      where: { tenantId, status: 'pending' },
    });
    if (pendingSub) {
      const pendingPays = await this.paymentAttemptRepository.find({
        where: { subscriptionId: pendingSub.id },
        order: { createdAt: 'DESC' },
        take: 1,
      });
      const pendingPay = pendingPays[0] ?? null;
      throw new ConflictException({
        message: t('billing_pending_exists'),
        pending_subscription: {
          id: pendingSub.id,
          plan: pendingSub.plan,
          amount: pendingSub.amount,
          payment_url: pendingPay?.paymentUrl ?? null,
          order_id: pendingPay?.orderId ?? null,
        },
      });
    }

    const now = new Date();
    const latestActive = await this.subscriptionRepository.findOne({
      where: {
        tenantId,
        status: 'active',
        periodEnd: MoreThan(now),
      },
      order: { periodEnd: 'DESC' },
    });

    const projectedStart = latestActive?.periodEnd
      ? new Date(latestActive.periodEnd)
      : new Date(now);
    const projectedEnd = endOfDayWib(projectedStart, pricing.periodMonths);

    const maxAllowedEnd = new Date(now);
    maxAllowedEnd.setFullYear(maxAllowedEnd.getFullYear() + 2);
    if (projectedEnd.getTime() > maxAllowedEnd.getTime()) {
      throw new BadRequestException(t('subscription_max_two_years'));
    }

    const payload = await this.subscriptionRepository.manager.transaction(
      async (manager) => {
        const subscription = this.subscriptionRepository.create({
          tenant: { id: tenantId } as TenantEntity,
          tenantId,
          plan,
          status: 'pending',
          amount: pricing.price,
          userQuota: pricing.defaultUserQuota,
          branchQuota: pricing.defaultBranchQuota,
          periodStart: undefined,
          periodEnd: undefined,
          isTrial: false,
        });
        await manager.save(subscription);

        const orderId = `SUB-${subscription.id}-${Date.now()}`;
        const projectSlug =
          this.configService.get<string>('PAKASIR_PROJECT_SLUG') ?? '';
        const paymentUrl = this.buildPakasirPaymentUrl({
          projectSlug,
          amount: pricing.price,
          orderId,
          includeOrderIdInRedirect: true,
        });

        const paymentAttempt = this.paymentAttemptRepository.create({
          tenant: { id: tenantId } as TenantEntity,
          tenantId,
          subscription,
          subscriptionId: subscription.id,
          orderId,
          projectSlug,
          amount: pricing.price,
          paymentUrl,
          status: 'pending',
          rawResponse: { source: 'billing_checkout' },
        });
        await manager.save(paymentAttempt);

        return {
          subscription_id: subscription.id,
          order_id: orderId,
          payment_url: paymentUrl ?? null,
          projected_period_start: projectedStart.toISOString(),
          projected_period_end: projectedEnd.toISOString(),
          stacked: !!latestActive,
        };
      },
    );

    return payload;
  }

  async cancelBillingSubscription(
    currentUser: CurrentUserType,
    subscriptionId: string,
  ) {
    if (!currentUser.isOwner) {
      throw new ForbiddenException(t('tenant_owner_only_cancel_subscription'));
    }
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
    });
    if (!subscription) {
      throw new NotFoundException(t('subscription_not_found'));
    }
    if (subscription.status !== 'pending') {
      throw new BadRequestException(t('subscription_cancel_pending_only'));
    }

    await this.subscriptionRepository.manager.transaction(async (manager) => {
      await manager.update(
        SubscriptionEntity,
        { id: subscriptionId },
        { status: 'cancelled' },
      );
      await manager.update(
        PaymentAttemptEntity,
        { subscriptionId, status: 'pending' },
        { status: 'failed' },
      );
    });

    return { subscription_id: subscriptionId, status: 'cancelled' };
  }

  async handlePakasirWebhook(
    payload: PakasirWebhookDto,
    headers?: Record<string, unknown>,
  ) {
    const webhookLog = await this.paymentWebhookLogRepository.save(
      this.paymentWebhookLogRepository.create({
        orderId: payload.order_id,
        rawBody: payload as unknown as Record<string, unknown>,
        headers,
        status: 'received',
      }),
    );

    const paymentAttempt = await this.paymentAttemptRepository.findOne({
      where: { orderId: payload.order_id },
      relations: ['subscription'],
    });

    if (!paymentAttempt?.subscription) {
      await this.paymentWebhookLogRepository.update(webhookLog.id, {
        status: 'failed',
        notes: 'order_id not found',
      });
      throw new NotFoundException(t('payment_order_id_not_found'));
    }

    try {
      const result = await this.reconcilePakasirPaymentAttempt(paymentAttempt);
      if (result.kind === 'already_paid') {
        await this.paymentWebhookLogRepository.update(webhookLog.id, {
          status: 'duplicate',
          notes: 'already paid',
          paymentAttemptId: paymentAttempt.id,
          processedAt: new Date(),
        });
        return { ok: true, duplicate: true };
      }
      if (result.kind === 'status_updated') {
        await this.paymentWebhookLogRepository.update(webhookLog.id, {
          status: 'processed',
          notes: `non-completed status: ${result.pakasirStatus}`,
          paymentAttemptId: paymentAttempt.id,
          processedAt: new Date(),
        });
        return {
          ok: true,
          payment_status: result.paymentStatus,
          pakasir_status: result.pakasirStatus,
        };
      }
      await this.paymentWebhookLogRepository.update(webhookLog.id, {
        status: 'processed',
        notes: 'payment completed and activated',
        paymentAttemptId: paymentAttempt.id,
        processedAt: new Date(),
      });
      return { ok: true, activated: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      await this.paymentWebhookLogRepository.update(webhookLog.id, {
        status: 'failed',
        notes: message.slice(0, 500),
        paymentAttemptId: paymentAttempt.id,
      });
      throw err;
    }
  }

  private async reconcilePakasirPaymentAttempt(
    paymentAttempt: PaymentAttemptEntity & {
      subscription: SubscriptionEntity;
    },
  ): Promise<
    | { kind: 'already_paid' }
    | {
        kind: 'status_updated';
        paymentStatus: 'pending' | 'failed' | 'expired';
        pakasirStatus: string;
      }
    | { kind: 'activated' }
  > {
    if (paymentAttempt.status === 'paid') {
      return { kind: 'already_paid' };
    }

    const detail = await this.getPakasirTransactionDetail({
      project: paymentAttempt.projectSlug,
      amount: this.pakasirAmountRupiahInteger(paymentAttempt.amount),
      orderId: paymentAttempt.orderId,
    });

    if (!detail) {
      throw new BadRequestException(t('pakasir_verification_failed'));
    }

    const detailAmount = this.pakasirAmountRupiahInteger(detail.amount);
    const expectedAmount = this.pakasirAmountRupiahInteger(
      paymentAttempt.amount,
    );
    const projectOk =
      String(detail.project ?? '').toLowerCase() ===
      String(paymentAttempt.projectSlug ?? '').toLowerCase();
    if (detail.order_id !== paymentAttempt.orderId || !projectOk) {
      throw new BadRequestException(t('payment_data_invalid'));
    }
    if (detailAmount !== expectedAmount) {
      throw new BadRequestException(
        t('payment_amount_mismatch', {
          actual: detailAmount,
          expected: expectedAmount,
        }),
      );
    }

    const pakasirStatus = String(detail.status ?? '').toLowerCase();
    if (pakasirStatus !== 'completed') {
      const mappedStatus = this.mapPaymentStatus(detail.status);
      await this.paymentAttemptRepository.update(paymentAttempt.id, {
        status: mappedStatus,
        rawResponse: detail as unknown as Record<string, unknown>,
      });
      return {
        kind: 'status_updated',
        paymentStatus: mappedStatus,
        pakasirStatus: String(detail.status ?? ''),
      };
    }

    const paidAt = detail.completed_at
      ? new Date(detail.completed_at)
      : new Date();
    await this.paymentAttemptRepository.manager.transaction(async (manager) => {
      const tenant = await manager.findOne(TenantEntity, {
        where: { id: paymentAttempt.tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tenant) {
        throw new NotFoundException(t('tenant_not_found'));
      }

      const pricing = await manager.findOne(PricingConfigEntity, {
        where: { plan: paymentAttempt.subscription.plan, isActive: true },
      });
      if (!pricing) {
        throw new BadRequestException(t('subscription_plan_unavailable'));
      }

      const now = paidAt;
      const latestActive = await manager.findOne(SubscriptionEntity, {
        where: {
          tenantId: paymentAttempt.tenantId,
          status: 'active',
          periodEnd: MoreThan(now),
        },
        order: { periodEnd: 'DESC' },
      });
      const startsActive = !latestActive;
      const periodStart = latestActive?.periodEnd
        ? new Date(latestActive.periodEnd)
        : new Date(now);
      const periodEnd = endOfDayWib(periodStart, pricing.periodMonths);

      await manager.update(PaymentAttemptEntity, paymentAttempt.id, {
        status: 'paid',
        paidAt,
        rawResponse: detail as unknown as Record<string, unknown>,
      });

      await manager.update(SubscriptionEntity, paymentAttempt.subscriptionId, {
        status: 'active',
        paidAt,
        periodStart,
        periodEnd,
        isTrial: false,
      });

      const existingEnd = tenant.currentPeriodEnd
        ? new Date(tenant.currentPeriodEnd)
        : null;
      const newChainEnd =
        existingEnd && existingEnd.getTime() > periodEnd.getTime()
          ? existingEnd
          : periodEnd;

      const tenantPatch: Partial<TenantEntity> = {
        status: 'active',
        currentPeriodEnd: newChainEnd,
        trialEndsAt: null,
      };
      if (startsActive) {
        tenantPatch.plan = paymentAttempt.subscription.plan;
        tenantPatch.userQuota = paymentAttempt.subscription.userQuota;
        tenantPatch.branchQuota = paymentAttempt.subscription.branchQuota;
        tenantPatch.currentPeriodStart = periodStart;
      }
      await manager.update(TenantEntity, paymentAttempt.tenantId, tenantPatch);
    });

    const tenant = await this.tenantRepository.findOne({
      where: { id: paymentAttempt.tenantId },
    });
    if (tenant) {
      const formatDate = (d: Date) =>
        d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Jakarta',
        });
      this.mailService
        .sendPaymentSuccessEmail(tenant.ownerEmail, {
          ownerName: tenant.ownerName,
          plan: paymentAttempt.subscription.plan,
          amount: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(Number(paymentAttempt.amount)),
          periodEnd: formatDate(
            new Date(
              tenant.currentPeriodEnd ??
                paymentAttempt.subscription.periodEnd ??
                new Date(),
            ),
          ),
          userQuota: paymentAttempt.subscription.userQuota,
          branchQuota: paymentAttempt.subscription.branchQuota,
        })
        .catch((err) =>
          console.error('Failed to send payment success email', err),
        );
    }

    return { kind: 'activated' };
  }

  private formatPakasirReconcileResponse(
    result:
      | { kind: 'already_paid' }
      | {
          kind: 'status_updated';
          paymentStatus: 'pending' | 'failed' | 'expired';
          pakasirStatus: string;
        }
      | { kind: 'activated' },
  ): Record<string, unknown> {
    if (result.kind === 'already_paid') {
      return {
        ok: true,
        duplicate: true,
        payment_status: 'paid',
        subscription_status: 'active',
      };
    }
    if (result.kind === 'status_updated') {
      return {
        ok: true,
        activated: false,
        payment_status: result.paymentStatus,
        pakasir_status: result.pakasirStatus,
      };
    }
    return {
      ok: true,
      activated: true,
      payment_status: 'paid',
      subscription_status: 'active',
    };
  }

  private async getPakasirTransactionDetail(params: {
    project: string;
    amount: number;
    orderId: string;
  }) {
    const apiKey = this.configService.get<string>('PAKASIR_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(t('pakasir_api_key_missing'));
    }

    const amountInt = this.pakasirAmountRupiahInteger(params.amount);
    const query = new URLSearchParams({
      project: params.project,
      amount: String(amountInt),
      order_id: params.orderId,
      api_key: apiKey,
    });
    const origin = this.pakasirApiOrigin();
    const url = `${origin}/api/transactiondetail?${query.toString()}`;
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        validateStatus: (s) => s < 500,
      });
      if (response.status >= 400) {
        return undefined;
      }
      return response.data?.transaction as
        | {
            amount: number;
            order_id: string;
            project: string;
            status: string;
            payment_method?: string;
            completed_at?: string;
          }
        | undefined;
    } catch {
      return undefined;
    }
  }

  private mapPaymentStatus(status: string): 'failed' | 'expired' | 'pending' {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'expired') {
      return 'expired';
    }
    if (normalized === 'failed' || normalized === 'cancelled') {
      return 'failed';
    }
    return 'pending';
  }

  async login(userLogin: LoginDto): Promise<{
    status: 'active' | 'unconfirmed';
    access_token: string | null;
    refresh_token: string | null;
    user: Record<string, unknown> | null;
  }> {
    const { identifier: rawIdentifier, password } = userLogin;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawIdentifier);

    let normalizedIdentifier = isEmail
      ? rawIdentifier.toLowerCase()
      : rawIdentifier;
    if (!isEmail) {
      const digits = rawIdentifier.replace(/\D/g, '');
      normalizedIdentifier = digits.startsWith('0')
        ? '62' + digits.slice(1)
        : digits;
    }

    const whereClause = isEmail
      ? { email: normalizedIdentifier }
      : { phone: normalizedIdentifier };

    const userExists = await this.userRepository.findOne({
      where: whereClause,
      relations: ['role'],
    });

    if (!userExists) {
      throw new UnauthorizedException(t('invalid_credentials'));
    }

    const isPasswordValid = await this.comparePassword(
      password,
      userExists.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(t('invalid_credentials'));
    }

    if (!userExists.isConfirmed) {
      return {
        status: 'unconfirmed',
        access_token: null,
        refresh_token: null,
        user: {
          id: userExists.id,
          email: userExists.email,
          name: userExists.name,
          is_confirmed: false,
        },
      };
    }

    await this.userRepository.update(userExists.id, { lastLogin: new Date() });

    const tokens = this.generateTokens(userExists);
    const userProfile = await this.getUserProfile(userExists.id);

    return {
      status: 'active',
      ...tokens,
      user: userProfile,
    };
  }

  async resendVerificationByEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.isConfirmed) return;
    await this.sendVerificationEmail(user);
  }

  async signIn(user) {
    if (!user) {
      throw new BadRequestException(t('unauthenticated'));
    }
    const userExists = await this.userRepository.findOne({
      where: { email: user.email },
    });

    if (userExists?.password) {
      throw new UnauthorizedException(t('please_login_with_password'));
    }

    if (!userExists) {
      return this.registerUser(user);
    }

    return this.generateTokens(userExists);
  }

  async registerUser(user: RegisterUserDto) {
    try {
      const newUser = this.userRepository.create(user);
      newUser.name = generateFromEmail(user.email, 5);
      newUser.isConfirmed = true;
      await this.userRepository.save(newUser);

      return this.generateTokens(newUser);
    } catch (error) {
      console.error('Error in registerUser:', error);
      throw new InternalServerErrorException(
        t('register_user_failed', {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  private generateTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email };

    const access_token = this.generateJwt(payload);
    const refresh_token = this.generateRefresh(payload);

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.refreshTokenService.verifyAsync(refreshToken, {
        secret: this.configService.get('config.refresh.secret'),
      });
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException(t('user_not_found_auth'));
      }
      await this.userRepository.update(user.id, { lastLogin: new Date() });
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException(t('refresh_token_invalid'));
    }
  }

  // jwt auth
  async getUserProfile(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['branch', 'role'],
    });
    return this.serializeUserProfile(user);
  }

  async getMyBranchContext(currentUser: CurrentUserType) {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id, tenantId },
      relations: ['branch'],
    });
    if (!user) {
      throw new NotFoundException(t('user_not_found_auth'));
    }
    this.assertUserTenantScope(user, tenantId);

    const activeBranch = user.branch
      ? { id: user.branch.id, name: user.branch.name }
      : null;

    let myListBranch: { id: string; name: string }[] = [];
    if (user.isOwner) {
      const branches = await this.branchRepository.find({
        where: { tenantId },
        order: { name: 'ASC' },
        select: ['id', 'name'],
      });
      myListBranch = branches.map((b) => ({ id: b.id, name: b.name }));
    } else {
      const delegations = await this.userBranchRepository.find({
        where: { userId: currentUser.id, tenantId, isActive: true },
        relations: ['branch'],
        order: { createdAt: 'DESC' },
      });
      const branchMap = new Map<string, string>();
      for (const delegation of delegations) {
        const branchId = delegation.branch?.id ?? delegation.branchId;
        const branchName = delegation.branch?.name;
        if (!branchId || !branchName || branchMap.has(branchId)) continue;
        branchMap.set(branchId, branchName);
      }
      myListBranch = [...branchMap.entries()].map(([id, name]) => ({
        id,
        name,
      }));
    }

    if (
      activeBranch &&
      !myListBranch.some((branch) => branch.id === activeBranch.id)
    ) {
      myListBranch.unshift(activeBranch);
    }

    return {
      my_active_branch: activeBranch,
      my_list_branch: myListBranch,
      can_switch: myListBranch.length > 1,
    };
  }

  async listMyDelegations(currentUser: CurrentUserType) {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id, tenantId },
      relations: ['branch'],
    });
    if (!user) {
      throw new NotFoundException(t('user_not_found_auth'));
    }
    this.assertUserTenantScope(user, tenantId);

    const delegations = await this.userBranchRepository.find({
      where: { userId: currentUser.id, tenantId, isActive: true },
      relations: ['branch'],
      order: { createdAt: 'DESC' },
    });

    let owner_branch_choices: { id: string; name: string }[] | null = null;
    if (user.isOwner) {
      const branches = await this.branchRepository.find({
        where: { tenantId },
        order: { name: 'ASC' },
        select: ['id', 'name'],
      });
      owner_branch_choices = branches.map((b) => ({ id: b.id, name: b.name }));
    }

    return {
      delegations: delegations.map((d) => this.delegationToPlain(d)),
      active_branch_id:
        user.branch?.id ?? (user as { branchId?: string }).branchId,
      active_branch_name: user.branch?.name ?? null,
      owner_branch_choices,
    };
  }

  async switchActiveBranch(currentUser: CurrentUserType, branchId: string) {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }
    if (typeof branchId !== 'string' || branchId.length > 36) {
      throw new BadRequestException(t('branch_id_invalid'));
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id, tenantId },
      relations: ['branch', 'role'],
    });
    if (!user) {
      throw new NotFoundException(t('user_not_found_auth'));
    }
    this.assertUserTenantScope(user, tenantId);

    const currentBranchId =
      user.branch?.id ?? (user as { branchId?: string }).branchId;
    if (branchId === currentBranchId) {
      return this.getUserProfile(user.id);
    }

    const branchOk = await this.branchRepository.findOne({
      where: { id: branchId, tenantId },
    });
    if (!branchOk) {
      throw new ForbiddenException(t('branch_not_found_or_outside_tenant'));
    }
    this.assertBranchTenantScope(branchOk, tenantId);

    if (user.isOwner) {
      await this.userRepository.update(
        { id: user.id },
        { branch: { id: branchId } as BranchEntity },
      );
      return this.getUserProfile(user.id);
    }

    const assignment = await this.userBranchRepository.findOne({
      where: {
        userId: user.id,
        branchId,
        tenantId,
        isActive: true,
      },
    });
    if (!assignment) {
      throw new ForbiddenException(t('branch_not_in_delegation'));
    }

    await this.userRepository.update(
      { id: user.id },
      { branch: { id: branchId } as BranchEntity },
    );

    return this.getUserProfile(user.id);
  }

  private assertUserTenantScope(user: UserEntity, tenantId: string) {
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException(t('user_outside_tenant_scope'));
    }
  }

  private assertBranchTenantScope(branch: BranchEntity, tenantId: string) {
    if (branch.tenantId !== tenantId) {
      throw new ForbiddenException(t('branch_outside_tenant_scope'));
    }
  }

  private serializeUserProfile(user: UserEntity | null) {
    if (!user) {
      return null;
    }
    const userSerialized = plainToInstance(UserEntity, user);
    const plain = instanceToPlain(userSerialized) as Record<string, unknown>;
    if (user.branch) {
      plain['branch'] = { id: user.branch.id, name: user.branch.name };
    }
    return plain;
  }

  private delegationToPlain(entity: UserBranchEntity) {
    const instance = plainToInstance(UserBranchResponseDto, entity, {
      excludeExtraneousValues: true,
    });
    return instanceToPlain(instance, { exposeDefaultValues: true }) as Record<
      string,
      unknown
    >;
  }

  async checkIdentifierExists(
    identifier: string,
  ): Promise<{ exists: boolean; isConfirmed: boolean }> {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    let normalizedIdentifier = identifier;
    if (!isEmail) {
      const digits = identifier.replace(/\D/g, '');
      normalizedIdentifier = digits.startsWith('0')
        ? '62' + digits.slice(1)
        : digits;
    }
    const user = await this.userRepository.findOne({
      where: isEmail ? { email: identifier } : { phone: normalizedIdentifier },
    });
    return {
      exists: !!user,
      isConfirmed: user?.isConfirmed ?? false,
    };
  }
}
