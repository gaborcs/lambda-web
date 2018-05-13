import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from "@material-ui/core/styles";

const styles = {
    appBarToolbar: {
        justifyContent: 'space-between'
    }
};

let LambdaAppBar = ({ classes, children }) => (
    <AppBar position="static" elevation={0} color="default">
        <Toolbar className={classes.appBarToolbar}>{children}</Toolbar>
    </AppBar>
);

export default withStyles(styles)(LambdaAppBar);
