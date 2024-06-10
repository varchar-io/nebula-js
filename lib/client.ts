/*
 * Copyright 2020-present columns.ai
 *
 * The code belongs to https://columns.ai
 * Terms & conditions to be found at `LICENSE.txt`.
 */

import * as grpc from '@grpc/grpc-js';

import {
  CustomColumn,
  ListTables,
  LoadError,
  LoadRequest,
  LoadResponse,
  LoadType,
  Metric,
  Order,
  Predicate,
  PredicateAnd,
  PredicateOr,
  QueryRequest,
  TableStateRequest,
} from '../gen/nebula';
import { V1Client } from '../gen/nebula.grpc-client';
import { NebulaRequest, NebulaResponse, TableState } from './types';
import { LOG } from './log';
import { seconds } from './utils';

const MESSAGE_LENGTH = 64 * 1024 * 1024;
const MIN_RECONNECT_BACKOFF_MS = 1000;
const MAX_RECONNECT_BACKOFF_MS = 10000;
const KEEPALIVE_INTERVAL_MS = 30000;
const KEEPALIVE_TIMEOUT_MS = 10000;

const serviceAddr = process.env.NS_ADDR || 'localhost:9190';
const cred = grpc.credentials.createInsecure();
const options = {
  nebula: 'node',
  'grpc.max_receive_message_length': MESSAGE_LENGTH,
  'grpc.max_send_message_length': MESSAGE_LENGTH,
  'grpc.min_reconnect_backoff_ms': MIN_RECONNECT_BACKOFF_MS,
  'grpc.max_reconnect_backoff_ms': MAX_RECONNECT_BACKOFF_MS,
  'grpc.keepalive_time_ms': KEEPALIVE_INTERVAL_MS,
  'grpc.keepalive_timeout_ms': KEEPALIVE_TIMEOUT_MS,
};

/**
 * user identifier - usually email
 */
const meta = (user: string): grpc.Metadata => {
  const metadata = new grpc.Metadata();
  // auth user information
  if (user) {
    metadata.add('nebula-auth', '1');
    metadata.add('nebula-user', user);
  } else {
    metadata.add('nebula-auth', '0');
  }

  return metadata;
};

// communication layer error handler, return true if the error is handled, false if no error
const rejectGrpcError = (err: grpc.ServiceError | null, reject: (reason?: any) => void): boolean => {
  if (!err) {
    return false;
  }

  const reason = `[${err.code}]: ${err.message}`;
  reject(reason);
  return true;
};

export class NebulaClient {
  private client: V1Client;
  constructor() {
    this.client = new V1Client(serviceAddr, cred, options);
  }

  // list all available tables in the cluster visible to the user
  async listTables(user: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request: ListTables = {
        limit: 100,
      };

      this.client.tables(request, meta(user), {}, (err, tables) => {
        if (rejectGrpcError(err, reject)) {
          return;
        }

        // empty tables
        if (!tables) {
          reject('[nebula]: null/undefined response');
          return;
        }

        // resolve the table name list
        resolve(tables.table);
      });
    });
  }

  async unloadTable(user: string, tableName: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const loadReq: LoadRequest = {
        type: LoadType.UNLOAD,
        table: tableName,
        json: "",
        ttl: 0,
      };

      // unload the table through LOAD api
      this.client.load(loadReq, meta(user), {}, (err, reply) => {
        if (rejectGrpcError(err, reject)) {
          return;
        }

        if (!reply) {
          reject('[nebula]: null/undefined response');
          return;
        }

        // the result is loaded since it's a sync op for now
        LOG.info(`Table ${tableName} unloaded successfully.`);

        // delete the cache so next reload can read the new data
        // this.storage.removeCache(dataId);
        resolve(reply.error == LoadError.SUCCESS);
      });
    });
  }

  async tableState(user: string, tableName: string): Promise<TableState> {
    return new Promise<TableState>((resolve, reject) => {
      const request: TableStateRequest = {
        table: tableName,
      };

      this.client.state(request, meta(user), (err, reply) => {
        if (rejectGrpcError(err, reject)) {
          return;
        }

        if (!reply) {
          reject('[nebula]: null/undefined response');
          return;
        }

        resolve({
          table_name: tableName,
          block_count: reply.blockCount,
          row_count: reply.rowCount,
          memory_size: reply.memSize,
          min_time: reply.minTime,
          max_time: reply.maxTime,
          column_keys: reply.dimension,
          column_values: reply.metric,
          hists: reply.hists,
        });
      });
    });
  };

  async loadTable(user: string, req: LoadRequest): Promise<LoadResponse> {
    // send the query
    return new Promise<LoadResponse>((resolve, reject) => {
      this.client.load(req, meta(user), {}, (err, reply) => {
        if (rejectGrpcError(err, reject)) {
          return;
        }

        if (!reply) {
          reject('[nebula]: null/undefined response');
          return;
        }

        // the result is loaded since it's a sync op for now
        resolve(reply);
      });
    });
  }

  // nebula query
  async query(user: string, query: NebulaRequest): Promise<NebulaResponse> {
    // initialize handler
    return new Promise<NebulaResponse>((resolve, reject) => {
      if (!query.table) {
        LOG.error('Table name is needed.');
        reject('Table is missing.');
        return;
      }

      const req = QueryRequest.create({
        table: query.table,
        start: seconds(query.start),
        end: seconds(query.end),
        top: query.limit,
        dimension: query.keys,
      });
      LOG.info(`Query nebula: table=${query.table}, start=${query.start}, end=${query.end}.`);

      // the filter can be much more complex
      const filter = query.filter;
      if (filter) {
        // all rules under this group
        const rules = filter.rules;
        if (rules && rules.length > 0) {
          const predicates: Predicate[] = [];
          rules.forEach((r) => {
            if (r.values && r.values.length > 0) {
              const pred = Predicate.create({ column: r.column, op: r.op, value: r.values });
              predicates.push(pred);
            }
          });

          if (predicates.length > 0) {
            if (filter.logic === 'AND') {
              req.filterA = PredicateAnd.create({ expression: predicates });
            } else if (filter.logic === 'OR') {
              req.filterO = PredicateOr.create({ expression: predicates });
            }
          }
        }
      }

      // set query type (is timeline or not) and window
      if (query.timeline) {
        req.timeline = true;
        req.window = query.timeline.window;
        req.timeUnit = query.timeline.unit;
        req.tzOffset = query.timeline.offset;
      }

      // Nebula SDK related - customized columns through instant UDF
      const columns = query.columns;
      if (columns && columns.length > 0) {
        const cc: CustomColumn[] = [];
        columns.forEach((c) => {
          cc.push(CustomColumn.create({
            column: c.name,
            type: c.type,
            expr: c.expr,
          }));
        });
        req.custom = cc;
      }

      // set metric for non-samples query
      // (use implicit type convert != instead of !==)
      if (query.metrics) {
        const metrics: Metric[] = [];
        let m1: string = '';
        query.metrics.forEach((e) => {
          // set the first metric column name
          if (!m1) {
            m1 = e.column;
          }

          metrics.push(Metric.create(e));
        });
        req.metric = metrics;

        // set order on metric only means we don't order on samples for now
        if (query.sort) {
          req.order = Order.create({ column: m1, type: query.sort.type });
        }
      }

      // send request to service to get result
      this.client.query(req, meta(user), {}, (err, reply) => {
        if (rejectGrpcError(err, reject)) {
          return;
        }

        if (!reply) {
          reject('[nebula]: null/undefined response');
          return;
        }

        const stats = reply.stats;
        if (!stats) {
          reject('[nebula]: invalid query result stats');
          return;
        }

        // NODEJS issue: new Uint8Array(reply.data) will come back a Buffer
        // https://github.com/timostamm/protobuf-ts/issues/519#issuecomment-1518624808
        const data = Array.from(reply.data);

        const result: NebulaResponse = {
          error: stats.error,
          duration: stats.queryTimeMs,
          rows_scan: stats.rowsScanned,
          blocks_scan: stats.blocksScanned,
          rows_return: stats.rowsReturn,
          data,
        };

        resolve(result);
      });
    });
  };
}

export const nebulaClient = () => new NebulaClient();
