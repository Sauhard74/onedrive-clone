/**
 * Pydio Cells REST API Client
 * Communicates with Pydio Cells backend on port 8081
 */

import axios from 'axios';

// Use relative URLs so Vite proxy works
const PYDIO_API_BASE = '';

class PydioClient {
  constructor() {
    this.api = axios.create({
      baseURL: PYDIO_API_BASE,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.jwt = null;
  }

  /**
   * Login to Pydio Cells
   */
  async login(username, password) {
    try {
      const response = await this.api.post('/a/frontend/session', {
        AuthInfo: {
          login: username,
          password: password,
          type: 'credentials'
        }
      });

      if (response.data && response.data.JWT) {
        this.jwt = response.data.JWT;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.jwt}`;
        return { success: true, data: response.data };
      }

      return { success: false, error: 'No JWT token received' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current user info
   */
  async getUserInfo() {
    try {
      const response = await this.api.get('/a/frontend/state');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get user info error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path = '/') {
    try {
      const response = await this.api.post('/a/tree/stats', {
        Path: path
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('List files error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(file, path = '/') {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post(
        `/io/${path}/${file.name}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a file
   */
  async downloadFile(path) {
    try {
      const response = await this.api.get(`/io/${path}`, {
        responseType: 'blob'
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a file or folder
   */
  async deleteFile(path) {
    try {
      const response = await this.api.post('/a/tree/delete', {
        Nodes: [{ Path: path }]
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(path, folderName) {
    try {
      const newPath = `${path}/${folderName}`.replace('//', '/');
      const response = await this.api.post('/a/tree/create', {
        Nodes: [{
          Path: newPath,
          Type: 2 // Type 2 = folder
        }]
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create folder error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rename a file or folder
   */
  async rename(oldPath, newName) {
    try {
      const pathParts = oldPath.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');

      const response = await this.api.post('/a/tree/move', {
        Nodes: [{
          Path: oldPath,
          Target: newPath
        }]
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Rename error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search files
   */
  async searchFiles(query) {
    try {
      const response = await this.api.post('/a/tree/search', {
        Query: {
          FileName: query
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout
   */
  logout() {
    this.jwt = null;
    delete this.api.defaults.headers.common['Authorization'];
  }
}

export default new PydioClient();
