import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ExchangeTokenDto } from '../dto/exchange-token.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResponseMessage } from '@app/core/decorators/response-message.decorator';
import { AuthGuard } from '../guards';
import { CurrentUser, AuthenticatedUser, Public } from '../decorators';
import {
  ApiRegister,
  ApiLogin,
  ApiExchangeToken,
  ApiGetMe,
  ApiRefreshToken,
} from '../docs';

import { SendVerificationDto } from '../dto/send-verification.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-verification-code')
  @Public()
  @ResponseMessage({ message: 'Verification code sent successfully' })
  async sendVerificationCode(@Body() dto: SendVerificationDto) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('register')
  @ApiRegister()
  @ResponseMessage({
    message: 'Account created successfully',
    successCode: 201,
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiLogin()
  @ResponseMessage({ message: 'Login successful' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('exchange-token')
  @Public()
  @ApiExchangeToken()
  @ResponseMessage({ message: 'Token exchanged successfully' })
  async exchangeToken(@Body() dto: ExchangeTokenDto) {
    return this.authService.exchangeCustomToken(
      dto.custom_token,
      dto.tenant_slug,
    );
  }

  @Post('refresh-token')
  @Public()
  @ApiRefreshToken()
  @ResponseMessage({ message: 'Token refreshed successfully' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token, dto.tenant_slug);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiGetMe()
  @ResponseMessage({ message: 'User retrieved successfully' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.firebase_uid);
  }
}
