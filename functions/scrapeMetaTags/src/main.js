import { load } from 'cheerio';
import { fetch } from 'undici';
import { Buffer } from 'node:buffer';

/**
 * Appwrite Function to scrape meta tags from a URL
 *
 * @param {object} context - Appwrite function context
 * @param {object} context.req - Request object
 * @param {object} context.res - Response object
 * @param {object} context.log - Logging function
 * @param {object} context.error - Error logging function
 */
export default async ({ req, res, log, error }) => {
  // Wrap everything in a try-catch to ensure we always return JSON
  try {
    // Log the incoming request
    log('Scrape meta tags function invoked');

    try {
      // Parse the request body
      let payload;
      try {
        payload = JSON.parse(req.body || '{}');
      } catch (parseError) {
        error('Failed to parse request body');
        return res.json(
          {
            success: false,
            message: 'Invalid JSON in request body',
          },
          400,
        );
      }
      const { url } = payload;

      // Validate URL
      if (!url) {
        error('No URL provided in payload');
        return res.json(
          {
            success: false,
            message: 'URL is required in the request payload',
          },
          400,
        );
      }

      log(`Scraping URL: ${url}`);

      // Fetch the URL content
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; WishareBot/2.0; +https://wishare.app)',
        },
        redirect: 'follow',
        timeout: 10000, // 10 seconds timeout
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch URL: ${response.status} ${response.statusText}`,
        );
      }

      const html = await response.text();
      const $ = load(html);

      // Helper function to get meta tag content
      const getMetaTag = (name) =>
        $(`meta[name="${name}"]`).attr('content') ||
        $(`meta[itemprop="${name}"]`).attr('content') ||
        $(`meta[property="og:${name}"]`).attr('content') ||
        $(`meta[property="twitter:${name}"]`).attr('content') ||
        '';

      // Extract meta information
      const urlObject = new URL(url);

      let title = $('title').first().text()?.trim() || '';
      let description = getMetaTag('description');
      let imageUrl = getMetaTag('image');
      let price =
        getMetaTag('price') ||
        $('meta[property="product:price:amount"]').attr('content') ||
        '';

      // Special handling for power.dk power-meta tags
      $('power-meta').each((i, el) => {
        const data = $(el).attr('data');
        if (data && data.length > 100) {
          log(`Found power-meta tag with data length: ${data.length}`);
          try {
            const decoded = Buffer.from(data, 'base64').toString('utf-8');
            const json = JSON.parse(decoded);

            // Check for seoModel (top level or inside pwrMainModel)
            let seoModel = json.seoModel;
            if (!seoModel && json.pwrMainModel && json.pwrMainModel.seoModel) {
              seoModel = json.pwrMainModel.seoModel;
            }

            if (seoModel) {
              if (seoModel.title) title = seoModel.title;
              if (seoModel.description) description = seoModel.description;
              if (seoModel.image && seoModel.image.startsWith('http')) {
                imageUrl = seoModel.image;
              }

              if (seoModel.openGraphItems) {
                const priceItem = seoModel.openGraphItems.find(
                  (item) => item.Key === 'product:price:amount',
                );
                if (priceItem) price = priceItem.Value;
              }
            }

            // Check for extendedProduct model if seoModel didn't give us everything
            if (json.model && json.model.extendedProduct) {
              const prod = json.model.extendedProduct;

              // Check variantProducts which often has price
              if (
                json.model.variantProducts &&
                Array.isArray(json.model.variantProducts)
              ) {
                const productId = prod.productId;
                const variant =
                  json.model.variantProducts.find(
                    (v) => v.productId === productId,
                  ) || json.model.variantProducts[0];

                if (variant) {
                  if (!price && variant.price) price = variant.price.toString();
                  if (!title && variant.title) title = variant.title;
                  if (variant.productImage && variant.productImage.basePath) {
                    const img = variant.productImage;
                    let filename = '';
                    if (img.variants && img.variants.length > 0) {
                      // Find largest non-transparent image
                      const bestVariant = img.variants
                        .filter((v) => !v.isTransparent)
                        .sort((a, b) => b.width - a.width)[0];

                      if (bestVariant) {
                        filename = bestVariant.filename;
                      } else {
                        filename = img.variants[0].filename;
                      }
                    }

                    if (filename) {
                      imageUrl = `https://media.power-cdn.net${img.basePath}/${filename}`;
                    } else {
                      imageUrl = `https://media.power-cdn.net${img.basePath}`;
                    }
                  }
                }
              }

              // Fallback to extendedProduct properties if still missing
              if (!price && prod.price) price = prod.price.toString();
              if (!title && prod.title) title = prod.title;
              if (
                !imageUrl &&
                prod.productImage &&
                prod.productImage.basePath
              ) {
                imageUrl = prod.productImage.basePath;
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });

      let imageEncoded = '';

      // Process image URL
      if (imageUrl) {
        try {
          // Ensure we have a full URL
          if (!imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('/')
              ? `${urlObject.origin}${imageUrl}`
              : `${urlObject.origin}/${imageUrl}`;
          }

          log(`Fetching image: ${imageUrl}`);

          // Fetch and encode image with size limit
          const imageResponse = await fetch(imageUrl, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; WishareBot/2.0)',
            },
          });

          if (imageResponse.ok) {
            // Check content length to avoid processing very large images
            const contentLength = imageResponse.headers.get('content-length');
            // Reduced to 1MB to ensure response fits within Appwrite's 1MB limit
            // Base64 encoding increases size by ~33%, so 1MB binary becomes ~1.3MB encoded
            const maxSize = 1 * 1024 * 1024; // 1MB limit

            if (contentLength && parseInt(contentLength) > maxSize) {
              log(
                `Image too large (${contentLength} bytes), skipping encoding`,
              );
            } else {
              const imageBuffer = await imageResponse.arrayBuffer();
              const buffer = Buffer.from(imageBuffer);

              // Double-check actual size (Appwrite response limit is 1MB total)
              const maxSize = 1 * 1024 * 1024; // 1MB limit
              if (buffer.length > maxSize) {
                log(
                  `Image too large after fetch (${buffer.length} bytes), skipping encoding`,
                );
              } else {
                // Determine image type from Content-Type header first, then URL
                let imageType = 'jpg'; // default fallback

                const contentType = imageResponse.headers.get('content-type');
                if (contentType && contentType.startsWith('image/')) {
                  // Extract subtype (e.g., 'image/webp' -> 'webp', 'image/jpeg' -> 'jpeg')
                  imageType = contentType.split('/')[1].split(';')[0];
                  log(`Image type from Content-Type: ${imageType}`);
                } else {
                  // Fallback to URL extension
                  const imageMatch = imageUrl.match(/\.([^./?#]+)($|\?|#)/);
                  if (imageMatch?.[1]) {
                    imageType = imageMatch[1];
                    log(`Image type from URL extension: ${imageType}`);
                  } else {
                    log(`No image type found, using default: ${imageType}`);
                  }
                }

                imageEncoded = `data:image/${imageType};base64,${buffer.toString('base64')}`;
                log(
                  `Image successfully encoded (${buffer.length} bytes -> ${imageEncoded.length} chars)`,
                );
              }
            }
          } else {
            log(`Image fetch failed: ${imageResponse.status}`);
          }
        } catch (imageError) {
          error(`Failed to fetch/encode image: ${imageError.message}`);
          // Continue without image
        }
      }

      // Extract price from various sources if not already found

      // Try to find price in JSON-LD structured data
      if (!price) {
        $('script[type="application/ld+json"]').each((i, elem) => {
          try {
            const jsonData = JSON.parse($(elem).html() || '{}');
            // Check for Product schema
            if (jsonData['@type'] === 'Product' && jsonData.offers) {
              price = jsonData.offers.price || jsonData.offers.lowPrice || '';
            }
            // Check for array of schemas
            if (Array.isArray(jsonData)) {
              jsonData.forEach((item) => {
                if (item['@type'] === 'Product' && item.offers) {
                  price = item.offers.price || item.offers.lowPrice || '';
                }
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        });
      }

      // Try common price selectors as fallback
      if (!price) {
        const priceSelectors = [
          '.site-currency-lg',
          '.site-currency-attention-large',
          '.price',
          '[itemprop="price"]',
          '.product-price',
          '[data-price]',
        ];

        for (const selector of priceSelectors) {
          const priceEl = $(selector).first();
          const priceContent =
            priceEl.attr('content') || priceEl.text()?.trim();
          if (priceContent) {
            price = priceContent;
            break;
          }
        }
      }

      // Build response object
      const scrapedData = {
        url,
        title,
        favicon:
          $('link[rel="shortcut icon"]').attr('href') ||
          $('link[rel="icon"]').attr('href') ||
          '',
        description,
        image: imageUrl,
        imageEncoded,
        price,
        author: getMetaTag('author'),
        siteName: getMetaTag('site_name'),
        type: getMetaTag('type'),
      };

      log('Successfully scraped meta tags');

      const jsonResponse = {
        success: true,
        payload: scrapedData,
      };

      // Check response size - Appwrite has a 1MB response limit
      const responseSize = JSON.stringify(jsonResponse).length;
      log(`Response data size: ${responseSize} bytes`);

      // If response is too large, remove the encoded image and try again
      if (responseSize > 900 * 1024) {
        // 900KB to leave some margin
        log('Response too large, removing encoded image');
        scrapedData.imageEncoded = '';
        const newResponseSize = JSON.stringify(jsonResponse).length;
        log(`New response size: ${newResponseSize} bytes`);
      }

      return res.json(jsonResponse);
    } catch (err) {
      error(`Error in scrape function: ${err.message}`);

      return res.json(
        {
          success: false,
          message: err.message || 'Failed to scrape URL',
          error:
            process.env.APPWRITE_FUNCTION_ENV === 'development'
              ? err.stack
              : undefined,
        },
        500,
      );
    }
  } catch (fatalError) {
    // Last resort error handler to ensure we always return JSON
    error(`Fatal error in scrape function: ${fatalError.message}`);
    return res.json(
      {
        success: false,
        message: 'Internal server error',
        error: fatalError.message,
      },
      500,
    );
  }
};
