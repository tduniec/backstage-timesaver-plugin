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
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { createUrlWithDates, getRandomColor } from '../utils';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useTheme } from '@material-ui/core';
import { IFilterDates } from '../DateFiltersComponent/DateFiltersComponent';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

type AllStatsChartResponse = {
  stats: {
    timeSaved: number;
    team: string;
    templateName: string;
  }[];
};

export function AllStatsBarChart({
  dates,
}: {
  dates: IFilterDates;
}): React.ReactElement {
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [data, setData] = useState<AllStatsChartResponse | null>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchApi
      .fetch(
        createUrlWithDates(
          `${configApi.getString('backend.baseUrl')}/api/time-saver/getStats`,
          dates,
        ),
      )
      .then(response => response.json())
      .then(dt => setData(dt))
      .catch();
  }, [configApi, fetchApi, dates]);

  if (!data) {
    return <CircularProgress />;
  }

  const options: ChartOptions<'bar'> = {
    plugins: {
      title: {
        display: true,
        text: 'All Statistics',
        color: theme.palette.text.primary,
      },
      legend: {
        display: true,
        labels: {
          color: theme.palette.text.primary,
        },
      },
    },
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.primary,
        },
      },
      y: {
        stacked: true,
        grid: {
          display: true,
        },
        ticks: {
          color: theme.palette.text.primary,
        },
      },
    },
  };

  const labels = Array.from(new Set(data.stats.map(stat => stat.team)));
  const datasets = Array.from(
    new Set(data.stats.map(stat => stat.templateName)),
  );

  const backgroundColors = datasets.map(() => getRandomColor());

  const dataAll = {
    labels,
    datasets: datasets.map((templateName, index) => ({
      label: `${templateName}`,
      data: labels.map(team =>
        data.stats
          .filter(
            stat => stat.team === team && stat.templateName === templateName,
          )
          .reduce((sum, stat) => sum + stat.timeSaved, 0),
      ),
      backgroundColor: backgroundColors[index],
    })),
  };

  return <Bar options={options} data={dataAll} />;
}
