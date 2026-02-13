# Instagram Clone - Deployment Guide

## 🚀 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### Prerequisites
- Ubuntu 20.04+ or similar Linux server
- Node.js 18+
- MongoDB 6+
- Nginx (reverse proxy)
- PM2 (process manager)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 2: Deploy Application

```bash
# Clone your repository
cd /var/www
git clone your-repo-url instagram-clone
cd instagram-clone

# Install dependencies
npm install

# Create production .env
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/instagram-clone
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
EOF

# Build application
npm run build

# Start with PM2
pm2 start dist/main.js --name instagram-api
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/instagram-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/instagram-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
```

#### Step 2: Create docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/instagram-clone
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=7d
      - NODE_ENV=production
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo-data:
```

#### Step 3: Deploy with Docker

```bash
# Create .env file
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Scale application (multiple instances)
docker-compose up -d --scale app=3
```

---

### Option 3: Platform as a Service (Heroku/Railway)

#### Heroku Deployment

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create instagram-clone-api

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open app
heroku open
```

#### Railway Deployment

1. Connect GitHub repository
2. Add MongoDB database
3. Set environment variables in dashboard
4. Deploy automatically on git push

---

### Option 4: Serverless (AWS Lambda + API Gateway)

#### Using Serverless Framework

```bash
# Install Serverless
npm install -g serverless

# Create serverless.yml
cat > serverless.yml << EOF
service: instagram-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    MONGO_URI: \${env:MONGO_URI}
    JWT_SECRET: \${env:JWT_SECRET}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
  - serverless-dotenv-plugin
EOF

# Deploy
serverless deploy
```

---

## 🔒 Production Checklist

### Security

- [ ] **Environment Variables**
  - [ ] Strong JWT_SECRET (min 32 characters)
  - [ ] Secure MongoDB credentials
  - [ ] No hardcoded secrets

- [ ] **Database Security**
  - [ ] Enable MongoDB authentication
  - [ ] Use strong passwords
  - [ ] Whitelist IP addresses
  - [ ] Enable SSL/TLS

- [ ] **API Security**
  - [ ] Enable CORS properly
  - [ ] Implement rate limiting
  - [ ] Add request validation
  - [ ] Enable HTTPS only

- [ ] **File Upload**
  - [ ] Validate file types
  - [ ] Limit file sizes
  - [ ] Scan for malware
  - [ ] Use CDN for delivery

### Performance

- [ ] **Optimization**
  - [ ] Enable gzip compression
  - [ ] Set up Redis caching
  - [ ] Optimize database queries
  - [ ] Add database indexes

- [ ] **Monitoring**
  - [ ] Set up error tracking (Sentry)
  - [ ] Configure logging
  - [ ] Monitor server resources
  - [ ] Set up uptime monitoring

- [ ] **Scaling**
  - [ ] Load balancer configured
  - [ ] Auto-scaling enabled
  - [ ] CDN for static assets
  - [ ] Database replication

### Backup

- [ ] **Database**
  - [ ] Automated daily backups
  - [ ] Test restore process
  - [ ] Off-site backup storage

- [ ] **Application**
  - [ ] Version control (Git)
  - [ ] Tagged releases
  - [ ] Rollback strategy

---

## 📊 Monitoring Setup

### Application Monitoring (PM2)

```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs instagram-api

# PM2 plus (advanced monitoring)
pm2 plus
```

### Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/node

# Configure in main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Logging (Winston)

```bash
# Install Winston
npm install winston

# Configure logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/instagram-clone
            git pull
            npm install
            npm run build
            pm2 restart instagram-api
```

---

## 💾 Database Migration

### Backup Current Data

```bash
# Export data
mongodump --uri="mongodb://localhost:27017/instagram-clone" --out=/backup/$(date +%Y%m%d)

# Import data
mongorestore --uri="mongodb://production:27017/instagram-clone" /backup/20240101
```

### MongoDB Atlas (Managed MongoDB)

1. Create cluster on MongoDB Atlas
2. Whitelist application server IP
3. Get connection string
4. Update MONGO_URI in .env
5. Migrate data using mongodump/mongorestore

---

## 📈 Scaling Strategy

### Vertical Scaling
```
Small:  2 vCPU, 4GB RAM  → 100 concurrent users
Medium: 4 vCPU, 8GB RAM  → 500 concurrent users
Large:  8 vCPU, 16GB RAM → 2000 concurrent users
```

### Horizontal Scaling
```
Load Balancer
    ├─► NestJS Instance 1
    ├─► NestJS Instance 2
    ├─► NestJS Instance 3
    └─► NestJS Instance N

MongoDB Replica Set
    ├─► Primary
    ├─► Secondary 1
    └─► Secondary 2
```

---

## 🔧 Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check API response times
- Review database performance

**Weekly:**
- Update dependencies
- Review security alerts
- Backup verification

**Monthly:**
- Security patches
- Performance optimization
- Capacity planning

### Update Process

```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Test application
npm test

# Deploy update
pm2 restart instagram-api
```

---

## 📞 Support & Troubleshooting

### Common Issues

**High Memory Usage:**
```bash
# Check memory
pm2 monit

# Increase Node memory limit
pm2 start dist/main.js --name instagram-api --node-args="--max-old-space-size=4096"
```

**Database Connection Issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

**Nginx Errors:**
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🎯 Post-Deployment

1. **Test all endpoints** using Swagger or Postman
2. **Set up monitoring** alerts
3. **Configure backups** schedule
4. **Document** deployment process
5. **Train** team on maintenance

---

**Your Instagram clone is now production-ready! 🚀**
