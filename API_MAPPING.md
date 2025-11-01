# OneDrive Features → Pydio Cells API Mapping

Complete reference for implementing OneDrive features using Pydio Cells APIs.

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [File Operations](#file-operations)
3. [Folder Operations](#folder-operations)
4. [Search APIs](#search-apis)
5. [Sharing APIs](#sharing-apis)
6. [Version Control APIs](#version-control-apis)
7. [Metadata APIs](#metadata-apis)
8. [Real-time WebSocket](#real-time-websocket)
9. [Activity Feed](#activity-feed)
10. [User Management](#user-management)

---

## Authentication APIs

### 1. User Login

**OneDrive Feature**: User login with email/password

**Pydio Cells API**:
```http
POST /auth/login
Content-Type: application/json

{
  "login": "user@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "expiresAt": 1699876543,
  "user": {
    "uuid": "user-uuid-123",
    "login": "user@example.com",
    "displayName": "John Doe",
    "email": "user@example.com",
    "roles": [...],
    "attributes": {
      "avatar": "https://..."
    }
  }
}
```

**Frontend Implementation**:
```typescript
import apiClient from '@/lib/api/client';

export async function login(login: string, password: string) {
  const response = await apiClient.post('/auth/login', {
    login,
    password
  });

  // Store token
  localStorage.setItem('auth_token', response.data.token);
  localStorage.setItem('refresh_token', response.data.refreshToken);

  return response.data;
}
```

### 2. Token Refresh

**Pydio Cells API**:
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_string"
}

Response (200 OK):
{
  "token": "new_access_token",
  "expiresAt": 1699876543
}
```

### 3. Logout

**Pydio Cells API**:
```http
POST /auth/logout
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true
}
```

### 4. Get Current User

**Pydio Cells API**:
```http
GET /api/v2/user/me
Authorization: Bearer <token>

Response (200 OK):
{
  "uuid": "user-uuid",
  "login": "user@example.com",
  "attributes": {
    "displayName": "John Doe",
    "email": "user@example.com",
    "avatar": "https://...",
    "storageUsed": 15000000000,
    "storageQuota": 50000000000
  }
}
```

---

## File Operations

### 1. List Files in Folder

**OneDrive Feature**: Browse files in a directory

**Pydio Cells API**:
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "path",
  "path": "/my-files/documents",
  "recursive": false,
  "offset": 0,
  "limit": 50,
  "sort": {
    "field": "modified",
    "direction": "desc"
  }
}

Response (200 OK):
{
  "nodes": [
    {
      "Uuid": "node-uuid-1",
      "Path": "/my-files/documents/report.pdf",
      "Type": "LEAF",
      "Size": 2048576,
      "Modified": 1699876543,
      "ContentType": "application/pdf",
      "Etag": "etag-hash",
      "UserMetadata": {
        "starred": "false"
      }
    },
    {
      "Uuid": "node-uuid-2",
      "Path": "/my-files/documents/folder1",
      "Type": "COLLECTION",
      "Modified": 1699876543
    }
  ],
  "total": 2,
  "offset": 0,
  "limit": 50
}
```

**Frontend Implementation**:
```typescript
export async function listFiles(path: string): Promise<FileNode[]> {
  const response = await apiClient.post('/api/v2/lookup', {
    scope: 'path',
    path: path,
    recursive: false
  });

  return response.data.nodes.map(node => ({
    uuid: node.Uuid,
    path: node.Path,
    name: node.Path.split('/').pop() || '',
    type: node.Type === 'COLLECTION' ? 'folder' : 'file',
    size: node.Size || 0,
    mimeType: node.ContentType,
    modifiedAt: new Date(node.Modified * 1000),
    eTag: node.Etag,
    isStarred: node.UserMetadata?.starred === 'true'
  }));
}
```

### 2. Upload File (Small Files < 5MB)

**OneDrive Feature**: Upload file via drag-and-drop or file picker

**Pydio Cells API** (S3 Gateway):
```http
PUT /io/my-files/documents/newfile.pdf
Authorization: Bearer <token>
Content-Type: application/pdf
Content-Length: 2048576

[binary file data]

Response (200 OK):
{
  "success": true,
  "node": {
    "Uuid": "new-node-uuid",
    "Path": "/my-files/documents/newfile.pdf",
    "Size": 2048576,
    "Etag": "etag-hash"
  }
}
```

**Frontend Implementation** (Direct Upload):
```typescript
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const uploadPath = `${path}/${file.name}`;

  await apiClient.put(`/io${uploadPath}`, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(progress);
      }
    }
  });
}
```

### 3. Upload Large File (> 5MB) - Multipart Upload

**OneDrive Feature**: Upload large files with resume capability

**Pydio Cells API**:

**Step 1: Initiate Multipart Upload**
```http
POST /io/my-files/large-video.mp4?uploads
Authorization: Bearer <token>
Content-Type: video/mp4

Response (200 OK):
{
  "uploadId": "upload-id-123"
}
```

**Step 2: Upload Parts**
```http
PUT /io/my-files/large-video.mp4?uploadId=upload-id-123&partNumber=1
Authorization: Bearer <token>
Content-Type: video/mp4

[binary part data]

Response (200 OK):
{
  "ETag": "part-etag-1"
}
```

**Step 3: Complete Upload**
```http
POST /io/my-files/large-video.mp4?uploadId=upload-id-123&complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "parts": [
    { "partNumber": 1, "etag": "part-etag-1" },
    { "partNumber": 2, "etag": "part-etag-2" }
  ]
}

Response (200 OK):
{
  "success": true,
  "node": { ... }
}
```

**Frontend Implementation** (Using Uppy):
```typescript
import Uppy from '@uppy/core';
import AwsS3Multipart from '@uppy/aws-s3-multipart';

export function createUploader(path: string) {
  const uppy = new Uppy({
    restrictions: {
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10 GB
    }
  });

  uppy.use(AwsS3Multipart, {
    companionUrl: 'http://localhost:8080',
    getChunkSize: (file) => 5 * 1024 * 1024, // 5 MB chunks
    createMultipartUpload: async (file) => {
      const response = await apiClient.post(
        `/io${path}/${file.name}?uploads`,
        {},
        {
          headers: {
            'Content-Type': file.type
          }
        }
      );
      return { uploadId: response.data.uploadId, key: file.name };
    },
    uploadPart: async (file, partData) => {
      const response = await apiClient.put(
        `/io${path}/${file.name}?uploadId=${partData.uploadId}&partNumber=${partData.partNumber}`,
        partData.body,
        {
          headers: {
            'Content-Type': file.type
          }
        }
      );
      return { ETag: response.data.ETag };
    },
    completeMultipartUpload: async (file, { uploadId, parts }) => {
      await apiClient.post(
        `/io${path}/${file.name}?uploadId=${uploadId}&complete`,
        { parts }
      );
    }
  });

  return uppy;
}
```

### 4. Download File

**OneDrive Feature**: Download file

**Pydio Cells API**:
```http
GET /io/my-files/documents/report.pdf
Authorization: Bearer <token>

Response (200 OK):
Content-Type: application/pdf
Content-Length: 2048576
Content-Disposition: attachment; filename="report.pdf"

[binary file data]
```

**Frontend Implementation**:
```typescript
export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await apiClient.get(`/io${path}`, {
    responseType: 'blob'
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

### 5. Delete File

**OneDrive Feature**: Move file to recycle bin

**Pydio Cells API**:
```http
DELETE /api/v2/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodes": [
    "/my-files/documents/file1.pdf",
    "/my-files/documents/file2.txt"
  ]
}

Response (200 OK):
{
  "success": true,
  "deleted": 2
}
```

**Frontend Implementation**:
```typescript
export async function deleteFiles(paths: string[]): Promise<void> {
  await apiClient.delete('/api/v2/nodes', {
    data: { nodes: paths }
  });
}
```

### 6. Rename File

**OneDrive Feature**: Rename file or folder

**Pydio Cells API**:
```http
PUT /api/v2/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "source": "/my-files/documents/oldname.pdf",
  "destination": "/my-files/documents/newname.pdf"
}

Response (200 OK):
{
  "success": true,
  "node": { ... }
}
```

**Frontend Implementation**:
```typescript
export async function renameFile(
  path: string,
  newName: string
): Promise<void> {
  const directory = path.substring(0, path.lastIndexOf('/'));
  const newPath = `${directory}/${newName}`;

  await apiClient.put('/api/v2/nodes', {
    source: path,
    destination: newPath
  });
}
```

### 7. Move Files

**OneDrive Feature**: Move files via drag-and-drop

**Pydio Cells API**:
```http
PUT /api/v2/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "source": "/my-files/documents/file.pdf",
  "destination": "/my-files/archive/file.pdf"
}

Response (200 OK):
{
  "success": true
}
```

**Frontend Implementation**:
```typescript
export async function moveFiles(
  sourcePaths: string[],
  destinationFolder: string
): Promise<void> {
  const promises = sourcePaths.map(sourcePath => {
    const filename = sourcePath.split('/').pop();
    const destinationPath = `${destinationFolder}/${filename}`;

    return apiClient.put('/api/v2/nodes', {
      source: sourcePath,
      destination: destinationPath
    });
  });

  await Promise.all(promises);
}
```

### 8. Copy Files

**OneDrive Feature**: Copy files

**Pydio Cells API**:
```http
POST /api/v2/nodes/copy
Authorization: Bearer <token>
Content-Type: application/json

{
  "source": "/my-files/documents/file.pdf",
  "destination": "/my-files/backup/file-copy.pdf"
}

Response (200 OK):
{
  "success": true,
  "node": { ... }
}
```

---

## Folder Operations

### 1. Create Folder

**OneDrive Feature**: Create new folder

**Pydio Cells API**:
```http
POST /api/v2/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "/my-files/documents/new-folder",
  "type": "COLLECTION"
}

Response (200 OK):
{
  "success": true,
  "node": {
    "Uuid": "folder-uuid",
    "Path": "/my-files/documents/new-folder",
    "Type": "COLLECTION"
  }
}
```

**Frontend Implementation**:
```typescript
export async function createFolder(
  parentPath: string,
  folderName: string
): Promise<void> {
  const folderPath = `${parentPath}/${folderName}`;

  await apiClient.post('/api/v2/nodes', {
    path: folderPath,
    type: 'COLLECTION'
  });
}
```

### 2. Get Folder Size

**OneDrive Feature**: Show folder size and item count

**Pydio Cells API**:
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "path",
  "path": "/my-files/documents",
  "recursive": true,
  "aggregate": true
}

Response (200 OK):
{
  "nodes": [...],
  "total": 150,
  "totalSize": 524288000,
  "folderCount": 10,
  "fileCount": 140
}
```

---

## Search APIs

### 1. Search Files by Name

**OneDrive Feature**: Search files by filename

**Pydio Cells API**:
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "search",
  "query": "report",
  "filters": {
    "type": "file"
  },
  "offset": 0,
  "limit": 50
}

Response (200 OK):
{
  "nodes": [...],
  "total": 15,
  "facets": {
    "types": {
      "pdf": 8,
      "docx": 5,
      "xlsx": 2
    }
  }
}
```

### 2. Full-Text Search

**OneDrive Feature**: Search file content

**Pydio Cells API**:
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "search",
  "query": "quarterly revenue analysis",
  "searchContent": true,
  "filters": {
    "extension": ["pdf", "docx", "txt"]
  }
}

Response (200 OK):
{
  "nodes": [...],
  "total": 5,
  "highlights": {
    "node-uuid-1": ["...quarterly <em>revenue</em> analysis..."]
  }
}
```

### 3. Advanced Search with Filters

**OneDrive Feature**: Filter by date, size, type

**Pydio Cells API**:
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "search",
  "query": "*",
  "filters": {
    "modified_after": "2024-01-01T00:00:00Z",
    "modified_before": "2024-12-31T23:59:59Z",
    "size_min": 1048576,
    "size_max": 104857600,
    "extension": ["pdf", "docx"],
    "owner": "user-uuid"
  }
}
```

**Frontend Implementation**:
```typescript
export interface SearchFilters {
  query: string;
  fileTypes?: string[];
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  minSize?: number;
  maxSize?: number;
  owner?: string;
}

export async function searchFiles(
  filters: SearchFilters
): Promise<FileNode[]> {
  const requestBody: any = {
    scope: 'search',
    query: filters.query || '*',
    filters: {}
  };

  if (filters.fileTypes) {
    requestBody.filters.extension = filters.fileTypes;
  }

  if (filters.modifiedAfter) {
    requestBody.filters.modified_after = filters.modifiedAfter.toISOString();
  }

  if (filters.modifiedBefore) {
    requestBody.filters.modified_before = filters.modifiedBefore.toISOString();
  }

  if (filters.minSize) {
    requestBody.filters.size_min = filters.minSize;
  }

  if (filters.maxSize) {
    requestBody.filters.size_max = filters.maxSize;
  }

  const response = await apiClient.post('/api/v2/lookup', requestBody);
  return response.data.nodes.map(transformNode);
}
```

---

## Sharing APIs

### 1. Create Public Share Link

**OneDrive Feature**: Share file via public link

**Pydio Cells API**:
```http
POST /api/v2/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodePath": "/my-files/documents/report.pdf",
  "label": "Quarterly Report",
  "description": "Q3 2024 Report",
  "permission": "read",
  "passwordProtected": true,
  "password": "secret123",
  "expiresAt": "2024-12-31T23:59:59Z",
  "downloadLimit": 10,
  "canPreview": true,
  "canDownload": true
}

Response (200 OK):
{
  "uuid": "share-uuid-123",
  "linkUrl": "https://your-domain.com/s/abc123xyz",
  "linkHash": "abc123xyz",
  "permissions": ["read"],
  "accessCount": 0,
  "downloadCount": 0,
  "createdAt": "2024-11-01T10:00:00Z"
}
```

**Frontend Implementation**:
```typescript
export interface ShareLinkOptions {
  nodePath: string;
  permission: 'read' | 'write';
  password?: string;
  expiresAt?: Date;
  downloadLimit?: number;
  canDownload?: boolean;
  canPreview?: boolean;
}

export async function createShareLink(
  options: ShareLinkOptions
): Promise<{ linkUrl: string; uuid: string }> {
  const response = await apiClient.post('/api/v2/links', {
    nodePath: options.nodePath,
    permission: options.permission,
    passwordProtected: !!options.password,
    password: options.password,
    expiresAt: options.expiresAt?.toISOString(),
    downloadLimit: options.downloadLimit,
    canDownload: options.canDownload ?? true,
    canPreview: options.canPreview ?? true
  });

  return {
    linkUrl: response.data.linkUrl,
    uuid: response.data.uuid
  };
}
```

### 2. Share with Specific Users

**OneDrive Feature**: Share file/folder with specific users

**Pydio Cells API**:
```http
POST /api/v2/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodeUuid": "file-uuid",
  "users": ["user1-uuid", "user2-uuid"],
  "permission": "write",
  "notify": true,
  "message": "Please review this document"
}

Response (200 OK):
{
  "success": true,
  "shares": [
    {
      "uuid": "share1-uuid",
      "userId": "user1-uuid",
      "permission": "write"
    }
  ]
}
```

### 3. List Share Links

**OneDrive Feature**: View all shared links

**Pydio Cells API**:
```http
GET /api/v2/links?nodeUuid=file-uuid
Authorization: Bearer <token>

Response (200 OK):
{
  "links": [
    {
      "uuid": "share-uuid",
      "linkUrl": "https://...",
      "permissions": ["read"],
      "accessCount": 5,
      "createdAt": "2024-11-01T10:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  ]
}
```

### 4. Revoke Share Link

**OneDrive Feature**: Remove access

**Pydio Cells API**:
```http
DELETE /api/v2/links/<share-uuid>
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true
}
```

### 5. Get "Shared with Me" Files

**OneDrive Feature**: View files shared with current user

**Pydio Cells API**:
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "shared-with-me",
  "offset": 0,
  "limit": 50
}

Response (200 OK):
{
  "nodes": [
    {
      "Uuid": "shared-file-uuid",
      "Path": "/shared/document.pdf",
      "SharedBy": {
        "uuid": "owner-uuid",
        "displayName": "John Doe"
      },
      "SharedAt": "2024-11-01T10:00:00Z",
      "Permission": "read"
    }
  ]
}
```

---

## Version Control APIs

### 1. List File Versions

**OneDrive Feature**: View version history

**Pydio Cells API**:
```http
GET /api/v2/versions/<node-uuid>
Authorization: Bearer <token>

Response (200 OK):
{
  "versions": [
    {
      "versionId": "v5",
      "versionNumber": 5,
      "size": 2048576,
      "etag": "etag-v5",
      "createdAt": "2024-11-01T10:00:00Z",
      "createdBy": {
        "uuid": "user-uuid",
        "displayName": "John Doe"
      },
      "isCurrent": true
    },
    {
      "versionId": "v4",
      "versionNumber": 4,
      "size": 2045000,
      "etag": "etag-v4",
      "createdAt": "2024-10-25T15:30:00Z",
      "createdBy": {
        "uuid": "user-uuid",
        "displayName": "John Doe"
      },
      "isCurrent": false
    }
  ],
  "total": 5
}
```

**Frontend Implementation**:
```typescript
export interface FileVersion {
  versionId: string;
  versionNumber: number;
  size: number;
  createdAt: Date;
  createdBy: UserInfo;
  isCurrent: boolean;
}

export async function listVersions(nodeUuid: string): Promise<FileVersion[]> {
  const response = await apiClient.get(`/api/v2/versions/${nodeUuid}`);

  return response.data.versions.map(v => ({
    versionId: v.versionId,
    versionNumber: v.versionNumber,
    size: v.size,
    createdAt: new Date(v.createdAt),
    createdBy: {
      uuid: v.createdBy.uuid,
      name: v.createdBy.displayName
    },
    isCurrent: v.isCurrent
  }));
}
```

### 2. Download Specific Version

**OneDrive Feature**: Download old version

**Pydio Cells API**:
```http
GET /io/my-files/document.pdf?versionId=v4
Authorization: Bearer <token>

Response (200 OK):
Content-Type: application/pdf
Content-Disposition: attachment; filename="document-v4.pdf"

[binary file data]
```

### 3. Restore Previous Version

**OneDrive Feature**: Restore old version as current

**Pydio Cells API**:
```http
POST /api/v2/versions/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodeUuid": "file-uuid",
  "versionId": "v4"
}

Response (200 OK):
{
  "success": true,
  "newVersion": {
    "versionId": "v6",
    "versionNumber": 6,
    "createdAt": "2024-11-01T12:00:00Z"
  }
}
```

**Frontend Implementation**:
```typescript
export async function restoreVersion(
  nodeUuid: string,
  versionId: string
): Promise<void> {
  await apiClient.post('/api/v2/versions/restore', {
    nodeUuid,
    versionId
  });
}
```

---

## Metadata APIs

### 1. Star/Favorite File

**OneDrive Feature**: Star files for quick access

**Pydio Cells API**:
```http
PUT /api/v2/meta
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodeUuid": "file-uuid",
  "metadata": {
    "starred": "true"
  }
}

Response (200 OK):
{
  "success": true
}
```

### 2. Get Starred Files

**OneDrive Feature**: View favorites

**Pydio Cells API**:
```http
POST /api/v2/lookup
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "metadata",
  "filters": {
    "metadata.starred": "true"
  }
}

Response (200 OK):
{
  "nodes": [...]
}
```

### 3. Set Custom Metadata

**OneDrive Feature**: Add tags, notes

**Pydio Cells API**:
```http
PUT /api/v2/meta
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodeUuid": "file-uuid",
  "metadata": {
    "tags": "work,important,q3",
    "note": "Review before meeting",
    "color": "red"
  }
}

Response (200 OK):
{
  "success": true
}
```

---

## Real-time WebSocket

### 1. WebSocket Connection

**OneDrive Feature**: Real-time sync notifications

**Pydio Cells WebSocket**:

**Connect**:
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

// Or with authentication
const token = localStorage.getItem('auth_token');
const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
```

**Subscribe to Workspaces**:
```javascript
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    workspaces: ['workspace-uuid-1', 'workspace-uuid-2']
  }));
};
```

**Receive Events**:
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'node-change':
      handleNodeChange(message.data);
      break;
    case 'share-update':
      handleShareUpdate(message.data);
      break;
    case 'notification':
      handleNotification(message.data);
      break;
  }
};

function handleNodeChange(data) {
  const { action, node, actor } = data;

  switch (action) {
    case 'CREATE':
      // Add node to file list
      filesStore.addFile(node);
      showNotification(`${actor.name} added ${node.name}`);
      break;

    case 'UPDATE':
      // Update node in file list
      filesStore.updateFile(node);
      showNotification(`${actor.name} updated ${node.name}`);
      break;

    case 'DELETE':
      // Remove node from file list
      filesStore.removeFile(node.uuid);
      showNotification(`${actor.name} deleted ${node.name}`);
      break;

    case 'MOVE':
      // Refresh if in affected folder
      if (isInCurrentFolder(node)) {
        filesStore.refresh();
      }
      break;
  }
}
```

### 2. Event Types

**Node Change Event**:
```json
{
  "type": "node-change",
  "data": {
    "action": "CREATE",
    "node": {
      "Uuid": "node-uuid",
      "Path": "/my-files/newfile.pdf",
      "Type": "LEAF",
      "Size": 1024
    },
    "actor": {
      "uuid": "user-uuid",
      "name": "John Doe"
    },
    "timestamp": "2024-11-01T12:00:00Z"
  }
}
```

**Share Update Event**:
```json
{
  "type": "share-update",
  "data": {
    "action": "CREATED",
    "shareUuid": "share-uuid",
    "nodeUuid": "file-uuid",
    "sharedWith": "user2-uuid",
    "permission": "write",
    "timestamp": "2024-11-01T12:00:00Z"
  }
}
```

**Frontend Implementation**:
```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    this.ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;

      // Subscribe to workspaces
      this.subscribe(['workspace-uuid']);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect(token);
    };
  }

  subscribe(workspaces: string[]) {
    this.send({
      type: 'subscribe',
      workspaces
    });
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: any) {
    // Dispatch to appropriate handler
    switch (message.type) {
      case 'node-change':
        useFilesStore.getState().handleNodeChange(message.data);
        break;
      case 'share-update':
        // Handle share update
        break;
      case 'notification':
        useUIStore.getState().addNotification(message.data);
        break;
    }
  }

  private reconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect(token);
      }, delay);
    }
  }

  disconnect() {
    this.ws?.close();
  }
}

export const wsClient = new WebSocketClient();
```

---

## Activity Feed

### 1. Get Recent Activity

**OneDrive Feature**: Activity timeline

**Pydio Cells API**:
```http
GET /api/v2/activity?offset=0&limit=20
Authorization: Bearer <token>

Response (200 OK):
{
  "activities": [
    {
      "id": "activity-1",
      "type": "file.created",
      "actor": {
        "uuid": "user-uuid",
        "displayName": "John Doe",
        "avatar": "https://..."
      },
      "target": {
        "uuid": "file-uuid",
        "path": "/my-files/document.pdf",
        "name": "document.pdf"
      },
      "timestamp": "2024-11-01T12:00:00Z"
    }
  ],
  "total": 150
}
```

### 2. Get Activity for Specific File

**Pydio Cells API**:
```http
GET /api/v2/activity?nodeUuid=file-uuid
Authorization: Bearer <token>

Response (200 OK):
{
  "activities": [...]
}
```

---

## User Management

### 1. Get User Storage Quota

**OneDrive Feature**: Show storage usage

**Pydio Cells API**:
```http
GET /api/v2/user/me/storage
Authorization: Bearer <token>

Response (200 OK):
{
  "used": 15000000000,
  "quota": 50000000000,
  "percentage": 30
}
```

### 2. Update User Profile

**Pydio Cells API**:
```http
PUT /api/v2/user/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "John Doe",
  "avatar": "data:image/png;base64,..."
}

Response (200 OK):
{
  "success": true,
  "user": { ... }
}
```

---

## Summary: Quick Reference

| OneDrive Feature | Pydio Cells Endpoint | Method |
|-----------------|---------------------|--------|
| Login | `/auth/login` | POST |
| List files | `/api/v2/lookup` | POST |
| Upload file | `/io/{path}` | PUT |
| Download file | `/io/{path}` | GET |
| Create folder | `/api/v2/nodes` | POST |
| Delete file | `/api/v2/nodes` | DELETE |
| Rename/Move | `/api/v2/nodes` | PUT |
| Search | `/api/v2/lookup` (scope: search) | POST |
| Share link | `/api/v2/links` | POST |
| List versions | `/api/v2/versions/{uuid}` | GET |
| Restore version | `/api/v2/versions/restore` | POST |
| Star file | `/api/v2/meta` | PUT |
| Activity feed | `/api/v2/activity` | GET |
| WebSocket | `ws://{host}/ws` | WS |

---

## Error Handling

### Common Error Responses

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```
→ Refresh token or redirect to login

**403 Forbidden**:
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```
→ Show permission error message

**404 Not Found**:
```json
{
  "error": "Not Found",
  "message": "File not found"
}
```
→ Refresh file list or show error

**409 Conflict**:
```json
{
  "error": "Conflict",
  "message": "File already exists"
}
```
→ Prompt for rename or overwrite

**413 Payload Too Large**:
```json
{
  "error": "Payload Too Large",
  "message": "File exceeds maximum size"
}
```
→ Show file size error

**429 Too Many Requests**:
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests"
}
```
→ Show rate limit warning, retry with backoff

---

This API mapping provides complete coverage for building an OneDrive clone using Pydio Cells backend!
