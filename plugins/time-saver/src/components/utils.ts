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

import { IFilterDates } from './DateFiltersComponent/DateFiltersComponent';

export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function createUrlWithDates(url: string, dates: IFilterDates) {
  if (!dates) return url;

  const [start, end] = dates;
  const parsedUrl = new URL(url);

  if (start) parsedUrl.searchParams.append('start', start!.toISODate());
  if (end) parsedUrl.searchParams.set('end', end!.toISODate());

  return parsedUrl.toString();
}
