# Cloudflare image setup (R2 + Worker)

Menu photos are stored in Cloudflare R2 and served by a small Worker, so they no longer use Supabase egress.
Item names, prices, categories and logins stay in Supabase.

1. Cloudflare dashboard -> R2 Object Storage -> Create bucket, name: `sadonya-images`.
2. Workers & Pages -> Create -> Worker, name: `sadonya-images` -> Deploy -> Edit code.
   Replace everything with the contents of `worker.js` -> Deploy.
3. Worker -> Settings -> Bindings -> Add -> R2 bucket. Variable name: `BUCKET`, bucket: `sadonya-images`. Save/Deploy.
4. Copy the Worker address (https://sadonya-images.<something>.workers.dev).
5. Put it in `assets/js/config-cafe.js` and `assets/js/config-plus.js` as `imageApi` (no trailing slash).
6. Deploy the site to Netlify.
7. Log in at /menu#admin -> Items -> "Move images to Cloudflare". Repeat at /plus#admin.
