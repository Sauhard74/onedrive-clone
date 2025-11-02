import { useState } from 'react';
import pydioClient from './api/pydioClient';
import './onedrive.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [viewMode, setViewMode] = useState('list');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await pydioClient.login(username, password);
    if (result.success) {
      setIsLoggedIn(true);
      loadFiles();
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const loadFiles = async (path = '/') => {
    setLoading(true);
    const result = await pydioClient.listFiles(path);
    if (result.success && result.data) {
      setFiles(result.data.Children || []);
      setCurrentPath(path);
      setSelectedFiles([]);
    }
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const result = await pydioClient.uploadFile(file, currentPath);
    if (result.success) loadFiles(currentPath);
    else alert('Upload failed: ' + result.error);
    setLoading(false);
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Delete ${selectedFiles.length} item(s)?`)) return;
    setLoading(true);
    for (const file of selectedFiles) {
      await pydioClient.deleteFile(file.Path);
    }
    loadFiles(currentPath);
  };

  const handleNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    setLoading(true);
    const result = await pydioClient.createFolder(currentPath, folderName);
    if (result.success) loadFiles(currentPath);
    else alert('Create folder failed: ' + result.error);
    setLoading(false);
  };

  const toggleFileSelection = (file) => {
    if (selectedFiles.find(f => f.Path === file.Path)) {
      setSelectedFiles(selectedFiles.filter(f => f.Path !== file.Path));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const handleFileClick = (file, event) => {
    if (event.ctrlKey || event.metaKey) {
      toggleFileSelection(file);
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleFileDoubleClick = (file) => {
    if (file.Type === 2) {
      loadFiles(file.Path);
    } else {
      window.open(`/io/${file.Path}`, '_blank');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const currentYear = now.getFullYear();

    if (year === currentYear) {
      return `${month} ${day}`;
    }
    return `${month} ${day}, ${year}`;
  };

  const getFileIcon = (file) => {
    if (file.Type === 2) {
      return (
        <svg viewBox="0 0 20 20" fill="#FFC83D">
          <path d="M2 4a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
        </svg>
      );
    } else {
      const ext = file.Name.split('.').pop().toLowerCase();
      const iconMap = {
        'pdf': { color: '#D93025', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'doc': { color: '#4285F4', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'docx': { color: '#4285F4', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'xls': { color: '#0F9D58', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'xlsx': { color: '#0F9D58', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'ppt': { color: '#F4B400', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'pptx': { color: '#F4B400', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'jpg': { color: '#7B1FA2', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'jpeg': { color: '#7B1FA2', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'png': { color: '#7B1FA2', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'zip': { color: '#999999', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
        'txt': { color: '#B3B3B3', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' },
      };
      const icon = iconMap[ext] || { color: '#B3B3B3', path: 'M6 2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4H6zm7 5h-3V4l3 3z' };

      return (
        <svg viewBox="0 0 20 20" fill={icon.color}>
          <path d={icon.path}/>
        </svg>
      );
    }
  };

  const getBreadcrumbs = () => {
    if (currentPath === '/') return 'My files';
    const parts = currentPath.split('/').filter(Boolean);
    return 'My files > ' + parts.join(' > ');
  };

  if (!isLoggedIn) {
    return (
      <div className="od-Login">
        <div className="od-Login-card">
          <svg className="od-Login-logo" viewBox="0 0 108 24" fill="#0078D4">
            <path d="M0 3.5h3.5v17H0zm5.5 0H9v17H5.5zm11 0c3.3 0 6 2.7 6 6v5c0 3.3-2.7 6-6 6h-4.5v-17h4.5zm0 14c1.7 0 3-1.3 3-3v-5c0-1.7-1.3-3-3-3h-1.5v11h1.5z"/>
          </svg>
          <h1 className="od-Login-title">Sign in</h1>
          <p className="od-Login-subtitle">to continue to OneDrive</p>
          <form onSubmit={handleLogin}>
            <input
              className="od-Login-input"
              type="text"
              placeholder="Email, phone, or Skype"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <input
              className="od-Login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {error && <div className="od-Login-error">{error}</div>}
            <button
              className="od-Login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="od-App">
      {/* Top Header - Row 1 */}
      <div className="od-Header">
        <div className="od-Header-left">
          {/* App Launcher */}
          <button className="od-Header-appLauncher" title="App launcher">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <circle cx="3" cy="3" r="2"/>
              <circle cx="10" cy="3" r="2"/>
              <circle cx="17" cy="3" r="2"/>
              <circle cx="3" cy="10" r="2"/>
              <circle cx="10" cy="10" r="2"/>
              <circle cx="17" cy="10" r="2"/>
              <circle cx="3" cy="17" r="2"/>
              <circle cx="10" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </button>

          {/* OneDrive Logo */}
          <div className="od-Header-logo" onClick={() => loadFiles('/')}>
            <svg className="od-Header-logo-icon" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M15.8 10.5c-.1-3.1-2.6-5.5-5.8-5.5-2.2 0-4.1 1.2-5.1 3-.3 0-.6-.1-.9-.1-2.2 0-4 1.8-4 4s1.8 4 4 4h11c2.8 0 5-2.2 5-5s-2.2-5-4.2-5z"/>
            </svg>
          </div>

          {/* Navigation Tabs */}
          <div className="od-Header-tabs">
            <button className="od-Header-tab">Photos</button>
            <button className="od-Header-tab od-Header-tab--active">Files</button>
          </div>
        </div>

        <div className="od-Header-center">
          <div className="od-SearchBox">
            <svg className="od-SearchBox-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input
              className="od-SearchBox-input"
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="od-Header-right">
          <button className="od-Header-storageButton">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{marginRight: '6px', flexShrink: 0}}>
              <path d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z"/>
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <span style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2'}}>
              <span style={{fontSize: '11px'}}>Get</span>
              <span style={{fontSize: '11px'}}>more</span>
              <span style={{fontSize: '11px'}}>storage</span>
            </span>
          </button>
          <button className="od-Header-iconButton" title="Settings">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
          </button>
          <div className="od-Header-avatar" title={username}>
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Second Header Row - Filter Bar */}
      <div className="od-FilterBar">
        <div className="od-FilterBar-left">
          <button className="od-FilterBar-createButton" title="Create new">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"/>
            </svg>
          </button>
          <span className="od-FilterBar-label">Recent</span>
          <div className="od-FilterBar-pills">
            <button className="od-FilterBar-pill od-FilterBar-pill--active">All</button>
            <button className="od-FilterBar-pill">
              <svg viewBox="0 0 16 16" fill="#2B579A" style={{marginRight: '4px'}}>
                <rect width="16" height="16" rx="2" fill="#2B579A"/>
                <text x="8" y="12" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">W</text>
              </svg>
              Word
            </button>
            <button className="od-FilterBar-pill">
              <svg viewBox="0 0 16 16" fill="#217346" style={{marginRight: '4px'}}>
                <rect width="16" height="16" rx="2" fill="#217346"/>
                <text x="8" y="12" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">X</text>
              </svg>
              Excel
            </button>
            <button className="od-FilterBar-pill">
              <svg viewBox="0 0 16 16" fill="#D24726" style={{marginRight: '4px'}}>
                <rect width="16" height="16" rx="2" fill="#D24726"/>
                <text x="8" y="12" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">P</text>
              </svg>
              PowerPoint
            </button>
            <button className="od-FilterBar-pill">
              <svg viewBox="0 0 16 16" fill="#7719AA" style={{marginRight: '4px'}}>
                <rect width="16" height="16" rx="2" fill="#7719AA"/>
                <text x="8" y="12" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">O</text>
              </svg>
              OneNote
            </button>
          </div>
        </div>
        <div className="od-FilterBar-right">
          <input
            className="od-FilterBar-filterInput"
            type="text"
            placeholder="Filter by name or person"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="od-Content">
        {/* Left Sidebar */}
        <div className="od-LeftNav">
          <div className="od-LeftNav-item is-selected" onClick={() => loadFiles('/')}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 4a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
            </svg>
            <span className="od-LeftNav-item-text">My files</span>
          </div>
          <div className="od-LeftNav-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <span className="od-LeftNav-item-text">Recent</span>
          </div>
          <div className="od-LeftNav-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
            </svg>
            <span className="od-LeftNav-item-text">Shared</span>
          </div>
          <div className="od-LeftNav-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
            </svg>
            <span className="od-LeftNav-item-text">Photos</span>
          </div>
        </div>

        {/* File List Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Command Bar */}
          <div className="od-CommandBar">
            <button className="od-CommandBar-button od-CommandBar-button--primary" onClick={() => document.getElementById('fileInput').click()}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.5 11.5a.5.5 0 01-1 0V8H4.5a.5.5 0 010-1H7.5V4a.5.5 0 011 0v3H12a.5.5 0 010 1H8.5v3.5z"/>
                <path d="M8 1a2.5 2.5 0 012.5 2.5V4h-5v-.5A2.5 2.5 0 018 1zm3.5 3v-.5a3.5 3.5 0 10-7 0V4H1v10a2 2 0 002 2h10a2 2 0 002-2V4h-3.5z"/>
              </svg>
              Upload
            </button>
            <input id="fileInput" type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={loading} />

            <button className="od-CommandBar-button" onClick={handleNewFolder} disabled={loading}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M.5 3l.04.87a1.99 1.99 0 00-.342 1.311l.637 7A2 2 0 002.826 14H9v-1H2.826a1 1 0 01-.995-.91l-.637-7A1 1 0 011.5 4h7.836a1 1 0 01.995.91l.35 3.999h1.01l-.402-4.56A2 2 0 009.262 3H.5z"/>
                <path d="M14.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 10-.708.708L13.293 7.5H9.5a.5.5 0 000 1h3.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
              </svg>
              New
            </button>

            <div className="od-CommandBar-divider"></div>

            <button className="od-CommandBar-button" disabled={selectedFiles.length === 0} onClick={handleDelete}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
              Delete
            </button>

            <div className="od-CommandBar-spacer"></div>

            <button className="od-CommandBar-button" onClick={() => setViewMode('list')} title="List">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/>
              </svg>
            </button>

            <button className="od-CommandBar-button" onClick={() => setViewMode('grid')} title="Grid">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z"/>
              </svg>
            </button>

            <button className="od-CommandBar-button" onClick={() => loadFiles(currentPath)} disabled={loading} title="Refresh">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4v1H4.21l.99 1.428a.5.5 0 11-.822.572L3 5l1.378-2a.5.5 0 01.822.572L4.21 5H8V3z"/>
              </svg>
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="od-FileList-breadcrumb">
            <div className="od-FileList-breadcrumb-item">
              {getBreadcrumbs()}
            </div>
          </div>

          {/* File List */}
          <div className="od-FileList">
            {loading ? (
              <div className="od-Loading">
                <div className="od-Loading-spinner"></div>
              </div>
            ) : files.length === 0 ? (
              <div className="od-EmptyState">
                <svg className="od-EmptyState-icon" viewBox="0 0 96 96" fill="currentColor">
                  <path d="M88 26H54l-8-8H8c-4.4 0-8 3.6-8 8v52c0 4.4 3.6 8 8 8h80c4.4 0 8-3.6 8-8V34c0-4.4-3.6-8-8-8z"/>
                </svg>
                <div className="od-EmptyState-title">This folder is empty</div>
                <div className="od-EmptyState-text">Add files by clicking Upload or create a new folder</div>
                <button className="od-EmptyState-button" onClick={() => document.getElementById('fileInput').click()}>
                  Upload files
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <>
                <div className="od-FileList-header">
                  <div className="od-FileList-header-checkbox"></div>
                  <div className="od-FileList-header-name">Name</div>
                  <div className="od-FileList-header-modified">Date modified</div>
                  <div className="od-FileList-header-modifiedBy">Sharing</div>
                  <div className="od-FileList-header-size">File size</div>
                </div>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className={`od-FileList-row ${selectedFiles.find(f => f.Path === file.Path) ? 'is-selected' : ''}`}
                    onClick={(e) => handleFileClick(file, e)}
                    onDoubleClick={() => handleFileDoubleClick(file)}
                  >
                    <div className="od-FileList-cell-checkbox">
                      <div
                        className={`od-FileList-checkbox ${selectedFiles.find(f => f.Path === file.Path) ? 'is-checked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleFileSelection(file); }}
                      >
                        {selectedFiles.find(f => f.Path === file.Path) && (
                          <svg viewBox="0 0 16 16" fill="white" width="12" height="12">
                            <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="od-FileList-cell-name">
                      <div className="od-FileList-cell-icon">
                        {getFileIcon(file)}
                      </div>
                      <div className="od-FileList-cell-text">
                        {file.Name || 'Unnamed'}
                      </div>
                    </div>
                    <div className="od-FileList-cell-modified">
                      {formatDate(file.ModTime)}
                    </div>
                    <div className="od-FileList-cell-modifiedBy">
                      -
                    </div>
                    <div className="od-FileList-cell-size">
                      {file.Type === 2 ? '-' : formatSize(file.Size)}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="od-FileList-grid">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className={`od-FileList-tile ${selectedFiles.find(f => f.Path === file.Path) ? 'is-selected' : ''}`}
                    onClick={(e) => handleFileClick(file, e)}
                    onDoubleClick={() => handleFileDoubleClick(file)}
                  >
                    <div className="od-FileList-tile-icon">
                      {getFileIcon(file)}
                    </div>
                    <div className="od-FileList-tile-name">
                      {file.Name || 'Unnamed'}
                    </div>
                    <div className="od-FileList-tile-info">
                      {file.Type === 2 ? 'Folder' : formatSize(file.Size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
