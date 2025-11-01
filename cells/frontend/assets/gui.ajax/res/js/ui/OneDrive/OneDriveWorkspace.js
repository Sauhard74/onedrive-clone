/*
 * OneDrive Workspace Layout
 * Main container that combines all OneDrive components
 */

import React from 'react';
import Pydio from 'pydio';
import OneDriveCommandBar from './CommandBar/OneDriveCommandBar';
import OneDriveLeftNav from './LeftNav/OneDriveLeftNav';
import OneDriveFileList from './FileList/OneDriveFileList';
import OneDriveFileTile from './FileTile/OneDriveFileTile';

class OneDriveWorkspace extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewMode: 'list', // 'list' or 'grid'
            infoPanelOpen: false
        };
    }

    componentDidMount() {
        const {pydio} = this.props;

        // Listen for view mode changes
        this._viewObserver = () => {
            const dm = pydio.user.getPreference('FilesList.displayMode');
            if (dm === 'grid-160' || dm === 'grid-240' || dm === 'grid-320') {
                this.setState({viewMode: 'grid'});
            } else {
                this.setState({viewMode: 'list'});
            }
        };

        pydio.observe('user_preferences_loaded', this._viewObserver);

        // Set initial view mode
        const initialDM = pydio.user?.getPreference('FilesList.displayMode');
        if (initialDM && (initialDM.indexOf('grid') > -1)) {
            this.setState({viewMode: 'grid'});
        }
    }

    componentWillUnmount() {
        const {pydio} = this.props;
        if (this._viewObserver) {
            pydio.stopObserving('user_preferences_loaded', this._viewObserver);
        }
    }

    toggleInfoPanel() {
        this.setState({infoPanelOpen: !this.state.infoPanelOpen});
    }

    render() {
        const {pydio, muiTheme} = this.props;
        const {viewMode, infoPanelOpen} = this.state;

        return (
            <div className="od-Workspace" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                backgroundColor: 'var(--onedrive-bg)',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
            }}>
                {/* Top Command Bar */}
                <OneDriveCommandBar
                    pydio={pydio}
                    muiTheme={muiTheme}
                    onToggleInfoPanel={() => this.toggleInfoPanel()}
                />

                {/* Main Content Area */}
                <div style={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden'
                }}>
                    {/* Left Navigation */}
                    <OneDriveLeftNav pydio={pydio} />

                    {/* File Browser Area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {viewMode === 'list' ? (
                            <OneDriveFileList pydio={pydio} />
                        ) : (
                            <OneDriveFileTile pydio={pydio} />
                        )}
                    </div>

                    {/* Info Panel (Right Side) - Optional */}
                    {infoPanelOpen && (
                        <div style={{
                            width: 320,
                            borderLeft: '1px solid var(--onedrive-border)',
                            backgroundColor: 'var(--onedrive-surface)',
                            overflow: 'auto',
                            padding: 16
                        }}>
                            <div style={{
                                fontSize: 18,
                                fontWeight: 600,
                                marginBottom: 16
                            }}>
                                Details
                            </div>
                            <div style={{
                                color: 'var(--onedrive-text-secondary)',
                                fontSize: 14
                            }}>
                                Select a file or folder to view details
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default OneDriveWorkspace;
