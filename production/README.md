Wax Hands PWA - Production Build

Launch:
Windows: start.bat

Manual launch:
Backend: cd backend, set NODE_ENV=production, node dist/index.js
Frontend: npm run preview

Structure:
dist/ - Frontend files
backend/ - Backend application
backend/dist/ - Compiled backend
backend/uploads/ - Uploaded files
.env - Environment variables

Setup:
1. Copy .env.production to .env
2. Replace your-domain.com with your domain
3. Configure PostgreSQL database
4. Install SSL certificate

Requirements:
Node.js 18+
PostgreSQL 12+
Nginx (for production)
SSL certificate

Support:
Check environment variables, database connection, file permissions, logs
