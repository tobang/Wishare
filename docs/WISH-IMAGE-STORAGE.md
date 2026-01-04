# Wish Image Storage Implementation

## Overview

This document describes the implementation of image storage for wishes in the Wishare application. When users create a wish, they can upload up to 5 images which are stored in Appwrite Storage and referenced in the wish document.

## Architecture

### Storage Bucket

Images are stored in the `wish-images` bucket configured in `appwrite.json`:

```json
{
  "$id": "wish-images",
  "name": "Wish Images",
  "enabled": true,
  "maximumFileSize": 5242880, // 5 MB
  "allowedFileExtensions": ["jpg", "jpeg", "png", "gif", "webp"],
  "compression": "gzip",
  "encryption": true,
  "antivirus": true,
  "fileSecurity": true
}
```

### Database Schema

The `wishes` collection stores file IDs in the `files` field as an array of strings referencing files in the `wish-images` bucket.

## Flow

### Creating a Wish with Images

1. **User Interface**: The `WishCreateComponent` allows users to select up to 5 images
2. **Dialog Submission**: When the user submits, `WishDialogComponent.onWishSubmit()` returns the form data and `File` objects
3. **Board Component**: Receives the dialog result and dispatches `createWish` action to the store
4. **Board Effects**: Handles the `createWish$` action, calling `BoardService.createWish()`
5. **Board Service**:
   - Uploads each image to the `wish-images` bucket
   - Creates the wish document with file ID references
   - Returns the created wish

### Code Flow

```typescript
// 1. Dialog returns File objects
onWishSubmit() {
  const imageFiles = this.images().map((img) => img.file);
  this.context.completeWith({
    wishData,
    imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
  });
}

// 2. Board component dispatches action
this.boardStore.actions.createWish({
  wishlistId,
  data: result.wishData,
  images: result.imageFiles,
});

// 3. Service uploads images then creates wish
createWish(wishlistId, data, images): Observable<WishFlat> {
  // First upload images, get file IDs
  // Then create wish document with file references
}
```

## Setup Requirements

### Deploy Bucket

Before using the image upload feature, deploy the bucket to Appwrite:

```bash
# Using Appwrite CLI
appwrite deploy bucket

# Or push all resources
appwrite push
```

### Verify Bucket Permissions

Ensure the bucket allows users to:

- **create**: Upload new files
- **read**: View/download their files

## Files Modified

- `libs/web/shared/app-config/src/lib/providers/appwrite.provider.ts` - Added Storage service
- `libs/web/board/data-access/src/lib/services/board.service.ts` - Added wish creation with image upload
- `libs/web/board/data-access/src/lib/store/board.types.ts` - Added CreateWishData, CreateWishPayload types
- `libs/web/board/data-access/src/lib/store/board.effects.ts` - Added createWish effect
- `libs/web/board/data-access/src/lib/store/board.store.ts` - Added createWishState
- `libs/web/wish/ui/dialog/src/lib/models/wish-dialog.model.ts` - Updated to return File objects
- `libs/web/wish/ui/dialog/src/lib/wish-dialog.component.ts` - Returns File objects instead of data URLs
- `libs/web/board/feature/board/src/lib/board.component.ts` - Wired dialog to store action
- `appwrite.json` - Added wish-images bucket configuration

## Retrieving Image URLs

To display wish images, use the `BoardService.getWishImagePreviewUrl()` method:

```typescript
const imageUrl = boardService.getWishImagePreviewUrl(fileId);
// Returns a URL string for the image preview
```

## Limitations

- Maximum 5 images per wish (enforced in UI)
- Maximum file size: 5 MB per image
- Supported formats: JPG, JPEG, PNG, GIF, WebP
