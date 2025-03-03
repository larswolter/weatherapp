import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import ErrorBoundary from './ErrorBoundary';
import { Button, CardActions, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Modal, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const DashboardItem = ({ src, value, text, onAddValue }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <Grid item xs={12} sm={6} md={4} lg={3} sx={{ height: '100%' }}>
      <ErrorBoundary>
        <Dialog
        open={showPrompt}
        onClose={()=>setShowPrompt(false)}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData).entries());
            onAddValue(formJson.value);
            setShowPrompt(false);
          },
        }}
      >
        <DialogTitle>Wert eintragen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {text[0]||text}
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="value"
            name="value"
            label="Wert"
            type="number"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setShowPrompt(false)}>Abbrechen</Button>
          <Button type="submit">Abschicken</Button>
        </DialogActions>
      </Dialog>
      </ErrorBoundary>
      <ErrorBoundary>
        <Card>
          <CardHeader
            action={
              onAddValue ? (
                <IconButton onClick={() => setShowPrompt(true)} aria-label="settings">
                  <AddIcon />
                </IconButton>
              ) : undefined
            }
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
