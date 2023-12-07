# nebula-js
Javascript library to interact with Nebula.
The library is written in Typescript and compiled to ES6, it can be found on npm as `nebula-js-lib`.

## nebula
Nebula is a high-performance on-demand OLAP engine that allows you to connect many different data sources and provide a query interface to run fast computing like data aggregation.
JSON is the main exchange data format between Nebula client and Nebula cluster. For more information, please see [Nebula](https://github.com/varchar-io/nebula).

A few most popular data sources that Nebula supports
- CSV/TSV data files (S3, GCS, etc.)
- Google Spreadsheet.
- SAAS services like Notion Database, Airtable, etc.
- SQL database like MySQL, Postgres, etc.
- Cloud data warehouse like Snowflake, Databricks, BigQuery etc.

Full services list can be found in [Columns](https://columns.ai).

## nebula-js
Nebula JS is the Javascript library to interact with Nebula cluster. It provides the following features:
1. Connect to Nebula cluster
2. API to ask Nebula to load data from data sources.
3. API to connect ask Nebula to run queries.

The service contract is based on the [Nebula Protocol](https://github.com/varchar-io/nebula/blob/master/src/service/protos/nebula.proto).
The local nebula.proto is an exact copy of this protocol file, it uses GRPC-js as the transport layer.

## nebula server
The library will connect to a nebula server located at address defined by env variable `NS_ADDR`. 
If the variable is not defined, it will connect to `localhost:9190` by default.

## build
On the repo root.
1. install protobuf compiler: `brew install protobuf`
2. build the library: `yarn build`

NOTE: till the day of writing, protoc is still not supporting ES6 import/export, so we use `@protobuf-ts/plugin` plugin for the time being.
NOTE-1: the default option is to convert long type to bigint which is safe. However, we use number instead for legacy reason. We will update this in future.

## publish
The nebula-js is published to npm. To publish a new version:
1. npm login
2. npm version patch
3. npm publish

## branches
- main: source code only for other projects to easily import the shared code through subtree or submodule.
- dev: includes package.json, tsconfig.json, vite.config.js etc. for development purpose.

Every change will be done in dev branch, and then only source code merged to main branch.