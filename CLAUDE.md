# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file Cloudflare Worker that serves the WebFinger protocol
(`/.well-known/webfinger`) so that `user@yourdomain.example` resolves to that
person's Mastodon account. It exists so people can hand out their email address
as a Fediverse handle while their actual account lives on some other instance.

The entire implementation is `webfinger-cloudflare-worker.js` (~53 lines). There
is no `package.json`, no `wrangler.toml`, no build step, no test suite, and no
dependencies. Do not introduce a toolchain unless asked — the lack of one is the
design.

## Deploy and test

Deployment is manual: paste `webfinger-cloudflare-worker.js` into the Cloudflare
dashboard Worker editor and bind it to a route matching
`https://<domain>/.well-known/webfinger*`.

Testing is done against the live route by hand (the canonical cases are recorded
in the file's header comments):

```
# hit — returns WebFinger JSON
curl 'https://seifried.org/.well-known/webfinger?resource=acct:kurt@seifried.org'

# miss — returns empty body, 404
curl -i 'https://seifried.org/.well-known/webfinger?resource=acct:nobody@seifried.org'
```

## How it works

`redirectMap` is a module-level `Map` from email address to Mastodon handle.
`handleRequest` strips the `acct:` prefix off the `resource` query parameter,
looks up the result, and hand-builds the WebFinger JRD response by string
concatenation.

### The `@` prefix in map values is load-bearing

Values are stored as `'@username@instance.tld'` and parsed with
`.split("@")`, which yields `["", username, instance]`. The empty string at
index 0 is exactly why the code reads `resourceArray[1]` and `resourceArray[2]`.
Omitting the leading `@` when adding an entry does not throw — it produces a
200 response containing `https://undefined/...` URLs. Keep the format exact when
adding users.

### Response JSON is a concatenated string, deliberately

The JRD is built as one long string literal rather than via `JSON.stringify` on
an object. Per the header comments the author authors these by minifying real
WebFinger JSON in jsoneditoronline.org and pasting the result. Preserve the
Mastodon-compatible shape (`subject`, `aliases`, and the three `links` rels:
profile-page, `self`, and the ostatus subscribe template) — see
https://docs.joinmastodon.org/spec/webfinger/.

## Known limitations and roadmap

Both open TODOs (`wrangler` deployment, KV-backed storage) are gated on the same
migration, which is worth knowing before starting either:

The worker uses the legacy service-worker syntax
(`addEventListener('fetch', ...)`). That form never receives an `env` argument,
so it cannot access bindings. Anything involving a KV namespace or a
wrangler-managed binding requires first converting to the ES-module form:

```js
export default {
  async fetch(request, env, ctx) { /* ... */ }
};
```

Other current behavior to be aware of:

- **Scale.** Users are compiled into the source, and a Worker is capped at 1 MB
  compressed. Fine for hundreds of users; the README's stated fix is moving
  `redirectMap` into Cloudflare KV keyed by account name.
- **A request with no `resource` parameter throws.** `searchParams.get` returns
  `null` and `.replace` on it raises a `TypeError`, surfacing as a 500 rather
  than the 400 the spec would call for.
- **No CORS headers.** Some Fediverse clients expect
  `Access-Control-Allow-Origin: *` on WebFinger responses.
