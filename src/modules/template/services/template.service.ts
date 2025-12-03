/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, writeFile, readFile, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import * as https from 'https';
import * as http from 'http';
import { TenantService } from '@app/modules/tenant';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { AuthenticatedUser } from '@app/modules/auth/decorators';
import { StorageService } from '@app/modules/storage/services/storage.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { FilterTemplateDto } from '../dto/filter-template.dto';
import { ImageType } from '../dto/upload-image.dto';
import { Template } from '../entities/template.entity';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';

export type UploadImageErrorKeys =
  | 'admin_cannot_upload'
  | 'invalid_file'
  | 'upload_failed';

interface GenerateTemplateParams {
  videoPath?: string;
  orientation?: 'vertical' | 'horizontal';
  theme?: string;
  videoPosition?: 'left' | 'right';
  brandName?: string;
  price?: string;
  productName?: string;
  features?: string[];
  showQRCode?: boolean;
  qrCodeText?: string;
  logoPath?: string;
  productImagePath?: string;
}

@Injectable()
export class TemplateService {
  private readonly STORAGE_PATH = process.env.STORAGE_PATH || '/data/templates';
  private readonly IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly storageService: StorageService,
  ) {}

  async uploadImage(
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    imageType: ImageType,
    user?: AuthenticatedUser,
  ): Promise<
    { imagePath: string; filename: string } | { errorKey: UploadImageErrorKeys }
  > {
    try {
      const tenantSlug = user?.slug || this.tenantService.getSlug();
      if (!tenantSlug) {
        return { errorKey: 'invalid_file' };
      }

      if (!file || !file.mimetype.startsWith('image/')) {
        return { errorKey: 'invalid_file' };
      }

      // Validate file size
      if (file.size > this.IMAGE_MAX_SIZE) {
        return { errorKey: 'invalid_file' };
      }

      const imageId = randomUUID();
      const extension = file.originalname.split('.').pop() || 'jpg';
      const filename = `${imageId}.${extension}`;

      const storageDir = join(this.STORAGE_PATH, tenantSlug, 'images');
      await mkdir(storageDir, { recursive: true });
      const filePath = join(storageDir, filename);

      await writeFile(filePath, file.buffer);

      const relativePath = `templates/${tenantSlug}/images/${filename}`;

      return {
        imagePath: relativePath,
        filename,
      };
    } catch (error) {
      console.error('[Template] Error uploading image:', error);
      return { errorKey: 'upload_failed' };
    }
  }

  async createTemplate(
    createTemplateDto: CreateTemplateDto,
    user: AuthenticatedUser,
  ): Promise<Template> {
    const tenantSlug = user.slug || this.tenantService.getSlug();
    if (!tenantSlug) {
      throw new BadRequestException('Tenant context not found');
    }

    const templateRepository =
      await this.tenantConnection.getRepository(Template);

    // Generate template image only if we have the minimum required fields
    let templateImagePath: string | null = null;
    const hasRequiredFieldsForImage =
      createTemplateDto.orientation &&
      createTemplateDto.theme &&
      createTemplateDto.videoPosition &&
      createTemplateDto.brandName &&
      createTemplateDto.price &&
      createTemplateDto.productName;

    if (hasRequiredFieldsForImage) {
      try {
        templateImagePath = await this.generateTemplateImage(
          {
            videoPath: createTemplateDto.videoPath,
            orientation: createTemplateDto.orientation,
            theme: createTemplateDto.theme,
            videoPosition: createTemplateDto.videoPosition,
            brandName: createTemplateDto.brandName,
            price: createTemplateDto.price,
            productName: createTemplateDto.productName,
            features: createTemplateDto.features,
            showQRCode: createTemplateDto.showQRCode,
            qrCodeText: createTemplateDto.qrCodeText,
            logoPath: createTemplateDto.logoPath,
            productImagePath: createTemplateDto.productImagePath,
          },
          tenantSlug,
        );
      } catch (error) {
        console.error('[Template] Error generating template image:', error);
        // Continue without template image if generation fails
      }
    }

    const template = templateRepository.create({
      ...createTemplateDto,
      organization_id: user.tenantId,
      owner_id: user.id,
      orientation: createTemplateDto.orientation || 'vertical',
      video_position: createTemplateDto.videoPosition || 'left',
      brand_name: createTemplateDto.brandName || '',
      product_name: createTemplateDto.productName || '',
      show_qr_code: createTemplateDto.showQRCode || false,
      qr_code_text: createTemplateDto.qrCodeText,
      logo_path: createTemplateDto.logoPath,
      product_image_path: createTemplateDto.productImagePath,
      video_path: createTemplateDto.videoPath,
      template_image_path: templateImagePath,
      name: createTemplateDto.name || 'Untitled Template',
      description: createTemplateDto.description,
      theme: createTemplateDto.theme || 'light',
      features: createTemplateDto.features || [],
    });

    return await templateRepository.save(template);
  }

  async findAll(filterDto: FilterTemplateDto): Promise<Pagination<Template>> {
    const templateRepository =
      await this.tenantConnection.getRepository(Template);

    const where: FindOptionsWhere<Template> = {};

    if (filterDto?.name) {
      where.name = Like(`%${filterDto.name}%`);
    }

    const queryBuilder = templateRepository
      .createQueryBuilder('template')
      .orderBy('template.created_at', 'DESC');

    if (Object.keys(where).length > 0) {
      queryBuilder.where(where);
    }

    return paginate<Template>(queryBuilder, {
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
    });
  }

  async findOne(id: string): Promise<Template> {
    const templateRepository =
      await this.tenantConnection.getRepository(Template);
    const template = await templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async getTemplateFile(
    filePath: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // Resolve the file path
    let fullPath: string;
    if (filePath.startsWith('templates/')) {
      // Remove 'templates/' prefix and resolve from STORAGE_PATH
      const relativePath = filePath.replace('templates/', '');
      fullPath = join(this.STORAGE_PATH, relativePath);
    } else {
      fullPath = filePath;
    }

    // Try multiple possible paths
    const pathsToTry: string[] = [fullPath];

    // If path contains /images/, also try /templates/ version
    if (filePath.includes('/images/')) {
      const alternativePath = filePath.replace('/images/', '/templates/');
      const altRelativePath = alternativePath.replace('templates/', '');
      const altFullPath = join(this.STORAGE_PATH, altRelativePath);
      pathsToTry.push(altFullPath);
    }

    // Also try if path contains /templates/, try /images/ version (reverse)
    if (filePath.includes('/templates/')) {
      const alternativePath = filePath.replace('/templates/', '/images/');
      const altRelativePath = alternativePath.replace('templates/', '');
      const altFullPath = join(this.STORAGE_PATH, altRelativePath);
      pathsToTry.push(altFullPath);
    }

    let buffer: Buffer | null = null;

    for (const pathToTry of pathsToTry) {
      try {
        buffer = await readFile(pathToTry);
        console.log(`[Template] File found at: ${pathToTry}`);
        break; // Success, exit loop
      } catch {
        console.log(`[Template] File not found at: ${pathToTry}`);
        continue; // Try next path
      }
    }

    if (!buffer) {
      console.error(
        `[Template] File not found in any of these locations: ${pathsToTry.join(', ')}`,
      );
      throw new NotFoundException(
        `File not found at ${filePath}. Tried: ${pathsToTry.join(', ')}`,
      );
    }

    // Determine MIME type based on file extension
    const ext = fullPath.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'mp4') mimeType = 'video/mp4';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'webp') mimeType = 'image/webp';

    return { buffer, mimeType };
  }

  private async loadImageBuffer(imagePath: string): Promise<Buffer> {
    // If it's a relative path, resolve it from storage
    if (imagePath.startsWith('templates/')) {
      const fullPath = join(
        this.STORAGE_PATH,
        imagePath.replace('templates/', ''),
      );
      return await readFile(fullPath);
    }
    // If it's an absolute path, use it directly
    return await readFile(imagePath);
  }

  private async generateTemplateImage(
    params: GenerateTemplateParams,
    tenantSlug: string,
  ): Promise<string> {
    try {
      // Try to use canvas library if available
      let createCanvas: any;
      let loadImage: any;
      let QRCode: any;

      try {
        // Dynamic import with type assertion to avoid compile-time errors
        const canvasModule = await import('@napi-rs/canvas' as any);
        createCanvas = canvasModule.createCanvas;
        loadImage = canvasModule.loadImage;
        const qrcodeModule = await import('qrcode' as any);
        QRCode = qrcodeModule.default || qrcodeModule;
      } catch (error) {
        console.error('[Template] Canvas library not available:', error);
        throw new BadRequestException(
          'Canvas library not available. Template image generation failed.',
        );
      }

      // Provide defaults for optional fields
      const theme = this.getTheme(params.theme || 'light');
      const outputFilename = `${randomUUID()}.png`;
      const outputPath = join(
        this.STORAGE_PATH,
        tenantSlug,
        'templates',
        outputFilename,
      );
      await mkdir(join(this.STORAGE_PATH, tenantSlug, 'templates'), {
        recursive: true,
      });

      const templateParams: GenerateTemplateParams = {
        videoPath: params.videoPath || '',
        orientation: params.orientation || 'vertical',
        theme: params.theme || 'light',
        videoPosition: params.videoPosition || 'left',
        brandName: params.brandName || '',
        price: params.price || '',
        productName: params.productName || '',
        features: params.features || [],
        showQRCode: params.showQRCode || false,
        qrCodeText: params.qrCodeText,
        logoPath: params.logoPath,
        productImagePath: params.productImagePath,
      };

      if (templateParams.orientation === 'vertical') {
        await this.generateVerticalTemplate(
          templateParams,
          outputPath,
          theme,
          createCanvas,
          loadImage,
          QRCode,
        );
      } else {
        await this.generateHorizontalTemplate(
          templateParams,
          outputPath,
          theme,
          createCanvas,
          loadImage,
          QRCode,
        );
      }

      return `templates/${tenantSlug}/templates/${outputFilename}`;
    } catch (error) {
      console.error('[Template] Error generating template image:', error);
      throw new BadRequestException('Failed to generate template image');
    }
  }

  private async generateVerticalTemplate(
    params: GenerateTemplateParams,
    outputPath: string,
    theme: { bg: string; text: string; primary: string; secondary: string },
    createCanvas: any,
    loadImage: any,
    QRCode: any,
  ): Promise<void> {
    const width = 636;
    const height = 540;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fontFamily = 'Arial, sans-serif';

    // Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const padding = 24;
    let yOffset = padding;

    // Logo
    const logoSize = 48;
    const logoX = padding;

    if (params.logoPath) {
      try {
        const logoBuffer = await this.loadImageBuffer(params.logoPath);
        const logoImage = await loadImage(logoBuffer);
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          logoX + logoSize / 2,
          yOffset + logoSize / 2,
          logoSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImage, logoX, yOffset, logoSize, logoSize);
        ctx.restore();
      } catch (error) {
        console.error('[Template] Failed to load logo:', error);
        this.drawLogoFallback(
          ctx,
          logoX,
          yOffset,
          logoSize,
          params.brandName,
          fontFamily,
        );
      }
    } else {
      this.drawLogoFallback(
        ctx,
        logoX,
        yOffset,
        logoSize,
        params.brandName,
        fontFamily,
      );
    }

    // Brand name
    ctx.fillStyle = theme.text;
    ctx.font = `bold 18px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      params.brandName,
      logoX + logoSize + 12,
      yOffset + logoSize / 2,
    );

    yOffset += logoSize + 12;

    // Product image
    const productBoxWidth = 360;
    const productBoxHeight = Math.round(360 * (240 / 280));
    const productBoxX = (width - productBoxWidth) / 2;
    const topSpace = padding + logoSize + 12;
    const bottomSpace = 112 + padding;
    const availableHeight = height - topSpace - bottomSpace;
    const productBoxY =
      topSpace + Math.round((availableHeight - productBoxHeight) / 2);

    if (params.productImagePath) {
      try {
        const productBuffer = await this.loadImageBuffer(
          params.productImagePath,
        );
        const productImage = await loadImage(productBuffer);
        ctx.save();
        this.roundRect(
          ctx,
          productBoxX,
          productBoxY,
          productBoxWidth,
          productBoxHeight,
          8,
        );
        ctx.clip();
        const imgRatio = productImage.width / productImage.height;
        const boxRatio = productBoxWidth / productBoxHeight;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgRatio > boxRatio) {
          drawHeight = productBoxHeight;
          drawWidth =
            productImage.width * (productBoxHeight / productImage.height);
          drawX = productBoxX + (productBoxWidth - drawWidth) / 2;
          drawY = productBoxY;
        } else {
          drawWidth = productBoxWidth;
          drawHeight =
            productImage.height * (productBoxWidth / productImage.width);
          drawX = productBoxX;
          drawY = productBoxY + (productBoxHeight - drawHeight) / 2;
        }
        ctx.drawImage(productImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      } catch (error) {
        console.error('[Template] Failed to load product image:', error);
        this.drawProductPlaceholder(
          ctx,
          productBoxX,
          productBoxY,
          productBoxWidth,
          productBoxHeight,
          fontFamily,
        );
      }
    } else {
      this.drawProductPlaceholder(
        ctx,
        productBoxX,
        productBoxY,
        productBoxWidth,
        productBoxHeight,
        fontFamily,
      );
    }

    // Price
    const priceY = productBoxY + productBoxHeight + 8;
    ctx.fillStyle = theme.text;
    ctx.font = `bold 36px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${params.price}$`, width / 2, priceY);

    // Product name
    const productNameY = priceY + 36 + 8;
    ctx.fillStyle = theme.text;
    ctx.font = `bold 16px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(params.productName, width / 2, productNameY);

    // Features and QR Code
    const bottomY = height - padding - 112;
    const featuresX = padding;
    const qrX = width - padding - 112;

    if (params.features && params.features.length > 0) {
      const validFeatures = params.features
        .map((f) => (typeof f === 'string' ? f.trim() : String(f || '').trim()))
        .filter((f) => f.length > 0);
      if (validFeatures.length > 0) {
        const featureHeight = 28;
        const featureGap = 6;
        const totalFeaturesHeight =
          validFeatures.length * featureHeight +
          (validFeatures.length - 1) * featureGap;
        let featureY = bottomY - totalFeaturesHeight;
        validFeatures.forEach((feature) => {
          ctx.font = `bold 14px ${fontFamily}`;
          const featureWidth = ctx.measureText(feature).width + 24;
          ctx.fillStyle = '#fef3c7';
          this.roundRect(
            ctx,
            featuresX,
            featureY,
            featureWidth,
            featureHeight,
            4,
          );
          ctx.fill();
          ctx.fillStyle = '#92400e';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(feature, featuresX + 12, featureY + featureHeight / 2);
          featureY += featureHeight + featureGap;
        });
      }
    }

    // QR Code
    if (params.showQRCode && params.qrCodeText) {
      try {
        const qrSize = 112;
        const qrDataUrl = await QRCode.toDataURL(params.qrCodeText, {
          width: qrSize,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const qrImage = await loadImage(qrDataUrl);
        const borderWidth = 4;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = borderWidth;
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, qrX, bottomY, qrSize, qrSize, 12);
        ctx.fill();
        ctx.stroke();
        const qrInset = borderWidth;
        const qrInnerSize = qrSize - qrInset * 2;
        ctx.drawImage(
          qrImage,
          qrX + qrInset,
          bottomY + qrInset,
          qrInnerSize,
          qrInnerSize,
        );
      } catch (error) {
        console.warn('[Template] Failed to generate QR code:', error);
      }
    }

    const buffer = canvas.toBuffer('image/png');
    await writeFile(outputPath, buffer);
  }

  private async generateHorizontalTemplate(
    params: GenerateTemplateParams,
    outputPath: string,
    theme: { bg: string; text: string; primary: string; secondary: string },
    createCanvas: any,
    loadImage: any,
    QRCode: any,
  ): Promise<void> {
    const width = 960;
    const height = 108;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fontFamily = 'Arial, sans-serif';

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const logoSize = 68;
    const logoX = padding;
    const logoY = height / 2;

    if (params.logoPath) {
      try {
        const logoBuffer = await this.loadImageBuffer(params.logoPath);
        const logoImage = await loadImage(logoBuffer);
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY, logoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          logoImage,
          logoX,
          logoY - logoSize / 2,
          logoSize,
          logoSize,
        );
        ctx.restore();
      } catch (error) {
        console.error('[Template] Failed to load logo:', error);
        this.drawLogoFallback(
          ctx,
          logoX,
          logoY - logoSize / 2,
          logoSize,
          params.brandName,
          fontFamily,
        );
      }
    } else {
      this.drawLogoFallback(
        ctx,
        logoX,
        logoY - logoSize / 2,
        logoSize,
        params.brandName,
        fontFamily,
      );
    }

    ctx.fillStyle = theme.text;
    ctx.font = `bold 24px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(params.brandName, logoX + logoSize + 20, logoY);

    const productX =
      logoX + logoSize + 20 + ctx.measureText(params.brandName).width + 30;
    const productWidth = 90;
    const productHeight = 68;
    const productY = height / 2 - productHeight / 2;

    if (params.productImagePath) {
      try {
        const productBuffer = await this.loadImageBuffer(
          params.productImagePath,
        );
        const productImage = await loadImage(productBuffer);
        ctx.save();
        this.roundRect(ctx, productX, productY, productWidth, productHeight, 8);
        ctx.clip();
        const imgRatio = productImage.width / productImage.height;
        const boxRatio = productWidth / productHeight;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgRatio > boxRatio) {
          drawHeight = productHeight;
          drawWidth =
            productImage.width * (productHeight / productImage.height);
          drawX = productX + (productWidth - drawWidth) / 2;
          drawY = productY;
        } else {
          drawWidth = productWidth;
          drawHeight =
            productImage.height * (productWidth / productImage.width);
          drawX = productX;
          drawY = productY + (productHeight - drawHeight) / 2;
        }
        ctx.drawImage(productImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      } catch (error) {
        console.error('[Template] Failed to load product image:', error);
        ctx.fillStyle = '#f3f4f6';
        this.roundRect(ctx, productX, productY, productWidth, productHeight, 8);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#f3f4f6';
      this.roundRect(ctx, productX, productY, productWidth, productHeight, 8);
      ctx.fill();
    }

    const detailsX = productX + productWidth + 30;
    ctx.fillStyle = theme.text;
    ctx.font = `bold 32px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${params.price}$`, detailsX, 20);
    ctx.font = `bold 18px ${fontFamily}`;
    ctx.fillText(params.productName, detailsX, 60);

    if (params.showQRCode && params.qrCodeText) {
      try {
        const qrSize = 80;
        const qrX = width - padding - qrSize;
        const qrY = height / 2 - qrSize / 2;
        const qrDataUrl = await QRCode.toDataURL(params.qrCodeText, {
          width: qrSize,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const qrImage = await loadImage(qrDataUrl);
        const borderWidth = 3;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = borderWidth;
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, qrX, qrY, qrSize, qrSize, 6);
        ctx.fill();
        ctx.stroke();
        const qrInset = borderWidth;
        const qrInnerSize = qrSize - qrInset * 2;
        ctx.drawImage(
          qrImage,
          qrX + qrInset,
          qrY + qrInset,
          qrInnerSize,
          qrInnerSize,
        );
      } catch (error) {
        console.warn('[Template] Failed to generate QR code:', error);
      }
    }

    const buffer = canvas.toBuffer('image/png');
    await writeFile(outputPath, buffer);
  }

  private roundRect(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  private drawLogoFallback(
    ctx: any,
    x: number,
    y: number,
    size: number,
    brandName: string,
    fontFamily: string,
  ): void {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size / 2}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandName.charAt(0).toUpperCase(), x + size / 2, y + size / 2);
  }

  private drawProductPlaceholder(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    fontFamily: string,
  ): void {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, '#f9fafb');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.fillStyle = '#9ca3af';
    ctx.font = `16px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Product Image', x + width / 2, y + height / 2);
  }

  private getTheme(themeName: string): {
    bg: string;
    text: string;
    primary: string;
    secondary: string;
  } {
    const themes: Record<
      string,
      { bg: string; text: string; primary: string; secondary: string }
    > = {
      light: {
        bg: '#ffffff',
        text: '#000000',
        primary: '#3b82f6',
        secondary: '#e5e7eb',
      },
      dark: {
        bg: '#1f2937',
        text: '#ffffff',
        primary: '#60a5fa',
        secondary: '#374151',
      },
      blue: {
        bg: '#eff6ff',
        text: '#1e40af',
        primary: '#3b82f6',
        secondary: '#dbeafe',
      },
      green: {
        bg: '#f0fdf4',
        text: '#166534',
        primary: '#22c55e',
        secondary: '#dcfce7',
      },
    };
    return themes[themeName] || themes.light;
  }

  async generateTemplateVideo(
    templateId: string,
    user: AuthenticatedUser,
  ): Promise<{ videoPath: string; filename: string }> {
    try {
      console.log(
        '[Template Video] Starting video generation for template:',
        templateId,
      );
      const tenantSlug = user?.slug || this.tenantService.getSlug();
      if (!tenantSlug) {
        throw new BadRequestException('Tenant context not found');
      }

      // Get template from database
      console.log('[Template Video] Fetching template from database...');
      const template = await this.findOne(templateId);
      if (!template.video_path) {
        throw new BadRequestException(
          'Template video path is required for video generation',
        );
      }
      console.log(
        '[Template Video] Template found, video_path:',
        template.video_path,
      );

      // Resolve video path
      const videoStoragePath = process.env.STORAGE_PATH || '/data/videos';
      let inputVideoPath: string;

      if (template.video_path.startsWith('creatives/')) {
        // Video from video-download module
        const relativePath = template.video_path.replace('creatives/', '');
        inputVideoPath = join(videoStoragePath, relativePath);
      } else if (template.video_path.startsWith('templates/')) {
        // Video from templates module (shouldn't happen, but handle it)
        const relativePath = template.video_path.replace('templates/', '');
        inputVideoPath = join(this.STORAGE_PATH, relativePath);
      } else {
        inputVideoPath = template.video_path;
      }

      console.log(
        '[Template Video] Resolved input video path:',
        inputVideoPath,
      );

      // Check if input video exists
      try {
        const stats = await stat(inputVideoPath);
        console.log('[Template Video] Input video found, size:', stats.size);
      } catch (error) {
        console.error(
          '[Template Video] Input video not found:',
          inputVideoPath,
          error,
        );
        throw new NotFoundException(
          `Input video not found at: ${inputVideoPath}`,
        );
      }

      // Generate static template image (without video placeholder)
      console.log('[Template Video] Generating template image...');
      const templateImagePath = await this.generateTemplateImageForVideo(
        {
          orientation: template.orientation,
          theme: template.theme,
          videoPosition: template.video_position,
          brandName: template.brand_name,
          price: template.price,
          productName: template.product_name,
          features: template.features || [],
          showQRCode: template.show_qr_code,
          qrCodeText: template.qr_code_text || undefined,
          logoPath: template.logo_path || undefined,
          productImagePath: template.product_image_path || undefined,
        },
        tenantSlug,
      );
      console.log(
        '[Template Video] Template image generated:',
        templateImagePath,
      );

      // Get video info (duration, dimensions)
      console.log('[Template Video] Getting video info...');
      const videoInfo = await this.getVideoInfo(inputVideoPath);
      console.log('[Template Video] Video info:', videoInfo);

      // Create video from static template image (loop for video duration)
      console.log('[Template Video] Creating video from template image...');
      const templateVideoPath = await this.createVideoFromImage(
        templateImagePath,
        videoInfo.duration,
        tenantSlug,
      );
      console.log(
        '[Template Video] Template video created:',
        templateVideoPath,
      );

      // Combine videos based on orientation and video position
      const STORAGE_PATH = process.env.STORAGE_PATH || '/data/videos';
      const storageDir = join(STORAGE_PATH, tenantSlug);
      await mkdir(storageDir, { recursive: true });
      const videoId = randomUUID();
      const outputFilename = `${videoId}.mp4`;
      const outputPath = join(storageDir, outputFilename);
      console.log(
        '[Template Video] Combining videos, output path:',
        outputPath,
      );

      await this.combineVideos(
        inputVideoPath,
        templateVideoPath,
        outputPath,
        template.orientation,
        template.video_position,
        videoInfo,
      );
      console.log('[Template Video] Videos combined successfully');

      // Clean up temporary template video
      await unlink(templateVideoPath).catch((err) => {
        console.warn(
          '[Template Video] Failed to clean up template video:',
          err,
        );
      });

      const relativePath = `creatives/${tenantSlug}/${outputFilename}`;
      console.log('[Template Video] Video generation complete:', outputPath);
      return { videoPath: relativePath, filename: outputFilename };
    } catch (error) {
      console.error('[Template Video] Error generating video:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate template video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async generateTemplateImageForVideo(
    params: Omit<GenerateTemplateParams, 'videoPath'>,
    tenantSlug: string,
  ): Promise<string> {
    // Similar to generateTemplateImage but without video placeholder
    try {
      let createCanvas: any;
      let loadImage: any;
      let QRCode: any;

      try {
        const canvasModule = await import('@napi-rs/canvas' as any);
        createCanvas = canvasModule.createCanvas;
        loadImage = canvasModule.loadImage;
        const qrcodeModule = await import('qrcode' as any);
        QRCode = qrcodeModule.default || qrcodeModule;
      } catch {
        throw new BadRequestException('Canvas library not available');
      }

      const theme = this.getTheme(params.theme);
      const outputFilename = `${randomUUID()}.png`;
      const outputPath = join(
        this.STORAGE_PATH,
        tenantSlug,
        'templates',
        outputFilename,
      );
      await mkdir(join(this.STORAGE_PATH, tenantSlug, 'templates'), {
        recursive: true,
      });

      if (params.orientation === 'vertical') {
        await this.generateVerticalTemplateForVideo(
          params,
          outputPath,
          theme,
          createCanvas,
          loadImage,
          QRCode,
        );
      } else {
        await this.generateHorizontalTemplateForVideo(
          params,
          outputPath,
          theme,
          createCanvas,
          loadImage,
          QRCode,
        );
      }

      return outputPath;
    } catch (error) {
      console.error(
        '[Template] Error generating template image for video:',
        error,
      );
      throw new BadRequestException(
        'Failed to generate template image for video',
      );
    }
  }

  private async generateVerticalTemplateForVideo(
    params: Omit<GenerateTemplateParams, 'videoPath'>,
    outputPath: string,
    theme: { bg: string; text: string; primary: string; secondary: string },
    createCanvas: any,
    loadImage: any,
    QRCode: any,
  ): Promise<void> {
    // Same as generateVerticalTemplate but without video placeholder
    // The template will take the full width/height since video is on the other side
    const width = 636;
    const height = 540;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fontFamily = 'Arial, sans-serif';

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const padding = 24;
    let yOffset = padding;

    // Logo
    const logoSize = 48;
    const logoX = padding;

    if (params.logoPath) {
      try {
        const logoBuffer = await this.loadImageBuffer(params.logoPath);
        const logoImage = await loadImage(logoBuffer);
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          logoX + logoSize / 2,
          yOffset + logoSize / 2,
          logoSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImage, logoX, yOffset, logoSize, logoSize);
        ctx.restore();
      } catch {
        this.drawLogoFallback(
          ctx,
          logoX,
          yOffset,
          logoSize,
          params.brandName,
          fontFamily,
        );
      }
    } else {
      this.drawLogoFallback(
        ctx,
        logoX,
        yOffset,
        logoSize,
        params.brandName,
        fontFamily,
      );
    }

    // Brand name
    ctx.fillStyle = theme.text;
    ctx.font = `bold 18px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      params.brandName,
      logoX + logoSize + 12,
      yOffset + logoSize / 2,
    );

    yOffset += logoSize + 12;

    // Product image
    const productBoxWidth = 360;
    const productBoxHeight = Math.round(360 * (240 / 280));
    const productBoxX = (width - productBoxWidth) / 2;
    const topSpace = padding + logoSize + 12;
    const bottomSpace = 112 + padding;
    const availableHeight = height - topSpace - bottomSpace;
    const productBoxY =
      topSpace + Math.round((availableHeight - productBoxHeight) / 2);

    if (params.productImagePath) {
      try {
        const productBuffer = await this.loadImageBuffer(
          params.productImagePath,
        );
        const productImage = await loadImage(productBuffer);
        ctx.save();
        this.roundRect(
          ctx,
          productBoxX,
          productBoxY,
          productBoxWidth,
          productBoxHeight,
          8,
        );
        ctx.clip();
        const imgRatio = productImage.width / productImage.height;
        const boxRatio = productBoxWidth / productBoxHeight;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgRatio > boxRatio) {
          drawHeight = productBoxHeight;
          drawWidth =
            productImage.width * (productBoxHeight / productImage.height);
          drawX = productBoxX + (productBoxWidth - drawWidth) / 2;
          drawY = productBoxY;
        } else {
          drawWidth = productBoxWidth;
          drawHeight =
            productImage.height * (productBoxWidth / productImage.width);
          drawX = productBoxX;
          drawY = productBoxY + (productBoxHeight - drawHeight) / 2;
        }
        ctx.drawImage(productImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      } catch {
        this.drawProductPlaceholder(
          ctx,
          productBoxX,
          productBoxY,
          productBoxWidth,
          productBoxHeight,
          fontFamily,
        );
      }
    } else {
      this.drawProductPlaceholder(
        ctx,
        productBoxX,
        productBoxY,
        productBoxWidth,
        productBoxHeight,
        fontFamily,
      );
    }

    // Price
    const priceY = productBoxY + productBoxHeight + 8;
    ctx.fillStyle = theme.text;
    ctx.font = `bold 36px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${params.price}$`, width / 2, priceY);

    // Product name
    const productNameY = priceY + 36 + 8;
    ctx.font = `bold 16px ${fontFamily}`;
    ctx.fillText(params.productName, width / 2, productNameY);

    // Features and QR Code
    const bottomY = height - padding - 112;
    const featuresX = padding;
    const qrX = width - padding - 112;

    if (params.features && params.features.length > 0) {
      const validFeatures = params.features
        .map((f) => (typeof f === 'string' ? f.trim() : String(f || '').trim()))
        .filter((f) => f.length > 0);

      if (validFeatures.length > 0) {
        const featureHeight = 28;
        const featureGap = 6;
        const totalFeaturesHeight =
          validFeatures.length * featureHeight +
          (validFeatures.length - 1) * featureGap;
        let featureY = bottomY - totalFeaturesHeight;

        validFeatures.forEach((feature) => {
          ctx.font = `bold 14px ${fontFamily}`;
          const featureWidth = ctx.measureText(feature).width + 24;
          ctx.fillStyle = '#fef3c7';
          this.roundRect(
            ctx,
            featuresX,
            featureY,
            featureWidth,
            featureHeight,
            4,
          );
          ctx.fill();
          ctx.fillStyle = '#92400e';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(feature, featuresX + 12, featureY + featureHeight / 2);
          featureY += featureHeight + featureGap;
        });
      }
    }

    // QR Code
    if (params.showQRCode && params.qrCodeText) {
      try {
        const qrSize = 112;
        const qrDataUrl = await QRCode.toDataURL(params.qrCodeText, {
          width: qrSize,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const qrImage = await loadImage(qrDataUrl);
        const borderWidth = 4;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = borderWidth;
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, qrX, bottomY, qrSize, qrSize, 12);
        ctx.fill();
        ctx.stroke();
        const qrInset = borderWidth;
        const qrInnerSize = qrSize - qrInset * 2;
        ctx.drawImage(
          qrImage,
          qrX + qrInset,
          bottomY + qrInset,
          qrInnerSize,
          qrInnerSize,
        );
      } catch (error) {
        console.warn('Failed to generate QR code:', error);
      }
    }

    const buffer = canvas.toBuffer('image/png');
    await writeFile(outputPath, buffer);
  }

  private async generateHorizontalTemplateForVideo(
    params: Omit<GenerateTemplateParams, 'videoPath'>,
    outputPath: string,
    theme: { bg: string; text: string; primary: string; secondary: string },
    createCanvas: any,
    loadImage: any,
    QRCode: any,
  ): Promise<void> {
    // Same as generateHorizontalTemplate but without video placeholder
    const width = 960;
    const height = 108;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fontFamily = 'Arial, sans-serif';

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const logoSize = 68;
    const logoX = padding;
    const logoY = height / 2;

    if (params.logoPath) {
      try {
        const logoBuffer = await this.loadImageBuffer(params.logoPath);
        const logoImage = await loadImage(logoBuffer);
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY, logoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          logoImage,
          logoX,
          logoY - logoSize / 2,
          logoSize,
          logoSize,
        );
        ctx.restore();
      } catch {
        this.drawLogoFallback(
          ctx,
          logoX,
          logoY - logoSize / 2,
          logoSize,
          params.brandName,
          fontFamily,
        );
      }
    } else {
      this.drawLogoFallback(
        ctx,
        logoX,
        logoY - logoSize / 2,
        logoSize,
        params.brandName,
        fontFamily,
      );
    }

    ctx.fillStyle = theme.text;
    ctx.font = `bold 24px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(params.brandName, logoX + logoSize + 20, logoY);

    const productX =
      logoX + logoSize + 20 + ctx.measureText(params.brandName).width + 30;
    const productWidth = 90;
    const productHeight = 68;
    const productY = height / 2 - productHeight / 2;

    if (params.productImagePath) {
      try {
        const productBuffer = await this.loadImageBuffer(
          params.productImagePath,
        );
        const productImage = await loadImage(productBuffer);
        ctx.save();
        this.roundRect(ctx, productX, productY, productWidth, productHeight, 8);
        ctx.clip();
        const imgRatio = productImage.width / productImage.height;
        const boxRatio = productWidth / productHeight;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgRatio > boxRatio) {
          drawHeight = productHeight;
          drawWidth =
            productImage.width * (productHeight / productImage.height);
          drawX = productX + (productWidth - drawWidth) / 2;
          drawY = productY;
        } else {
          drawWidth = productWidth;
          drawHeight =
            productImage.height * (productWidth / productImage.width);
          drawX = productX;
          drawY = productY + (productHeight - drawHeight) / 2;
        }
        ctx.drawImage(productImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#f3f4f6';
        this.roundRect(ctx, productX, productY, productWidth, productHeight, 8);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#f3f4f6';
      this.roundRect(ctx, productX, productY, productWidth, productHeight, 8);
      ctx.fill();
    }

    const detailsX = productX + productWidth + 30;
    ctx.fillStyle = theme.text;
    ctx.font = `bold 32px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${params.price}$`, detailsX, 20);

    ctx.font = `bold 18px ${fontFamily}`;
    ctx.fillText(params.productName, detailsX, 60);

    if (params.showQRCode && params.qrCodeText) {
      try {
        const qrSize = 80;
        const qrX = width - padding - qrSize;
        const qrY = height / 2 - qrSize / 2;
        const qrDataUrl = await QRCode.toDataURL(params.qrCodeText, {
          width: qrSize,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const qrImage = await loadImage(qrDataUrl);
        const borderWidth = 3;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = borderWidth;
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, qrX, qrY, qrSize, qrSize, 6);
        ctx.fill();
        ctx.stroke();
        const qrInset = borderWidth;
        const qrInnerSize = qrSize - qrInset * 2;
        ctx.drawImage(
          qrImage,
          qrX + qrInset,
          qrY + qrInset,
          qrInnerSize,
          qrInnerSize,
        );
      } catch (error) {
        console.warn('Failed to generate QR code:', error);
      }
    }

    const buffer = canvas.toBuffer('image/png');
    await writeFile(outputPath, buffer);
  }

  private async getVideoInfo(
    videoPath: string,
  ): Promise<{ duration: number; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=width,height',
        '-of',
        'json',
        videoPath,
      ]);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed: ${stderr}`));
          return;
        }

        try {
          const info = JSON.parse(stdout);
          const duration = parseFloat(info.format?.duration || '0');
          const videoStream = info.streams?.find(
            (s: any) => s.width && s.height,
          );
          const width = videoStream?.width || 0;
          const height = videoStream?.height || 0;

          if (!duration || !width || !height) {
            reject(new Error('Could not extract video information'));
            return;
          }

          resolve({ duration, width, height });
        } catch (error) {
          reject(new Error(`Failed to parse ffprobe output: ${error}`));
        }
      });

      ffprobe.on('error', (error) => {
        reject(new Error(`ffprobe not found: ${error.message}`));
      });
    });
  }

  private async createVideoFromImage(
    imagePath: string,
    duration: number,
    tenantSlug: string,
  ): Promise<string> {
    const outputFilename = `${randomUUID()}.mp4`;
    const outputPath = join(
      this.STORAGE_PATH,
      tenantSlug,
      'templates',
      outputFilename,
    );
    await mkdir(join(this.STORAGE_PATH, tenantSlug, 'templates'), {
      recursive: true,
    });

    console.log(
      `[Template Video] Creating video from image: ${imagePath}, duration: ${duration}s, output: ${outputPath}`,
    );

    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-loop',
        '1',
        '-i',
        imagePath,
        '-t',
        duration.toString(),
        '-pix_fmt',
        'yuv420p',
        '-vf',
        'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast', // Faster encoding, less memory
        '-crf',
        '28', // Slightly lower quality for smaller file size
        '-threads',
        '1', // Single thread to reduce memory usage
        '-y', // Overwrite output file
        outputPath,
      ];

      console.log(
        `[Template Video] Spawning ffmpeg for image video: ${ffmpegArgs.join(' ')}`,
      );

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      let stderr = '';
      let lastProgressTime = Date.now();
      const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes timeout for image-to-video
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout
      timeoutId = setTimeout(() => {
        console.error(
          `[Template Video] FFmpeg timeout after ${TIMEOUT_MS}ms for image video, killing process`,
        );
        if (ffmpeg.pid) {
          try {
            process.kill(ffmpeg.pid, 'SIGTERM');
            setTimeout(() => {
              if (ffmpeg.pid) {
                process.kill(ffmpeg.pid, 'SIGKILL');
              }
            }, 5000);
          } catch (error) {
            console.error(
              '[Template Video] Error killing ffmpeg process:',
              error,
            );
          }
        }
        reject(
          new Error(
            `FFmpeg timeout after ${TIMEOUT_MS}ms. Last stderr: ${stderr.substring(stderr.length - 500)}`,
          ),
        );
      }, TIMEOUT_MS);

      ffmpeg.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;

        // Log progress every 5 seconds
        const now = Date.now();
        if (now - lastProgressTime > 5000) {
          const lines = chunk.split('\n').filter((l: string) => l.trim());
          for (const line of lines) {
            if (
              line.includes('frame=') ||
              line.includes('time=') ||
              line.includes('bitrate=')
            ) {
              console.log(
                `[Template Video] FFmpeg progress (image video): ${line.trim()}`,
              );
            }
          }
          lastProgressTime = now;
        }
      });

      ffmpeg.on('close', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (code === 0) {
          console.log(
            `[Template Video] FFmpeg completed successfully for image video. Output: ${outputPath}`,
          );
          resolve(outputPath);
        } else {
          const errorMsg = `FFmpeg exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
          const errorDetails = stderr.substring(stderr.length - 1000); // Last 1000 chars
          console.error(
            `[Template Video] ${errorMsg} for image video. Stderr: ${errorDetails}`,
          );
          reject(new Error(`${errorMsg}. Details: ${errorDetails}`));
        }
      });

      ffmpeg.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        console.error(
          `[Template Video] FFmpeg spawn error for image video: ${error.message}`,
        );
        reject(new Error(`FFmpeg not found: ${error.message}`));
      });
    });
  }

  private async combineVideos(
    video1Path: string,
    video2Path: string,
    outputPath: string,
    orientation: 'vertical' | 'horizontal',
    videoPosition: 'left' | 'right',
    videoInfo: { duration: number; width: number; height: number },
  ): Promise<void> {
    console.log(
      `[Template Video] Starting combineVideos: video1=${video1Path}, video2=${video2Path}, output=${outputPath}`,
    );

    return new Promise((resolve, reject) => {
      // Template image dimensions (from generateTemplateImage)
      const templateWidth = orientation === 'vertical' ? 636 : 960;
      const templateHeight = orientation === 'vertical' ? 540 : 108;

      // Input order: video1 is the user's video, video2 is the template video
      const input1 = video1Path; // User's video
      const input2 = video2Path; // Template video

      // Pre-scale user's video to reduce processing time
      // Calculate target width for user's video (maintain aspect ratio, match template height)
      const userVideoAspectRatio = videoInfo.width / videoInfo.height;
      const targetUserVideoWidth = Math.round(
        templateHeight * userVideoAspectRatio,
      );
      // Ensure even dimensions
      const finalUserVideoWidth = Math.floor(targetUserVideoWidth / 2) * 2;

      // Optimized filter: pre-scale inputs separately, then combine
      // This is faster than scaling during hstack
      // Output to [v] so we can map it separately from audio
      let optimizedFilterComplex: string;
      if (orientation === 'vertical') {
        if (videoPosition === 'left') {
          optimizedFilterComplex = `[0:v]scale=${finalUserVideoWidth}:${templateHeight}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:${templateHeight}:(ow-iw)/2:(oh-ih)/2,fps=30[v0];[1:v]scale=${templateWidth}:${templateHeight},fps=30[v1];[v0][v1]hstack=inputs=2[v]`;
        } else {
          optimizedFilterComplex = `[0:v]scale=${finalUserVideoWidth}:${templateHeight}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:${templateHeight}:(ow-iw)/2:(oh-ih)/2,fps=30[v0];[1:v]scale=${templateWidth}:${templateHeight},fps=30[v1];[v1][v0]hstack=inputs=2[v]`;
        }
      } else {
        const targetUserVideoWidthH = Math.round(
          templateHeight * userVideoAspectRatio,
        );
        const finalUserVideoWidthH = Math.floor(targetUserVideoWidthH / 2) * 2;
        if (videoPosition === 'left') {
          optimizedFilterComplex = `[0:v]scale=${finalUserVideoWidthH}:${templateHeight}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:${templateHeight}:(ow-iw)/2:(oh-ih)/2,fps=30[v0];[1:v]scale=${templateWidth}:${templateHeight},fps=30[v1];[v0][v1]hstack=inputs=2[v]`;
        } else {
          optimizedFilterComplex = `[0:v]scale=${finalUserVideoWidthH}:${templateHeight}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:${templateHeight}:(ow-iw)/2:(oh-ih)/2,fps=30[v0];[1:v]scale=${templateWidth}:${templateHeight},fps=30[v1];[v1][v0]hstack=inputs=2[v]`;
        }
      }

      const ffmpegArgs = [
        '-i',
        input1,
        '-i',
        input2,
        '-filter_complex',
        optimizedFilterComplex,
        '-map',
        '[v]', // Map the output video from filter_complex
        '-map',
        '0:a?', // Map audio from first input (user's video) if available
        '-t',
        videoInfo.duration.toString(),
        '-r',
        '30', // Fixed frame rate to avoid duplicates
        '-pix_fmt',
        'yuv420p',
        '-c:v',
        'libx264',
        '-c:a',
        'aac', // Audio codec
        '-b:a',
        '128k', // Audio bitrate
        '-preset',
        'ultrafast', // Faster encoding, less memory
        '-crf',
        '30', // Lower quality for faster encoding (was 28)
        '-tune',
        'fastdecode', // Optimize for fast decoding
        '-threads',
        '2', // Allow 2 threads for better performance
        '-movflags',
        '+faststart', // Optimize for streaming
        '-y',
        outputPath,
      ];

      console.log(
        `[Template Video] FFmpeg optimized filter_complex: ${optimizedFilterComplex}`,
      );
      console.log(
        `[Template Video] Spawning ffmpeg with args: ${ffmpegArgs.join(' ')}`,
      );

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      let stderr = '';
      let lastProgressTime = Date.now();
      const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes timeout
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout
      timeoutId = setTimeout(() => {
        console.error(
          `[Template Video] FFmpeg timeout after ${TIMEOUT_MS}ms, killing process`,
        );
        if (ffmpeg.pid) {
          try {
            process.kill(ffmpeg.pid, 'SIGTERM');
            setTimeout(() => {
              if (ffmpeg.pid) {
                process.kill(ffmpeg.pid, 'SIGKILL');
              }
            }, 5000);
          } catch (error) {
            console.error(
              '[Template Video] Error killing ffmpeg process:',
              error,
            );
          }
        }
        reject(
          new Error(
            `FFmpeg timeout after ${TIMEOUT_MS}ms. Last stderr: ${stderr.substring(stderr.length - 500)}`,
          ),
        );
      }, TIMEOUT_MS);

      ffmpeg.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;

        // Log progress every 5 seconds
        const now = Date.now();
        if (now - lastProgressTime > 5000) {
          const lines = chunk.split('\n').filter((l: string) => l.trim());
          for (const line of lines) {
            if (
              line.includes('frame=') ||
              line.includes('time=') ||
              line.includes('bitrate=')
            ) {
              console.log(`[Template Video] FFmpeg progress: ${line.trim()}`);
            }
          }
          lastProgressTime = now;
        }
      });

      ffmpeg.on('close', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (code === 0) {
          console.log(
            `[Template Video] FFmpeg completed successfully. Output: ${outputPath}`,
          );
          resolve();
        } else {
          const errorMsg = `FFmpeg exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
          const errorDetails = stderr.substring(stderr.length - 1000); // Last 1000 chars
          console.error(
            `[Template Video] ${errorMsg}. Stderr: ${errorDetails}`,
          );
          reject(new Error(`${errorMsg}. Details: ${errorDetails}`));
        }
      });

      ffmpeg.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        console.error(`[Template Video] FFmpeg spawn error: ${error.message}`);
        reject(new Error(`FFmpeg not found: ${error.message}`));
      });
    });
  }

  /**
   * Overlay a video on an image at specified coordinates and dimensions
   */
  async overlayVideoOnImage(
    imageUrl: string,
    videoUrl: string | null,
    position_x: number,
    position_y: number,
    widthVideo: number,
    heightVideo: number,
    user: AuthenticatedUser,
  ): Promise<{ videoPath: string | null; filename: string; minioUrl: string }> {
    console.log(
      `[Overlay Video] Starting overlay process: imageUrl=${imageUrl}, videoUrl=${videoUrl}`,
    );

    const tenantSlug = user.slug;
    const tempDir = join(this.STORAGE_PATH, tenantSlug, 'temp');
    const outputDir = join(this.STORAGE_PATH, tenantSlug, 'videos');

    // Create directories
    await mkdir(tempDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    // Download image and video
    const imageFilename = `${randomUUID()}.jpg`;
    const videoFilename = `${randomUUID()}.mp4`;
    const imagePath = join(tempDir, imageFilename);
    const videoPath = join(tempDir, videoFilename);

    try {
      console.log('[Overlay Video] Downloading image...');
      await this.downloadFile(imageUrl, imagePath);

      // Generate output filename
      const outputFilename = `${randomUUID()}.mp4`;
      // Use tempDir for output instead of persistent volume
      const outputPath = join(tempDir, outputFilename);

      // If videoUrl is null, create a 10-second video from the image only
      if (!videoUrl) {
        console.log(
          '[Overlay Video] No video provided, creating 10-second video from image...',
        );
        await this.createVideoFromImageOnly(imagePath, outputPath, 10);

        // Clean up temporary input file
        console.log('[Overlay Video] Cleaning up temporary input file...');
        await unlink(imagePath).catch(() => {});
      } else {
        // Download and overlay video
        console.log('[Overlay Video] Downloading video...');
        await this.downloadFile(videoUrl, videoPath);

        // Get video info to determine duration
        console.log('[Overlay Video] Getting video info...');
        const videoInfo = await this.getVideoInfo(videoPath);

        // Create the overlay using FFmpeg
        console.log('[Overlay Video] Creating overlay with FFmpeg...');
        await this.createOverlayVideo(
          imagePath,
          videoPath,
          outputPath,
          position_x,
          position_y,
          widthVideo,
          heightVideo,
          videoInfo.duration,
        );

        // Clean up temporary input files
        console.log('[Overlay Video] Cleaning up temporary input files...');
        await unlink(imagePath).catch(() => {});
        await unlink(videoPath).catch(() => {});
      }

      // Upload to MinIO
      console.log('[Overlay Video] Uploading to MinIO...');
      const fileBuffer = await readFile(outputPath);
      const fileStat = await stat(outputPath);
      const minioUrl = await this.storageService.uploadFile(
        `templates/${tenantSlug}/videos/${outputFilename}`,
        fileBuffer,
        fileStat.size,
        'video/mp4',
      );
      console.log(`[Overlay Video] Uploaded to MinIO: ${minioUrl}`);

      // Clean up output file from temp dir
      console.log('[Overlay Video] Cleaning up temporary output file...');
      await unlink(outputPath).catch(() => {});

      return {
        videoPath: null, // No local file
        filename: outputFilename,
        minioUrl,
      };
    } catch (error) {
      // Clean up on error
      await unlink(imagePath).catch(() => {});
      await unlink(videoPath).catch(() => {});

      console.error('[Overlay Video] Error creating overlay:', error);
      throw new BadRequestException(
        `Failed to create overlay video: ${error.message}`,
      );
    }
  }

  /**
   * Download a file from a URL
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol
        .get(url, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            // Handle redirects
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              this.downloadFile(redirectUrl, outputPath)
                .then(resolve)
                .catch(reject);
              return;
            }
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download file: HTTP ${response.statusCode}`),
            );
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            void (async () => {
              try {
                const buffer = Buffer.concat(chunks);
                await writeFile(outputPath, buffer);
                resolve();
              } catch (error) {
                const message =
                  error &&
                  typeof error === 'object' &&
                  'message' in error &&
                  typeof error.message === 'string'
                    ? error.message
                    : 'Unknown error';
                reject(error instanceof Error ? error : new Error(message));
              }
            })().catch((error: unknown) => {
              const message =
                error &&
                typeof error === 'object' &&
                'message' in error &&
                typeof error.message === 'string'
                  ? error.message
                  : 'Unknown error';
              reject(error instanceof Error ? error : new Error(message));
            });
          });
          response.on('error', (error: unknown) => {
            const message =
              error &&
              typeof error === 'object' &&
              'message' in error &&
              typeof error.message === 'string'
                ? error.message
                : 'Unknown error';
            reject(error instanceof Error ? error : new Error(message));
          });
        })
        .on('error', (error: unknown) => {
          const message =
            error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof error.message === 'string'
              ? error.message
              : 'Unknown error';
          reject(error instanceof Error ? error : new Error(message));
        });
    });
  }

  /**
   * Create overlay video using FFmpeg
   */
  private async createOverlayVideo(
    imagePath: string,
    videoPath: string,
    outputPath: string,
    x: number,
    y: number,
    width: number,
    height: number,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure dimensions are even (required by H.264 encoder)
      const evenWidth = Math.floor(width / 2) * 2;
      const evenHeight = Math.floor(height / 2) * 2;
      const evenX = Math.floor(x / 2) * 2;
      const evenY = Math.floor(y / 2) * 2;

      // FFmpeg filter to overlay video on image
      // 1. Scale background image to even dimensions first
      // 2. Create a looping video from the scaled image
      // 3. Scale the input video to exact requested dimensions (stretching if necessary)
      // 4. Overlay the scaled video on the background
      // 5. Ensure final output has even dimensions
      const filterComplex = `[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2[bg_scaled];[bg_scaled]loop=loop=-1:size=1:start=0,fps=30[bg];[1:v]scale=${evenWidth}:${evenHeight}[overlay];[bg][overlay]overlay=${evenX}:${evenY}:shortest=1,scale=trunc(iw/2)*2:trunc(ih/2)*2[out]`;

      const ffmpegArgs = [
        '-loop',
        '1',
        '-i',
        imagePath,
        '-i',
        videoPath,
        '-filter_complex',
        filterComplex,
        '-map',
        '[out]',
        '-map',
        '1:a?', // Map audio from video if available
        '-t',
        duration.toString(),
        '-r',
        '30',
        '-pix_fmt',
        'yuv420p',
        '-c:v',
        'libx264',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-preset',
        'ultrafast',
        '-crf',
        '28',
        '-threads',
        '2',
        '-movflags',
        '+faststart',
        '-y',
        outputPath,
      ];

      console.log(
        `[Overlay Video] FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`,
      );

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      let stderr = '';
      let lastProgressTime = Date.now();
      const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes timeout
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout
      timeoutId = setTimeout(() => {
        console.error(
          `[Overlay Video] FFmpeg timeout after ${TIMEOUT_MS}ms, killing process`,
        );
        if (ffmpeg.pid) {
          try {
            process.kill(ffmpeg.pid, 'SIGTERM');
            setTimeout(() => {
              if (ffmpeg.pid) {
                process.kill(ffmpeg.pid, 'SIGKILL');
              }
            }, 5000);
          } catch (error) {
            console.error(
              '[Overlay Video] Error killing ffmpeg process:',
              error,
            );
          }
        }
        reject(
          new Error(
            `FFmpeg timeout after ${TIMEOUT_MS}ms. Last stderr: ${stderr.substring(stderr.length - 500)}`,
          ),
        );
      }, TIMEOUT_MS);

      ffmpeg.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;

        // Log progress every 5 seconds
        const now = Date.now();
        if (now - lastProgressTime > 5000) {
          const lines = chunk.split('\n').filter((l: string) => l.trim());
          for (const line of lines) {
            if (
              line.includes('frame=') ||
              line.includes('time=') ||
              line.includes('bitrate=')
            ) {
              console.log(`[Overlay Video] FFmpeg progress: ${line.trim()}`);
            }
          }
          lastProgressTime = now;
        }
      });

      ffmpeg.on('close', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (code === 0) {
          console.log(
            `[Overlay Video] FFmpeg completed successfully. Output: ${outputPath}`,
          );
          resolve();
        } else {
          const errorMsg = `FFmpeg exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
          const errorDetails = stderr.substring(stderr.length - 1000);
          console.error(`[Overlay Video] ${errorMsg}. Stderr: ${errorDetails}`);
          reject(new Error(`${errorMsg}. Details: ${errorDetails}`));
        }
      });

      ffmpeg.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        console.error(`[Overlay Video] FFmpeg spawn error: ${error.message}`);
        reject(new Error(`FFmpeg not found: ${error.message}`));
      });
    });
  }

  /**
   * Create a video from a static image with a specified duration
   */
  private async createVideoFromImageOnly(
    imagePath: string,
    outputPath: string,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-loop',
        '1',
        '-i',
        imagePath,
        '-t',
        duration.toString(),
        '-vf',
        'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
        '-r',
        '30',
        '-pix_fmt',
        'yuv420p',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '28',
        '-movflags',
        '+faststart',
        '-y',
        outputPath,
      ];

      console.log(
        `[Create Video From Image] FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`,
      );

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      let stderr = '';

      const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes timeout
      const timeoutId = setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        reject(
          new Error(
            `FFmpeg timeout after ${TIMEOUT_MS}ms. Last stderr: ${stderr.substring(stderr.length - 500)}`,
          ),
        );
      }, TIMEOUT_MS);

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (code === 0) {
          console.log(
            `[Create Video From Image] FFmpeg completed successfully. Output: ${outputPath}`,
          );
          resolve();
        } else {
          const errorMsg = `FFmpeg exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
          const errorDetails = stderr.substring(stderr.length - 1000);
          console.error(
            `[Create Video From Image] ${errorMsg}. Stderr: ${errorDetails}`,
          );
          reject(new Error(`${errorMsg}. Details: ${errorDetails}`));
        }
      });

      ffmpeg.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        console.error(
          `[Create Video From Image] FFmpeg spawn error: ${error.message}`,
        );
        reject(new Error(`FFmpeg not found: ${error.message}`));
      });
    });
  }
}
