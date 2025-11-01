/*
 * OneDrive Left Navigation Component
 * Replicates Microsoft OneDrive's left sidebar navigation with exact DOM structure
 */

import React from 'react';
import Pydio from 'pydio';

class OneDriveLeftNav extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            workspaces: new Map(),
            activeWorkspace: null,
            selectedItem: 'files'
        };
    }

    componentDidMount() {
        const {pydio} = this.props;
        this._observer = () => {
            this.loadWorkspaces();
        };
        pydio.observe('repository_list_refreshed', this._observer);
        pydio.observe('context_changed', this._observer);
        this.loadWorkspaces();
    }

    componentWillUnmount() {
        const {pydio} = this.props;
        pydio.stopObserving('repository_list_refreshed', this._observer);
        pydio.stopObserving('context_changed', this._observer);
    }

    loadWorkspaces() {
        const {pydio} = this.props;
        if (pydio.user) {
            const workspaces = pydio.user.getRepositoriesList();
            const activeWorkspace = pydio.user.getActiveRepository();
            this.setState({
                workspaces,
                activeWorkspace
            });
        }
    }

    switchWorkspace(repoId) {
        const {pydio} = this.props;
        pydio.triggerRepositoryChange(repoId);
    }

    navigateToRecent() {
        this.setState({selectedItem: 'recent'});
        // Trigger search for recently modified files
        const {pydio} = this.props;
        // Implementation would go here
    }

    navigateToStarred() {
        this.setState({selectedItem: 'starred'});
        // Trigger search for starred files
    }

    navigateToShared() {
        this.setState({selectedItem: 'shared'});
        // Navigate to shared workspace
        const {pydio} = this.props;
        const workspaces = pydio.user.getRepositoriesList();
        // Find cells/shared workspace
        workspaces.forEach((ws, id) => {
            if (ws.getLabel().toLowerCase().includes('cell') || ws.getLabel().toLowerCase().includes('shared')) {
                this.switchWorkspace(id);
            }
        });
    }

    navigateToRecycleBin() {
        this.setState({selectedItem: 'recycle'});
        const {pydio} = this.props;
        const workspaces = pydio.user.getRepositoriesList();
        // Find recycle bin workspace
        workspaces.forEach((ws, id) => {
            if (ws.getAccessType() === 'gateway_recycle_bin') {
                this.switchWorkspace(id);
            }
        });
    }

    render() {
        const {pydio} = this.props;
        const {workspaces, activeWorkspace, selectedItem} = this.state;

        return (
            <nav className="od-LeftNav" style={{
                width: 220,
                height: '100%',
                backgroundColor: 'var(--onedrive-sidebar-bg)',
                borderRight: '1px solid var(--onedrive-border)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
                padding: '8px 0'
            }}>
                {/* OneDrive Logo / Branding */}
                <div style={{
                    padding: '12px 16px',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--onedrive-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 8
                }}>
                    <i className="mdi mdi-cloud" style={{fontSize: 24, marginRight: 8}}></i>
                    <span>OneDrive</span>
                </div>

                {/* Primary Navigation Items */}
                <div className="od-LeftNav-section">
                    {workspaces && Array.from(workspaces.entries()).map(([id, ws]) => {
                        if (ws.getAccessType() === 'gateway_recycle_bin' || ws.getId() === 'homepage') {
                            return null;
                        }

                        const isActive = id === activeWorkspace || selectedItem === 'files';
                        const label = ws.getLabel();
                        const isPersonal = label.toLowerCase().includes('personal') || label.toLowerCase().includes('my files');

                        if (isPersonal || workspaces.size === 1) {
                            return (
                                <div
                                    key={id}
                                    className={`od-LeftNav-item ${isActive ? 'is-selected' : ''}`}
                                    onClick={() => {
                                        this.switchWorkspace(id);
                                        this.setState({selectedItem: 'files'});
                                    }}
                                    style={this.getNavItemStyle(isActive)}
                                >
                                    <i className="ms-Icon mdi mdi-folder" style={{fontSize: 20, marginRight: 12}}></i>
                                    <span>My files</span>
                                </div>
                            );
                        }
                        return null;
                    })}

                    <div
                        className={`od-LeftNav-item ${selectedItem === 'recent' ? 'is-selected' : ''}`}
                        onClick={() => this.navigateToRecent()}
                        style={this.getNavItemStyle(selectedItem === 'recent')}
                    >
                        <i className="ms-Icon mdi mdi-clock-outline" style={{fontSize: 20, marginRight: 12}}></i>
                        <span>Recent</span>
                    </div>

                    <div
                        className={`od-LeftNav-item ${selectedItem === 'starred' ? 'is-selected' : ''}`}
                        onClick={() => this.navigateToStarred()}
                        style={this.getNavItemStyle(selectedItem === 'starred')}
                    >
                        <i className="ms-Icon mdi mdi-star-outline" style={{fontSize: 20, marginRight: 12}}></i>
                        <span>Starred</span>
                    </div>
                </div>

                {/* Shared Section */}
                <div className="od-LeftNav-section" style={{marginTop: 16}}>
                    <div
                        className={`od-LeftNav-item ${selectedItem === 'shared' ? 'is-selected' : ''}`}
                        onClick={() => this.navigateToShared()}
                        style={this.getNavItemStyle(selectedItem === 'shared')}
                    >
                        <i className="ms-Icon mdi mdi-account-multiple" style={{fontSize: 20, marginRight: 12}}></i>
                        <span>Shared</span>
                    </div>

                    {/* List other workspaces/cells */}
                    {workspaces && Array.from(workspaces.entries()).map(([id, ws]) => {
                        if (ws.getAccessType() === 'gateway_recycle_bin' || ws.getId() === 'homepage') {
                            return null;
                        }

                        const label = ws.getLabel();
                        const isPersonal = label.toLowerCase().includes('personal') || label.toLowerCase().includes('my files');
                        const isActive = id === activeWorkspace && selectedItem === 'files';

                        if (!isPersonal && workspaces.size > 1) {
                            return (
                                <div
                                    key={id}
                                    className={`od-LeftNav-item od-LeftNav-subitem ${isActive ? 'is-selected' : ''}`}
                                    onClick={() => {
                                        this.switchWorkspace(id);
                                        this.setState({selectedItem: 'files'});
                                    }}
                                    style={{...this.getNavItemStyle(isActive), paddingLeft: 48}}
                                >
                                    <i className="ms-Icon mdi mdi-folder-account" style={{fontSize: 18, marginRight: 10}}></i>
                                    <span style={{fontSize: 13}}>{label}</span>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>

                {/* Bottom Section - Recycle Bin */}
                <div className="od-LeftNav-section" style={{marginTop: 'auto', paddingTop: 16}}>
                    <div
                        className={`od-LeftNav-item ${selectedItem === 'recycle' ? 'is-selected' : ''}`}
                        onClick={() => this.navigateToRecycleBin()}
                        style={this.getNavItemStyle(selectedItem === 'recycle')}
                    >
                        <i className="ms-Icon mdi mdi-delete-outline" style={{fontSize: 20, marginRight: 12}}></i>
                        <span>Recycle bin</span>
                    </div>

                    {/* Storage Indicator */}
                    <div style={{
                        padding: '16px',
                        fontSize: 12,
                        color: 'var(--onedrive-text-secondary)'
                    }}>
                        <div style={{marginBottom: 8}}>
                            <div style={{
                                height: 4,
                                backgroundColor: 'var(--onedrive-border)',
                                borderRadius: 2,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: '35%',
                                    height: '100%',
                                    backgroundColor: 'var(--onedrive-blue)'
                                }}></div>
                            </div>
                        </div>
                        <div>3.5 GB of 10 GB used</div>
                    </div>
                </div>
            </nav>
        );
    }

    getNavItemStyle(isActive) {
        return {
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--onedrive-blue)' : 'var(--onedrive-text-primary)',
            backgroundColor: isActive ? 'var(--onedrive-blue-light)' : 'transparent',
            cursor: 'pointer',
            borderRadius: 4,
            margin: '2px 8px',
            transition: 'all 0.15s ease',
            userSelect: 'none'
        };
    }
}

export default OneDriveLeftNav;
