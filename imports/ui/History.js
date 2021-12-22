import React, { useEffect, useState } from 'react'
import { Meteor } from 'meteor/meteor'
import { useTracker } from 'meteor/react-meteor-data'
import { SensorReadings } from '../api/sensorData'
import { XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, ReferenceArea } from 'recharts'
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import dayjs from 'dayjs'
import { Box } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'

const dateFormater = (mode) => (item) => {
  switch (mode) {
    case 'hour':
      return dayjs(item).format('HH:mm')
    case 'day':
      return dayjs(item).format('ddd HH:mm')
    case 'week':
      return dayjs(item).format('DD.MM.')
    case 'month':
      return dayjs(item).format('DD.MM.')
    case 'year':
      return dayjs(item).format('DD.MM.')
    default:
      return dayjs(item).format('DD.MM. HH:mm')
  }
}

const History = ({ latest }) => {
  const [mode, setMode] = useState('hour')
  const [dateRange, setDateRange] = useState([+latest.date, +dayjs(latest.date).subtract(1, 'hour').toDate()])
  const [refAreaLeft, setRefAreaLeft] = useState()
  const [refAreaRight, setRefAreaRight] = useState()
  const changeMode = (event) => {
    setMode(event.target.value)
    setDateRange([dateRange[0], +dayjs(dateRange[0]).subtract(1, event.target.value)])
  }
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === 0) {
      setRefAreaRight(0)
      setRefAreaLeft(0)
      return
    }

    // xAxis domain
    let [left, right] = [refAreaLeft, refAreaRight]
    if (refAreaLeft < refAreaRight) [left, right] = [refAreaRight, refAreaLeft]
    setDateRange([left, right])
  }

  useEffect(() => {
    const start = dateRange[0]
    let end = dateRange[1]
    let sub
    if (dayjs(dateRange[0]).diff(dateRange[1], 'minute') < 18) {
      end = +dayjs(dateRange[0]).subtract(20, 'minute')
      setDateRange([dateRange[0], end])
    }
    if (dayjs(start).diff(end, 'hour') > 4) {
      sub = Meteor.subscribe('sensorAggregation', dayjs(start).toDate(), dayjs(end).toDate(), Math.floor(window.innerWidth / 3))
    } else {
      sub = Meteor.subscribe('sensorReadings', dayjs(start).toDate(), dayjs(end).toDate())
    }
    if (dayjs(start).diff(end, 'hour') < 3) setMode('hour')
    else if (dayjs(start).diff(end, 'day') < 3) setMode('day')
    else if (dayjs(start).diff(end, 'week') < 3) setMode('week')
    else if (dayjs(start).diff(end, 'month') < 3) setMode('month')
    else setMode('year')
    return () => {
      sub.stop()
    }
  }, [dateRange])
  const sensorReadings = useTracker(() => {
    return SensorReadings.find({}, { sort: { date: -1 } }).fetch()
  })
  console.log(
    'Got sensorReadings',
    mode,
    dayjs(dateRange[1]).diff(dateRange[0], 'hour'),
    sensorReadings.length,
    dateRange,
    dateRange.map((d) => dayjs(d).format('DD.MM.YYYY HH:mm:ss'))
  )
  return (
    <Box display="flex" height="100%" flexDirection="column">
      <Box overflow="auto" padding={2}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            syncId="anyId"
            width={730}
            height={250}
            data={sensorReadings.map((reading) => {
              const sensor = { ...reading, ...reading.parsed }
              return {
                name: +sensor.date,
                Außen: ((sensor.tempf - 32) * 5) / 9,
                Innen: ((sensor.tempinf - 32) * 5) / 9,
              }
            })}
            onMouseDown={(e) => setRefAreaLeft(e.activeLabel)}
            onMouseMove={(e) => refAreaLeft && setRefAreaRight(e.activeLabel)}
            // eslint-disable-next-line react/jsx-no-bind
            onMouseUp={() => zoom()}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
            <Legend verticalAlign="top" height={36} />
            <YAxis
              type="number"
              unit="°"
              label={{ value: 'Temperatur', angle: -90, position: 'insideLeft' }}
              domain={[(dataMin) => Math.round(dataMin) - 2, (dataMax) => Math.round(dataMax) + 2]}
              for
            />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(value) => value.toFixed(2) + '°'} labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')} />
            <Line type="monotone" dataKey="Außen" dot={false} stroke="#000088" />
            <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
            {refAreaLeft && refAreaRight ? <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} /> : null}
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            syncId="anyId"
            width={730}
            height={250}
            data={sensorReadings.map((reading) => {
              const sensor = { ...reading, ...reading.parsed }
              return {
                name: +sensor.date,
                Außen: sensor.humidity,
                Innen: sensor.humidityin,
                Boden: sensor.soilmoisture1,
              }
            })}
            onMouseDown={(e) => setRefAreaLeft(e.activeLabel)}
            onMouseMove={(e) => refAreaLeft && setRefAreaRight(e.activeLabel)}
            // eslint-disable-next-line react/jsx-no-bind
            onMouseUp={() => zoom()}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
            <Legend verticalAlign="top" height={36} />
            <YAxis
              type="number"
              unit="%"
              domain={[0, 100]}
              for
              label={{
                value: 'Feuchtigkeit',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(value) => value.toFixed(2) + '%'} labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')} />
            <Line type="monotone" dataKey="Außen" dot={false} stroke="#000088" />
            <Line type="monotone" dataKey="Innen" dot={false} stroke="#ff8800" />
            <Line type="monotone" dataKey="Boden" dot={false} stroke="#448844" />
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            syncId="anyId"
            width={730}
            height={250}
            data={sensorReadings.map((reading) => {
              const sensor = { ...reading, ...reading.parsed }
              return {
                name: +sensor.date,
                Regen: sensor.rainratein,
                Wind: sensor.windspeedmph * 1.60934, // in kmh
                Sonnenschein: sensor.solarradiation / 100,
              }
            })}
            onMouseDown={(e) => setRefAreaLeft(e.activeLabel)}
            onMouseMove={(e) => refAreaLeft && setRefAreaRight(e.activeLabel)}
            // eslint-disable-next-line react/jsx-no-bind
            onMouseUp={() => zoom()}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="name" tickFormatter={dateFormater(mode)} />
            <Legend verticalAlign="top" height={36} />
            <YAxis type="number" width={25} allowDecimals={false} for yAxisId="left" />
            <YAxis type="number" width={35} axisLine={{ stroke: '#000088' }} for yAxisId="right" />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'Regen') return value.toFixed(2) + ' mm'
                if (name === 'Wind') return value.toFixed(2) + ' km/h'
                if (name === 'Sonnenschein') return (value * 100).toFixed(2) + ' Watt'
              }}
              labelFormatter={(name) => dayjs(name).format('DD.MM.YYYY HH:mm:ss')}
            />
            <Line type="monotone" yAxisId="right" dataKey="Regen" dot={false} stroke="#000088" />
            <Line type="monotone" yAxisId="left" dataKey="Wind" dot={false} stroke="#aaaaaa" />
            <Line type="monotone" yAxisId="left" dataKey="Sonnenschein" dot={false} stroke="#ff8800" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Box boxShadow="0px -3px 5px rgba(0,0,0,0.2)" paddingY={2} display="flex" flexDirection="row" justifyContent="space-between">
        <Button disabled={dateRange[0] >= +latest.date}>
          <ChevronLeft onClick={() => setDateRange(dateRange.map((d) => Math.min(latest.date, +dayjs(d).add(1, mode))))} />
        </Button>
        <Box>{dayjs(dateRange[0]).format('DD.MM.YYYY')}</Box>
        <FormControl>
          <InputLabel id="mode-label">Zeitraum</InputLabel>
          <Select variant="standard" labelId="mode-label" id="mode-select" value={mode} onChange={changeMode}>
            <MenuItem value={'hour'}>Stunde</MenuItem>
            <MenuItem value={'day'}>Tag</MenuItem>
            <MenuItem value={'week'}>Woche</MenuItem>
            <MenuItem value={'month'}>Monat</MenuItem>
            <MenuItem value={'year'}>Jahr</MenuItem>
          </Select>
        </FormControl>
        <Box>{dayjs(dateRange[1]).format('DD.MM.YYYY')}</Box>
        <Button>
          <ChevronRight onClick={() => setDateRange(dateRange.map((d) => +dayjs(d).subtract(1, mode)))} />
        </Button>
      </Box>
    </Box>
  )
}

export default History
