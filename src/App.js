import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition } from 'react-dnd-multi-backend';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history'
import Ui from './Ui';

const history = createBrowserHistory();
history.listen((location, action) => {
    window.gtag('config', window.GA_TRACKING_ID, {
        'page_path': location.pathname
    });
});

class App extends Component {
    render() {
        return <Router history={history}><Ui /></Router>;
    }
}

const multiBackend = MultiBackend({
    backends: [{
        backend: HTML5Backend
    }, {
        backend: TouchBackend({
            delayTouchStart: 500
        }),
        preview: true,
        transition: TouchTransition
    }]
});

export default DragDropContext(multiBackend)(App);
