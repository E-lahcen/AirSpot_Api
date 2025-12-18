# Creative Video Upload Feature

## Overview
The Creative module now supports uploading video files with strict validation requirements. Videos are uploaded to MinIO storage and metadata is stored in the database.

## Video Requirements

### Format
- **Container Format**: MP4 only
- **File Extension**: `.mp4`

### Resolution
- **Width**: 1920 pixels (required)
- **Height**: 1080 pixels (required)
- **Total**: 1920x1080 (Full HD)

### Aspect Ratio
- **Required**: 16:9
- **Tolerance**: ±1% for rounding differences

### File Size
- **Maximum**: 100 MB

## API Endpoint

### Create Creative with Optional Video Upload

**POST** `/api/v1/creatives`

**Authentication**: Bearer Token required

**Content-Type**: `multipart/form-data`

#### Request Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `organization_id` | UUID | Form Data | Yes | Organization ID |
| `brand_id` | UUID | Form Data | No | Brand ID (optional) |
| `name` | string | Form Data | Yes | Creative name |
| `video` | File | Form Data | No | MP4 video file (optional) |
| Other fields | various | Form Data | No | See CreateCreativeDto for all fields |

#### Example Request (cURL)

```bash
# With video upload
curl -X POST \
  'https://api.example.com/api/v1/creatives' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'video=@/path/to/video.mp4' \
  -F 'organization_id=550e8400-e29b-41d4-a716-446655440000' \
  -F 'brand_id=abc12345-6789-0abc-def0-123456789abc' \
  -F 'name=Summer Campaign Creative' \
  -F 'file_name=summer-video.mp4'

# Without video (using template)
curl -X POST \
  'https://api.example.com/api/v1/creatives' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "organization_id": "550e8400-e29b-41d4-a716-446655440000",
    "brand_id": "abc12345-6789-0abc-def0-123456789abc",
    "name": "Summer Campaign Creative",
    "id_template": "template-uuid",
    "file_name": "summer-video.mp4"
  }'
```

#### Example Request (Postman)

1. Method: POST
2. URL: `{{baseUrl}}/creatives`
3. Headers:
   - `Authorization: Bearer {{token}}`
4. Body (form-data):
   - Key: `organization_id` | Type: Text | Value: `550e8400-e29b-41d4-a716-446655440000`
   - Key: `brand_id` | Type: Text | Value: `abc12345-6789-0abc-def0-123456789abc` (optional)
   - Key: `name` | Type: Text | Value: `Summer Campaign Creative`
   - Key: `file_name` | Type: Text | Value: `summer-video.mp4`
   - Key: `video` | Type: File | Value: Select your MP4 file (optional)

#### Success Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Campaign Creative",
  "organization_id": "abc12345-...",
  "brand_id": "def67890-...",
  "video_path": "http://minio.example.com/airspot-videos/creatives/tenant-id/uuid.mp4",
  "video_width": 1920,
  "video_height": 1080,
  "video_duration": 30.5,
  "video_format": "mp4",
  "file_name": "summer-video.mp4",
  "owner_id": "user-uuid",
  "created_at": "2024-12-18T10:00:00Z",
  "updated_at": "2024-12-18T10:05:00Z"
}
```

#### Error Responses

##### Invalid Format (400 Bad Request)
```json
{
  "message": "Invalid video format",
  "errors": [
    {
      "code": "INVALID_FORMAT",
      "message": "Video must be in MP4 format"
    }
  ]
}
```

##### Invalid Resolution (400 Bad Request)
```json
{
  "message": "Invalid video resolution",
  "errors": [
    {
      "code": "INVALID_RESOLUTION",
      "message": "Video resolution must be 1920x1080 pixels",
      "details": "Found: 1280x720"
    }
  ]
}
```

##### Invalid Aspect Ratio (400 Bad Request)
```json
{
  "message": "Invalid aspect ratio",
  "errors": [
    {
      "code": "INVALID_ASPECT_RATIO",
      "message": "Video aspect ratio must be 16:9",
      "details": "Found: 1920:1200"
    }
  ]
}
```

##### File Too Large (400 Bad Request)
```json
{
  "message": "File size exceeds maximum allowed",
  "errors": [
    {
      "code": "FILE_TOO_LARGE",
      "message": "Maximum file size is 100MB"
    }
  ]
}
```

##### Creative Not Found (404 Not Found)
```json
{
  "message": "Creative with ID xxx not found"
}
```

## Database Schema

### New Fields in `creatives` Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `brand_id` | uuid | Yes | Brand ID reference (optional) |
| `video_width` | integer | Yes | Video width in pixels (1920) |
| `video_height` | integer | Yes | Video height in pixels (1080) |
| `video_duration` | numeric(10,2) | Yes | Video duration in seconds |
| `video_format` | varchar(50) | Yes | Video format (mp4) |

## Validation Process

1. **File Extension Check**: Validates `.mp4` extension
2. **FFprobe Analysis**: Uses FFmpeg's ffprobe to extract video metadata
3. **Format Validation**: Ensures container format is MP4
4. **Resolution Validation**: Verifies exact 1920x1080 dimensions
5. **Aspect Ratio Validation**: Confirms 16:9 ratio (with 1% tolerance)
6. **Upload to MinIO**: Stores file in `creatives/{tenant-id}/{uuid}.mp4`
7. **Database Update**: Saves metadata and URL to database

## Dependencies

### System Requirements
- **FFmpeg**: Must be installed and available in system PATH
  - Ubuntu/Debian: `apt-get install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### NPM Packages
- `uuid`: For generating unique filenames
- `minio`: For MinIO storage integration
- `@nestjs/platform-express`: For file upload handling

## Configuration

### Environment Variables

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=airspot-videos
MINIO_PUBLIC_URL=http://localhost:9000
```

## Testing

### Prepare Test Video

Create a test video with correct specifications:

```bash
ffmpeg -f lavfi -i color=c=blue:s=1920x1080:d=10 \
  -vf "drawtext=text='Test Video':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -t 10 -pix_fmt yuv420p test-video.mp4
```

### Verify Video Specifications

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,duration \
  -of json test-video.mp4
```

## Migration

Run the migration to add video metadata fields:

```bash
# Development
npm run migration:run

# Production
npm run migration:run:prod
```

## Troubleshooting

### FFprobe Not Found
**Error**: `ffprobe not found: spawn ffprobe ENOENT`

**Solution**: Install FFmpeg:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffprobe -version
```

### MinIO Connection Failed
**Error**: `Error uploading file to MinIO`

**Solution**: 
1. Verify MinIO is running: `docker ps | grep minio`
2. Check environment variables
3. Test MinIO connection: `mc ls myminio/`

### Video Analysis Failed
**Error**: `Failed to analyze video file`

**Solution**:
1. Verify video file is valid MP4
2. Check file is not corrupted
3. Try re-encoding with FFmpeg:
   ```bash
   ffmpeg -i input.mp4 -c:v libx264 -c:a aac -strict experimental output.mp4
   ```

## Code Structure

```
src/modules/creative/
├── controllers/
│   └── creative.controller.ts    # Video upload endpoint
├── services/
│   └── creative.service.ts       # Video upload logic
├── entities/
│   └── creative.entity.ts        # Video metadata fields
├── dto/
│   ├── create-creative.dto.ts    # Video metadata in DTO
│   └── update-creative.dto.ts
├── utils/
│   └── video-validation.util.ts  # Video validation logic
└── creative.module.ts            # Module configuration
```

## Future Enhancements

- [ ] Support additional video formats (MOV, AVI)
- [ ] Support multiple resolutions with automatic transcoding
- [ ] Add video thumbnail generation
- [ ] Implement progress tracking for large uploads
- [ ] Add video preview in UI
- [ ] Support video streaming
