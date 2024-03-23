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
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { fetchWithCredentials } from '../utils';

type TemplatesResponse = {
  templates: string[];
};

export function EmptyTimeSaver({}): React.ReactElement {
  const configApi = useApi(configApiRef);

  const [data, setData] = useState<TemplatesResponse | null>(null);

  useEffect(() => {
    const url = `${configApi.getString(
      'backend.baseUrl'
    )}/api/time-saver/templates`;

    fetchWithCredentials(url)
      .then(response => response.json())
      .then(dt => setData(dt))
      .catch();
  }, [configApi]);

  if (!data) {
    return <CircularProgress />;
  }
  const cellStyle: React.CSSProperties = {
    color: 'red',
    fontWeight: 'bold',
    fontSize: '20px',
  };

  return data && data.templates.length === 0 ? (
    <TableContainer component={Paper}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell style={cellStyle}>
              Please fill your templates with data, they will be displayed after
              their executions
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <></>
  );
}
