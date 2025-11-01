/*
 * OneDrive File Tile Grid Component
 * Replicates Microsoft OneDrive's grid/tile view with exact DOM structure
 */

import React from 'react';
import Pydio from 'pydio';
import {Checkbox} from 'material-ui';

class OneDriveFileTile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nodes: [],
            selectedNodes: []
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
            // Single select
            this.setState({selectedNodes: [node]});
            pydio.getContextHolder().setSelectedNodes([node]);
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

    toggleSelection(node, checked, event) {
        event.stopPropagation();
        let {selectedNodes} = this.state;
        if (checked) {
            selectedNodes = [...selectedNodes, node];
        } else {
            selectedNodes = selectedNodes.filter(n => n !== node);
        }
        this.setState({selectedNodes});
        this.props.pydio.getContextHolder().setSelectedNodes(selectedNodes);
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Modified today';
        } else if (days === 1) {
            return 'Modified yesterday';
        } else if (days < 7) {
            return `Modified ${days} days ago`;
        } else {
            return 'Modified ' + date.toLocaleDateString();
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

    getThumbnail(node) {
        const {pydio} = this.props;
        if (node.isLeaf()) {
            const mime = node.getAjxpMime();
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].indexOf(mime) > -1) {
                // Return thumbnail URL if available
                return pydio.Parameters.get('ajxpServerAccess') + '&get_action=preview_data_proxy&file=' + encodeURIComponent(node.getPath());
            }
        }
        return null;
    }

    render() {
        const {nodes, selectedNodes} = this.state;

        // Separate folders and files
        const folders = nodes.filter(n => !n.isLeaf());
        const files = nodes.filter(n => n.isLeaf());
        const orderedNodes = [...folders, ...files];

        return (
            <div className="od-Files-grid" style={{
                flex: 1,
                padding: 16,
                overflow: 'auto',
                backgroundColor: 'var(--onedrive-surface)',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
            }}>
                {orderedNodes.length === 0 && (
                    <div style={{
                        padding: 40,
                        textAlign: 'center',
                        color: 'var(--onedrive-text-secondary)',
                        fontSize: 14
                    }}>
                        <i className="mdi mdi-folder-open-outline" style={{fontSize: 64, display: 'block', marginBottom: 16, opacity: 0.5}}></i>
                        This folder is empty
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 16
                }}>
                    {orderedNodes.map((node) => {
                        const isSelected = selectedNodes.includes(node);
                        const isFolder = !node.isLeaf();
                        const thumbnail = this.getThumbnail(node);

                        return (
                            <div
                                key={node.getPath()}
                                className={`od-FileTile ${isSelected ? 'is-selected' : ''}`}
                                onClick={(e) => this.handleNodeClick(node, e)}
                                onDoubleClick={() => this.handleNodeDoubleClick(node)}
                                style={{
                                    position: 'relative',
                                    border: `2px solid ${isSelected ? 'var(--onedrive-blue)' : 'var(--onedrive-border)'}`,
                                    borderRadius: 8,
                                    backgroundColor: 'var(--onedrive-surface)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = 'var(--onedrive-divider)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = 'var(--onedrive-border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {/* Checkbox */}
                                <div style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    zIndex: 2,
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheck={(e, checked) => this.toggleSelection(node, checked, e)}
                                        iconStyle={{fill: 'var(--onedrive-blue)'}}
                                        style={{width: 24, height: 24}}
                                    />
                                </div>

                                {/* Image/Icon Container */}
                                <div className="od-FileTile-imageContainer" style={{
                                    height: 140,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--onedrive-bg)',
                                    position: 'relative'
                                }}>
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            alt={node.getLabel()}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                // Fallback to icon if image fails
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = `<i class="mdi ${this.getFileIcon(node)}" style="font-size: 64px; color: var(--onedrive-blue); opacity: 0.7;"></i>`;
                                            }}
                                        />
                                    ) : (
                                        <i
                                            className={this.getFileIcon(node)}
                                            style={{
                                                fontSize: 64,
                                                color: isFolder ? 'var(--onedrive-blue)' : 'var(--onedrive-text-secondary)',
                                                opacity: 0.7
                                            }}
                                        ></i>
                                    )}
                                </div>

                                {/* Nameplate */}
                                <div className="od-FileTile-nameplate" style={{
                                    padding: 12,
                                    backgroundColor: 'var(--onedrive-surface)'
                                }}>
                                    <div className="od-FileTile-name" style={{
                                        fontSize: 14,
                                        fontWeight: isFolder ? 600 : 400,
                                        color: 'var(--onedrive-text-primary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        marginBottom: 4
                                    }}>
                                        {node.getLabel()}
                                    </div>
                                    <div className="od-FileTile-metadata" style={{
                                        fontSize: 12,
                                        color: 'var(--onedrive-text-secondary)'
                                    }}>
                                        {this.formatDate(node.getMetadata().get('ajxp_modiftime'))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default OneDriveFileTile;
