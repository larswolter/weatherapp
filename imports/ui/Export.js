import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Link, Typography } from '@mui/material';
import { useAuthContext } from './Authenticator';
import dayjs from 'dayjs';
import { DateField } from '@mui/x-date-pickers/DateField';
import { DatePicker } from '@mui/x-date-pickers';

function Export() {
  const { token } = useAuthContext();
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);

  return (
    <Box display="flex" flexDirection="column" gap={2} padding={2}>
      <Typography variant="h4">Export</Typography>
      <Typography variant="body1">Hier können die Daten als Excel exportiert werden, ein ganzes Jahr sind aber locker 100MB!</Typography>
      <Link href={'/excelExport.xlsx?token=' + token + '&year=' + dayjs().year()}>Aktuelles Jahr {dayjs().year()}</Link>
      <Link href={'/excelExport.xlsx?token=' + token + '&year=' + dayjs().subtract(1, 'year').year()}>Letztes Jahr {dayjs().subtract(1, 'year').year()}</Link>
      <Box display="flex" gap={1} alignItems="center">
        <Link href={'/excelExport.xlsx?token=' + token + '&gte=' + dateRange[0].format('YYYYMMDD') + '&lte=' + dateRange[1].format('YYYYMMDD')}>Zeitraum</Link>
        <Typography> von </Typography>
        <DatePicker format='DD.MM.YYYY' label="von" value={dateRange[0]} onChange={(newValue) => setDateRange((prev) => [newValue, prev[1]])} />
        <Typography> bis </Typography>
        <DatePicker format='DD.MM.YYYY' label="bis" value={dateRange[1]} onChange={(newValue) => setDateRange((prev) => [prev[0], newValue])} />
      </Box>
    </Box>
  );
}

export default Export;
