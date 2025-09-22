import {
  ActionDataType,
  ContextActionDataType,
  AnswerDataType,
  LiveboardDataType,
  SearchDataType,
  VizPointClickDataType,
} from "@/types/data-classes-types";

/*
 * Contains classes for handing API data.
 * This file supports and is tested against v2 (new experience) objects.  Last version tested was 9.3.0.cl.
 * Other version may work, but have not been tested.
 */

/**
 * combines and inverts arrays, so a = [1, 2, 3], b = [4, 5, 6] becomes [[1,4], [2,5], [3,6]]
 * this function is used to convert column-based representations of the data to a table for display
 * @param arrays the arrays to combined and invert.
 */
const zip = <T>(arrays: T[][]): T[][] => {
  if (!arrays.length) return [];

  return arrays[0].map(function (_: T, i: number) {
    return arrays.map(function (array) {
      return array[i];
    });
  });
};

/**
 * Sorts an array of objects (changinge the array) based on some attribute in the array.
 * @param arrayOfObjs The array of objects to sort.
 * @param attr The attribute to use for sorting.  Always sorts ascending.
 */
export const sortObjects = <T extends Record<string, unknown>>(
  arrayOfObjs: T[],
  attr: keyof T
) => {
  arrayOfObjs.sort((first, second) => {
    if (first[attr] < second[attr]) return -1;
    if (first[attr] > second[attr]) return 1;
    return 0;
  });
};

/**
 * Tabular data is an object that's indexed by column name and then the data is in the order of the data in the original payload.
 */
type TableData = {
  [columnName: string]: (string | number)[];
};

/**
 * Represents the original data, which can have different structures.
 */
type AnyObject = Record<string, unknown>;

/**
 * Holds the data in a tabular format for easy use and retrieval.  Base class of all data classes.
 */
export class TabularData {
  // The data is narmalized to be stored by column with the key being the column name.  This
  // makes it easy to just get a subset of columns in any order.
  data: TableData;

  // The original data from the payload.
  originalData: AnyObject;

  // The list of column names.
  _cns: string[];

  // The number of rows in the data.
  _nbrRows: number;

  // Case-insensitive column name lookup map
  _columnNameMap: Map<string, string>;

  /**
   * Creates a new TabularData object.
   * @param originalData The original data from the API.
   */
  constructor(originalData: AnyObject) {
    this.data = {};
    this.originalData = originalData;
    this._cns = [];
    this._nbrRows = 0;
    this._columnNameMap = new Map<string, string>();
  }

  /**
   * Sets the column names to use.  This also dictates the number of columns and should match the data.
   * @param cns The names of the columns in the same order as the data.
   */
  set columnNames(cns: string[]) {
    this._cns = Array.from(cns);
    // Build the case-insensitive column name map
    this._columnNameMap.clear();
    for (const name of this._cns) {
      this._columnNameMap.set(name.toLowerCase(), name);
    }
  }

  /**
   * Returns the column names.
   * @returns An array containing the column names.
   */
  get columnNames(): string[] {
    return Array.from(this._cns); // avoid manipulation.
  }

  /**
   * Returns the number of columns in the tabular data.
   * @returns The number of columns.
   */
  get nbrColumns(): number {
    return this._cns.length;
  }

  /**
   * Returns the number of rows of data.
   * @returns {number} The number of rows of data.
   */
  get nbrRows(): number {
    return this._nbrRows;
  }

  /**
   * Gets the original case column name from a potentially case-insensitive column name.
   * @param columnName The column name to look up (case-insensitive).
   * @returns The original case column name, or undefined if not found.
   */
  getOriginalColumnName(columnName: string): string | undefined {
    return this._columnNameMap.get(columnName.toLowerCase());
  }

  /**
   * Checks if a column exists with case-insensitive comparison.
   * @param columnName The column name to check.
   * @returns True if the column exists, false otherwise.
   */
  hasColumn(columnName: string): boolean {
    return this._columnNameMap.has(columnName.toLowerCase());
  }

  /**
   * Populates the data by row.  This means the data is an array of arrays of the form:
   * [0]: [a|b|1]
   * [1]: [c|d|2]
   * etc
   * The order of the columns is assumed to be the same as the order of the column names and that there are the
   * same number of column headers and values.  In the example above, that would imply three columns/column names.
   * @param data The data to populate.
   */
  populateDataByRow(data: (string | number)[][]) {
    try {
      // Create the columns to populate with data.
      for (const name of this._cns) {
        this.data[name] = [];
      }

      // Assumes the columns are all filled and the same size.
      this._nbrRows = data.length;
      for (let rowCnt = 0; rowCnt < this._nbrRows; rowCnt++) {
        for (let colCnt = 0; colCnt < this.columnNames.length; colCnt++) {
          this.data[this._cns[colCnt]].push(data[rowCnt][colCnt]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Populates the data by column.   In this case, the data is of the form:
   * {
   * col_name_1: [a|b|1]
   * col_name_2: [c|d|2]
   * etc
   * }
   * The order of the columns is assumed to be the same as the order of the column names and that there are the
   * same number of column headers and values.  In the example above, that would imply three columns/column names.
   * @param data The data to populate.
   */
  populateDataByColumn(data: (string | number)[][]) {
    this._nbrRows = data.length ? data[0].length : 0; // doesn't matter which column.
    for (let colCnt = 0; colCnt < this.nbrColumns; colCnt++) {
      const colName = this._cns[colCnt];
      this.data[colName] = Array.from(data[colCnt]); // shallow copy the data
    }
  }

  /**
   * Returns the set of columns as an array of arrays of data.
   *  The columnNames are the sub-set of columns.  There are three options:
   *    null or undefined: return all columns
   *    string: return a single column with that name
   *    array of strings: return the columns with the given name
   * @param columnNames The names of the columns to return.
   * @returns An array of arrays with the data in rows, e.g.
   * [
   * [a|b|1]
   * [c|d|2]
   * etc.
   * ]
   */
  getDataAsTable(columnNames: string[] = []): (string | number)[][] {
    if (columnNames.length === 0) {
      columnNames = this.columnNames;
    } else if (!(columnNames instanceof Array)) {
      columnNames = [columnNames];
    }

    const arrays = [];
    for (const cname of columnNames) {
      // Use case-insensitive lookup to find the original column name
      const originalName = this.getOriginalColumnName(cname);
      if (originalName) {
        arrays.push(this.data[originalName]);
      } else {
        console.warn(
          `Column name "${cname}" not found (case-insensitive search)`
        );
        arrays.push([]); // Push empty array for missing column
      }
    }

    const results = zip(arrays);
    return results; // returns a two dimensional data array for the columns requested.
  }
}

/**
 * This class handles data from Search and Answers where the action was from the main menu or primary action.
 * This class also works for the EventType.Data events.
 * It does not work for liveboard visualizations or context menus.
 */
export class ActionData extends TabularData {
  /**
   * @param {JSON} jsonData The payload data from the actions.
   * @returns a new ActionData object populated from the jsonData
   */
  static createFromJSON(jsonData: ActionDataType): ActionData {
    const actionData = new ActionData(jsonData as unknown as AnyObject);

    try {
      // Handle both data structures: jsonData.data.embedAnswerData or jsonData.embedAnswerData
      const dataRoot =
        jsonData.data?.embedAnswerData || jsonData.embedAnswerData;

      if (!dataRoot) {
        console.error("No embedAnswerData found in the data");
        return actionData;
      }

      // Note that you can get more column names than data and that the data column are aligned by column ID.
      const originalColumnNames = [];
      const columnIds = [];
      // Get the column meta information.
      const nbrCols = dataRoot.columns.length;
      for (let colCnt = 0; colCnt < nbrCols; colCnt += 1) {
        originalColumnNames.push(dataRoot.columns[colCnt].column.name);
        columnIds.push(dataRoot.columns[colCnt].column.id);
      }

      // Handle both data structures: dataRoot.data[0].columnDataLite and dataRoot.data.columnDataLite
      const dataSet = Array.isArray(dataRoot.data)
        ? dataRoot.data[0].columnDataLite
        : dataRoot.data.columnDataLite;

      const data = [];
      const columnNames = [];
      for (let cnt = 0; cnt < dataSet.length; cnt++) {
        const columnIdx = columnIds.indexOf(dataSet[cnt].columnId); // find the right column.
        if (columnIdx < 0) {
          console.error(
            `Data error: ${dataSet[cnt].columnId} not found in the columns names.`
          );
        } else {
          columnNames.push(originalColumnNames[columnIdx]);
          data.push(dataSet[cnt].dataValue); // should be an array of columns values.
        }
      }

      actionData.columnNames = columnNames;
      actionData.populateDataByColumn(data);
    } catch (error) {
      console.error(`Error creating action data: ${error}`);
      console.error(jsonData);
    }

    return actionData;
  }
}

/**
 * This class handles data from context actions as well as point clicks.
 */
export class ContextActionData extends TabularData {
  /**
   * Creates a new context action class from teh payload.
   * @param jsonData The payload data from the actions.
   * @returns a new ContextActionData object populated from the jsonData
   */
  static createFromJSON(jsonData: ContextActionDataType): ContextActionData {
    const contextActionData = new ContextActionData(
      jsonData as unknown as AnyObject
    );

    try {
      const columnNames = [];
      const columnValues = [];

      // The actual data selected is stored in contextMenuPoints
      // It could be under jsonData or jsonData.data
      const contextMenuPoints =
        jsonData.contextMenuPoints || jsonData.data?.contextMenuPoints;

      if (!contextMenuPoints) {
        console.error("No contextMenuPoints found in the data");
        return contextActionData;
      }

      // Handle multiple selectedPoints
      const selectedPoints = contextMenuPoints.selectedPoints || [];

      // Process each selected point
      for (const point of selectedPoints) {
        // Handle multiple selectedAttributes
        if (point.selectedAttributes && point.selectedAttributes.length > 0) {
          for (const attribute of point.selectedAttributes) {
            columnNames.push(attribute.column.name);
            columnValues.push([attribute.value]);
          }
        }

        // Handle multiple selectedMeasures
        if (point.selectedMeasures && point.selectedMeasures.length > 0) {
          for (const measure of point.selectedMeasures) {
            columnNames.push(measure.column.name);
            columnValues.push([measure.value]);
          }
        }
      }

      // If no data was found, try the clickedPoints as a fallback
      if (
        columnNames.length === 0 &&
        contextMenuPoints.clickedPoints &&
        contextMenuPoints.clickedPoints.length > 0
      ) {
        const clickedPoint = contextMenuPoints.clickedPoints[0];

        if (
          clickedPoint.selectedAttributes &&
          clickedPoint.selectedAttributes.length > 0
        ) {
          for (const attribute of clickedPoint.selectedAttributes) {
            columnNames.push(attribute.column.name);
            columnValues.push([attribute.value]);
          }
        }

        if (
          clickedPoint.selectedMeasures &&
          clickedPoint.selectedMeasures.length > 0
        ) {
          for (const measure of clickedPoint.selectedMeasures) {
            columnNames.push(measure.column.name);
            columnValues.push([measure.value]);
          }
        }
      }

      if (columnNames.length > 0) {
        contextActionData.columnNames = columnNames;
        contextActionData.populateDataByColumn(columnValues);
      } else {
        console.error("No data found in contextMenuPoints");
      }
    } catch (error) {
      console.error(`Error creating context action data: ${error}`);
      console.error(jsonData);
    }

    return contextActionData;
  }
}

/**
 * Represents the individual visualizations in a liveboard.
 */
class VizData extends TabularData {
  constructor(
    public viz_id: string,
    public viz_name: string,
    jsonData: AnyObject // JSON for the individual visualization.
  ) {
    super(jsonData);
    this.viz_id = viz_id; // ID for the visualization.
    this.viz_name = viz_name; // Name for the visualization.
  }
}

/**
 * Represents the liveboard data class.  This is returned when calling the liveboard data API.
 * Note that this class _isn't_ a tabular data class, but rather a collection of VizData objects which are.
 * This class only works with V2 liveboards.
 */
export class LiveboardData {
  public vizData: { [vizID: string]: VizData };

  /**
   * Creates a new liveboard data class, which is just a collection of VizData.
   */
  constructor() {
    this.vizData = {}; // Set of VizData objects keyed by the viz ID.
  }

  /**
   * Creates the liveboard data object from payload.
   * @param jsonData The data from the liveboard data API.
   * @returns The new LiveboardData object.
   */
  static createFromJSON(jsonData: LiveboardDataType): LiveboardData {
    const liveboardData = new LiveboardData();

    try {
      for (const viz of jsonData.contents) {
        // results have an array of visualizations.
        const vizData = new VizData(
          viz.visualization_id,
          viz.visualization_name,
          viz
        );
        vizData.columnNames = viz.column_names;
        vizData.populateDataByRow(viz.data_rows);

        liveboardData.vizData[viz.visualization_id] = vizData;
      }
    } catch (error) {
      console.error(`Error creating liveboard data: ${error}`);
      console.error(jsonData);
    }

    return liveboardData;
  }
}

/**
 * Creates a new search data object with the results of the Search Data and Fetch Answer Data v2.0 API calls.
 */
export class SearchData extends TabularData {
  /**
   * Create a new search data object.
   * @param jsonData The data returned from the API call.
   * @returns {SearchData}
   */
  static createFromJSON(jsonData: SearchDataType): SearchData {
    const searchData = new SearchData(jsonData as unknown as AnyObject);
    try {
      searchData.columnNames = jsonData.contents[0].column_names;
      searchData.populateDataByRow(jsonData.contents[0].data_rows);
    } catch (error) {
      console.error(`Error creating search data: ${error}`);
      console.error(jsonData);
      throw error;
    }

    return searchData;
  }
}

/**
 * Creates a new get answer data object.
 * This data format comes from the payload.answerService.fetchData(offset, batchSize) call from custom actions.
 * Note that AnswerData is simply SearchData with a couple extra attributes.
 */
export class AnswerData extends TabularData {
  /**
   * Creats a new get answer data object.
   * @param jsonData The response  from a payload.answerService.fetchData(offset, batchSize)
   */
  static createFromJSON(jsonData: AnswerDataType): AnswerData {
    const answerData = new AnswerData(jsonData as unknown as AnyObject);
    try {
      answerData.columnNames = jsonData.contents[0].column_names;
      answerData.populateDataByRow(jsonData.contents[0].data_rows);
    } catch (error) {
      console.error(`Error creating get answer data: ${error}`);
      console.error(jsonData);
    }

    return answerData;
  }
}

/**
 * This class handles data from viz point click events (vizPointClick, vizPointDoubleClick, vizPointRightClick).
 * It extends TabularData to provide a consistent interface for accessing the clicked point data.
 */
export class VizPointClick extends TabularData {
  /**
   * Creates a new VizPointClick object from the payload.
   * @param jsonData The payload data from the viz point click events.
   * @returns a new VizPointClick object populated from the jsonData
   */
  static createFromJSON(jsonData: VizPointClickDataType): VizPointClick {
    const vizPointClick = new VizPointClick(jsonData as unknown as AnyObject);

    try {
      const columnNames: string[] = [];
      const columnValues: (string | number)[][] = [];

      // Extract data from the clickedPoint
      const clickedPoint = jsonData.data.clickedPoint;

      // Process selectedAttributes from clickedPoint
      if (
        clickedPoint.selectedAttributes &&
        clickedPoint.selectedAttributes.length > 0
      ) {
        for (const attribute of clickedPoint.selectedAttributes) {
          columnNames.push(attribute.column.name);
          columnValues.push([attribute.value]);
        }
      }

      // Process selectedMeasures from clickedPoint
      if (
        clickedPoint.selectedMeasures &&
        clickedPoint.selectedMeasures.length > 0
      ) {
        for (const measure of clickedPoint.selectedMeasures) {
          columnNames.push(measure.column.name);
          columnValues.push([measure.value]);
        }
      }

      // If no data was found in clickedPoint, try selectedPoints as a fallback
      if (
        columnNames.length === 0 &&
        jsonData.data.selectedPoints &&
        jsonData.data.selectedPoints.length > 0
      ) {
        const selectedPoint = jsonData.data.selectedPoints[0];

        // Process selectedAttributes from selectedPoints
        if (
          selectedPoint.selectedAttributes &&
          selectedPoint.selectedAttributes.length > 0
        ) {
          for (const attribute of selectedPoint.selectedAttributes) {
            columnNames.push(attribute.column.name);
            columnValues.push([attribute.value]);
          }
        }

        // Process selectedMeasures from selectedPoints
        if (
          selectedPoint.selectedMeasures &&
          selectedPoint.selectedMeasures.length > 0
        ) {
          for (const measure of selectedPoint.selectedMeasures) {
            columnNames.push(measure.column.name);
            columnValues.push([measure.value]);
          }
        }
      }

      if (columnNames.length > 0) {
        vizPointClick.columnNames = columnNames;
        vizPointClick.populateDataByColumn(columnValues);
      } else {
        console.error("No data found in viz point click event");
      }
    } catch (error) {
      console.error(`Error creating viz point click data: ${error}`);
      console.error(jsonData);
    }

    return vizPointClick;
  }

  /**
   * Gets the type of the viz point click event.
   * @returns The event type (vizPointClick, vizPointDoubleClick, vizPointRightClick)
   */
  getEventType(): string {
    return (this.originalData as unknown as VizPointClickDataType).type;
  }

  /**
   * Gets the visualization ID from the event data.
   * @returns The visualization ID
   */
  getVizId(): string {
    return (this.originalData as unknown as VizPointClickDataType).data.vizId;
  }

  /**
   * Gets the full embed answer data from the event.
   * @returns The embed answer data object
   */
  getEmbedAnswerData(): unknown {
    return (this.originalData as unknown as VizPointClickDataType).data
      .embedAnswerData;
  }
}

/**
 * Converts a tabular data object to an HTML table for display.
 * @param tabularData The tabular data object to convert.
 * @returns The tabular data as an HTML table.
 * CSS classes are:
 * - tabular-data: the table class
 * - tabular-data-th: the table header class
 * - tabular-data: the table data class
 */
export const tabularDataToHTML = (tabularData: TabularData): string => {
  // Converts TabularData to HTML.
  let table = '<table class="tabular-data">';

  // Add a header
  table += "<tr>";
  for (const columnName of tabularData.columnNames) {
    table += `<th class="tabular-data-th">${columnName}</th>`;
  }
  table += "</tr>";

  const data = tabularData.getDataAsTable();
  for (let rnbr = 0; rnbr < tabularData.nbrRows; rnbr++) {
    table += "<tr>";
    for (let cnbr = 0; cnbr < tabularData.columnNames.length; cnbr++) {
      table += `<td class="tabular-data">${data[rnbr][cnbr]}</td>`;
    }
    table += "</tr>";
  }
  table += "</table>";

  return table;
};

/**
 * Converts tabular data to CSV format that can be displayed or downloaded.
 * @param tabularData A TabularData object.
 * @return The tabular data as a CSV string that can be saved to a file.
 */
export const tabularDataToCSV = (tabularData: TabularData) => {
  let csv = "data:text/csv;charset=utf-8,";

  // Get the column names as header values.
  const columnNames = tabularData.columnNames.map((cn) =>
    String(cn).replaceAll('"', '""')
  ); // convert quotes for embedding.
  csv += '"' + columnNames.join('","') + '"\n';

  // get the data as a table and add it to the CSV.
  const data = tabularData.getDataAsTable();
  for (let rnbr = 0; rnbr < tabularData.nbrRows; rnbr++) {
    const row = data[rnbr].map((d) => String(d).replaceAll('"', '""')); // convert quotes for embedding
    csv += '"' + row.join('","') + '"\n';
  }

  return csv;
};
