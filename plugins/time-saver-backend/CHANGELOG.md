# @tduniec/backstage-plugin-time-saver-backend

## 2.2.0

### Minor Changes

- Added /generate-sample-classification API to provide easier backward migrations.

## 2.1.0

### Minor Changes

- Fixed scaffolder DB corruption when trying to backward migrate. Opened up /migrate endpoint unautheticated. Improved DB querying trhough Knex.

## 2.0.0

### Major Changes

- Replaced Winston Logger with the new backend LoggerService
- Integrated new backend Auth service

### Minor Changes

- Decreased the initial delay time to fetch templates to 30 seconds.
- Removed the need for a static external token

## 1.1.0

### Minor Changes

- ec4abcc: Added changelog
