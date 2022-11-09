# webfinger-cloudflare-worker

So you want to use webfinger to map every user at your site so they can add @ to their email (e.g. @kurt@seifried.org) and use that as a Mastodon ID to redirect to whatever Mastodon ID they're actually using? 

Simply deploy webfinger-cloudflare-worker.js as a Cloudflare Worker using a route such as https://seifried.org/.well-known/webfinger* and populate the redirectMap data

This has obvious scale issues (a cloudflare worker can only be 1MB in size after compression), but it should work up to a few hundred (thousands?) users.

The obvious solution if you need to scale past this is to use Cloudflare KV to simply map a key of account name to the JSON data. PR's welcome.
