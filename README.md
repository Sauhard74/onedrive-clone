# Microsoft OneDrive Clone

A high-fidelity clone of Microsoft OneDrive built with **Pydio Cells** backend and **Next.js** frontend, replicating all core features including file storage, synchronization, sharing, version history, and real-time collaboration.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Testing](#testing)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### ✅ Core Features Implemented

#### User & Authentication
- [x] User registration and login
- [x] JWT-based authentication
- [x] OAuth2 support
- [x] Account details page
- [x] Storage quota tracking

#### File Storage & Management
- [x] Upload files (single & multiple)
- [x] Download files
- [x] Create folders
- [x] Rename files/folders
- [x] Delete files/folders
- [x] Move files (drag-and-drop)
- [x] Copy files
- [x] Folder hierarchy navigation
- [x] Breadcrumb navigation
- [x] File metadata display (size, type, date, owner)
- [x] Upload progress tracking
- [x] Multi-part upload for large files

#### Cloud Synchronization
- [x] Real-time file sync across clients
- [x] WebSocket-based updates
- [x] Sync status indicators (synced, syncing, failed)
- [x] Conflict detection and resolution
- [x] Auto-refresh on file changes

#### File Version History
- [x] Automatic version creation on file updates
- [x] Version history viewer
- [x] Restore previous versions
- [x] Version metadata (timestamp, author)
- [x] Version comparison

#### File Preview & Viewer
- [x] Image preview (JPG, PNG, GIF, SVG)
- [x] PDF viewer
- [x] Text file viewer
- [x] Video player
- [x] Audio player
- [x] Inline preview without download
- [x] Office file preview (WOPI integration)

#### Sharing & Permissions
- [x] Share files/folders via public links
- [x] Share with specific users
- [x] Permission levels (View, Edit, Comment)
- [x] Password-protected links
- [x] Link expiration dates
- [x] "Shared with me" view
- [x] "Shared by me" view
- [x] Revoke access
- [x] Access list management

#### Search & Filters
- [x] Full-text search
- [x] Search by file name, type, owner
- [x] Filter by date, size, type
- [x] Sort by name, date, size
- [x] Search suggestions
- [x] Advanced search filters

#### Recent & Favorites
- [x] Recent files view
- [x] Star/favorite files
- [x] Quick access to favorites
- [x] Recent activity timeline

#### Recycle Bin
- [x] Soft delete to recycle bin
- [x] Restore deleted items
- [x] Permanent delete
- [x] Auto-purge after 30 days
- [x] Bulk restore/delete

#### Collaboration & Notifications
- [x] Real-time activity feed
- [x] Notification system
- [x] File comments
- [x] Comment threads
- [x] @mentions in comments
- [x] Email notifications

#### UI/UX
- [x] Exact OneDrive DOM structure
- [x] Grid view
- [x] List view
- [x] Light mode
- [x] Dark mode
- [x] Responsive design (mobile, tablet, desktop)
- [x] Context menus
- [x] Keyboard shortcuts
- [x] Drag-and-drop interface
- [x] Multi-file selection
- [x] Loading states & skeletons

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **API Client**: Axios
- **File Upload**: Uppy
- **Real-time**: Socket.io Client
- **Date Handling**: date-fns
- **Icons**: Heroicons
- **Animations**: Framer Motion

### Backend (Pydio Cells)
- **Language**: Go 1.25+
- **Architecture**: Microservices (gRPC)
- **API**: REST API v2 + WebSocket
- **Authentication**: OAuth2/JWT
- **Object Storage**: MinIO (S3-compatible)
- **Database**: MySQL 8.0 / PostgreSQL 14+
- **Search Engine**: Bleve
- **Message Broker**: NATS (optional)
- **Caching**: Redis (optional)

### DevOps
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana (optional)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  Next.js Frontend (React + TypeScript)                  │
│  - OneDrive UI Clone                                    │
│  - Real-time WebSocket connection                       │
└─────────────────────────────────────────────────────────┘
                        ↓ HTTP/WS
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY                            │
│  REST API v2 | S3 Gateway | WebSocket | OAuth           │
└─────────────────────────────────────────────────────────┘
                        ↓ gRPC
┌─────────────────────────────────────────────────────────┐
│              MICROSERVICES (Pydio Cells)                 │
│  Tree | Meta | Search | Versions | ACL | Share          │
│  User | Role | Workspace | Activity | Mailer            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  STORAGE LAYER                           │
│  MinIO (S3) | MySQL/Postgres | Bleve Search             │
└─────────────────────────────────────────────────────────┘
```

**For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md)**

---

## Quick Start

### Prerequisites

- **Go** 1.25 or higher
- **Node.js** 18 or higher
- **Docker** & Docker Compose
- **MySQL** 8.0 or **PostgreSQL** 14+
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/onedrive-clone.git
cd onedrive-clone
```

#### 2. Start Backend (Pydio Cells)

**Option A: Using Docker Compose (Recommended)**

```bash
# Start all services (MySQL, MinIO, Pydio Cells)
docker-compose up -d

# Check logs
docker-compose logs -f cells

# Access Pydio Cells at http://localhost:8080
```

**Option B: Local Installation**

```bash
cd cells

# Build Pydio Cells
make dev

# Run installation wizard
./cells install

# Start server
./cells start
```

During installation, configure:
- **Database**: MySQL (localhost:3306)
- **Storage**: MinIO (localhost:9000)
- **Admin credentials**: admin / admin (change in production!)
- **External URL**: http://localhost:8080

#### 3. Setup Frontend

```bash
# Install dependencies
cd ../frontend
npm install

# Create environment file
cp .env.example .env.local

# Update .env.local with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:8080

# Start development server
npm run dev

# Access frontend at http://localhost:3000
```

#### 4. Test the Application

1. Open http://localhost:3000
2. Login with admin credentials
3. Upload a test file
4. Try creating folders, sharing, searching

---

## API Documentation

### Authentication

**Login**
```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "login": "admin",
  "password": "password"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### File Operations

**List Files**
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "path",
  "path": "/my-files",
  "recursive": false
}

Response:
{
  "nodes": [ ... ],
  "total": 50
}
```

**Upload File**
```http
PUT /io/my-files/document.pdf
Authorization: Bearer <token>
Content-Type: application/pdf

[binary data]
```

**Download File**
```http
GET /io/my-files/document.pdf
Authorization: Bearer <token>

Response: [binary stream]
```

**Create Folder**
```http
POST /api/v2/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "/my-files/new-folder",
  "type": "COLLECTION"
}
```

**Delete Files**
```http
DELETE /api/v2/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodes": ["/my-files/file1.txt", "/my-files/file2.txt"]
}
```

### Sharing

**Create Share Link**
```http
POST /api/v2/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodePath": "/my-files/document.pdf",
  "permission": "read",
  "passwordProtected": true,
  "password": "secret",
  "expiresAt": "2024-12-31T23:59:59Z"
}

Response:
{
  "uuid": "share-uuid",
  "linkUrl": "https://domain.com/s/abc123"
}
```

### Versions

**List Versions**
```http
GET /api/v2/versions/<node-uuid>
Authorization: Bearer <token>

Response:
{
  "versions": [
    {
      "versionId": "v1",
      "createdAt": "2024-01-01T10:00:00Z",
      "size": 1024
    }
  ]
}
```

**For complete API docs, see [ARCHITECTURE.md#api-integration](ARCHITECTURE.md#api-integration)**

---

## Project Structure

```
onedrive-clone/
├── cells/                          # Pydio Cells backend
│   ├── main.go                     # Entry point
│   ├── common/                     # Shared libraries
│   ├── data/                       # Data services
│   ├── gateway/                    # API gateways
│   ├── idm/                        # Identity management
│   └── ...
│
├── frontend/                       # Next.js frontend
│   ├── src/
│   │   ├── app/                    # Next.js app router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (main)/
│   │   │   │   ├── files/          # File browser
│   │   │   │   ├── recent/         # Recent files
│   │   │   │   ├── shared/         # Shared files
│   │   │   │   └── recycle/        # Recycle bin
│   │   │   └── layout.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/             # Layout components
│   │   │   ├── files/              # File components
│   │   │   ├── upload/             # Upload components
│   │   │   ├── modals/             # Modal dialogs
│   │   │   └── common/             # Shared components
│   │   │
│   │   ├── lib/
│   │   │   ├── api/                # API clients
│   │   │   ├── websocket/          # WebSocket client
│   │   │   ├── utils/              # Utilities
│   │   │   └── hooks/              # Custom hooks
│   │   │
│   │   ├── store/                  # Zustand stores
│   │   │   ├── auth.store.ts
│   │   │   ├── files.store.ts
│   │   │   └── ui.store.ts
│   │   │
│   │   └── types/                  # TypeScript types
│   │
│   ├── public/                     # Static assets
│   ├── package.json
│   └── tailwind.config.ts
│
├── docker-compose.yml              # Docker setup
├── ARCHITECTURE.md                 # Architecture docs
├── IMPLEMENTATION_PLAN.md          # Implementation guide
└── README.md                       # This file
```

---

## Development Guide

### Running Locally

**Backend:**
```bash
cd cells
./cells start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Making Changes

1. **Backend Changes**: Modify Go code in `cells/`, rebuild with `make dev`
2. **Frontend Changes**: Edit React components in `frontend/src/`, hot reload is automatic
3. **API Changes**: Update API client in `frontend/src/lib/api/`

### Adding New Features

1. **Check Architecture**: Review [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Plan Implementation**: Follow patterns in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
3. **Write Code**: Follow existing patterns
4. **Test**: Write unit and E2E tests
5. **Document**: Update README and ARCHITECTURE.md

### Code Style

**Frontend:**
- Use TypeScript strict mode
- Follow React best practices
- Use Prettier for formatting
- Use ESLint for linting

**Backend:**
- Follow Go conventions
- Use `gofmt` for formatting
- Follow Pydio Cells patterns

---

## Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

1. **Backend**: Deploy Pydio Cells with production config
   ```bash
   ./cells configure --bind 0.0.0.0:443 --external https://your-domain.com
   ./cells start
   ```

2. **Frontend**: Build and deploy Next.js
   ```bash
   npm run build
   npm run start
   # Or deploy to Vercel/Netlify
   ```

3. **Database**: Use managed MySQL/PostgreSQL
4. **Storage**: Use production MinIO or S3
5. **SSL**: Configure Let's Encrypt or use Cloudflare
6. **Monitoring**: Set up logging and metrics

### Environment Variables

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com/ws
```

**Backend (Pydio Cells):**
```env
CELLS_EXTERNAL=https://your-domain.com
CELLS_BIND=0.0.0.0:443
MYSQL_HOST=your-db-host
MYSQL_DATABASE=cells
MINIO_ENDPOINT=your-minio-endpoint
```

---

## Testing

### Unit Tests

```bash
# Frontend
cd frontend
npm run test

# Backend
cd cells
go test ./...
```

### E2E Tests

```bash
# Run Playwright tests
cd frontend
npm run test:e2e
```

### Manual Testing Checklist

- [ ] User can register and login
- [ ] User can upload files
- [ ] User can create folders
- [ ] User can rename files/folders
- [ ] User can delete files/folders
- [ ] User can move files via drag-and-drop
- [ ] User can search files
- [ ] User can preview images/PDFs
- [ ] User can share files via link
- [ ] User can share with specific users
- [ ] User can view version history
- [ ] User can restore old versions
- [ ] User can star/favorite files
- [ ] User can view recent files
- [ ] User can restore from recycle bin
- [ ] Real-time sync works across tabs
- [ ] Notifications appear for file changes
- [ ] Light/dark mode toggle works
- [ ] Mobile view is responsive

---

## Screenshots

### File Browser
![File Browser - Grid View](screenshots/file-browser-grid.png)

### File List View
![File Browser - List View](screenshots/file-browser-list.png)

### File Sharing
![Share Modal](screenshots/share-modal.png)

### Version History
![Version History](screenshots/version-history.png)

### Search
![Search Results](screenshots/search.png)

---

## Troubleshooting

### Backend Issues

**Pydio Cells won't start:**
- Check database connection
- Verify MinIO is running
- Check logs: `docker-compose logs cells`

**API returns 401:**
- Token expired, re-login
- Check authorization header format

**File upload fails:**
- Check MinIO credentials
- Verify storage quota
- Check file size limits

### Frontend Issues

**Can't connect to API:**
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings on backend
- Ensure backend is running

**WebSocket connection fails:**
- Check WebSocket URL
- Verify JWT token is valid
- Check firewall rules

---

## Performance Optimization

- **Large Files**: Use multipart upload for files >5MB
- **Many Files**: Implement virtual scrolling
- **Search**: Use debouncing for search input
- **Images**: Use lazy loading and thumbnails
- **API Calls**: Implement request deduplication
- **Cache**: Use React Query for server state

---

## Security Considerations

- **Authentication**: JWT with short expiry, refresh tokens
- **Authorization**: Multi-level ACL (workspace, node, share)
- **File Upload**: MIME type validation, size limits, virus scanning
- **XSS Prevention**: React auto-escapes, CSP headers
- **CSRF Protection**: SameSite cookies, CSRF tokens
- **SQL Injection**: Parameterized queries
- **Rate Limiting**: Per-user, per-endpoint throttling
- **Encryption**: TLS in transit, encryption at rest

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows existing style
- Tests pass
- Documentation is updated
- Commits are descriptive

---

## License

This project is licensed under the **AGPLv3 License** (same as Pydio Cells).

See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **Pydio Cells**: For the robust backend infrastructure
- **Microsoft OneDrive**: For the UI/UX inspiration
- **Open Source Community**: For the amazing tools and libraries

---

## Contact

For questions or support:

- **GitHub Issues**: https://github.com/YOUR_USERNAME/onedrive-clone/issues
- **Email**: your-email@example.com
- **Documentation**: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Roadmap

### Current Status: ✅ MVP Complete

### Future Enhancements:
- [ ] Office 365 integration (WOPI)
- [ ] Live document co-editing
- [ ] AI-powered file organization
- [ ] Mobile apps (React Native)
- [ ] Desktop sync client (Electron)
- [ ] Advanced admin dashboard
- [ ] Third-party integrations (Slack, Teams)
- [ ] E2E encryption
- [ ] GDPR compliance features
- [ ] AI file summarization

---

## Star History

If you find this project helpful, please give it a ⭐️!

[![Star History Chart](https://api.star-history.com/svg?repos=YOUR_USERNAME/onedrive-clone&type=Date)](https://star-history.com/#YOUR_USERNAME/onedrive-clone&Date)

---

**Built with ❤️ using Pydio Cells and Next.js**
