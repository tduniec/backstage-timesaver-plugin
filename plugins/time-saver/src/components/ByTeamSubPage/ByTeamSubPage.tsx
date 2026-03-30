import { useState } from 'react';
import { Grid, Divider } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { ByTeamBarChart } from '../ByTeamBarCharComponent/ByTeamBarChartComponent';
import { DailyTimeSummaryLineChartTeamWise } from '../TeamWiseDailyTimeLinearComponent/TeamWiseDailyTimeLinearComponent';
import { TeamWiseTimeSummaryLinearChart } from '../TeamWiseTimeSummaryLinearComponent/TeamWiseTimeSummaryLinearComponent';
import TeamSelector from '../TeamSelectorComponent/TeamSelectorComponent';
import StatsTable from '../Table/StatsTable';
import { EmptyTimeSaver } from '../Gauge/EmptyDbContent';
import { DateFiltersComponent } from '../DateFiltersComponent/DateFiltersComponent';

export function ByTeamSubPage() {
  const [selectedTeam, setSelectedTeam] = useState('');

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <EmptyTimeSaver />
      <InfoCard title="Time statistics that you have saved using Backstage Templates">
        <DateFiltersComponent>
          {dates => (
            <Grid container spacing={3}>
              <Grid xs={12}>
                <Grid xs={6}>
                  <TeamSelector
                    onTeamChange={setSelectedTeam}
                    onClearButtonClick={() => setSelectedTeam('')}
                  />
                  <Divider orientation="vertical" />
                </Grid>
              </Grid>
              <Grid xs={6}>
                <ByTeamBarChart team={selectedTeam} dates={dates} />
              </Grid>
              <Grid xs={6}>
                <StatsTable team={selectedTeam} dates={dates} />
              </Grid>
              <Grid xs={6}>
                <DailyTimeSummaryLineChartTeamWise
                  team={selectedTeam}
                  dates={dates}
                />
              </Grid>
              <Grid xs={6}>
                <TeamWiseTimeSummaryLinearChart
                  team={selectedTeam}
                  dates={dates}
                />
              </Grid>
            </Grid>
          )}
        </DateFiltersComponent>
      </InfoCard>
    </LocalizationProvider>
  );
}
