import { BadRequestException } from '@nestjs/common';
import { spawn } from 'child_process';

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  format: string;
  aspectRatio: string;
}

export class VideoValidationUtil {
  /**
   * Validate video file requirements
   * - Format: MP4
   * - Aspect Ratio: 16:9
   * - Resolution: 1920x1080
   */
  static async validateVideo(
    buffer: Buffer,
    filename: string,
  ): Promise<VideoMetadata> {
    // Validate file extension
    if (!filename.toLowerCase().endsWith('.mp4')) {
      throw new BadRequestException({
        message: 'Invalid video format',
        errors: [
          {
            code: 'INVALID_FORMAT',
            message: 'Video must be in MP4 format',
          },
        ],
      });
    }

    // Get video metadata using ffprobe
    const metadata = await this.getVideoMetadata(buffer);

    // Validate format - MP4 container can be reported as 'mp4', 'mov', or 'mov,mp4,m4a,3gp,3g2,mj2'
    // MOV and MP4 are essentially the same container format (MP4 is based on QuickTime MOV)
    const isValidFormat =
      metadata.format.includes('mp4') || metadata.format.includes('mov');

    if (!isValidFormat) {
      throw new BadRequestException({
        message: 'Invalid video format',
        errors: [
          {
            code: 'INVALID_FORMAT',
            message: 'Video format must be MP4',
            details: `Found: ${metadata.format}`,
          },
        ],
      });
    }

    // Validate resolution
    if (metadata.width !== 1920 || metadata.height !== 1080) {
      throw new BadRequestException({
        message: 'Invalid video resolution',
        errors: [
          {
            code: 'INVALID_RESOLUTION',
            message: 'Video resolution must be 1920x1080 pixels',
            details: `Found: ${metadata.width}x${metadata.height}`,
          },
        ],
      });
    }

    // Validate aspect ratio (16:9)
    const expectedAspectRatio = 16 / 9;
    const actualAspectRatio = metadata.width / metadata.height;
    const tolerance = 0.01; // Allow small rounding differences

    if (Math.abs(actualAspectRatio - expectedAspectRatio) > tolerance) {
      throw new BadRequestException({
        message: 'Invalid aspect ratio',
        errors: [
          {
            code: 'INVALID_ASPECT_RATIO',
            message: 'Video aspect ratio must be 16:9',
            details: `Found: ${metadata.aspectRatio}`,
          },
        ],
      });
    }

    return metadata;
  }

  /**
   * Extract video metadata using ffprobe
   */
  private static async getVideoMetadata(
    buffer: Buffer,
  ): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v',
        'error',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        '-i',
        'pipe:0',
      ]);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(
            new BadRequestException({
              message: 'Failed to analyze video file',
              errors: [
                {
                  code: 'VIDEO_ANALYSIS_FAILED',
                  message: `ffprobe failed: ${stderr}`,
                },
              ],
            }),
          );
          return;
        }

        try {
          interface VideoStream {
            codec_type: string;
            width: number;
            height: number;
          }

          interface FormatInfo {
            duration?: string;
            format_name: string;
          }

          interface FFprobeOutput {
            streams: VideoStream[];
            format: FormatInfo;
          }

          const data: FFprobeOutput = JSON.parse(stdout) as FFprobeOutput;
          const videoStream = data.streams.find(
            (s: VideoStream) => s.codec_type === 'video',
          );

          if (!videoStream) {
            reject(
              new BadRequestException({
                message: 'No video stream found in file',
                errors: [
                  {
                    code: 'NO_VIDEO_STREAM',
                    message:
                      'The uploaded file does not contain a video stream',
                  },
                ],
              }),
            );
            return;
          }

          const width: number = videoStream.width;
          const height: number = videoStream.height;
          const duration: number = parseFloat(data.format.duration || '0');
          const format: string = data.format.format_name.split(',')[0]; // Get primary format
          const aspectRatio = `${width.toString()}:${height.toString()}`;

          resolve({
            width,
            height,
            duration,
            format,
            aspectRatio,
          });
        } catch (error) {
          reject(
            new BadRequestException({
              message: 'Failed to parse video metadata',
              errors: [
                {
                  code: 'METADATA_PARSE_ERROR',
                  message: `Failed to parse ffprobe output: ${String(error)}`,
                },
              ],
            }),
          );
        }
      });

      ffprobe.on('error', (error) => {
        reject(
          new BadRequestException({
            message: 'Video analysis tool not available',
            errors: [
              {
                code: 'FFPROBE_NOT_FOUND',
                message: `ffprobe not found: ${error.message}. Please ensure FFmpeg is installed.`,
              },
            ],
          }),
        );
      });

      // Handle stdin errors (e.g., EPIPE)
      ffprobe.stdin.on('error', (error) => {
        // Ignore EPIPE errors as they're expected when ffprobe closes early
        if (error.message.includes('EPIPE')) {
          return;
        }
        reject(
          new BadRequestException({
            message: 'Failed to write video data',
            errors: [
              {
                code: 'STDIN_WRITE_ERROR',
                message: `Error writing to ffprobe: ${error.message}`,
              },
            ],
          }),
        );
      });

      // Write buffer to ffprobe's stdin with error handling
      try {
        ffprobe.stdin.write(buffer);
        ffprobe.stdin.end();
      } catch (error) {
        reject(
          new BadRequestException({
            message: 'Failed to send video data to analyzer',
            errors: [
              {
                code: 'BUFFER_WRITE_ERROR',
                message: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          }),
        );
      }
    });
  }
}
