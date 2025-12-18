import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '@app/core/validators';

export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID', { infer: true }),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET', {
        infer: true,
      }),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL', { infer: true }),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos } = profile;

    const user: GoogleUser = {
      email: emails[0].value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
