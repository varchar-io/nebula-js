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
