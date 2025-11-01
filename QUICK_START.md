# OneDrive Clone - Quick Start Guide

Get your OneDrive clone up and running in **10 minutes**!

## Prerequisites Installation

### macOS (using Homebrew)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install go node mysql docker

# Start Docker Desktop
open -a Docker
```

### Linux (Ubuntu/Debian)
```bash
# Install Go
wget https://go.dev/dl/go1.25.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.25.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install mysql-server

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
```

---

## Option 1: Docker Setup (Easiest)

### Step 1: Create Docker Compose File

```bash
cd /Users/sauhardgupta/onedrive-clone
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: onedrive-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: cells
      MYSQL_USER: cells
      MYSQL_PASSWORD: cellspassword
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - onedrive_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: onedrive-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - onedrive_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  cells:
    build:
      context: ./cells
      dockerfile: Dockerfile
    container_name: onedrive-cells
    depends_on:
      mysql:
        condition: service_healthy
      minio:
        condition: service_healthy
    environment:
      CELLS_BIND: 0.0.0.0:8080
      CELLS_EXTERNAL: http://localhost:8080
      CELLS_NO_SSL: "1"
      CELLS_WORKING_DIR: /var/cells
    volumes:
      - cells_data:/var/cells
      - cells_logs:/var/cells/logs
    ports:
      - "8080:8080"
    networks:
      - onedrive_network

volumes:
  mysql_data:
  minio_data:
  cells_data:
  cells_logs:

networks:
  onedrive_network:
    driver: bridge
```

### Step 2: Create Dockerfile for Pydio Cells

Create `cells/Dockerfile`:
```dockerfile
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY . .

RUN apk add --no-cache git make
RUN make dev

FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /var/cells

COPY --from=builder /app/cells /usr/local/bin/cells

EXPOSE 8080

CMD ["cells", "start"]
```

### Step 3: Start Everything

```bash
# Build and start all services
docker-compose up -d

# Wait for services to be ready (about 2-3 minutes)
docker-compose logs -f cells

# You should see: "Pydio Cells is ready"
```

### Step 4: Access Pydio Cells

Open browser: http://localhost:8080

**Initial Setup Wizard:**
1. Choose language: English
2. Database:
   - Type: MySQL
   - Host: `mysql` (Docker service name)
   - Port: `3306`
   - Database: `cells`
   - User: `cells`
   - Password: `cellspassword`
3. Storage:
   - Type: MinIO (S3)
   - Endpoint: `minio:9000`
   - Access Key: `minioadmin`
   - Secret Key: `minioadmin123`
   - Bucket: `cells-data`
4. Admin User:
   - Login: `admin`
   - Password: `admin123` (change this!)
   - Email: `admin@example.com`
5. Finish setup

---

## Option 2: Local Setup (More Control)

### Step 1: Build Pydio Cells

```bash
cd cells

# Build
make dev

# This creates ./cells executable
```

### Step 2: Start MySQL

```bash
# Using Docker
docker run -d \
  --name cells-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=cells \
  -e MYSQL_USER=cells \
  -e MYSQL_PASSWORD=cellspass \
  -p 3306:3306 \
  mysql:8.0

# Or use local MySQL
mysql -u root -p
CREATE DATABASE cells;
CREATE USER 'cells'@'localhost' IDENTIFIED BY 'cellspass';
GRANT ALL PRIVILEGES ON cells.* TO 'cells'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Start MinIO

```bash
# Using Docker
docker run -d \
  --name cells-minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -p 9000:9000 \
  -p 9001:9001 \
  minio/minio:latest \
  server /data --console-address ":9001"

# Access MinIO Console: http://localhost:9001
# Login: minioadmin / minioadmin123
```

### Step 4: Configure & Start Pydio Cells

```bash
cd cells

# Run interactive installer
./cells install

# Or use non-interactive install
./cells configure \
  --bind 0.0.0.0:8080 \
  --external http://localhost:8080 \
  --db_driver mysql \
  --db_dsn "cells:cellspass@tcp(localhost:3306)/cells" \
  --storage_type s3 \
  --storage_endpoint localhost:9000 \
  --storage_key minioadmin \
  --storage_secret minioadmin123 \
  --admin_login admin \
  --admin_password admin123

# Start Pydio Cells
./cells start

# Access: http://localhost:8080
```

---

## Frontend Setup

### Step 1: Create Next.js Project

```bash
cd /Users/sauhardgupta/onedrive-clone

# Create frontend directory
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd frontend
```

### Step 2: Install Dependencies

```bash
npm install zustand axios
npm install @uppy/core @uppy/dashboard @uppy/xhr-upload
npm install date-fns clsx tailwind-merge
npm install @headlessui/react @heroicons/react
npm install framer-motion
npm install @tanstack/react-query
```

### Step 3: Environment Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### Step 4: Create Basic Structure

```bash
# Create directory structure
mkdir -p src/{components,lib,store,types}
mkdir -p src/components/{layout,files,upload,modals}
mkdir -p src/lib/{api,websocket,utils}
```

Create `src/lib/api/client.ts`:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

Create `src/app/page.tsx`:
```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">OneDrive Clone</h1>
        <p className="text-gray-600 mb-8">Building Microsoft OneDrive with Pydio Cells</p>
        <a
          href="/files"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Open Files
        </a>
      </div>
    </main>
  );
}
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open: http://localhost:3000

---

## Testing the Setup

### 1. Test Backend API

```bash
# Test login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'

# Should return JWT token
```

### 2. Test File Upload

```bash
# Get token from login response
TOKEN="your-jwt-token"

# Upload test file
echo "Hello OneDrive Clone" > test.txt

curl -X PUT http://localhost:8080/io/my-files/test.txt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary "@test.txt"
```

### 3. Test File List

```bash
curl -X POST http://localhost:8080/api/v2/lookup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope":"path","path":"/my-files"}'
```

---

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find process using port
lsof -i :8080
# Kill it
kill -9 <PID>
```

**MySQL connection failed:**
```bash
# Check MySQL is running
docker ps | grep mysql

# Check logs
docker logs cells-mysql

# Restart MySQL
docker restart cells-mysql
```

**MinIO connection failed:**
```bash
# Check MinIO is running
docker ps | grep minio

# Access MinIO console
open http://localhost:9001

# Restart MinIO
docker restart cells-minio
```

**Pydio Cells won't start:**
```bash
# Check logs
docker logs onedrive-cells

# Or for local install
tail -f /var/cells/logs/cells.log

# Reset configuration
rm -rf /var/cells/*
./cells install
```

### Frontend Issues

**API connection failed:**
```bash
# Verify API URL
echo $NEXT_PUBLIC_API_URL

# Test connection
curl http://localhost:8080/api/v2/health

# Check CORS (add to Pydio Cells config if needed)
```

**Dependencies installation failed:**
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Next Steps

### 1. Implement Authentication
- Create login page
- Create auth store
- Add protected routes

### 2. Build File Browser
- List files component
- Grid/List view toggle
- File selection

### 3. Add Upload Functionality
- Drag-and-drop zone
- Upload progress
- Multi-file upload

### 4. Implement Core Features
- Create folder
- Rename/Delete
- Move files
- Search

### 5. Add Advanced Features
- File sharing
- Version history
- Real-time sync

---

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
cd cells
./cells start

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database (if needed)
docker-compose logs -f mysql

# Terminal 4: Git
git status
git add .
git commit -m "Add feature"
```

### Testing

```bash
# Run frontend tests
npm test

# Run E2E tests
npm run test:e2e

# Manual testing checklist in README.md
```

### Building for Production

```bash
# Frontend
npm run build
npm run start

# Backend
make build
./cells start --config production.yml
```

---

## Useful Commands

### Docker

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Stop all
docker-compose down

# Clean up volumes (WARNING: deletes data)
docker-compose down -v
```

### Pydio Cells

```bash
# Check status
./cells status

# View config
./cells config list

# Reset admin password
./cells admin reset-password

# Clear cache
./cells clear cache

# Run maintenance
./cells admin maintenance
```

### Frontend

```bash
# Dev server
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

---

## Resources

- **Pydio Cells Docs**: https://pydio.com/en/docs/cells/v4
- **Next.js Docs**: https://nextjs.org/docs
- **API Reference**: [API_MAPPING.md](API_MAPPING.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Implementation Plan**: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

---

## Support

If you encounter issues:

1. Check logs:
   - Backend: `docker logs onedrive-cells`
   - MySQL: `docker logs onedrive-mysql`
   - MinIO: `docker logs onedrive-minio`
   - Frontend: Browser console

2. Verify services are running:
   ```bash
   docker-compose ps
   curl http://localhost:8080/api/v2/health
   ```

3. Review documentation:
   - [ARCHITECTURE.md](ARCHITECTURE.md)
   - [API_MAPPING.md](API_MAPPING.md)

4. Create GitHub issue with:
   - Error message
   - Log output
   - Steps to reproduce

---

**You're now ready to build your OneDrive clone! 🚀**

Start with the authentication flow, then file listing, then upload. Follow the [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed steps.
