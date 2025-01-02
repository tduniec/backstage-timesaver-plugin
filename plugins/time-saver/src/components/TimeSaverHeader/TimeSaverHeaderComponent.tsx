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
import React from 'react';
import { Header, HeaderLabel } from '@backstage/core-components';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  headerLabel?: Record<string, string>;
}

const CustomHeader: React.FC<HeaderProps> = ({
  title,
  subtitle,
  headerLabel,
}) => {
  return (
    <Header title={title} subtitle={subtitle}>
      {headerLabel &&
        Object.entries(headerLabel).map(([labelText, value]) => (
          <HeaderLabel key={labelText} label={labelText} value={value} />
        ))}
    </Header>
  );
};

export default CustomHeader;
