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
        infoOpen: false,
        selectedIndex: 0
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
            input: value === '.' ? lambdaChar : value,
            selectedIndex: 0
        });
    };

    handleInputKeyDown = event => {
        switch (event.key) {
            case 'Enter':
                this.saveResult();
                return;
            case 'ArrowDown':
                this.setState(state => ({
                    selectedIndex: Math.min(state.selectedIndex + 1, this.getMatchCount() - 1)
                }));
                event.preventDefault();
                return;
            case 'ArrowUp':
                this.setState(state => ({
                    selectedIndex: Math.max(0, state.selectedIndex - 1)
                }));
                event.preventDefault();
                return;
            default:
                return;
        }
    };

    saveResult = () => {
        let item = this.getMatches()[this.state.selectedIndex];
        if (item) {
            this.props.saveResult(item.type, item.value);
        } else {
            let input = this.state.input;
            if (input.startsWith(lambdaChar)) {
                this.props.saveResult('function', input.substr(1));
            } else if (isNaN(input)) {
                this.props.saveResult('placeholder', input);
            } else {
                this.props.saveResult('number', +input);
            }
        }
    };

    getMatchCount = () => this.getMatches().length;

    getMatches = () => this.props.items.filter(this.startsWithInput);

    startsWithInput = item => item.name.startsWith(this.state.input);

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

    renderItems = () => this.getMatches().map(this.renderItem);

    renderItem = (item, index) => (
        <MenuItem
            key={index}
            selected={index === this.state.selectedIndex}
            onClick={() => this.props.saveResult(item.type, item.value)}>
            {item.name}
        </MenuItem>
    );
}

export default withStyles(styles)(Editor);
