// Based off of https://developers.cloudflare.com/workers/examples/bulk-redirects/
// Based off of https://developers.cloudflare.com/workers/examples/return-json/
// and whatever the third(?) google result for "cloudflare worker query string" was
// Also thanks to https://jsoneditoronline.org/, cut and paste your webfinger json in and hit the minify button to get a string

// Test cases:
// https://seifried.org/.well-known/webfinger?resource=acct:kurt@seifried.org
// https://seifried.org/.well-known/webfinger?resource=acct:kurt@seifried.org2

const redirectMap = new Map([
  ['kurt@seifried.org', '{"subject":"acct:kurt@seifried.org","aliases":["https://mastodon.social/@kurtseifried","https://mastodon.social/users/kurtseifried"],"links":[{"rel":"http://webfinger.net/rel/profile-page","type":"text/html","href":"https://mastodon.social/@kurtseifried"},{"rel":"self","type":"application/activity+json","href":"https://mastodon.social/users/kurtseifried"},{"rel":"http://ostatus.org/schema/1.0/subscribe","template":"https://mastodon.social/authorize_interaction?uri={uri}"}]}'],
  ['test@seifried.org', '{"moredata": "here"}'],
]);

async function handleRequest(request) {
  const requestURL = new URL(request.url);
  const resourceKey = requestURL.searchParams.get('resource');
  const email = resourceKey.replace("acct:", "");
  const resourceData = redirectMap.get(email);
  if (resourceData) {
const jsonData = resourceData
    return new Response(jsonData, {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        },
        });
      }
  // If request not in map, return empty string and 404
  return new Response('', {
        status: 404
      });
}

addEventListener('fetch', async event => {
  event.respondWith(handleRequest(event.request));
});
