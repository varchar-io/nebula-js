/*
 * Copyright 2020-present columns.ai
 *
 * The code belongs to https://columns.ai
 * Terms & conditions to be found at `LICENSE.txt`.
 */

import { CustomType, Operation, Order, Rollup } from "../gen/nebula";

// example state returned by Nebula
// "block_count":1,"row_count":9,"memory_size":171,
// "min_time":1621030740,"max_time":1621030740,
// "column_keys":["gender","country"],"column_values":["age","points","_time_"]
export type TableState = {
  table_name: string;
  block_count: number;
  row_count: number;
  memory_size: number;
  min_time: number;
  max_time: number;
  column_keys: string[];
  column_values: string[];
  hists: string[];
};

// filter is a tree, leaf node has expression
export interface Filter {
  // logic operator string: AND, OR
  logic: string;

  // list of filter set
  rules: Array<Filter>;

  // leaf node column name, otherwise empty/undefined.
  column?: string;
  // operations: EQ, NEQ, MORE, LESS, LIKE, ILIKE
  op?: Operation;
  // values, string, bigint or double
  values?: Array<any>;
}

// define a field - column or aggregation
export interface OptionType {
  column: string;
  preferred: string;
  method: Rollup;
  display: string;
  key: string;
  alias: string;
  edited?: boolean;
  as: (alias: string) => OptionType;
}

export type TimelineOptions = {
  // window size in seconds
  window: number;
  // fill 0 for missing time point
  autofill: boolean;
  // N windows to be predicated
  forecast: number;
  // unit is to round time point into that unit
  unit: TimeUnit;
};

// supported unit in Nebula
// static constexpr int32_t HOUR_CASE = 1;
// static constexpr int32_t DAY_CASE = 2;
// static constexpr int32_t WEEK_CASE = 3;
// static constexpr int32_t MONTH_CASE = 4;
// static constexpr int32_t QUARTER_CASE = 5;
// static constexpr int32_t YEAR_CASE = 6;
export enum TimeUnit {
  NONE = 0,
  HOUR = 1,
  DAY = 2,
  WEEK = 3,
  MONTH = 4,
  QUARTER = 5,
  YEAR = 6,
};

export interface CodeColumn {
  // column name
  name: string;
  // custom column type
  type: CustomType;
  // expression for this new column
  expr: string;
}

export interface NebulaRequest {
  // table name
  table: string;

  // query time start UTC UNIX time
  start: number;
  // query time end UTC UNIX time
  end: number;

  // TODO: futher define the structure
  // filter is object of where clause.
  filter: Filter;

  // column list to aggregate
  keys: string[];
  metrics: OptionType[];

  // whether current query is for timeline
  timeline: TimelineOptions;

  // nebula order
  sort: Order;

  // limitation on the number of returned rows
  limit: number;

  // code block from user input (Nebula SDK)
  code: string;

  // custom columns to run in the query (Nebula SDK)
  columns: CodeColumn[];

  // pivot column to pivot data set (Nebula SDK)
  pivot: string;

  // map function to transform data set (Nebula SDK)
  map: string;

  // column list to remove from data set (Nebula SDK)
  rm: string[];
}

export interface NebulaResponse {
  error: number;
  duration: number;
  rows_scan: number;
  blocks_scan: number;
  rows_return: number;
  data: Uint8Array;
}

export interface IHandler {
  onError: (err: string) => boolean;
  onNull: () => boolean;
  onSuccess: (data: NebulaResponse) => boolean;
};

// time spec defines how to get time value from records
// ref: https://github.com/varchar-io/nebula/blob/master/src/meta/TableSpec.h#L120
export interface TimeSpec {
  // type - extendable for other supported scenarios
  type: 'column' | 'static' | 'provided' | 'current';

  // column name when type is 'column'
  column?: string;
  // pattern: unixtime, ms, nano, string pattern, etc.
  pattern?: string;
  // static value in unix time stamp in seconds
  value?: number;
}

// this is the spec to ask Nebula to load a Google Sheet
// https://github.com/varchar-io/nebula/blob/daaf74829476f0ad74a6aaec17b28144242fe604/src/service/base/GoogleSheet.h#L106
export interface NebulaGsheet {
  // SHEET ID
  id: string;

  // user ID to load this sheet in its namespace
  uid?: string;

  // Nebula schema string
  schema: string;

  // sheet rows and cols
  cols: number;
  rows: number;

  // user access token to gsheet
  gtoken: string;

  // google api client key
  key: string;

  // time column in the sheet if having (serial number only)
  time: TimeSpec;
}

// refer Table.h#Column definition
export type ColumnOpts = {
  // use dictionary
  dict: boolean;

  // use bloom filter
  bloom: boolean;
};

export type CsvProps = {
  hasHeader: boolean;
  delimiter: string;
  compression: string;

  // indicating if second row is metadata
  // basically explanation for the first row
  hasMeta: boolean;
};

export type JsonProps = {
  rowsField: string;
  columnsMap: any;
};

// this is a standard load spec which is converted into
// https://github.com/varchar-io/nebula/blob/daaf74829476f0ad74a6aaec17b28144242fe604/src/service/base/LoadSpec.h#L33
// we use this to carry a load spec with data source from a HTTP service: columns or drive
export interface NebulaLoadSpec {
  // user ID that this load spec on behalf
  uid?: string;

  // data path - this will be used to determine data source (S3, HTTP)
  // such as examples: "s3://nebula/a.txt", "gs://nebula/b.txt", "http://columns.ai/cdn/x.txt", etc.
  path: string;

  // data schema in nebula format (eg. `ROW<id:int, name:string>`)
  schema: string;

  // column options such as encoding
  options: Record<string, ColumnOpts>;

  // data format: csv,tsv,json (default csv)
  format?: string;

  // csv related properties
  csv: CsvProps;

  // json related properties
  json: JsonProps;

  // macros: {M1:[v1, v2]}
  macros: Record<string, string[]>;

  // optional: access token - if current request (like HTTP) requires access token.
  // this value could be used to build HTTP request header when access the resource.
  token?: string;

  // time spec
  time: TimeSpec;

  // service headers
  headers: string[];
}