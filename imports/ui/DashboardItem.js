import React from 'react';
import { Avatar, Grid, Card, CardHeader } from '@mui/material';

const DashboardItem = ({ src, value, text }) => {
  return (<Grid item xs={12} sm={6} md={4} lg={3} sx={{height:'100%'}}>

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