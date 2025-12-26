import { Client, Databases, ID } from 'node-appwrite';
import { load } from 'cheerio';
import { fetch } from 'undici';

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
  // Log the incoming request
  log('Scrape meta tags function invoked');

  try {
    // Parse the request body
    const payload = JSON.parse(req.body || '{}');
    const { url } = payload;

    // Validate URL
    if (!url) {
      error('No URL provided in payload');
      return res.json({
        success: false,
        message: 'URL is required in the request payload',
      }, 400);
    }

    log(`Scraping URL: ${url}`);

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WishareBot/2.0; +https://wishare.app)',
      },
      redirect: 'follow',
      timeout: 10000, // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
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
    let imageUrl = getMetaTag('image');
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
        
        // Fetch and encode image
        const imageResponse = await fetch(imageUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WishareBot/2.0)',
          },
        });

        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          
          // Determine image type from URL or default to jpg
          const imageMatch = imageUrl.match(/\.([^\./\?\#]+)($|\?|\#)/);
          const imageType = imageMatch?.[1] || 'jpg';
          
          imageEncoded = `data:image/${imageType};base64,${buffer.toString('base64')}`;
          log('Image successfully encoded');
        } else {
          log(`Image fetch failed: ${imageResponse.status}`);
        }
      } catch (imageError) {
        error(`Failed to fetch/encode image: ${imageError.message}`);
        // Continue without image
      }
    }

    // Build response object
    const scrapedData = {
      url,
      title: $('title').first().text()?.trim() || '',
      favicon: $('link[rel="shortcut icon"]').attr('href') || 
               $('link[rel="icon"]').attr('href') || '',
      description: getMetaTag('description'),
      image: imageUrl,
      imageEncoded,
      price: getMetaTag('price') || 
             $('meta[property="product:price:amount"]').attr('content') || '',
      author: getMetaTag('author'),
      siteName: getMetaTag('site_name'),
      type: getMetaTag('type'),
    };

    log('Successfully scraped meta tags');

    return res.json({
      success: true,
      payload: scrapedData,
    });

  } catch (err) {
    error(`Error in scrape function: ${err.message}`);
    
    return res.json({
      success: false,
      message: err.message || 'Failed to scrape URL',
      error: process.env.APPWRITE_FUNCTION_ENV === 'development' ? err.stack : undefined,
    }, 500);
  }
};
