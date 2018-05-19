import React, { Component } from 'react';
import Input from '@material-ui/core/Input';

class AutoSelectInput extends Component {
    componentDidMount() {
        this.inputElement.focus();
        this.inputElement.select();
    }

    render = () => (
        <Input {...this.props} inputRef={this.setInputElement} />
    );

    setInputElement = element => {
        this.inputElement = element;
    };
}

export default AutoSelectInput;
