import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { I18nContext } from 'nestjs-i18n';

@ValidatorConstraint({ name: 'isAllowedEmail', async: false })
export class IsAllowedEmailConstraint implements ValidatorConstraintInterface {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  validate(value: string): boolean {
    if (!value) return true;
    const domain = value.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    if (this.isProduction) {
      const tld = domain.split('.').pop();
      return tld === 'com';
    }

    const allowedDomains = [
      'gmail.com',
      'yahoo.com',
      'yahoo.co.id',
      'hotmail.com',
      'outlook.com',
      'live.com',
      'icloud.com',
      'me.com',
      'mac.com',
    ];

    return allowedDomains.some((d) => d.toLowerCase() === domain);
  }

  defaultMessage(): string {
    const i18n = I18nContext.current();
    if (i18n) {
      return i18n.t('errors.email_domain_not_allowed');
    }
    if (this.isProduction) {
      return 'Email must have .com domain';
    }
    return 'Hanya email dari domain besar yang diizinkan (gmail, yahoo, outlook, icloud)';
  }
}

export function IsAllowedEmail(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAllowedEmailConstraint,
    });
  };
}
