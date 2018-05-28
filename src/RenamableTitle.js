import React, { Component, Fragment } from 'react';
import { withStyles } from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import Popover from '@material-ui/core/Popover';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import AutoSelectInput from './AutoSelectInput';

const styles = ({
    title: {
        padding: '8px 20px',
        overflow: 'hidden'
    },
    renamer: {
        padding: 8
    }
});

class RenamableTitle extends Component {
    state = {
        renamer: { open: false }
    };

    render = () => (
        <Fragment>
            {this.renderTitle()}
            {this.renderRenamer()}
        </Fragment>
    );

    renderTitle = () => (
        <ButtonBase className={this.props.classes.title} title="Rename" onClick={this.openRenamer}>
            <Typography variant="title" noWrap>{this.props.name || "unnamed"}</Typography>
        </ButtonBase>
    );

    openRenamer = event => {
        this.setState({
            renamer: { open: true, anchorEl: event.currentTarget, value: this.props.name }
        });
    };

    renderRenamer = () => (
        <Popover
            classes={{ paper: this.props.classes.renamer }}
            anchorEl={this.state.renamer.anchorEl}
            open={this.state.renamer.open}
            onClose={this.closeRenamer}
            marginThreshold={0}>
            {this.renderRenamerTextField()}
        </Popover>
    );

    closeRenamer = () => {
        this.setState(state => ({
            renamer: { ...state.renamer, open: false }
        }));
    };

    renderRenamerTextField = () => (
        <FormControl>
            <InputLabel htmlFor="renamer-input">Rename</InputLabel>
            <AutoSelectInput
                id="renamer-input"
                value={this.state.renamer.value}
                onChange={this.handleRenamerInputChange}
                onKeyDown={this.handleRenamerInputKeyDown}
                inputProps={{ autoCapitalize: "off" }} />
        </FormControl>
    );

    handleRenamerInputChange = event => {
        let value = event.target.value;
        this.setState(state => ({
            renamer: { ...state.renamer, value }
        }));
    };

    handleRenamerInputKeyDown = event => {
        if (event.key === 'Enter') {
            this.saveRenameResult();
        }
    };

    saveRenameResult = () => {
        this.props.setName(this.state.renamer.value);
        this.closeRenamer();
    };
}

export default withStyles(styles)(RenamableTitle);
