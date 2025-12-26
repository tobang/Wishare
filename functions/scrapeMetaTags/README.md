# Scrape Meta Tags Function

## Description
This Appwrite function scrapes meta tags, Open Graph data, and Twitter Card information from any URL. It's designed to extract rich metadata for creating wish items.

## Runtime
- **Runtime**: Node.js 21.0
- **Type**: ES Modules (modern)
- **Timeout**: 30 seconds

## Features
- ✅ Scrapes standard meta tags
- ✅ Extracts Open Graph data (og:*)
- ✅ Extracts Twitter Card data (twitter:*)
- ✅ Downloads and encodes images to base64
- ✅ Handles relative URLs
- ✅ 10-second timeout protection
- ✅ Proper error handling and logging
- ✅ User-Agent spoofing for better compatibility

## Input

```json
{
  "url": "https://example.com/product"
}
```

## Output

### Success Response
```json
{
  "success": true,
  "payload": {
    "url": "https://example.com/product",
    "title": "Product Name",
    "description": "Product description",
    "image": "https://example.com/image.jpg",
    "imageEncoded": "data:image/jpg;base64,...",
    "price": "99.99",
    "favicon": "/favicon.ico",
    "author": "Author Name",
    "siteName": "Example Site",
    "type": "product"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Failed to scrape URL",
  "error": "Error details (dev mode only)"
}
```

## Dependencies

- **cheerio** (^1.1.2) - Fast, flexible HTML parser
- **node-appwrite** (^21.0.0) - Appwrite SDK for Node.js
- **undici** (^7.16.0) - Modern, fast HTTP client (replaces node-fetch)

## Environment Variables

The function uses Appwrite's built-in environment variables:
- `APPWRITE_FUNCTION_ENDPOINT` - Appwrite API endpoint
- `APPWRITE_FUNCTION_API_KEY` - API key for Appwrite access (if needed)
- `APPWRITE_FUNCTION_PROJECT_ID` - Project ID
- `APPWRITE_FUNCTION_ENV` - Environment (development/production)

## Local Testing

```bash
cd functions/scrapeMetaTags
npm install
node src/main.js
```

## Deployment

### Using Appwrite CLI

```bash
# Deploy the function
appwrite functions createDeployment \
  --functionId scrapeMetaTags \
  --activate true \
  --entrypoint="src/main.js" \
  --code="functions/scrapeMetaTags"
```

### Using Appwrite Console

1. Go to your Appwrite project
2. Navigate to **Functions**
3. Click **Create Function**
4. Fill in:
   - **Name**: Scrape Meta Tags
   - **Function ID**: `scrapeMetaTags`
   - **Runtime**: Node.js 21.0
   - **Entrypoint**: `src/main.js`
   - **Timeout**: 30 seconds
5. Upload the function code or connect to Git
6. Deploy

## Usage in Angular App

```typescript
import { Client, Functions } from 'appwrite';

const client = new Client()
  .setEndpoint('http://localhost/v1')
  .setProject('wishare');

const functions = new Functions(client);

async function scrapeUrl(url: string) {
  try {
    const response = await functions.createExecution(
      'scrapeMetaTags',
      JSON.stringify({ url }),
      false, // async execution
    );
    
    const result = JSON.parse(response.responseBody);
    
    if (result.success) {
      console.log('Scraped data:', result.payload);
      return result.payload;
    } else {
      console.error('Scraping failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Function execution failed:', error);
    return null;
  }
}

// Example usage
const metadata = await scrapeUrl('https://amazon.com/product/123');
```

## Improvements from v1

### Modernization
- ✅ Migrated from CommonJS to ES Modules
- ✅ Updated from node-16.0 to node-21.0 runtime
- ✅ Replaced `node-fetch` with `undici` (faster, more modern)
- ✅ Updated `node-appwrite` from v8 to v21
- ✅ Updated `cheerio` to latest version

### Code Quality
- ✅ Added proper error handling with try-catch
- ✅ Added logging for debugging
- ✅ Added input validation
- ✅ Added timeout protection (10s for main request, 5s for images)
- ✅ Added User-Agent header for better compatibility
- ✅ Improved image URL handling (relative vs absolute)
- ✅ Added more meta tag extraction (author, siteName, type)
- ✅ Better error messages and status codes

### Performance
- ✅ Using `undici` for faster HTTP requests
- ✅ Proper timeout handling prevents hanging
- ✅ Graceful degradation (continues without image if fetch fails)

### Security
- ✅ Input validation
- ✅ Timeout limits prevent DoS
- ✅ Error stack traces only in development mode
- ✅ Proper error handling prevents information leakage

## Breaking Changes from v1

1. **Module System**: Now uses ES modules (`import`/`export`) instead of CommonJS (`require`/`module.exports`)
2. **Runtime**: Requires Node.js 21.0 (was 16.0)
3. **Request Handling**: Uses new Appwrite Functions v2 context API
4. **Response Format**: More structured with consistent `success` flag

## Migration from v1

If you're using the old function:
1. Update function runtime to `node-21.0` in Appwrite Console
2. Update entrypoint to `src/main.js`
3. Redeploy with new code
4. No changes needed in calling code (API remains compatible)
