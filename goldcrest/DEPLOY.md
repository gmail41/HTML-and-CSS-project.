# Goldcrest Partners: deployment and indexing guide

## What is in this folder
Static site (HTML/CSS/JS, no build step): `index`, `strategy`, `portfolio`, `contact`, `portal`, `404`,
plus `robots.txt`, `sitemap.xml`, `favicon.svg`.

## 1. Replace placeholders before launch
- Domain: every file uses `https://www.example.com`. Replace it:
  `grep -rl "www.example.com" . | xargs sed -i 's#https://www.example.com#https://YOURDOMAIN#g'`
- Contact email/phone in `contact.html` and the home/portfolio copy (add real figures, photos).
- Confirm with counsel how the firm may describe itself (REIT is a defined legal/tax status) and that the footer disclaimer is adequate.

## 2. Host it (pick one, all free to start)
- **Vercel / Netlify / Cloudflare Pages**: connect the GitHub repo, set the root/publish directory to `goldcrest`, no build command.
- **GitHub Pages**: Settings > Pages, deploy from branch, folder must be `/` or `/docs`, so move this folder's contents to `/docs`.
Then add your custom domain in the host's dashboard and set the DNS records it shows you (HTTPS is automatic).

## 3. Make it crawlable by scrapers and search engines
- `robots.txt` allows all crawlers and points to `sitemap.xml`; `portal.html` is `noindex`.
- Each page has a unique title, description, canonical URL, Open Graph tags; the home page has Organization structured data.
- All content is plain server-delivered HTML, so simple scrapers can read it without running JavaScript.
- Submit the site: Google Search Console (verify domain, submit `/sitemap.xml`) and Bing Webmaster Tools.
- Check: `curl -I https://YOURDOMAIN/` returns 200; `https://YOURDOMAIN/robots.txt` and `/sitemap.xml` load.

## 4. Make the forms real
- Contact form: set `action` in `contact.html` to a form service (Formspree, Netlify Forms, Getform). Until then it shows a "not connected" notice.
- Investor portal: the page is a front-end shell. Real login needs an auth backend (Supabase Auth, Auth0, Clerk, or your host's password protection). Never check passwords in browser JavaScript.
