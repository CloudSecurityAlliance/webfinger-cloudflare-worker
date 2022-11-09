// This implements https://en.wikipedia.org/wiki/WebFinger for multiple accounts
// Based off of https://developers.cloudflare.com/workers/examples/bulk-redirects/
// Based off of https://developers.cloudflare.com/workers/examples/return-json/
// and whatever the third(?) google result for "cloudflare worker query string" was
// Also thanks to https://jsoneditoronline.org/, cut and paste your webfinger json in and hit the minify button to get a string

// Route looks like: https://seifried.org/.well-known/webfinger*

const redirectMap = new Map([
  ['acct:kurt@seifried.org', '{"subject":"acct:kurt@seifried.org","aliases":["https://mastodon.social/@kurtseifried","https://mastodon.social/users/kurtseifried"],"links":[{"rel":"http://webfinger.net/rel/profile-page","type":"text/html","href":"https://mastodon.social/@kurtseifried"},{"rel":"self","type":"application/activity+json","href":"https://mastodon.social/users/kurtseifried"},{"rel":"http://ostatus.org/schema/1.0/subscribe","template":"https://mastodon.social/authorize_interaction?uri={uri}"}]}'],
  ['acct:test@seifried.org', '{"moredata": "here"}'],
]);

async function handleRequest(request) {
  const requestURL = new URL(request.url);
  const resource = requestURL.searchParams.get('resource');
  const jsonData = redirectMap.get(resource);
  if (jsonData) {
    return new Response(jsonData, {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        },
        });
      }
  // If request not in map, return the original request
  return fetch(request);
}

addEventListener('fetch', async event => {
  event.respondWith(handleRequest(event.request));
});
