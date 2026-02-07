import PocketBase from 'pocketbase';

const url = import.meta.env.VITE_POCKETBASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8090' : 'https://pb.hagendigital.com/');

// Override global fetch to remove skipTotal parameter from PocketBase requests
// This is required for older PocketBase servers that don't support it
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  let urlString = typeof input === 'string' ? input : input.url;
  let modifiedInput = input;
  let modifiedInit = init;

  // Only modify PocketBase API requests
  if (urlString.includes('/api/collections/')) {
    // Remove skipTotal parameter from URL
    const urlObj = new URL(urlString);
    urlObj.searchParams.delete('skipTotal');
    const cleanUrl = urlObj.toString();

    // DEBUG: Log exactly what's being sent
    console.log('🔍 PB Request:', {
      url: cleanUrl,
      method: init?.method || 'GET',
      headers: init?.headers || 'none',
    });

    // Just replace the URL string, keep everything else
    if (typeof input === 'string') {
      modifiedInput = cleanUrl;
    } else {
      // For Request objects, clone with new URL
      modifiedInput = new Request(cleanUrl, input);
    }
  }

  const response = await originalFetch.call(this, modifiedInput, modifiedInit);

  // DEBUG: Log response status for API calls
  if (urlString.includes('/api/collections/')) {
    if (response.status >= 400) {
      // Clone response to read body without consuming it
      const cloned = response.clone();
      try {
        const errorBody = await cloned.text();
        console.log('❌ PB Error:', response.status, errorBody);
      } catch (e) {
        console.log('❌ PB Error:', response.status, '(could not read body)');
      }
    } else {
      console.log('✅ PB Response:', response.status);
    }
  }

  return response;
};

const pb = new PocketBase(url);
pb.autoCancellation(false);

export default pb;
