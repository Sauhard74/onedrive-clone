# OneDrive Clone - Implementation Plan

## Quick Start Guide

### Prerequisites
```bash
# Required software
- Go 1.25+ (for Pydio Cells)
- Node.js 18+ (for frontend)
- Docker & Docker Compose
- MySQL 8.0 or PostgreSQL 14+
```

---

## Part 1: Backend Setup (Pydio Cells)

### Step 1: Set Up Pydio Cells

#### Option A: Docker Compose (Recommended for Development)

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: cells-mysql
    environment:
      MYSQL_ROOT_PASSWORD: cells_root_password
      MYSQL_DATABASE: cells
      MYSQL_USER: cells
      MYSQL_PASSWORD: cells_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - cells_network

  minio:
    image: minio/minio:latest
    container_name: cells-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: cells_minio_key
      MINIO_ROOT_PASSWORD: cells_minio_secret
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - cells_network

  cells:
    build: ./cells
    container_name: pydio-cells
    depends_on:
      - mysql
      - minio
    environment:
      CELLS_BIND: 0.0.0.0:8080
      CELLS_EXTERNAL: http://localhost:8080
      CELLS_NO_SSL: 1
    volumes:
      - cells_data:/var/cells
      - cells_logs:/var/cells/logs
    ports:
      - "8080:8080"
    networks:
      - cells_network

volumes:
  mysql_data:
  minio_data:
  cells_data:
  cells_logs:

networks:
  cells_network:
    driver: bridge
```

#### Option B: Local Installation

```bash
cd cells

# Build Pydio Cells
make dev

# Run installation wizard
./cells install

# Follow prompts to configure:
# - Database: MySQL (localhost:3306)
# - Storage: MinIO (localhost:9000)
# - Admin user credentials
# - External URL

# Start Pydio Cells
./cells start
```

### Step 2: Configure Pydio Cells for OneDrive Clone

Create configuration script `setup-cells.sh`:
```bash
#!/bin/bash

CELLS_API="http://localhost:8080/api/v2"
ADMIN_TOKEN="<your-admin-token>"

# 1. Create main workspace (equivalent to "My Files")
curl -X POST "$CELLS_API/workspace" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Label": "My Files",
    "Slug": "my-files",
    "Scope": "USER",
    "Description": "Personal file storage"
  }'

# 2. Create shared workspace
curl -X POST "$CELLS_API/workspace" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Label": "Shared",
    "Slug": "shared",
    "Scope": "ROOM",
    "Description": "Shared files and folders"
  }'

# 3. Enable versioning policy
curl -X POST "$CELLS_API/config/versioning" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "MaxVersions": 50,
    "MaxAge": 2592000,
    "PrunePolicy": "auto"
  }'

# 4. Configure search indexing
curl -X POST "$CELLS_API/config/search" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Engine": "bleve",
    "IndexContent": true,
    "IndexMetadata": true
  }'

# 5. Enable WebSocket
curl -X POST "$CELLS_API/config/websocket" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Enabled": true,
    "MaxConnections": 1000
  }'

echo "Pydio Cells configuration complete!"
```

### Step 3: Test Backend APIs

Create test script `test-apis.sh`:
```bash
#!/bin/bash

API_URL="http://localhost:8080"

# 1. Test authentication
echo "Testing login..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login": "admin", "password": "admin"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Test file listing
echo "Testing file listing..."
curl -X POST "$API_URL/api/v2/lookup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "path",
    "path": "/",
    "recursive": false
  }' | jq

# 3. Test file upload
echo "Testing file upload..."
echo "Test content" > test.txt
curl -X PUT "$API_URL/io/my-files/test.txt" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary "@test.txt"

# 4. Test file download
echo "Testing file download..."
curl -X GET "$API_URL/io/my-files/test.txt" \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded.txt

# 5. Test WebSocket connection
echo "Testing WebSocket..."
wscat -c "ws://localhost:8080/ws?token=$TOKEN"

echo "All API tests complete!"
```

---

## Part 2: Frontend Setup

### Step 1: Initialize Next.js Project

```bash
# Create Next.js app
npx create-next-app@latest onedrive-frontend --typescript --tailwind --app --use-npm

cd onedrive-frontend

# Install dependencies
npm install zustand axios uppy @uppy/core @uppy/dashboard @uppy/xhr-upload
npm install date-fns clsx tailwind-merge
npm install @headlessui/react @heroicons/react
npm install framer-motion
npm install react-query
npm install socket.io-client

# Install dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D prettier eslint-config-prettier
npm install -D @playwright/test
```

### Step 2: Project Structure Setup

```bash
# Create directory structure
mkdir -p src/{components,lib,store,types,hooks}
mkdir -p src/components/{layout,files,upload,modals,common}
mkdir -p src/lib/{api,websocket,utils}
mkdir -p src/app/{(auth),(main)}

# Create base files
touch src/lib/api/client.ts
touch src/lib/api/files.ts
touch src/lib/api/auth.ts
touch src/store/auth.store.ts
touch src/store/files.store.ts
touch src/types/file.types.ts
```

### Step 3: Core Configuration Files

#### `src/lib/api/client.ts`
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem('auth_token', data.token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### `src/types/file.types.ts`
```typescript
export interface FileNode {
  uuid: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  mimeType?: string;

  createdAt: Date;
  modifiedAt: Date;

  owner: UserInfo;
  eTag: string;

  permissions: Permission[];

  isStarred: boolean;
  isShared: boolean;
  syncStatus: 'synced' | 'syncing' | 'error';

  thumbnailUrl?: string;
  previewUrl?: string;
}

export interface UserInfo {
  uuid: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Permission {
  action: 'read' | 'write' | 'delete' | 'share';
  allowed: boolean;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'modified' | 'size' | 'type';
export type SortDirection = 'asc' | 'desc';
```

#### `src/store/auth.store.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uuid: string;
  login: string;
  email: string;
  displayName: string;
  avatar?: string;
  storageUsed: number;
  storageQuota: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (credentials: { login: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await fetch('/api/v2/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) throw new Error('Login failed');

          const data = await response.json();

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });

          localStorage.setItem('auth_token', data.token);
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('auth_token');
      },

      refreshUser: async () => {
        // Implement user refresh logic
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

#### `src/store/files.store.ts`
```typescript
import { create } from 'zustand';
import { FileNode, ViewMode, SortBy } from '@/types/file.types';
import * as filesApi from '@/lib/api/files';

interface FilesStore {
  currentPath: string;
  files: FileNode[];
  selectedFiles: Set<string>;
  viewMode: ViewMode;
  sortBy: SortBy;
  isLoading: boolean;
  error: string | null;

  setCurrentPath: (path: string) => void;
  fetchFiles: (path?: string) => Promise<void>;
  selectFile: (uuid: string) => void;
  selectMultiple: (uuids: string[]) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;

  createFolder: (name: string) => Promise<void>;
  deleteFiles: (uuids: string[]) => Promise<void>;
  moveFiles: (uuids: string[], destination: string) => Promise<void>;
  renameFile: (uuid: string, newName: string) => Promise<void>;

  starFile: (uuid: string) => Promise<void>;
  unstarFile: (uuid: string) => Promise<void>;
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  currentPath: '/',
  files: [],
  selectedFiles: new Set(),
  viewMode: 'grid',
  sortBy: 'name',
  isLoading: false,
  error: null,

  setCurrentPath: (path) => set({ currentPath: path }),

  fetchFiles: async (path) => {
    const targetPath = path ?? get().currentPath;
    set({ isLoading: true, error: null });

    try {
      const files = await filesApi.listFiles(targetPath);
      set({ files, currentPath: targetPath, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load files', isLoading: false });
    }
  },

  selectFile: (uuid) => {
    const selected = new Set(get().selectedFiles);
    if (selected.has(uuid)) {
      selected.delete(uuid);
    } else {
      selected.add(uuid);
    }
    set({ selectedFiles: selected });
  },

  selectMultiple: (uuids) => {
    set({ selectedFiles: new Set(uuids) });
  },

  clearSelection: () => {
    set({ selectedFiles: new Set() });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  createFolder: async (name) => {
    const path = get().currentPath;
    await filesApi.createFolder(`${path}/${name}`);
    await get().fetchFiles();
  },

  deleteFiles: async (uuids) => {
    await filesApi.deleteFiles(uuids);
    await get().fetchFiles();
    get().clearSelection();
  },

  moveFiles: async (uuids, destination) => {
    await filesApi.moveFiles(uuids, destination);
    await get().fetchFiles();
    get().clearSelection();
  },

  renameFile: async (uuid, newName) => {
    await filesApi.renameFile(uuid, newName);
    await get().fetchFiles();
  },

  starFile: async (uuid) => {
    await filesApi.setMetadata(uuid, { starred: 'true' });
    // Update local state
    set((state) => ({
      files: state.files.map((f) =>
        f.uuid === uuid ? { ...f, isStarred: true } : f
      ),
    }));
  },

  unstarFile: async (uuid) => {
    await filesApi.setMetadata(uuid, { starred: 'false' });
    set((state) => ({
      files: state.files.map((f) =>
        f.uuid === uuid ? { ...f, isStarred: false } : f
      ),
    }));
  },
}));
```

#### `src/lib/api/files.ts`
```typescript
import apiClient from './client';
import { FileNode } from '@/types/file.types';

export async function listFiles(path: string): Promise<FileNode[]> {
  const response = await apiClient.post('/api/v2/lookup', {
    scope: 'path',
    path: path,
    recursive: false,
  });

  return response.data.nodes.map(transformNode);
}

export async function createFolder(path: string): Promise<void> {
  await apiClient.post('/api/v2/nodes', {
    path: path,
    type: 'COLLECTION',
  });
}

export async function deleteFiles(uuids: string[]): Promise<void> {
  await apiClient.delete('/api/v2/nodes', {
    data: { nodes: uuids },
  });
}

export async function moveFiles(
  uuids: string[],
  destination: string
): Promise<void> {
  const promises = uuids.map((uuid) =>
    apiClient.put('/api/v2/nodes', {
      source: uuid,
      destination: destination,
    })
  );
  await Promise.all(promises);
}

export async function renameFile(uuid: string, newName: string): Promise<void> {
  await apiClient.put('/api/v2/nodes', {
    source: uuid,
    newName: newName,
  });
}

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  await apiClient.put(`/io${path}/${file.name}`, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(progress);
      }
    },
  });
}

export async function downloadFile(path: string): Promise<Blob> {
  const response = await apiClient.get(`/io${path}`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function setMetadata(
  uuid: string,
  metadata: Record<string, string>
): Promise<void> {
  await apiClient.put('/api/v2/meta', {
    nodeUuid: uuid,
    metadata: metadata,
  });
}

export async function searchFiles(query: string): Promise<FileNode[]> {
  const response = await apiClient.post('/api/v2/lookup', {
    scope: 'search',
    query: query,
  });
  return response.data.nodes.map(transformNode);
}

function transformNode(node: any): FileNode {
  return {
    uuid: node.Uuid,
    path: node.Path,
    name: node.Path.split('/').pop() || '',
    type: node.Type === 'COLLECTION' ? 'folder' : 'file',
    size: node.Size || 0,
    mimeType: node.ContentType,
    createdAt: new Date(node.Modified * 1000),
    modifiedAt: new Date(node.Modified * 1000),
    owner: {
      uuid: '',
      name: '',
      email: '',
    },
    eTag: node.Etag || '',
    permissions: [],
    isStarred: node.UserMetadata?.starred === 'true',
    isShared: false,
    syncStatus: 'synced',
  };
}
```

---

## Part 3: UI Component Development

### Priority 1: Layout Components

#### `src/components/layout/TopBar.tsx`
```typescript
'use client';

import { useAuthStore } from '@/store/auth.store';
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

export function TopBar() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Left: Logo + Search */}
      <div className="flex items-center space-x-4 flex-1">
        <h1 className="text-xl font-semibold">OneDrive</h1>

        <div className="relative max-w-md flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right: User menu */}
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <BellIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-2">
          <img
            src={user?.avatar || '/avatar-placeholder.png'}
            alt={user?.displayName}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium">{user?.displayName}</span>
        </div>
      </div>
    </header>
  );
}
```

#### `src/components/layout/Sidebar.tsx`
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderIcon,
  ClockIcon,
  UserGroupIcon,
  PhotoIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'My files', href: '/files', icon: FolderIcon },
  { name: 'Recent', href: '/recent', icon: ClockIcon },
  { name: 'Shared', href: '/shared', icon: UserGroupIcon },
  { name: 'Photos', href: '/photos', icon: PhotoIcon },
  { name: 'Favorites', href: '/favorites', icon: StarIcon },
  { name: 'Recycle bin', href: '/recycle', icon: TrashIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="p-4">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          + New
        </button>
      </div>

      <nav className="px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-gray-100 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Storage indicator */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-sm text-gray-600 mb-2">Storage</div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 w-1/3"></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">15 GB of 50 GB used</div>
      </div>
    </aside>
  );
}
```

---

## Part 4: File Browser Implementation

### Core File Browser Component

#### `src/components/files/FileBrowser.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import { useFilesStore } from '@/store/files.store';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { Breadcrumbs } from './Breadcrumbs';
import { Toolbar } from './Toolbar';

export function FileBrowser() {
  const { currentPath, files, viewMode, isLoading, fetchFiles } = useFilesStore();

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  return (
    <div className="flex flex-col h-full">
      <Breadcrumbs path={currentPath} />
      <Toolbar />

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : viewMode === 'grid' ? (
          <FileGrid files={files} />
        ) : (
          <FileList files={files} />
        )}
      </div>
    </div>
  );
}
```

---

## Part 5: Upload Implementation

### Uppy Configuration

#### `src/lib/upload/uppy-config.ts`
```typescript
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';

export function createUppyInstance() {
  const uppy = new Uppy({
    restrictions: {
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10 GB
      maxNumberOfFiles: 100,
    },
  });

  uppy.use(XHRUpload, {
    endpoint: 'http://localhost:8080/io',
    method: 'PUT',
    formData: false,
    getResponseData: (responseText, response) => {
      return { url: response.headers.get('Location') };
    },
    headers: () => ({
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    }),
  });

  return uppy;
}
```

---

## Part 6: WebSocket Integration

#### `src/lib/websocket/client.ts`
```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io('ws://localhost:8080/ws', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.subscribe(['workspace-uuid']);
    });

    this.socket.on('node-change', (event) => {
      console.log('Node change:', event);
      // Update store
    });
  }

  subscribe(workspaces: string[]) {
    this.socket?.emit('subscribe', { workspaces });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const wsClient = new WebSocketClient();
```

---

## Deployment Checklist

### Environment Variables
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Backend (Pydio Cells)
CELLS_BIND=0.0.0.0:8080
CELLS_EXTERNAL=https://your-domain.com
MYSQL_HOST=localhost
MYSQL_DATABASE=cells
MINIO_ENDPOINT=localhost:9000
```

### Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f cells
```

---

## Testing Strategy

1. **Unit Tests**: Components, utilities
2. **Integration Tests**: API calls, store updates
3. **E2E Tests**: File operations, upload/download flows
4. **Performance Tests**: Large file uploads, many files
5. **Accessibility Tests**: WCAG 2.1 AA compliance

---

## Success Metrics

- ✅ All OneDrive features implemented
- ✅ Exact DOM structure matching OneDrive
- ✅ Real-time sync working
- ✅ File operations under 200ms
- ✅ Upload/download progress tracking
- ✅ Mobile responsive
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Documentation complete

---

## Next Steps

1. **Start Backend**: Get Pydio Cells running locally
2. **Test APIs**: Verify all endpoints work
3. **Build Frontend**: Follow component checklist
4. **Integrate**: Connect frontend to backend
5. **Polish**: Match OneDrive UI exactly
6. **Document**: README, screenshots, video
7. **Deploy**: Docker setup, GitHub repo

Ready to start implementation!
