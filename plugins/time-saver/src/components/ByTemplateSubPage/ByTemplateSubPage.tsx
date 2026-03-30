import { useState } from 'react';
import { Grid } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { ByTemplateBarChart } from '../ByTemplateBarCharComponent/ByTemplateBarChartComponent';
import { DailyTimeSummaryLineChartTemplateWise } from '../TemplateWiseDailyTimeLinearComponent/TemplateWiseWiseDailyTimeLinearComponent';
import { TemplateWiseTimeSummaryLinearChart } from '../TemplateWiseTimeSummaryLinearComponent/TemplateWiseTimeSummaryLinearComponent';
import TemplateAutocomplete from '../TemplateAutocompleteComponent/TemplateAutocompleteComponent';
import StatsTable from '../Table/StatsTable';
import { EmptyTimeSaver } from '../Gauge/EmptyDbContent';
import { DateFiltersComponent } from '../DateFiltersComponent/DateFiltersComponent';

export function ByTemplateSubPage() {
  const [template, setTemplate] = useState('');

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <EmptyTimeSaver />
      <InfoCard title="Time statistics that you have saved using Backstage Templates">
        <DateFiltersComponent>
          {dates => (
            <Grid container spacing={3}>
              <Grid xs={12}>
                <Grid xs={6}>
                  <TemplateAutocomplete onTemplateChange={setTemplate} />
                </Grid>
              </Grid>
              <Grid xs={6}>
                <ByTemplateBarChart templateName={template} dates={dates} />
              </Grid>
              <Grid xs={6}>
                <StatsTable templateName={template} dates={dates} />
              </Grid>
              <Grid xs={6}>
                <DailyTimeSummaryLineChartTemplateWise
                  templateName={template}
                  dates={dates}
                />
              </Grid>
              <Grid xs={6}>
                <TemplateWiseTimeSummaryLinearChart
                  templateName={template}
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
