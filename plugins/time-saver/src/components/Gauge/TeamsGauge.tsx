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
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import CircularProgress from '@material-ui/core/CircularProgress';
import Gauge from './Gauge';
import { IFilterDates } from '../DateFiltersComponent/DateFiltersComponent';
import { createUrlWithDates } from '../utils';

type GroupsResponse = {
  groups: string[];
};

export function TeamsGauge({
  dates,
}: {
  dates: IFilterDates;
}): React.ReactElement {
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [data, setData] = useState<GroupsResponse | null>(null);

  useEffect(() => {
    const url = createUrlWithDates(
      `${configApi.getString('backend.baseUrl')}/api/time-saver/groups`,
      dates,
    );

    fetchApi
      .fetch(url)
      .then(response => response.json())
      .then(dt => setData(dt))
      .catch();
  }, [configApi, fetchApi, dates]);

  if (!data) {
    return <CircularProgress />;
  }

  return <Gauge number={data.groups.length} heading="Groups" />;
}
