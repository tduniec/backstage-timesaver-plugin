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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { createUrlWithDates, getRandomColor } from '../utils';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useTheme } from '@material-ui/core';
import { IFilterDates } from '../DateFiltersComponent/DateFiltersComponent';

ChartJS.register(LineElement, PointElement, Title, Tooltip, Legend);

type TemplateWiseTimeSummaryLinearResponse = {
  stats: {
    date: string;
    templateName: string;
    totalTimeSaved: number;
  }[];
};

interface TemplateWiseTimeSummaryLinearProps {
  templateName?: string;
  dates: IFilterDates;
}

export function TemplateWiseTimeSummaryLinearChart({
  templateName,
  dates,
}: TemplateWiseTimeSummaryLinearProps): React.ReactElement {
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [data, setData] =
    useState<TemplateWiseTimeSummaryLinearResponse | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const url = createUrlWithDates(
      `${configApi.getString(
        'backend.baseUrl',
      )}/api/time-saver/getTimeSummary/template`,
      dates,
    );

    fetchApi
      .fetch(url)
      .then(response => response.json())
      .then(dt => {
        dt.stats.sort(
          (a: { date: string }, b: { date: string }) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        setData(dt);
      })
      .catch();
  }, [configApi, templateName, fetchApi, dates]);

  if (!data) {
    return <CircularProgress />;
  }

  let filteredData: TemplateWiseTimeSummaryLinearResponse;
  if (templateName) {
    filteredData = {
      stats: data.stats.filter(
        (stat: { templateName: string }) => stat.templateName === templateName,
      ),
    };
  } else {
    filteredData = data;
  }

  const uniqueTemplates = Array.from(
    new Set(
      filteredData.stats.map(
        (stat: { templateName: string }) => stat.templateName,
      ),
    ),
  );

  const options: ChartOptions<'line'> = {
    plugins: {
      title: {
        display: true,
        text: 'Time Summary by Template',
        color: theme.palette.text.primary,
      },
    },
    responsive: true,
    scales: {
      x: [
        {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'YYYY-MM-DD',
            displayFormats: {
              day: 'YYYY-MM-DD',
            },
            bounds: 'data',
          },
          scaleLabel: {
            display: true,
            labelString: 'Date',
          },
        },
      ] as unknown as ChartOptions<'line'>['scales'],
      y: [
        {
          stacked: true,
          beginAtZero: true,
          scaleLabel: {
            display: true,
            labelString: 'Total Time Saved',
          },
        },
      ] as unknown as ChartOptions<'line'>['scales'],
    },
  };

  const uniqueDates = Array.from(new Set(data.stats.map(stat => stat.date)));

  const allData = {
    labels: uniqueDates,
    datasets: uniqueTemplates.map(tn => {
      const templateData = filteredData.stats
        .filter((stat: { templateName: string }) => stat.templateName === tn)
        .map(
          (stat: {
            date: string | undefined;
            totalTimeSaved: number | undefined;
          }) => ({
            x: stat.date,
            y: stat.totalTimeSaved,
          }),
        );
      // TODO : verify that date and total_time_saved types.

      return {
        label: tn, // Fix: use tn instead of template_name
        data: templateData,
        fill: false,
        borderColor: getRandomColor(),
      };
    }),
  };

  return <Line options={options} data={allData} />;
}
