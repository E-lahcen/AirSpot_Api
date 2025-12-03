# MinIO Integration Guide

## Overview

The application now supports storing generated videos in MinIO (or any S3-compatible storage). This allows for scalable storage and direct file serving.

## Configuration

Add the following environment variables to your `.env` file:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=airspot-videos
# Optional: Public URL if MinIO is behind a reverse proxy or load balancer
MINIO_PUBLIC_URL=https://storage.example.com
```

## Implementation Details

### Storage Module

A new `StorageModule` has been created in `src/modules/storage`. It provides a `StorageService` that handles:

- MinIO client initialization
- Automatic bucket creation (`airspot-videos`)
- File uploads
- URL generation

### Usage

The `StorageService` is global and can be injected into any service:

```typescript
constructor(private readonly storageService: StorageService) {}

// Upload a file
const url = await this.storageService.uploadFile(
  'path/to/file.mp4',
  fileBuffer,
  fileSize,
  'video/mp4'
);
```

### Video Overlay Integration

The `overlayVideoOnImage` method in `TemplateService` has been updated to:

1. Generate the video locally using FFmpeg
2. Upload the generated video to MinIO
3. Return the MinIO URL in the response

## API Response

The `POST /api/v1/templates/overlay-video` endpoint now returns:

```json
{
  "videoPath": "templates/tenant-slug/videos/abc123.mp4",
  "filename": "abc123.mp4",
  "minioUrl": "http://localhost:9000/airspot-videos/templates/tenant-slug/videos/abc123.mp4",
  "publicUrl": "https://api.example.com/..."
}
```

- `minioUrl`: Direct URL to the file in MinIO storage
- `publicUrl`: URL to download via the API (proxied/local file)
