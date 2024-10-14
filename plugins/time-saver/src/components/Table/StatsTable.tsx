/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState, useEffect } from 'react';

import CircularProgress from '@material-ui/core/CircularProgress';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { DataGrid, GridColDef, GridSortModel } from '@mui/x-data-grid';
import { useTheme, Paper } from '@material-ui/core';
import { IFilterDates } from '../DateFiltersComponent/DateFiltersComponent';
import { createUrlWithDates } from '../utils';

type Stat = {
  id: string;
  timeSaved: number;
  team: string;
  templateName: string;
  [key: string]: string | number;
};

type AllStatsChartResponse = {
  stats: Stat[];
};

interface StatsTableProps {
  team?: string;
  templateName?: string;
  dates: IFilterDates;
}

const StatsTable: React.FC<StatsTableProps> = ({
  team,
  templateName,
  dates,
}) => {
  const [data, setData] = useState<Stat[] | null>(null);
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'sum', sort: 'asc' },
  ]);

  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  const theme = useTheme();

  useEffect(() => {
    let url = `${configApi.getString(
      'backend.baseUrl',
    )}/api/time-saver/getStats`;
    if (team) {
      url = `${url}?team=${team}`;
    } else if (templateName) {
      url = `${url}?templateName=${templateName}`;
    }

    fetchApi
      .fetch(createUrlWithDates(url, dates))
      .then(response => response.json())
      .then((dt: AllStatsChartResponse) => {
        const statsWithIds = dt.stats.map((stat, index) => ({
          ...stat,
          id: index.toString(),
        }));
        setData(statsWithIds);
        setSortModel([{ field: 'sum', sort: 'desc' }]);
      })
      .catch();
  }, [configApi, team, templateName, fetchApi, dates]);

  if (!data) {
    return <CircularProgress />;
  }

  const columns: GridColDef[] = [
    { field: 'team', headerName: 'Team', flex: 1, sortable: true },
    {
      field: 'templateName',
      headerName: 'Template Name',
      flex: 1,
      sortable: true,
    },
    { field: 'timeSaved', headerName: 'Saved Time', flex: 1, sortable: true },
  ].filter(col => data.some(row => !!row[col.field]));

  return (
    <Paper
      style={{
        height: 400,
        width: '100%',
        margin: '16px',
        padding: '16px',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <DataGrid
        rows={data}
        columns={columns}
        sortModel={sortModel}
        onSortModelChange={model => setSortModel(model)}
        // className="test" :: TODO : Check CSS correlation
        sx={{
          color: theme.palette.text.primary,
          '& .MuiDataGrid-cell:hover': { color: theme.palette.text.secondary },
          '& .MuiDataGrid-footerContainer': {
            color: theme.palette.text.primary,
          },
          '& .v5-MuiToolbar-root': {
            color: theme.palette.text.primary,
          },
          '& .v5-MuiTablePagination-actions button': {
            color: theme.palette.text.primary,
          },
        }}
      />
    </Paper>
  );
};

export default StatsTable;
