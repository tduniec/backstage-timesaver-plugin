import {
  roundNumericValues,
  isoDateFromDateTime,
  dateTimeFromIsoDate,
} from '../utils';
import {
  GroupSavingsDivision,
  TemplateTimeSavingsDistinctRbRow,
  GroupSavingsDivisionDbRow,
  TemplateTimeSavingsDbRow,
  TimeSavedStatisticsDbRow,
  RawDbTimeSummary,
  TemplateTimeSavings,
  TimeSavedStatistics,
  TimeSummary,
  TemplateTimeSavingsCollection,
} from './types';

const DEFAULT_DB_CREATED_AT_VALUE = '';

interface IMapper { }
class Mapper<T> implements IMapper {
  // toDomain(raw: any): <T>;
  // toPersistence(o: T): any;
  // toDTO(o: T): U;
}

export class TemplateTimeSavingsMap extends Mapper<TemplateTimeSavings> {
  static toPersistence(
    templateTimeSavings: TemplateTimeSavings,
  ): TemplateTimeSavingsDbRow {
    return {
      team: templateTimeSavings.team,
      role: templateTimeSavings.role,
      created_at:
        isoDateFromDateTime(templateTimeSavings.createdAt) ||
        DEFAULT_DB_CREATED_AT_VALUE,
      created_by: templateTimeSavings.createdBy,
      time_saved: templateTimeSavings.timeSaved,
      template_name: templateTimeSavings.templateName,
      template_task_id: templateTimeSavings.templateTaskId,
      template_task_status: templateTimeSavings.templateTaskStatus,
    };
  }
  static toDTO(
    templateTimeSavingsDbRow: TemplateTimeSavingsDbRow,
  ): TemplateTimeSavings {
    return {
      id: templateTimeSavingsDbRow.id,
      team: templateTimeSavingsDbRow.team,
      role: templateTimeSavingsDbRow.role,
      createdAt:
        dateTimeFromIsoDate(templateTimeSavingsDbRow.created_at),
      createdBy: templateTimeSavingsDbRow.created_by,
      timeSaved: roundNumericValues(templateTimeSavingsDbRow.time_saved),
      templateName: templateTimeSavingsDbRow.template_name,
      templateTaskId: templateTimeSavingsDbRow.template_task_id,
      templateTaskStatus: templateTimeSavingsDbRow.template_task_status,
    };
  }
}

export class TemplateTimeSavingsCollectionMap extends Mapper<TemplateTimeSavings> {
  static toDTO(
    templateTimeSavingsDbRows: TemplateTimeSavingsDbRow[],
  ): TemplateTimeSavingsCollection {
    return templateTimeSavingsDbRows.map(e => TemplateTimeSavingsMap.toDTO(e));
  }
  static distinctToDTO(
    templateTimeSavingsDbRows: TemplateTimeSavingsDistinctRbRow[],
  ): { [x: string]: (string | number)[] } | undefined {
    if (!(templateTimeSavingsDbRows && templateTimeSavingsDbRows.length)) {
      return undefined;
    }
    const key: string = Object.keys(templateTimeSavingsDbRows[0])[0];
    const values = templateTimeSavingsDbRows.map(e => Object.values(e)[0]);

    return {
      [key]: [...values],
    };
  }
}

export class TimeSavedStatisticsMap extends Mapper<TimeSavedStatistics> {
  static toDTO(
    timeSavedStatisticsDbRow: TimeSavedStatisticsDbRow,
  ): TimeSavedStatistics {
    return {
      team: timeSavedStatisticsDbRow?.team,
      templateName: timeSavedStatisticsDbRow?.template_name,
      timeSaved: parseInt(timeSavedStatisticsDbRow?.time_saved || '0', 10),
    };
  }
}

export class GroupSavingsDivisionMap extends Mapper<GroupSavingsDivision> {
  static toDTO(
    groupSavingsDivisionDbRow: GroupSavingsDivisionDbRow,
  ): GroupSavingsDivision {
    return {
      team: groupSavingsDivisionDbRow?.team,
      percentage: roundNumericValues(groupSavingsDivisionDbRow.percentage),
    };
  }
}

export class TimeSummaryMap extends Mapper<TimeSummary> {
  static toDTO(timeSummaryDbRow: RawDbTimeSummary): TimeSummary {
    return {
      team: timeSummaryDbRow?.team,
      templateName: timeSummaryDbRow?.template_name,
      date: dateTimeFromIsoDate(timeSummaryDbRow.date),
      totalTimeSaved:
        roundNumericValues(timeSummaryDbRow.total_time_saved) || 0,
    };
  }
}
