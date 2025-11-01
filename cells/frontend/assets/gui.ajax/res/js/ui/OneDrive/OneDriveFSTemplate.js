/*
 * OneDrive FS Template
 * Replaces Pydio's default FSTemplate with OneDrive workspace
 */

import React from 'react';
import Pydio from 'pydio';
import {muiThemeable} from 'material-ui/styles';
import OneDriveWorkspace from './OneDriveWorkspace';

class OneDriveFSTemplate extends React.Component {

    constructor(props){
        super(props);
        this.state = {};
    }

    componentDidMount(){
        const {pydio} = this.props;
        // Set up any necessary observers
        this._contextObserver = () => {
            this.forceUpdate();
        };
        pydio.observe('context_changed', this._contextObserver);
    }

    componentWillUnmount(){
        const {pydio} = this.props;
        if (this._contextObserver) {
            pydio.stopObserving('context_changed', this._contextObserver);
        }
    }

    render(){
        const {pydio, muiTheme} = this.props;

        return (
            <OneDriveWorkspace
                pydio={pydio}
                muiTheme={muiTheme}
            />
        );
    }
}

OneDriveFSTemplate.displayName = "OneDriveFSTemplate";
OneDriveFSTemplate.propTypes = {
    pydio: React.PropTypes.instanceOf(Pydio)
};

export default muiThemeable()(OneDriveFSTemplate);
