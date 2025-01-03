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

type TemplateChartResponse = {
  templateName: string;
  stats: {
    timeSaved: number;
    team: string;
  }[];
};

interface ByTemplateBarChartProps {
  templateName: string;
  dates: IFilterDates;
}

export function ByTemplateBarChart({
  templateName,
  dates,
}: ByTemplateBarChartProps): React.ReactElement {
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [data, setData] = useState<TemplateChartResponse | null>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchApi
      .fetch(
        createUrlWithDates(
          `${configApi.getString(
            'backend.baseUrl',
          )}/api/time-saver/getStats?templateName=${templateName}`,
          dates,
        ),
      )
      .then(response => response.json())
      .then(dt => setData(dt))
      .catch();
  }, [configApi, templateName, fetchApi, dates]);

  if (!data) {
    return <CircularProgress />;
  }

  const options: ChartOptions<'bar'> = {
    plugins: {
      title: {
        display: true,
        text: data.templateName || '',
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
          display: true,
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
  const datasets = data.stats.map(stat => stat.timeSaved);

  const backgroundColors = Array.from({ length: datasets.length }, () =>
    getRandomColor(),
  );
  const dataAll = {
    labels,
    datasets: [
      {
        label: 'Time Saved',
        data: datasets,
        backgroundColor: backgroundColors,
      },
    ],
  };

  return <Bar options={options} data={dataAll} />;
}
