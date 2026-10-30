# Going live

## 1. API server
cd server && cp .env.example .env (fill in keys) && npm install && npm start
Frontend: copy ../.env.example to ../.env.local, then `npm run build` and host the `dist` folder.

## 2. Razorpay
- Put your key id/secret in server/.env.
- Dashboard → Webhooks: URL `https://api.yourdomain/api/payments/webhook`, event `payment.captured`, same secret as RZP_WEBHOOK_SECRET.

## 3. WordPress Multisite (subdomain mode)
- Install WordPress + WP-CLI, then `wp core multisite-install --subdomains --url=sitecraft.in --title=SiteCraft ...`
- Copy `wordpress/sitecraft` into wp-content/themes and network-enable it.
- Set WP_PATH in server/.env to the WordPress folder. The API then creates each site, activates the theme and stores the customer's content.

## 4. Wildcard DNS and SSL
- DNS: `A  *.sitecraft.in → your server IP`
- Certificate: `certbot certonly --manual --preferred-challenges dns -d sitecraft.in -d "*.sitecraft.in"` (or use your DNS provider's plugin for auto-renewal).
- Nginx: one server block with `server_name .sitecraft.in;` pointing at WordPress, and your API on its own hostname.

## 5. Before launch
Replace db.json with PostgreSQL/MySQL, enable daily backups, rate-limit the API, and run a security test.
