import React, { Component, Fragment } from 'react';
import { withStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import InfoOutlineIcon from '@material-ui/icons/InfoOutline';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import AutoSelectInput from './AutoSelectInput';

const lambdaChar = '\u03BB';

const styles = {
    input: {
        margin: '8px 16px'
    },
    info: {
        padding: '8px 16px 0'
    }
};

class Editor extends Component {
    state = {
        input: this.props.initialInput,
        infoOpen: false
    }

    render = () => (
        <Fragment>
            {this.renderInput()}
            {this.state.infoOpen ? this.renderInfo() : this.renderItems()}
        </Fragment>
    );

    renderInput = () => (
        <div className={this.props.classes.input}>
            <AutoSelectInput
                fullWidth
                value={this.state.input}
                onChange={this.handleInputChange}
                onKeyDown={this.handleInputKeyDown}
                inputProps={{ autoCapitalize: "off" }}
                endAdornment={this.renderInputAdornment()} />
        </div>
    );

    handleInputChange = event => {
        let { value } = event.target;
        this.setState({
            input: value === '.' ? lambdaChar : value
        });
    };

    handleInputKeyDown = event => {
        if (event.key === 'Enter') {
            this.saveResult();
        }
    };

    saveResult = () => {
        let input = this.state.input;
        if (input.startsWith(lambdaChar)) {
            this.props.saveResult('function', input.substr(1));
        } else if (isNaN(input)) {
            this.props.saveResult('placeholder', input);
        } else {
            this.props.saveResult('number', +input);
        }
    };

    renderInputAdornment = () => (
        <InputAdornment position="end">
            <IconButton onClick={this.toggleInfo} onMouseDown={e => e.preventDefault()}>
                {this.state.infoOpen ? <InfoIcon /> : <InfoOutlineIcon />}
            </IconButton>
        </InputAdornment>
    );

    toggleInfo = () => {
        this.setState(state => ({
            infoOpen: !state.infoOpen
        }));
    };

    renderInfo = () => (
        <div className={this.props.classes.info}>
            <Typography variant="subheading" gutterBottom>Valid inputs</Typography>
            <Typography gutterBottom>Numbers: just enter the number</Typography>
            <Typography gutterBottom>References: select from the autocomplete list</Typography>
            <Typography gutterBottom>Function signatures: start with ".", then enter the parameter name</Typography>
        </div>
    );

    renderItems = () => this.getItems().map(this.renderItem);

    getItems = () => this.props.items.filter(this.matchesSearch);

    matchesSearch = item => item.name.startsWith(this.state.input);

    renderItem = (item, index) => (
        <MenuItem key={index} onClick={() => this.props.saveResult(item.type, item.value)}>
            {item.name}
        </MenuItem>
    );
}

export default withStyles(styles)(Editor);
