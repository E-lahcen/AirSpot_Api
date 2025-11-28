import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateVideoDownloadDto } from '../dto/update-video-download.dto';
import { spawn } from 'child_process';
import { mkdir, readdir, stat, unlink, writeFile, readFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { TenantService } from '@app/modules/tenant';
import { AuthenticatedUser } from '@app/modules/auth/decorators';

export type DownloadVideoErrorKeys =
  | 'admin_cannot_download'
  | 'invalid_url'
  | 'download_failed'
  | 'ytdlp_not_found'
  | 'invalid_tenant_slug'
  | 'invalid_file_type'
  | 'file_too_large';

@Injectable()
export class VideoDownloadService {
  constructor(private readonly tenantService: TenantService) {}

  async findAll(
    tenantSlug?: string,
    user?: AuthenticatedUser,
  ): Promise<
    Array<{
      filename: string;
      videoPath: string;
      size: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    const STORAGE_PATH = process.env.STORAGE_PATH || '/data/videos';
    let finalTenantSlug: string | undefined = tenantSlug;

    if (!finalTenantSlug && user) {
      finalTenantSlug = user.slug;
    }
    if (!finalTenantSlug) {
      finalTenantSlug = this.tenantService.getSlug() || undefined;
    }
    if (!finalTenantSlug) {
      return [];
    }

    const storageDir = join(STORAGE_PATH, finalTenantSlug);

    try {
      // Check if directory exists
      await stat(storageDir);
    } catch {
      // Directory doesn't exist, return empty array
      return [];
    }

    try {
      const files = await readdir(storageDir);
      const videoFiles = files.filter((file) => file.endsWith('.mp4'));

      const videos = await Promise.all(
        videoFiles.map(async (filename) => {
          const filePath = join(storageDir, filename);
          try {
            const stats = await stat(filePath);
            return {
              filename,
              videoPath: `creatives/${finalTenantSlug}/${filename}`,
              size: stats.size,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime,
            };
          } catch {
            // Skip files that can't be accessed
            return null;
          }
        }),
      );

      // Filter out null values and sort by creation date (newest first)
      return videos
        .filter((video): video is NonNullable<typeof video> => video !== null)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('[Video download] Error listing videos:', error);
      return [];
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} videoDownload`;
  }

  update(id: number, updateVideoDownloadDto: UpdateVideoDownloadDto) {
    console.log(updateVideoDownloadDto);
    return `This action updates a #${id} videoDownload`;
  }

  remove(id: number) {
    return `This action removes a #${id} videoDownload`;
  }

  async downloadVideo(
    videoUrl: string,
    tenantSlug?: string,
    user?: AuthenticatedUser,
  ): Promise<
    | { videoPath: string; filename: string }
    | { errorKey: DownloadVideoErrorKeys }
  > {
    const STORAGE_PATH = process.env.STORAGE_PATH || '/data/videos';
    let finalTenantSlug: string | undefined = tenantSlug;

    if (!finalTenantSlug && user) {
      finalTenantSlug = user.slug;
    }
    if (!finalTenantSlug) {
      finalTenantSlug = this.tenantService.getSlug() || undefined;
    }
    if (!finalTenantSlug) {
      return { errorKey: 'invalid_tenant_slug' };
    }

    if (!videoUrl || videoUrl.trim() === '') {
      return { errorKey: 'invalid_url' };
    }

    const storageDir = join(STORAGE_PATH, finalTenantSlug);
    await mkdir(storageDir, { recursive: true });
    const videoId = randomUUID();
    const filename = `${videoId}.mp4`;
    const filePath = join(storageDir, filename);

    const baseArgs = [
      '-f',
      'best[ext=mp4]/best[height<=1080]/best', // Prefer MP4, max 1080p, fallback to best
      '--no-playlist',
      '--no-warnings',
      '--progress', // Show progress
      '--newline', // Progress on new lines for better parsing
      '--force-overwrites', // Overwrite existing files
      '--no-cache-dir', // Don't use cache directory (prevents cache conflicts)
      '--no-mtime', // Don't set file modification time (faster)
    ];

    const ytdlpArgs: string[] = [...baseArgs];
    ytdlpArgs.push(
      '--extractor-args',
      'tiktok:webpage_download_retries=3', // Retry webpage downloads
      '--sleep-requests',
      '2', // Sleep 2 seconds between requests
      '--sleep-interval',
      '5', // Sleep 5 seconds between downloads
      '-o',
      filePath,
      videoUrl,
    );

    try {
      console.info(
        '[Video download] Executing yt-dlp with args:',
        ytdlpArgs.join(' '),
      );
      await this.executeYtdlp(ytdlpArgs, videoUrl);
      const relativePath = `creatives/${finalTenantSlug}/${filename}`;

      // Check if video was downloaded
      try {
        const stats = await stat(filePath);
        if (stats.size === 0) {
          console.error('[Video download] download file is empty');
          await unlink(filePath).catch(() => {});
          return { errorKey: 'download_failed' };
        }
        console.info('[Video download] file downloaded successfully: ', {
          size: stats.size,
          path: filePath,
        });
      } catch (statError: any) {
        console.error(
          '[Video download] download file does not exist or cannot be accessed ',
          statError,
        );
        return { errorKey: 'download_failed' };
      }

      return { videoPath: relativePath, filename };
    } catch {
      await unlink(filePath).catch(() => {});
      return { errorKey: 'download_failed' };
    }
  }

  async executeYtdlp(args: string[], videoUrl: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const ytdlpProcess = spawn('yt-dlp', args);

      let timeoutId: NodeJS.Timeout | null = null;
      let stdoutBuffer: string = '';
      let stderrBuffer: string = '';

      // Set timeout of 5 mins
      timeoutId = setTimeout(
        () => {
          console.error(
            '[Video download] yt-dlp timeout after 5 mins, killing process',
          );
          ytdlpProcess.kill('SIGTERM');
          setTimeout(() => {
            console.error('[Video download] Force kill yt-dlp process');
            ytdlpProcess.kill('SIGKILL');
          }, 5000);
          reject(new Error('yt-dlp timeout after 5 minutes'));
        },
        5 * 60 * 1000,
      );

      // Video downloading progress
      ytdlpProcess.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdoutBuffer += chunk;
        const lines = chunk.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          if (line.includes('[download]') || line.includes('%')) {
            console.log('[Video download] Progress:', line.trim());
          }
        }
      });

      // yt-dlp LOGS
      ytdlpProcess.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderrBuffer += chunk;
        const lines = chunk.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          if (
            line.includes('ERROR') ||
            line.includes('WARNING') ||
            line.toLowerCase().includes('error')
          ) {
            console.log('[Video download] yt-dlp stderr:', line.trim());
          } else if (line.includes('[download]') || line.includes('%')) {
            console.log('[Video download] Progress:', line.trim());
          }
        }
      });

      // Terminate yt-dlp process
      ytdlpProcess.on('close', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (ytdlpProcess.pid) {
          try {
            process.kill(ytdlpProcess.pid, 0);
          } catch {
            console.info('[Video download] error killing yt-dlp process');
          }
        }

        if (code === 0) {
          console.info('[Video download] yt-dlp completed successfully');
          if (stdoutBuffer) {
            console.info(
              '[Video download] yt-dlp stdout',
              stdoutBuffer.substring(0, 500),
            );
          } else if (stderrBuffer && !stderrBuffer.includes('[dowbload]')) {
            console.info(
              '[Video download] yt-dlp stderr (non-progress)',
              stderrBuffer.substring(0, 500),
            );
          }
          resolve();
        } else {
          const errorMessage = `yt-dlp exited with code ${code}${signal ? `(signal: ${signal})` : ''}`;
          const errorDetails =
            stderrBuffer || stdoutBuffer || 'No error details available';
          const fullError = {
            message: errorMessage,
            code,
            signal,
            killed: ytdlpProcess.killed,
            pid: ytdlpProcess.pid,
            stdout: stdoutBuffer,
            stderr: stderrBuffer,
            videoUrl,
          };

          console.error('[Video download] yt-dlp exited with error:', {
            ...fullError,
            stdout: stdoutBuffer.substring(0, 1000),
            stderr: stderrBuffer.substring(0, 1000),
          });

          const error = new Error(
            `${errorMessage}. Details: ${errorDetails.substring(0, 500)}`,
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (error as any).ytdlpError = fullError;
          reject(error);
        }
      });

      ytdlpProcess.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.info('[Video download] yt-dlp spawn error:', error);
        reject(error);
      });
    });
  }

  async uploadVideoFromDevice(
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    tenantSlug?: string,
    user?: AuthenticatedUser,
  ): Promise<
    | { videoPath: string; filename: string }
    | { errorKey: DownloadVideoErrorKeys }
  > {
    const STORAGE_PATH = process.env.STORAGE_PATH || '/data/videos';
    let finalTenantSlug: string | undefined = tenantSlug;

    if (!finalTenantSlug && user) {
      finalTenantSlug = user.slug;
    }
    if (!finalTenantSlug) {
      finalTenantSlug = this.tenantService.getSlug() || undefined;
    }
    if (!finalTenantSlug) {
      return { errorKey: 'invalid_tenant_slug' };
    }

    if (!file) {
      return { errorKey: 'invalid_url' };
    }

    // Validate file type - only MP4 allowed
    if (file.mimetype !== 'video/mp4') {
      console.error('[Video upload] Invalid file type:', file.mimetype);
      return { errorKey: 'invalid_file_type' };
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      console.error(
        '[Video upload] File too large:',
        file.size,
        'bytes (max:',
        maxSize,
        'bytes)',
      );
      return { errorKey: 'file_too_large' };
    }

    if (file.size === 0) {
      console.error('[Video upload] File is empty');
      return { errorKey: 'download_failed' };
    }

    const storageDir = join(STORAGE_PATH, finalTenantSlug);
    await mkdir(storageDir, { recursive: true });
    const videoId = randomUUID();

    // Always use .mp4 extension since we only accept MP4 files
    const filename = `${videoId}.mp4`;
    const filePath = join(storageDir, filename);

    try {
      // Write the file buffer to disk
      await writeFile(filePath, file.buffer);
      console.info('[Video upload] File uploaded successfully:', {
        size: file.size,
        path: filePath,
        mimetype: file.mimetype,
      });

      const relativePath = `creatives/${finalTenantSlug}/${filename}`;
      return { videoPath: relativePath, filename };
    } catch (error) {
      console.error('[Video upload] Error writing file:', error);
      await unlink(filePath).catch(() => {});
      return { errorKey: 'download_failed' };
    }
  }

  // generateTempPath(orgId: string): Promise<string, Error> {
  //   const videoId = nanoid();
  //   const filename = `${videoId}.mp4`;

  //   // Create temporary directory for downloading (use system temp directory)
  //   const tempDir = join(tmpdir(), 'airspot-social-ads', orgId);
  //   await mkdir(tempDir, { recursive: true });

  //   // Add delay between downloads to avoid rate limiting
  //   // Check if there are recent downloads in the temp directory
  //   try {
  //     const files: any = await readdir(tempDir);
  //     if (files.length > 0) {
  //       // Check the most recent file's modification time
  //       let mostRecentTime = 0;
  //       for (const file of files) {
  //         try {
  //           const filePath = join(tempDir, file);
  //           const stats: any = await stat(filePath);
  //           if (stats.mtimeMs > mostRecentTime) {
  //             mostRecentTime = stats.mtimeMs;
  //           }
  //         } catch {
  //           // Ignore errors
  //         }
  //       }

  //       // If last download was less than 5 seconds ago, wait
  //       const timeSinceLastDownload = Date.now() - mostRecentTime;
  //       if (timeSinceLastDownload < 5000) {
  //         const waitTime = 5000 - timeSinceLastDownload;
  //         console.info(`[Video Download] Rate limit protection: waiting ${waitTime}ms before download`);
  //         await new Promise(resolve => setTimeout(resolve, waitTime));
  //       }
  //     }
  //   } catch {
  //     // Ignore errors when checking for recent downloads
  //   }

  //   // Clean up any stale temp files from previous downloads (older than 1 hour)
  //   try {
  //     const files: any = await readdir(tempDir);
  //     const now = Date.now();
  //     for (const file of files) {
  //       const filePath = join(tempDir, file);
  //       try {
  //         const stats = await stat(filePath);
  //         // Remove files older than 1 hour
  //         if (now - stats.mtimeMs > 60 * 60 * 1000) {
  //           await unlink(filePath).catch(() => {});
  //           console.info('[Video Download] Cleaned up stale temp file:', file);
  //         }
  //       } catch {
  //         // Ignore errors when cleaning up
  //       }
  //     }
  //   } catch {
  //     // Ignore errors if directory doesn't exist or can't be read
  //   }

  //   return join(tempDir, filename);
  // }

  // uploadToS3({prefix, organizationId, filename, buffer, contentType, additionalMetadata}: {
  //   prefix: S3Prefix;
  //   organizationId: string;
  //   filename: string;
  //   buffer: Buffer;
  //   contentType: string;
  //   additionalMetadata?: Record<string, string>;
  // }): Promise<{ key: string, bucket: string }> {

  //   const key = generateS3Key({ prefix, organizationId, filename });
  //   const parsedEnv = await parseEnv();
  //   const s3Client = generateS3Client(parseEnv);
  //   const BUCKET_NAME = parseEnv.S3_BUCKET_NAME;

  // }

  /**
   * Get video file by path (for public access)
   * @param videoPath - Path like "creatives/{tenant-slug}/{filename}.mp4"
   */
  async getVideoFile(
    videoPath: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const STORAGE_PATH = process.env.STORAGE_PATH || '/data/videos';

    // Handle paths like "creatives/{tenant-slug}/{filename}.mp4"
    let fullPath: string;
    if (videoPath.startsWith('creatives/')) {
      // Remove 'creatives/' prefix and resolve from STORAGE_PATH
      const relativePath = videoPath.replace('creatives/', '');
      fullPath = join(STORAGE_PATH, relativePath);
    } else {
      // Assume it's already a relative path from STORAGE_PATH
      fullPath = join(STORAGE_PATH, videoPath);
    }

    try {
      const buffer = await readFile(fullPath);
      console.log(`[Video Download] File found at: ${fullPath}`);

      // Determine MIME type based on file extension
      const ext = fullPath.split('.').pop()?.toLowerCase();
      let mimeType = 'video/mp4'; // Default to mp4 for videos
      if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'webm') mimeType = 'video/webm';
      else if (ext === 'mov') mimeType = 'video/quicktime';

      return { buffer, mimeType };
    } catch (error) {
      console.error(`[Video Download] File not found at: ${fullPath}`, error);
      throw new NotFoundException(`Video file not found at ${videoPath}`);
    }
  }
}
