/*
 * OneDrive File List Component
 * Replicates Microsoft OneDrive's file list view with exact DOM structure
 */

import React from 'react';
import Pydio from 'pydio';
import {Checkbox} from 'material-ui';

class OneDriveFileList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nodes: [],
            selectedNodes: [],
            sortColumn: 'name',
            sortDirection: 'asc'
        };
    }

    componentDidMount() {
        const {pydio} = this.props;
        this._observer = () => {
            this.reload();
        };
        pydio.observe('context_changed', this._observer);
        this.reload();
    }

    componentWillUnmount() {
        const {pydio} = this.props;
        pydio.stopObserving('context_changed', this._observer);
    }

    reload() {
        const {pydio} = this.props;
        const contextNode = pydio.getContextNode();
        if (contextNode) {
            const children = [];
            contextNode.getChildren().forEach((child) => {
                children.push(child);
            });
            this.setState({nodes: children});
        }
    }

    handleNodeClick(node, event) {
        const {pydio} = this.props;
        if (event.shiftKey || event.ctrlKey || event.metaKey) {
            // Multi-select
            let {selectedNodes} = this.state;
            const index = selectedNodes.indexOf(node);
            if (index > -1) {
                selectedNodes = selectedNodes.filter(n => n !== node);
            } else {
                selectedNodes = [...selectedNodes, node];
            }
            this.setState({selectedNodes});
            pydio.getContextHolder().setSelectedNodes(selectedNodes);
        } else {
            // Single select or open
            if (node.isLeaf()) {
                // Open file
                pydio.getController().fireSelectionChange();
                pydio.getController().fireAction('open_file');
            } else {
                // Navigate into folder
                pydio.goTo(node);
            }
        }
    }

    handleNodeDoubleClick(node) {
        const {pydio} = this.props;
        if (node.isLeaf()) {
            const action = pydio.getController().getActionByName('open_file');
            if (action) {
                action.apply();
            }
        } else {
            pydio.goTo(node);
        }
    }

    toggleSelection(node, checked) {
        let {selectedNodes} = this.state;
        if (checked) {
            selectedNodes = [...selectedNodes, node];
        } else {
            selectedNodes = selectedNodes.filter(n => n !== node);
        }
        this.setState({selectedNodes});
        this.props.pydio.getContextHolder().setSelectedNodes(selectedNodes);
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '-';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
    }

    formatDate(timestamp) {
        if (!timestamp) return '-';
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today ' + date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return days + ' days ago';
        } else {
            return date.toLocaleDateString();
        }
    }

    getFileIcon(node) {
        if (!node.isLeaf()) {
            return 'mdi mdi-folder';
        }

        const ext = node.getAjxpMime();
        const iconMap = {
            'doc': 'mdi mdi-file-word',
            'docx': 'mdi mdi-file-word',
            'xls': 'mdi mdi-file-excel',
            'xlsx': 'mdi mdi-file-excel',
            'ppt': 'mdi mdi-file-powerpoint',
            'pptx': 'mdi mdi-file-powerpoint',
            'pdf': 'mdi mdi-file-pdf',
            'zip': 'mdi mdi-folder-zip',
            'jpg': 'mdi mdi-file-image',
            'jpeg': 'mdi mdi-file-image',
            'png': 'mdi mdi-file-image',
            'gif': 'mdi mdi-file-image',
            'txt': 'mdi mdi-file-document',
            'mp4': 'mdi mdi-file-video',
            'mp3': 'mdi mdi-file-music'
        };

        return iconMap[ext] || 'mdi mdi-file';
    }

    handleSort(column) {
        const {sortColumn, sortDirection} = this.state;
        let newDirection = 'asc';
        if (sortColumn === column) {
            newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        }
        this.setState({sortColumn: column, sortDirection: newDirection});
    }

    render() {
        const {nodes, selectedNodes, sortColumn, sortDirection} = this.state;

        // Sort nodes
        const sortedNodes = [...nodes].sort((a, b) => {
            let aVal, bVal;
            switch (sortColumn) {
                case 'name':
                    aVal = a.getLabel().toLowerCase();
                    bVal = b.getLabel().toLowerCase();
                    break;
                case 'modified':
                    aVal = a.getMetadata().get('ajxp_modiftime') || 0;
                    bVal = b.getMetadata().get('ajxp_modiftime') || 0;
                    break;
                case 'size':
                    aVal = a.isLeaf() ? (a.getMetadata().get('bytesize') || 0) : 0;
                    bVal = b.isLeaf() ? (b.getMetadata().get('bytesize') || 0) : 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Folders first
        const folders = sortedNodes.filter(n => !n.isLeaf());
        const files = sortedNodes.filter(n => n.isLeaf());
        const orderedNodes = [...folders, ...files];

        return (
            <div className="od-Files-list" role="grid" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--onedrive-surface)',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
                overflow: 'hidden'
            }}>
                {/* Column Headers */}
                <div className="od-Files-header" style={{
                    display: 'flex',
                    padding: '8px 16px',
                    borderBottom: '1px solid var(--onedrive-border)',
                    backgroundColor: 'var(--onedrive-bg)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--onedrive-text-secondary)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                }}>
                    <div style={{width: 40}}></div>
                    <div
                        className="od-Files-columnHeader"
                        onClick={() => this.handleSort('name')}
                        style={{
                            flex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        Name
                        {sortColumn === 'name' && (
                            <i className={`mdi mdi-chevron-${sortDirection === 'asc' ? 'up' : 'down'}`} style={{marginLeft: 4}}></i>
                        )}
                    </div>
                    <div
                        className="od-Files-columnHeader"
                        onClick={() => this.handleSort('modified')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        Modified
                        {sortColumn === 'modified' && (
                            <i className={`mdi mdi-chevron-${sortDirection === 'asc' ? 'up' : 'down'}`} style={{marginLeft: 4}}></i>
                        )}
                    </div>
                    <div style={{flex: 1}}>Modified by</div>
                    <div
                        className="od-Files-columnHeader"
                        onClick={() => this.handleSort('size')}
                        style={{
                            width: 100,
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        File size
                        {sortColumn === 'size' && (
                            <i className={`mdi mdi-chevron-${sortDirection === 'asc' ? 'up' : 'down'}`} style={{marginLeft: 4}}></i>
                        )}
                    </div>
                </div>

                {/* File List Body */}
                <div className="od-Files-listBody" style={{
                    flex: 1,
                    overflow: 'auto'
                }}>
                    {orderedNodes.length === 0 && (
                        <div style={{
                            padding: 40,
                            textAlign: 'center',
                            color: 'var(--onedrive-text-secondary)',
                            fontSize: 14
                        }}>
                            <i className="mdi mdi-folder-open-outline" style={{fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.5}}></i>
                            This folder is empty
                        </div>
                    )}

                    {orderedNodes.map((node, index) => {
                        const isSelected = selectedNodes.includes(node);
                        const isFolder = !node.isLeaf();

                        return (
                            <div
                                key={node.getPath()}
                                className={`od-Files-listRow ${isSelected ? 'is-selected' : ''}`}
                                role="row"
                                onClick={(e) => this.handleNodeClick(node, e)}
                                onDoubleClick={() => this.handleNodeDoubleClick(node)}
                                style={{
                                    display: 'flex',
                                    padding: '8px 16px',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--onedrive-border)',
                                    backgroundColor: isSelected ? 'var(--onedrive-blue-light)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.1s ease',
                                    fontSize: 14
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'var(--onedrive-bg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {/* Checkbox */}
                                <div className="od-Files-cell" style={{width: 40}}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheck={(e, checked) => {
                                            e.stopPropagation();
                                            this.toggleSelection(node, checked);
                                        }}
                                        iconStyle={{fill: 'var(--onedrive-blue)'}}
                                        style={{width: 24, height: 24}}
                                    />
                                </div>

                                {/* Name with Icon */}
                                <div className="od-Files-cell" style={{
                                    flex: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    overflow: 'hidden'
                                }}>
                                    <i
                                        className={`ms-Icon ${this.getFileIcon(node)}`}
                                        style={{
                                            fontSize: 20,
                                            marginRight: 12,
                                            color: isFolder ? 'var(--onedrive-blue)' : 'var(--onedrive-text-secondary)',
                                            flexShrink: 0
                                        }}
                                    ></i>
                                    <span className="od-Files-name" style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontWeight: isFolder ? 600 : 400
                                    }}>
                                        {node.getLabel()}
                                    </span>
                                </div>

                                {/* Modified */}
                                <div className="od-Files-cell" style={{
                                    flex: 1,
                                    color: 'var(--onedrive-text-secondary)',
                                    fontSize: 13
                                }}>
                                    {this.formatDate(node.getMetadata().get('ajxp_modiftime'))}
                                </div>

                                {/* Modified By */}
                                <div className="od-Files-cell" style={{
                                    flex: 1,
                                    color: 'var(--onedrive-text-secondary)',
                                    fontSize: 13
                                }}>
                                    {node.getMetadata().get('owner') || 'You'}
                                </div>

                                {/* File Size */}
                                <div className="od-Files-cell" style={{
                                    width: 100,
                                    color: 'var(--onedrive-text-secondary)',
                                    fontSize: 13,
                                    textAlign: 'right'
                                }}>
                                    {isFolder ? '-' : this.formatFileSize(node.getMetadata().get('bytesize'))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default OneDriveFileList;
