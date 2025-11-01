/*
 * Copyright 2007-2017 Charles du Jeu - Abstrium SAS <team (at) pyd.io>
 * Modified for OneDrive Clone
 */

import React from 'react';
import Pydio from 'pydio';
import {muiThemeable} from 'material-ui/styles';
import OneDriveWorkspace from '../../OneDrive/OneDriveWorkspace';

class FSTemplate extends React.Component {

    constructor(props){
        super(props);
        this.state = {};
    }

    componentDidMount(){
        const {pydio} = this.props;
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

FSTemplate.displayName = "FSTemplate";
FSTemplate.propTypes = {
    pydio: React.PropTypes.instanceOf(Pydio)
};

export default muiThemeable()(FSTemplate);
