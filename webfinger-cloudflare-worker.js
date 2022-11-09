// So you want to use webfinger to map every user at your site so they can add @ to their email (e.g. @kurt@seifried.org) and use that as a Mastodon ID to redirect to whatever Mastodon ID they're actually using?

// Simply deploy webfinger-cloudflare-worker.js as a Cloudflare Worker using a route such as https://seifried.org/.well-known/webfinger* and populate the redirectMap data

// This has obvious scale issues (a cloudflare worker can only be 1MB in size after compression), but it should work up to a few hundred (thousands?) users.

// The obvious solution if you need to scale past this is to use Cloudflare KV to simply map a key of account name to the JSON data. PR's welcome.
                                                                                                                                       
// Based off of https://developers.cloudflare.com/workers/examples/bulk-redirects/
// Based off of https://developers.cloudflare.com/workers/examples/return-json/
// and whatever the third(?) google result for "cloudflare worker query string" was
// Also thanks to https://jsoneditoronline.org/, cut and paste your webfinger json in and hit the minify button to get a string
// And https://docs.joinmastodon.org/spec/webfinger/

// Test cases:
// https://seifried.org/.well-known/webfinger?resource=acct:kurt@seifried.org
// https://seifried.org/.well-known/webfinger?resource=acct:kurt@seifried.org2

const redirectMap = new Map([
  ['kurt@seifried.org', '@kurtseifried@mastodon.social'],
  ['test@seifried.org', '@test@tld'],
]);

async function handleRequest(request) {
  const requestURL = new URL(request.url);
  const resourceKey = requestURL.searchParams.get('resource');
  const email = resourceKey.replace("acct:", "");
  const resourceData = redirectMap.get(email);
  if (resourceData) {
    const resourceArray = resourceData.split("@");
    const username = resourceArray[1];
    const hostname = resourceArray[2];
    const jsonData = '{"subject":"acct:' + email + '","aliases":["https://' + hostname + '/@' + username + '","https://' + hostname + '/users/' + username + '"],"links":[{"rel":"http://webfinger.net/rel/profile-page","type":"text/html","href":"https://' + hostname + '/@' + username + '"},{"rel":"self","type":"application/activity+json","href":"https://' + hostname + '/users/' + username + '"},{"rel":"http://ostatus.org/schema/1.0/subscribe","template":"https://' + hostname + '/authorize_interaction?uri={uri}"}]}';
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
