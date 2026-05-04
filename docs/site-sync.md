# Daily Site Content Sync

This project can sync content daily from:

- https://www.platz-ltd.co.jp/
- http://www.platz-cn.com/
- https://www.platz-ltd.com/

Synced content is saved into:

- `content/site-sync/<domain>/*.mdx`
- `content/site-sync/manifest.json`

## Run once

```bash
npm run sync:sites
```

## Run with larger crawl budget

```bash
npm run sync:sites:daily
```

## Optional flags

```bash
node scripts/sync-platz-sites.mjs --max-pages 80 --max-depth 3
node scripts/sync-platz-sites.mjs --timeout 20000
node scripts/sync-platz-sites.mjs --dry-run
```

## Daily automation (cron)

Run every day at 02:30:

```bash
crontab -e
```

Add:

```cron
30 2 * * * cd /Users/wlin/dev/platz && /usr/bin/env npm run sync:sites:daily >> /Users/wlin/dev/platz/logs/site-sync.log 2>&1
```

Create log folder once:

```bash
mkdir -p /Users/wlin/dev/platz/logs
```

## Notes

- The crawler keeps only same-origin links per site.
- Binary/non-HTML files are ignored.
- If `FIRECRAWL_API_KEY` (or `FIRECLOWER_API_KEY`) is configured, Firecrawl is used as the preferred extractor.
- If a page content has not changed, the file is not rewritten.
- If no page changed in a run, `content/site-sync/manifest.json` is left unchanged.
