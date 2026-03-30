import { Grid, Divider, Paper } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { AllStatsBarChart } from '../AllStatsBarChartComponent/AllStatsBarChartComponent';
import { GroupDivisionPieChart } from '../GroupDivisionPieChartComponent/GroupDivisionPieChartComponent';
import { DailyTimeSummaryLineChartTeamWise } from '../TeamWiseDailyTimeLinearComponent/TeamWiseDailyTimeLinearComponent';
import { TeamWiseTimeSummaryLinearChart } from '../TeamWiseTimeSummaryLinearComponent/TeamWiseTimeSummaryLinearComponent';
import StatsTable from '../Table/StatsTable';
import { TemplateCountGauge } from '../Gauge/TemplatesTaskCountGauge';
import { TimeSavedGauge } from '../Gauge/TimeSavedGauge';
import { TeamsGauge } from '../Gauge/TeamsGauge';
import { TemplatesGauge } from '../Gauge/TemplatesGauge';
import { EmptyTimeSaver } from '../Gauge/EmptyDbContent';
import {
  DateFiltersComponent,
  IFilterDates,
} from '../DateFiltersComponent/DateFiltersComponent';

const GaugesContainer = ({
  dates,
  hoursPerDay,
}: {
  dates: IFilterDates;
  hoursPerDay: number;
}) => (
  <Grid
    container
    spacing={4}
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    style={{ marginTop: '12px', marginBottom: '12px' }}
  >
    <Grid item xs={6} sm={6} md={2}>
      <Paper elevation={0}>
        <TemplateCountGauge dates={dates} />
      </Paper>
    </Grid>
    <Grid item xs={6} sm={6} md={2}>
      <Paper elevation={0}>
        <TimeSavedGauge heading="Time Saved [hours]" dates={dates} />
      </Paper>
    </Grid>
    <Grid item xs={6} sm={6} md={2}>
      <Paper elevation={0}>
        <TimeSavedGauge
          number={hoursPerDay}
          heading="Time Saved [days]"
          dates={dates}
        />
      </Paper>
    </Grid>
    <Grid item xs={6} sm={6} md={2}>
      <Paper elevation={0}>
        <TeamsGauge dates={dates} />
      </Paper>
    </Grid>
    <Grid item xs={6} sm={6} md={2}>
      <Paper elevation={0}>
        <TemplatesGauge dates={dates} />
      </Paper>
    </Grid>
  </Grid>
);

export function AllStatsSubPage() {
  const configApi = useApi(configApiRef);
  const hoursPerDay =
    configApi.getOptionalNumber('ts.frontend.table.hoursPerDay') ?? 8;

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <EmptyTimeSaver />
      <InfoCard title="Time statistics that you have saved using Backstage Templates">
        <DateFiltersComponent>
          {dates => (
            <Grid container spacing={2}>
              <GaugesContainer dates={dates} hoursPerDay={hoursPerDay} />
              <Divider variant="fullWidth" />
              <Grid xs={6}>
                <AllStatsBarChart dates={dates} />
              </Grid>
              <Grid xs={6}>
                <StatsTable dates={dates} />
              </Grid>
              <Grid xs={6}>
                <DailyTimeSummaryLineChartTeamWise dates={dates} />
              </Grid>
              <Grid xs={6}>
                <TeamWiseTimeSummaryLinearChart dates={dates} />
              </Grid>
              <Grid xs={6}>
                <GroupDivisionPieChart dates={dates} />
              </Grid>
            </Grid>
          )}
        </DateFiltersComponent>
      </InfoCard>
    </LocalizationProvider>
  );
}
