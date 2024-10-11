import { Button, Chip, Grid, IconButton, Typography } from '@material-ui/core';
import { DatePicker } from '@mui/x-date-pickers';
import React, { useState } from 'react';
import { DateTime } from 'luxon';

import { makeStyles } from '@material-ui/core/styles';

import CloseIcon from '@material-ui/icons/Close';
import CheckIcon from '@material-ui/icons/Check';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

export type IFilterDates =
  | [DateTime<true> | null, DateTime<true> | null]
  | null;

const useStyles = makeStyles(theme => ({
  fullWidth: {
    width: '100%',
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  panel: {
    width: `calc(100% - ${theme.spacing(2)}px)`,
    margin: `${theme.spacing(2)}px auto`,
    padding: theme.spacing(0.5),
    borderRadius: 16,
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey[700]
        : theme.palette.grey[50],
    marginBottom: theme.spacing(4),
    boxShadow:
      'rgba(0, 0, 0, 0.2) 0px 1px 1px -5px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
  },
  datePicker: {
    width: '100%',
    '& label': {
      color: theme.palette.text.hint,
    },
    '& label + div svg': {
      fill: theme.palette.text.secondary,
    },
    '& fieldset': {
      borderColor: theme.palette.text.hint,
    },
  },
}));

const shortcutsItems = () => {
  const today = DateTime.local();

  const basics = [
    {
      label: 'Current week',
      getValue: () => {
        return [today.startOf('week'), today];
      },
    },
    {
      label: 'Previous week',
      getValue: () => {
        return [
          today.minus({ week: 1 }).startOf('week'),
          today.minus({ week: 1 }).endOf('week'),
        ];
      },
    },
    {
      label: 'Current month',
      getValue: () => {
        return [today.startOf('month'), today];
      },
    },
    {
      label: 'Previous month',
      getValue: () => {
        return [
          today.minus({ month: 1 }).startOf('month'),
          today.minus({ month: 1 }).endOf('month'),
        ];
      },
    },
    {
      label: 'Previous 3 months',
      getValue: () => {
        return [
          today.minus({ months: 3 }).startOf('month'),
          today.minus({ month: 1 }).endOf('month'),
        ];
      },
    },
  ];

  const quarters = [];

  if (today.month >= 4) {
    quarters.push({
      label: 'Q1',
      getValue: () => {
        return [
          today.startOf('year'),
          today.startOf('year').plus({ months: 2 }).endOf('month'),
        ];
      },
    });
  }

  if (today.month >= 7) {
    quarters.push({
      label: 'Q2',
      getValue: () => {
        return [
          today.startOf('year').plus({ months: 3 }).startOf('month'),
          today.startOf('year').plus({ months: 5 }).endOf('month'),
        ];
      },
    });
  }

  if (today.month >= 10) {
    quarters.push({
      label: 'Q3',
      getValue: () => {
        return [
          today.startOf('year').plus({ months: 6 }).startOf('month'),
          today.startOf('year').plus({ months: 8 }).endOf('month'),
        ];
      },
    });

    quarters.push({
      label: 'Q4',
      getValue: () => {
        return [
          today.endOf('year').minus({ months: 2 }).startOf('month'),
          today,
        ];
      },
    });
  }

  const years = [
    {
      label: `Year ${today.year}`,
      getValue: () => {
        return [today.startOf('year'), today];
      },
    },
    {
      label: `Year ${today.year - 1}`,
      getValue: () => {
        return [
          today.minus({ year: 1 }).startOf('year'),
          today.minus({ year: 1 }).endOf('year'),
        ];
      },
    },
  ];

  return [...basics, ...quarters, ...years] as {
    label: string;
    getValue: () => [DateTime<true>, DateTime<true>];
  }[];
};

export function DateFiltersComponent(props: {
  children: (dates: IFilterDates) => JSX.Element;
}) {
  const { children } = props;
  const classes = useStyles();

  const [expanded, setExpanded] = useState(false);

  const [startDate, setStartDate] = useState<DateTime<true> | null>(null);
  const [endDate, setEndDate] = useState<DateTime<true> | null>(null);

  const [form, setForm] = useState<IFilterDates>(null);

  const apply = () => setForm([startDate, endDate]);

  const reset = () => {
    setStartDate(null);
    setEndDate(null);
    setForm(null);
  };

  const noChanges = form?.length
    ? form?.[0] === startDate && form?.[1] === endDate
    : [form, startDate, endDate].every(i => i === null);

  return (
    <>
      <Grid container spacing={3} className={classes.panel}>
        <Grid item xs={12} className={classes.flexRow}>
          <Typography variant="body2" color="textSecondary">
            Date filters
          </Typography>

          <IconButton
            onClick={() => setExpanded(prev => !prev)}
            size="small"
            style={{
              marginLeft: 24,
              transform: `rotate(${expanded ? 180 : 0}deg)`,
              transition: 'all 0.3s ease-in',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
          {!expanded && form && form?.length > 0 && (
            <Typography variant="body2" color="textPrimary">
              <b>
                {form?.[0] && <>{form[0].toFormat('dd LLL yyyy')}</>}
                {form?.[0] ? <> - </> : <> until </>}
                {form?.[1] ? <>{form[1].toFormat('dd LLL yyyy')}</> : 'now'}
              </b>
            </Typography>
          )}
        </Grid>
        {expanded && (
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={4}>
                    <DatePicker
                      className={classes.datePicker}
                      label="From"
                      format="dd LLL yyyy"
                      maxDate={endDate || DateTime.local()}
                      value={startDate}
                      onChange={setStartDate}
                    />
                  </Grid>
                  <Grid item xs={12} sm={12} md={4}>
                    <DatePicker
                      className={classes.datePicker}
                      label="To"
                      format="dd LLL yyyy"
                      minDate={startDate || undefined}
                      maxDate={DateTime.local()}
                      value={endDate}
                      onChange={setEndDate}
                    />
                  </Grid>
                  <Grid item xs={12} sm={12} md={4} className={classes.flexRow}>
                    <IconButton
                      size="small"
                      title="Reset"
                      onClick={reset}
                      disabled={form === null}
                    >
                      <CloseIcon />
                    </IconButton>

                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={apply}
                      disabled={noChanges}
                    >
                      Apply
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} sm={12} md={6}>
                {shortcutsItems().map(shortcut => (
                  <Chip
                    key={shortcut.label}
                    clickable
                    variant="outlined"
                    label={shortcut.label}
                    onClick={() => {
                      const [s, e] = shortcut.getValue();
                      if (s) setStartDate(s);
                      if (e) setEndDate(e);
                      setForm([s, e]);
                    }}
                  />
                ))}
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
      {children(form)}
    </>
  );
}
