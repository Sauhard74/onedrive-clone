# OneDrive DOM Replication Plan

## Overview
To make Pydio Cells DOM-accurate to Microsoft OneDrive, we need to modify the React components to match OneDrive's exact HTML structure and component hierarchy.

## Current Pydio Cells Frontend Architecture

### Technology Stack
- **Framework**: React with Material-UI
- **Build System**: Webpack
- **Location**: `cells/frontend/assets/gui.ajax/`
- **Main Components**:
  - `AppBar.js` - Top navigation bar
  - `LeftPanel.js` - Left sidebar navigation
  - `MaterialTable.js` / `ModernLayoutTable.js` - File list view
  - `DynamicGrid.js` - Grid/thumbnail view
  - `Breadcrumb.js` - Path navigation
  - `InfoPanel.js` - Right info panel

### Build Process
```bash
cd cells/frontend/assets/gui.ajax
npm install
npm run build
# Compiles to: res/dist/
```

## OneDrive DOM Structure (Target)

### 1. Top Command Bar
```html
<div class="CommandBar" role="menubar">
  <div class="ms-CommandBar-primaryCommands">
    <button class="ms-CommandBar-item">New</button>
    <button class="ms-CommandBar-item">Upload</button>
    <button class="ms-CommandBar-item">Share</button>
    <!-- ... -->
  </div>
  <div class="ms-CommandBar-secondaryCommands">
    <button class="ms-CommandBar-item">Sort</button>
    <button class="ms-CommandBar-item">View</button>
    <button class="ms-CommandBar-item">Info</button>
  </div>
</div>
```

### 2. File List (List View)
```html
<div class="od-Files-list" role="grid">
  <div class="od-Files-header">
    <div class="od-Files-columnHeader">Name</div>
    <div class="od-Files-columnHeader">Modified</div>
    <div class="od-Files-columnHeader">Modified by</div>
    <div class="od-Files-columnHeader">File size</div>
  </div>
  <div class="od-Files-listBody">
    <div class="od-Files-listRow" role="row">
      <div class="od-Files-cell">
        <i class="ms-Icon ms-Icon--Page"></i>
        <span class="od-Files-name">Document.docx</span>
      </div>
      <div class="od-Files-cell">Today 10:30 AM</div>
      <div class="od-Files-cell">John Doe</div>
      <div class="od-Files-cell">2.3 MB</div>
    </div>
  </div>
</div>
```

### 3. File List (Tiles/Grid View)
```html
<div class="od-Files-grid">
  <div class="od-FileTile">
    <div class="od-FileTile-imageContainer">
      <img src="thumbnail.jpg" />
    </div>
    <div class="od-FileTile-nameplate">
      <div class="od-FileTile-name">Document.docx</div>
      <div class="od-FileTile-metadata">Modified today</div>
    </div>
  </div>
</div>
```

### 4. Left Navigation
```html
<nav class="od-LeftNav">
  <div class="od-LeftNav-item is-selected">
    <i class="ms-Icon ms-Icon--CloudWeather"></i>
    <span>My files</span>
  </div>
  <div class="od-LeftNav-item">
    <i class="ms-Icon ms-Icon--Recent"></i>
    <span>Recent</span>
  </div>
  <div class="od-LeftNav-item">
    <i class="ms-Icon ms-Icon--FavoriteStar"></i>
    <span>Starred</span>
  </div>
  <div class="od-LeftNav-item">
    <i class="ms-Icon ms-Icon--Group"></i>
    <span>Shared</span>
  </div>
  <div class="od-LeftNav-item">
    <i class="ms-Icon ms-Icon--Delete"></i>
    <span>Recycle bin</span>
  </div>
</nav>
```

## Implementation Strategy

### Option 1: Component Override (Fastest - Recommended for Hackathon)
Create OneDrive-specific wrapper components that override Pydio's default components.

**Steps**:
1. Create `/cells/frontend/assets/gui.ajax/res/js/ui/OneDrive/` directory
2. Create OneDrive-specific components:
   - `OneDriveCommandBar.js` - Replaces AppBar
   - `OneDriveFileList.js` - Replaces MaterialTable
   - `OneDriveLeftNav.js` - Replaces LeftPanel
   - `OneDriveFileTile.js` - Custom file card component
3. Modify main entry point to use OneDrive components
4. Rebuild frontend

**Pros**:
- Faster implementation
- Easier to maintain separate from Pydio code
- Can fall back to Pydio components if needed

**Cons**:
- Some Pydio functionality might need rewiring

### Option 2: Direct Component Modification (Most Accurate)
Directly modify existing Pydio components to match OneDrive DOM.

**Steps**:
1. Backup original components
2. Modify each component's render() method
3. Update class names to match OneDrive
4. Rebuild frontend

**Pros**:
- 100% DOM accurate
- All existing functionality preserved

**Cons**:
- Time-consuming
- Harder to track changes
- Risk of breaking existing features

### Option 3: CSS-Only DOM Modification (Quick Hack)
Use CSS `::before`, `::after`, and aggressive styling to simulate OneDrive DOM.

**Pros**:
- No code changes
- Fastest

**Cons**:
- Not truly DOM-accurate
- Won't pass DOM inspection
- Limited by CSS capabilities

## Recommended Approach for Hackathon

**Hybrid Approach**: Option 1 (Component Override) + Enhanced CSS

### Phase 1: Critical Components (2-3 hours)
1. **OneDriveCommandBar.js** - Top toolbar matching OneDrive
2. **OneDriveFileList.js** - File list with OneDrive DOM structure
3. **OneDriveLeftNav.js** - Left navigation sidebar

### Phase 2: File Display (1-2 hours)
4. **OneDriveFileTile.js** - Grid view file cards
5. **OneDriveTableRow.js** - List view rows

### Phase 3: Integration (1 hour)
6. Wire up components to Pydio's data layer
7. Test functionality (upload, download, share)

## Quick Start Implementation

### 1. Set Up Build Environment
```bash
cd /Users/sauhardgupta/onedrive-clone/cells/frontend/assets/gui.ajax
npm install
```

### 2. Create OneDrive Component Directory
```bash
mkdir -p res/js/ui/OneDrive
```

### 3. Create First Component: OneDriveCommandBar.js

```javascript
import React from 'react';
import Pydio from 'pydio';

class OneDriveCommandBar extends React.Component {
    render() {
        const {pydio} = this.props;

        return (
            <div className="CommandBar od-CommandBar" role="menubar">
                <div className="ms-CommandBar-primaryCommands">
                    <button className="ms-CommandBarItem" onClick={() => this.handleNew()}>
                        <i className="ms-Icon ms-Icon--Add"></i>
                        <span className="ms-CommandBarItem-commandText">New</span>
                    </button>
                    <button className="ms-CommandBarItem" onClick={() => this.handleUpload()}>
                        <i className="ms-Icon ms-Icon--Upload"></i>
                        <span className="ms-CommandBarItem-commandText">Upload</span>
                    </button>
                    <button className="ms-CommandBarItem">
                        <i className="ms-Icon ms-Icon--Sync"></i>
                        <span className="ms-CommandBarItem-commandText">Sync</span>
                    </button>
                    <button className="ms-CommandBarItem">
                        <i className="ms-Icon ms-Icon--Share"></i>
                        <span className="ms-CommandBarItem-commandText">Share</span>
                    </button>
                    <button className="ms-CommandBarItem">
                        <i className="ms-Icon ms-Icon--Copy"></i>
                        <span className="ms-CommandBarItem-commandText">Copy</span>
                    </button>
                    <button className="ms-CommandBarItem">
                        <i className="ms-Icon ms-Icon--MoveToFolder"></i>
                        <span className="ms-CommandBarItem-commandText">Move</span>
                    </button>
                    <button className="ms-CommandBarItem">
                        <i className="ms-Icon ms-Icon--Delete"></i>
                        <span className="ms-CommandBarItem-commandText">Delete</span>
                    </button>
                </div>
                <div className="ms-CommandBar-secondaryCommands">
                    <button className="ms-CommandBarItem">
                        <i className="ms-Icon ms-Icon--Sort"></i>
                        <span className="ms-CommandBarItem-commandText">Sort</span>
                    </button>
                    <button className="ms-CommandBarItem" onClick={() => this.handleViewChange()}>
                        <i className="ms-Icon ms-Icon--View"></i>
                        <span className="ms-CommandBarItem-commandText">View</span>
                    </button>
                    <button className="ms-CommandBarItem">
                        <i className="ms-Icon ms-Icon--Info"></i>
                        <span className="ms-CommandBarItem-commandText">Info</span>
                    </button>
                </div>
            </div>
        );
    }

    handleNew() {
        // Trigger Pydio's new file/folder action
        this.props.pydio.Controller.fireAction('upload');
    }

    handleUpload() {
        // Trigger Pydio's upload action
        this.props.pydio.Controller.fireAction('upload');
    }

    handleViewChange() {
        // Toggle view mode
        this.props.pydio.Controller.fireAction('switch_display_mode');
    }
}

export default OneDriveCommandBar;
```

### 4. Build Frontend
```bash
npm run build
# This compiles to res/dist/
```

### 5. Rebuild Cells Binary
```bash
cd /Users/sauhardgupta/onedrive-clone
./rebrand-and-deploy.sh
```

## Component Mapping

| OneDrive Component | Pydio Component | New Component | Priority |
|-------------------|-----------------|---------------|----------|
| Command Bar | AppBar.js | OneDriveCommandBar.js | HIGH |
| Left Navigation | LeftPanel.js | OneDriveLeftNav.js | HIGH |
| File List View | MaterialTable.js | OneDriveFileList.js | HIGH |
| File Grid View | DynamicGrid.js | OneDriveFileTile.js | MEDIUM |
| Breadcrumb | Breadcrumb.js | OneDriveBreadcrumb.js | MEDIUM |
| Search Bar | UnifiedSearchForm.js | OneDriveSearch.js | LOW |
| Info Panel | InfoPanel.js | OneDriveInfoPanel.js | LOW |

## Microsoft Fluent UI Icons

OneDrive uses Microsoft's Fluent UI icon system. We can either:

1. **Use Fluent UI Icons CDN**:
```html
<link rel="stylesheet" href="https://static2.sharepointonline.com/files/fabric/office-ui-fabric-core/11.0.0/css/fabric.min.css">
```

2. **Use Icon Font Mapping**:
Map Pydio's Material Design Icons to Fluent UI equivalents via CSS.

## Testing Checklist

After implementing OneDrive DOM:

- [ ] Command bar has OneDrive structure
- [ ] File list uses OneDrive table structure
- [ ] Grid view uses OneDrive tile cards
- [ ] Left navigation matches OneDrive sidebar
- [ ] Class names match OneDrive (od-*, ms-*)
- [ ] Upload functionality works
- [ ] File preview works
- [ ] Sharing works
- [ ] Search works
- [ ] Breadcrumb navigation works

## Timeline (for hackathon EOD delivery)

- **Hour 1-2**: Set up build environment, create component structure
- **Hour 3-4**: Implement OneDriveCommandBar + OneDriveLeftNav
- **Hour 5-6**: Implement OneDriveFileList (list view)
- **Hour 7**: Implement OneDriveFileTile (grid view)
- **Hour 8**: Integration testing and bug fixes
- **Hour 9**: Final rebuild and deployment

## Alternative: Faster CSS-Based Approach

If time is very limited, we can use aggressive CSS to modify DOM appearance without touching React components:

1. Use CSS `content` to replace text
2. Use CSS `::before`/`::after` to inject elements
3. Use CSS `display: none` to hide Pydio elements
4. Use CSS selectors to target specific elements

This won't be truly DOM-accurate but will look identical visually.

## Next Steps

1. Choose implementation strategy (Recommended: Hybrid)
2. Set up Node.js build environment
3. Create OneDrive component directory
4. Implement critical components
5. Test and iterate
6. Final deployment

---

**Estimated Total Time**: 6-9 hours for full OneDrive DOM replication
**Minimum Viable**: 3-4 hours for command bar + file list + left nav
