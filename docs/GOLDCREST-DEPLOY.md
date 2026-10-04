# Goldcrest Partners: deployment guide

(Kept outside the `goldcrest/` publish folder so it is never served by the website.)

## Layout
`goldcrest/` is the website. Static pages plus two server functions in `goldcrest/api/`:
- `api/contact.js` receives the contact form and emails it. The recipient address exists only as a server environment variable.
- `api/portal.js` handles the investor-portal sign-in request. Server code is never sent to the browser.

## 1. Host on Vercel (needed for the functions)
1. Import the GitHub repo into Vercel.
2. Set **Root Directory** to `goldcrest`. No build command.
3. Add your domain and set the DNS records Vercel shows.

## 2. Set environment variables (Vercel > Project > Settings > Environment Variables)
| Name | Value |
|---|---|
| `RESEND_API_KEY` | API key from resend.com |
| `CONTACT_TO_EMAIL` | the inbox that should receive inquiries |
| `CONTACT_FROM_EMAIL` | a sender on a domain verified in Resend (e.g. `Goldcrest <noreply@yourdomain>`) |

Never commit these. Redeploy after adding them. Until they are set, the form shows "Unable to send your message right now."

## 3. Replace placeholders
`https://www.example.com` appears in canonical URLs, `sitemap.xml` and `robots.txt`:
`grep -rl "www.example.com" goldcrest | xargs sed -i 's#https://www.example.com#https://YOURDOMAIN#g'`

## 4. Search and crawler readiness
`robots.txt` and `sitemap.xml` are included, each page has a title, description and canonical URL, and the portal page is `noindex`. Submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Security notes
- Anything in HTML/JS/CSS is visible to visitors. Secrets and routing belong in `api/` and environment variables only.
- `vercel.json` sets security headers (CSP, HSTS, frame denial, nosniff).
- The contact function validates input, strips line breaks from header fields, caps lengths, drops honeypot hits and rate-limits per IP (in memory per instance; use a store like Upstash for strict limits).
- Rotate the Resend key if it is ever exposed.
