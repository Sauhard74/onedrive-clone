/*
 * OneDrive Command Bar Component
 * Replicates Microsoft OneDrive's top command bar with exact DOM structure
 */

import React from 'react';
import Pydio from 'pydio';
const {ModernButton} = Pydio.requireLib('hoc');

class OneDriveCommandBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selection: [],
            canUpload: false,
            canDownload: false,
            canShare: false,
            canDelete: false
        };
    }

    componentDidMount() {
        const {pydio} = this.props;
        this._observer = () => {
            this.updateSelection();
        };
        pydio.observe('selection_changed', this._observer);
        this.updateSelection();
    }

    componentWillUnmount() {
        const {pydio} = this.props;
        pydio.stopObserving('selection_changed', this._observer);
    }

    updateSelection() {
        const {pydio} = this.props;
        const selection = pydio.getContextHolder().getSelectedNodes();
        const canUpload = pydio.getController().getActionByName('upload') !== undefined;
        const canDownload = selection.length > 0 && pydio.getController().getActionByName('download') !== undefined;
        const canShare = selection.length > 0 && pydio.getController().getActionByName('share') !== undefined;
        const canDelete = selection.length > 0 && pydio.getController().getActionByName('delete') !== undefined;

        this.setState({
            selection: selection,
            canUpload,
            canDownload,
            canShare,
            canDelete
        });
    }

    handleAction(actionName) {
        const {pydio} = this.props;
        const action = pydio.getController().getActionByName(actionName);
        if (action) {
            action.apply();
        }
    }

    render() {
        const {pydio, muiTheme} = this.props;
        const {selection, canUpload, canDownload, canShare, canDelete} = this.state;
        const hasSelection = selection.length > 0;

        return (
            <div className="CommandBar od-CommandBar" role="menubar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 48,
                padding: '0 16px',
                backgroundColor: 'var(--onedrive-surface)',
                borderBottom: '1px solid var(--onedrive-border)',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
            }}>
                {/* Primary Commands */}
                <div className="ms-CommandBar-primaryCommands" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <button
                        className="ms-CommandBarItem od-CommandBarItem"
                        onClick={() => this.handleAction('mkdir')}
                        style={this.getButtonStyle()}
                        disabled={!canUpload}
                    >
                        <i className="ms-Icon mdi mdi-plus" style={{fontSize: 16, marginRight: 6}}></i>
                        <span className="ms-CommandBarItem-commandText">New</span>
                    </button>

                    <button
                        className="ms-CommandBarItem od-CommandBarItem"
                        onClick={() => this.handleAction('upload')}
                        style={this.getButtonStyle()}
                        disabled={!canUpload}
                    >
                        <i className="ms-Icon mdi mdi-upload" style={{fontSize: 16, marginRight: 6}}></i>
                        <span className="ms-CommandBarItem-commandText">Upload</span>
                    </button>

                    {hasSelection && (
                        <>
                            <div style={{width: 1, height: 24, backgroundColor: 'var(--onedrive-divider)', margin: '0 4px'}}></div>

                            <button
                                className="ms-CommandBarItem od-CommandBarItem"
                                onClick={() => this.handleAction('download')}
                                style={this.getButtonStyle()}
                                disabled={!canDownload}
                            >
                                <i className="ms-Icon mdi mdi-download" style={{fontSize: 16, marginRight: 6}}></i>
                                <span className="ms-CommandBarItem-commandText">Download</span>
                            </button>

                            <button
                                className="ms-CommandBarItem od-CommandBarItem"
                                onClick={() => this.handleAction('share')}
                                style={this.getButtonStyle()}
                                disabled={!canShare}
                            >
                                <i className="ms-Icon mdi mdi-share-variant" style={{fontSize: 16, marginRight: 6}}></i>
                                <span className="ms-CommandBarItem-commandText">Share</span>
                            </button>

                            <button
                                className="ms-CommandBarItem od-CommandBarItem"
                                onClick={() => this.handleAction('copy')}
                                style={this.getButtonStyle()}
                            >
                                <i className="ms-Icon mdi mdi-content-copy" style={{fontSize: 16, marginRight: 6}}></i>
                                <span className="ms-CommandBarItem-commandText">Copy</span>
                            </button>

                            <button
                                className="ms-CommandBarItem od-CommandBarItem"
                                onClick={() => this.handleAction('move')}
                                style={this.getButtonStyle()}
                            >
                                <i className="ms-Icon mdi mdi-folder-move" style={{fontSize: 16, marginRight: 6}}></i>
                                <span className="ms-CommandBarItem-commandText">Move</span>
                            </button>

                            <button
                                className="ms-CommandBarItem od-CommandBarItem"
                                onClick={() => this.handleAction('delete')}
                                style={this.getButtonStyle()}
                                disabled={!canDelete}
                            >
                                <i className="ms-Icon mdi mdi-delete" style={{fontSize: 16, marginRight: 6}}></i>
                                <span className="ms-CommandBarItem-commandText">Delete</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Secondary Commands */}
                <div className="ms-CommandBar-secondaryCommands" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <button
                        className="ms-CommandBarItem od-CommandBarItem"
                        onClick={() => this.handleAction('switch_display_mode')}
                        style={this.getButtonStyle()}
                        title="Change view"
                    >
                        <i className="ms-Icon mdi mdi-view-grid" style={{fontSize: 16, marginRight: 6}}></i>
                        <span className="ms-CommandBarItem-commandText">View</span>
                    </button>

                    <button
                        className="ms-CommandBarItem od-CommandBarItem"
                        onClick={() => this.handleAction('refresh')}
                        style={this.getButtonStyle()}
                        title="Refresh"
                    >
                        <i className="ms-Icon mdi mdi-refresh" style={{fontSize: 16}}></i>
                    </button>

                    {hasSelection && (
                        <button
                            className="ms-CommandBarItem od-CommandBarItem"
                            onClick={() => this.props.onToggleInfoPanel && this.props.onToggleInfoPanel()}
                            style={this.getButtonStyle()}
                            title="Details"
                        >
                            <i className="ms-Icon mdi mdi-information-outline" style={{fontSize: 16}}></i>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    getButtonStyle() {
        return {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            height: 32,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--onedrive-text-primary)',
            fontSize: 14,
            fontWeight: 400,
            cursor: 'pointer',
            borderRadius: 4,
            transition: 'background-color 0.1s ease',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap'
        };
    }
}

export default OneDriveCommandBar;
