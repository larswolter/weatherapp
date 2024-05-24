import React from 'react';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import ErrorBoundary from './ErrorBoundary';

const DashboardItem = ({ src, value, text }) => {
  return (
    <Grid item xs={12} sm={6} md={4} lg={3} sx={{ height: '100%' }}>
      <ErrorBoundary>
        <Card>
          <CardHeader
            avatar={<Avatar variant="rounded" src={src} alt="Entryicon" />}
            title={value}
            subheader={
              Array.isArray(text) ? (
                <Box>
                  {text.map((t, i) => (
                    <Box key={i}>{t}</Box>
                  ))}
                </Box>
              ) : (
                text
              )
            }
          />
        </Card>
      </ErrorBoundary>
    </Grid>
  );
};

export default DashboardItem;
