import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition } from 'react-dnd-multi-backend';
import { BrowserRouter as Router } from 'react-router-dom';
import Ui from './Ui';

class App extends Component {
    render() {
        return <Router><Ui /></Router>;
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
