# Video Overlay Endpoint

## Overview

A new endpoint has been created to overlay a video on an image at specified coordinates and dimensions using FFmpeg.

## Endpoint Details

### POST `/api/v1/templates/overlay-video`

**Authentication Required:** Yes (Bearer token)

**Request Body:**

```json
{
  "videoResponse": {
    "url": "https://example.com/video.mp4"
  },
  "imageResponse": {
    "url": "https://example.com/background.jpg"
  },
  "videoElement": {
    "x": 100,
    "y": 100,
    "width": 640,
{
  "videoPath": null,
  "filename": "abc123.mp4",
  "minioUrl": "https://storage.example.com/airspot-videos/templates/tenant-slug/videos/abc123.mp4",
  "publicUrl": "https://storage.example.com/airspot-videos/templates/tenant-slug/videos/abc123.mp4"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid parameters or processing failed
- `401 Unauthorized`: Missing or invalid authentication token

## Implementation Details

### Files Created/Modified

1. **DTO Created:** `src/modules/template/dto/overlay-video.dto.ts`
   - Validates input parameters
   - Uses class-validator decorators for validation
   - Includes Swagger API documentation

2. **Service Method Added:** `TemplateService.overlayVideoOnImage()`
   - Downloads image and video from provided URLs
   - Uses FFmpeg to create the overlay
   - Cleans up temporary files
   - Returns the path to the generated video

3. **Controller Endpoint Added:** `TemplateController.overlayVideo()`
   - POST endpoint at `/templates/overlay-video`
   - Includes Swagger documentation
   - Returns public URL for the generated video

### How It Works

1. **Download Phase:**
   - Downloads the image from `imageUrl` to a temporary location
   - Downloads the video from `videoUrl` to a temporary location
   - Supports HTTP and HTTPS URLs
   - Handles redirects automatically

2. **Processing Phase:**
   - Extracts video information (duration, width, height) using FFprobe
   - Creates an FFmpeg filter complex that:
     - Converts the static image to a video stream
     - Scales the input video to the specified dimensions
     - Overlays the scaled video on the image at the specified coordinates
   - Outputs a new video file with:
     - 30 fps frame rate
     - H.264 video codec
     - AAC audio codec (if audio exists in the input video)
     - Optimized for streaming (faststart flag)

3. **Cleanup Phase:**
   - Removes temporary downloaded files
   - Returns the path to the generated video

### FFmpeg Command Example

The service generates an FFmpeg command similar to:

```bash
ffmpeg -loop 1 -i image.jpg -i video.mp4 \
  -filter_complex "[0:v]loop=loop=-1:size=1:start=0,fps=30[bg];[1:v]scale=640:480[overlay];[bg][overlay]overlay=100:100:shortest=1[out]" \
  -map "[out]" -map "1:a?" \
  -t 10.5 -r 30 -pix_fmt yuv420p \
  -c:v libx264 -c:a aac -b:a 128k \
  -preset ultrafast -crf 28 -threads 2 \
  -movflags +faststart -y output.mp4
```

### Configuration

- **Storage Path:** Uses `STORAGE_PATH` environment variable (default: `/data/templates`)
- **Output Directory:** `{STORAGE_PATH}/{tenantSlug}/videos/`
- **Temporary Directory:** `{STORAGE_PATH}/{tenantSlug}/temp/`
- **Timeout:** 10 minutes for FFmpeg processing

## Testing

You can test the endpoint using curl:

```bash
curl -X POST https://airspot-backend.dba.ma/api/v1/templates/overlay-video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/background.jpg",
    "videoUrl": "https://example.com/video.mp4",
    "position_x": 100,
    "position_y": 100,
    "widthVideo": 640,
    "heightVideo": 480
  }'
```

Or view the Swagger documentation at: `https://airspot-backend.dba.ma/api/docs`

## Notes

- The endpoint requires FFmpeg to be installed on the server
- The video duration is determined by the input video's duration
- The image is converted to a video stream that loops for the duration of the input video
- Audio from the input video is preserved in the output
- Temporary files are automatically cleaned up after processing
- **Video Scaling**: The overlay video will be **stretched** to exactly match the provided `widthVideo` and `heightVideo`, ignoring its original aspect ratio.
- **All dimensions are automatically adjusted to even numbers** (divisible by 2) to ensure H.264 encoder compatibility
- The background image dimensions are also adjusted to be even to prevent encoding errors
- **Storage**: Videos are stored **only in MinIO** (if configured) and not retained on the local server volume.
