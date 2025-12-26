# Appwrite Functions - Overview

This directory contains serverless functions for the Wishare application.

## Available Functions

### 1. scrapeMetaTags

**Purpose**: Scrapes meta tags and Open Graph data from URLs to auto-populate wish items.

**Runtime**: Node.js 21.0  
**Status**: ✅ Migrated & Modernized  
**Documentation**: [functions/scrapeMetaTags/README.md](functions/scrapeMetaTags/README.md)

**Quick Usage**:
```typescript
const metadata = await scraper.scrapeUrl('https://amazon.com/product/123');
```

---

## Documentation

- 📘 [Functions Migration Guide](FUNCTIONS-MIGRATION.md) - Complete migration details
- 📗 [Deployment Guide](FUNCTIONS-DEPLOYMENT.md) - How to deploy functions
- 📕 [Appwrite Setup](APPWRITE-LOCAL-SETUP.md) - Local Appwrite setup

---

## Quick Start

```bash
# 1. Install function dependencies
cd functions/scrapeMetaTags
npm install

# 2. Deploy function
cd ../..
appwrite deploy function

# 3. Test function
appwrite functions createExecution \
  --functionId scrapeMetaTags \
  --body '{"url":"https://github.com"}'
```

---

## Development

### Adding a New Function

1. Create function directory:
```bash
mkdir -p functions/myFunction/src
```

2. Create package.json:
```json
{
  "name": "my-function",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^21.0.0"
  }
}
```

3. Create main.js:
```javascript
export default async ({ req, res, log, error }) => {
  log('Function invoked');
  
  try {
    const data = JSON.parse(req.body || '{}');
    
    return res.json({
      success: true,
      result: data
    });
  } catch (err) {
    error(err.message);
    return res.json({ success: false }, 500);
  }
};
```

4. Add to appwrite.json

5. Deploy!

---

## Best Practices

✅ Use Node.js 21.0 runtime  
✅ Use ES modules (type: "module")  
✅ Add comprehensive error handling  
✅ Use built-in logging (log, error)  
✅ Set appropriate timeouts  
✅ Validate all inputs  
✅ Add documentation  
✅ Test locally before deploying  

---

## Troubleshooting

See [FUNCTIONS-DEPLOYMENT.md](FUNCTIONS-DEPLOYMENT.md#troubleshooting) for common issues and solutions.
