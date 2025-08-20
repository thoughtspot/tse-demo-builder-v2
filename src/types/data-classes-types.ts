/**
 * This file contains type definitions for the JSON data objects that are sent from ThoughtSpot.  Note that the types are simplified to only
 * include the attributes needed by the data-classes.ts file.  The types are not complete and may need to be updated in the future.
 * That said, all data is saved in each of the classes, so the object can be queried directly.
 */

// Type definitions for column properties and related structures
export interface ColumnProperties {
  [key: string]: unknown;
}

export interface CurrencyFormat {
  __typename: string;
  column: string;
  isoCode: string;
  type: string;
}

export interface CustomCalendarType {
  [key: string]: unknown;
}

export interface CustomOrder {
  [key: string]: unknown;
}

export interface FormatPattern {
  [key: string]: unknown;
}

export interface GeoConfig {
  [key: string]: unknown;
}

export interface LegacyColumnFormatProperties {
  [key: string]: unknown;
}

export interface LegacySheetProperties {
  [key: string]: unknown;
}

export interface DeselectedAttribute {
  column: {
    dataType: string;
    name: string;
  };
  value: string | number;
}

export interface DeselectedMeasure {
  column: {
    dataType: string;
    name: string;
  };
  value: number;
}

export interface EmbedAnswerData {
  columns: {
    __typename: string;
    column: {
      __typename: string;
      dataType: string;
      id: string;
      name: string;
      referencedColumns: {
        __typename: string;
        displayName: string;
      }[];
      type: string;
    };
  }[];
  data:
    | {
        columnDataLite: {
          columnDataType: string;
          columnId: string;
          dataValue: (string | number)[];
        }[];
        completionRatio: number;
        samplingRatio: number;
        totalRowCount: string;
      }[]
    | {
        columnDataLite: {
          columnDataType: string;
          columnId: string;
          dataValue: (string | number)[];
        }[];
        completionRatio: number;
        samplingRatio: number;
        totalRowCount: string;
      };
}

// Sent by menu actions on answers, including individual visualizations in a liveboard.
export interface ActionDataType {
  embedAnswerData?: EmbedAnswerData;
  data?: {
    embedAnswerData: EmbedAnswerData;
  };
}

// Sent by context actions on answers.
export interface ContextActionDataType {
  contextMenuPoints?: {
    selectedPoints: {
      selectedAttributes: {
        column: {
          dataType: string;
          name: string;
        };
        value: string;
      }[];
      selectedMeasures: {
        column: {
          dataType: string;
          name: string;
        };
        value: number;
      }[];
    }[];
    clickedPoints?: {
      selectedAttributes: {
        column: {
          dataType: string;
          name: string;
        };
        value: string;
      }[];
      selectedMeasures: {
        column: {
          dataType: string;
          name: string;
        };
        value: number;
      }[];
    }[];
  };
  data?: {
    contextMenuPoints: {
      selectedPoints: {
        selectedAttributes: {
          column: {
            dataType: string;
            name: string;
          };
          value: string;
        }[];
        selectedMeasures: {
          column: {
            dataType: string;
            name: string;
          };
          value: number;
        }[];
      }[];
      clickedPoints?: {
        selectedAttributes: {
          column: {
            dataType: string;
            name: string;
          };
          value: string;
        }[];
        selectedMeasures: {
          column: {
            dataType: string;
            name: string;
          };
          value: number;
        }[];
      }[];
    };
  };
}

// Sent by the liveboard data API.
export interface LiveboardDataType {
  metadata_id: string;
  metadata_name: string;
  contents: {
    available_data_row_count: number;
    column_names: string[];
    data_rows: (string | number)[][];
    record_offset: number;
    record_size: number;
    returned_data_row_count: number;
    sampling_ratio: number;
    visualization_id: string;
    visualization_name: string;
  }[];
}

// Sent by the search data API.
export interface SearchDataType {
  contents: {
    available_data_row_count: number;
    column_names: string[];
    data_rows: [string, number][];
    record_offset: number;
    record_size: number;
    returned_data_row_count: number;
    sampling_ratio: number;
  }[];
}

// Sent by the fetch answer data API.
export interface AnswerDataType {
  metadata_id: string;
  metadata_name: string;
  contents: {
    available_data_row_count: number;
    column_names: string[];
    data_rows: [string, number][];
    record_offset: number;
    record_size: number;
    returned_data_row_count: number;
    sampling_ratio: number;
  }[];
}

// Sent by viz point click events (vizPointClick, vizPointDoubleClick, vizPointRightClick)
export interface VizPointClickDataType {
  type: string; // "vizPointClick", "vizPointDoubleClick", "vizPointRightClick"
  data: {
    clickedPoint: {
      selectedAttributes: {
        column: {
          __typename: string;
          aggregationType: string;
          baseColumnType: string;
          calendarGuid: string;
          chartSpecificColumnType: string;
          columnProps: {
            __typename: string;
            columnProperties: ColumnProperties;
            version: string;
          };
          customCalendarType: CustomCalendarType;
          customOrder: CustomOrder[];
          dataType: string;
          dynamicTitle: string;
          format: {
            __typename: string;
            currencyFormat: CurrencyFormat | null;
            pattern: string;
          } | null;
          formatPattern: FormatPattern;
          formatType: string | null;
          formulaId: string;
          geoConfig: GeoConfig;
          id: string;
          isAdditive: boolean;
          isAggregateApplied: boolean;
          isGroupBy: boolean;
          isMandatory: boolean;
          isStrictDateColumn: boolean;
          isTimeBucketRestricted: boolean;
          isUserDefinedTitle: boolean;
          legacyColumnFormatProperties: LegacyColumnFormatProperties;
          legacySheetProperties: LegacySheetProperties;
          name: string;
          referencedColumns: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          referencedTables: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          showGrowth: boolean;
          timeBucket: string;
          type: string;
          uniqueValues: string;
        };
        value: string | number;
      }[];
      deselectedAttributes: DeselectedAttribute[];
      selectedMeasures: {
        column: {
          __typename: string;
          aggregationType: string;
          baseColumnType: string;
          calendarGuid: string;
          chartSpecificColumnType: string;
          columnProps: {
            __typename: string;
            columnProperties: ColumnProperties;
            version: string;
          };
          customCalendarType: CustomCalendarType;
          customOrder: CustomOrder[];
          dataType: string;
          dynamicTitle: string;
          format: {
            __typename: string;
            currencyFormat: {
              __typename: string;
              column: string;
              isoCode: string;
              type: string;
            } | null;
            pattern: string;
          } | null;
          formatPattern: FormatPattern;
          formatType: string | null;
          formulaId: string;
          geoConfig: GeoConfig;
          id: string;
          isAdditive: boolean;
          isAggregateApplied: boolean;
          isGroupBy: boolean;
          isMandatory: boolean;
          isStrictDateColumn: boolean;
          isTimeBucketRestricted: boolean;
          isUserDefinedTitle: boolean;
          legacyColumnFormatProperties: LegacyColumnFormatProperties;
          legacySheetProperties: LegacySheetProperties;
          name: string;
          referencedColumns: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          referencedTables: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          showGrowth: boolean;
          timeBucket: string;
          type: string;
          uniqueValues: string;
        };
        value: number;
      }[];
      deselectedMeasures: DeselectedMeasure[];
    };
    selectedPoints: {
      selectedAttributes: {
        column: {
          __typename: string;
          aggregationType: string;
          baseColumnType: string;
          calendarGuid: string;
          chartSpecificColumnType: string;
          columnProps: {
            __typename: string;
            columnProperties: ColumnProperties;
            version: string;
          };
          customCalendarType: CustomCalendarType;
          customOrder: CustomOrder[];
          dataType: string;
          dynamicTitle: string;
          format: {
            __typename: string;
            currencyFormat: CurrencyFormat | null;
            pattern: string;
          } | null;
          formatPattern: FormatPattern;
          formatType: string | null;
          formulaId: string;
          geoConfig: GeoConfig;
          id: string;
          isAdditive: boolean;
          isAggregateApplied: boolean;
          isGroupBy: boolean;
          isMandatory: boolean;
          isStrictDateColumn: boolean;
          isTimeBucketRestricted: boolean;
          isUserDefinedTitle: boolean;
          legacyColumnFormatProperties: LegacyColumnFormatProperties;
          legacySheetProperties: LegacySheetProperties;
          name: string;
          referencedColumns: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          referencedTables: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          showGrowth: boolean;
          timeBucket: string;
          type: string;
          uniqueValues: string;
        };
        value: string | number;
      }[];
      deselectedAttributes: DeselectedAttribute[];
      selectedMeasures: {
        column: {
          __typename: string;
          aggregationType: string;
          baseColumnType: string;
          calendarGuid: string;
          chartSpecificColumnType: string;
          columnProps: {
            __typename: string;
            columnProperties: ColumnProperties;
            version: string;
          };
          customCalendarType: CustomCalendarType;
          customOrder: CustomOrder[];
          dataType: string;
          dynamicTitle: string;
          format: {
            __typename: string;
            currencyFormat: {
              __typename: string;
              column: string;
              isoCode: string;
              type: string;
            } | null;
            pattern: string;
          } | null;
          formatPattern: FormatPattern;
          formatType: string | null;
          formulaId: string;
          geoConfig: GeoConfig;
          id: string;
          isAdditive: boolean;
          isAggregateApplied: boolean;
          isGroupBy: boolean;
          isMandatory: boolean;
          isStrictDateColumn: boolean;
          isTimeBucketRestricted: boolean;
          isUserDefinedTitle: boolean;
          legacyColumnFormatProperties: LegacyColumnFormatProperties;
          legacySheetProperties: LegacySheetProperties;
          name: string;
          referencedColumns: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          referencedTables: {
            __typename: string;
            description: string;
            displayName: string;
            guid: string;
          }[];
          showGrowth: boolean;
          timeBucket: string;
          type: string;
          uniqueValues: string;
        };
        value: number;
      }[];
      deselectedMeasures: DeselectedMeasure[];
    }[];
    embedAnswerData: EmbedAnswerData; // Full embed answer data structure
    vizId: string;
  };
  status: string;
}
