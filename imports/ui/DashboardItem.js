import React from 'react';
import { Avatar, Grid, Card, CardHeader, makeStyles, CardContent, useMediaQuery, useTheme } from '@material-ui/core';

const useStyles = makeStyles(theme => {
  return {
    root: {
      height: '100%'
    }
  }
});



const DashboardItem = ({ src, value, text }) => {
  const classes = useStyles()
  return (<Grid item xs={12} sm={6} md={4} lg={3} className={classes.root}>

    <Card>
      <CardHeader
        avatar={
          <Avatar variant="rounded" src={src} />
        }
        title={value}
        subheader={text}
      />
    </Card></Grid>
  );
};

export default DashboardItem;