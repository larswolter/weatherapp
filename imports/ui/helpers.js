import dayjs from 'dayjs';

export const dateFormater = (mode) => (item) => {
  switch (mode) {
    case 'minute':
      return dayjs(item).format('HH:mm');
    case 'hour':
      return dayjs(item).format('ddd HH:mm');
    case 'day':
      return dayjs(item).format('ddd DD.');
    case 'week':
      return dayjs(item).format('W');
    case 'month':
      return dayjs(item).format('MMM');
    case 'year':
      return dayjs(item).format('YYYY');
    default:
      return dayjs(item).format('DD.MM. HH:mm');
  }
};

export const scaleFormat = (mode) => {
  switch (mode) {
    case 'minute':
      return 'HH:mm';
    case 'hour':
      return 'ddd HH';
    case 'day':
      return 'ddd DD.';
    case 'week':
      return 'W';
    case 'month':
      return 'MMM';
    case 'year':
      return 'YYYY';
    default:
      return 'DD.MM. HH:mm';
  }
};
