import React from 'react';
import classNames from 'classnames';
import AppBar from '@material-ui/core/AppBar';
import { withStyles } from "@material-ui/core/styles";

const styles = {
    root: {
        height: 56,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center'
    }
};

let Toolbar = ({ classes, className, children }) => (
    <AppBar position="static" elevation={0} color="default" className={classNames(classes.root, className)}>
        {children}
    </AppBar>
);

export default withStyles(styles)(Toolbar);
