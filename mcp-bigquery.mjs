#!/usr/bin/env node
/**
 * Lightweight BigQuery MCP Server
 * Project: big-button-383207
 *
 * Tools:
 *   bq_query        — run a SQL query (readonly)
 *   bq_datasets     — list datasets
 *   bq_tables       — list tables in a dataset
 *   bq_schema       — get schema for a table
 *   bq_preview      — preview first N rows of a table
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { BigQuery } from '@google-cloud/bigquery';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'big-button-383207';
const bq = new BigQuery({ projectId: PROJECT });

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'bq_query',
    description: 'Run a BigQuery SQL query and return results. Use standard SQL. Always add LIMIT to large tables.',
    inputSchema: {
      type: 'object',
      properties: {
        sql:        { type: 'string', description: 'The SQL query to execute' },
        maxResults: { type: 'number', description: 'Max rows to return (default 100)', default: 100 },
      },
      required: ['sql'],
    },
  },
  {
    name: 'bq_datasets',
    description: 'List all datasets in the project.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'bq_tables',
    description: 'List all tables in a dataset.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string', description: 'Dataset ID' },
      },
      required: ['dataset'],
    },
  },
  {
    name: 'bq_schema',
    description: 'Get the schema (field names + types) of a table.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string', description: 'Dataset ID' },
        table:   { type: 'string', description: 'Table ID' },
      },
      required: ['dataset', 'table'],
    },
  },
  {
    name: 'bq_preview',
    description: 'Preview the first N rows of a table without writing SQL.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: { type: 'string', description: 'Dataset ID' },
        table:   { type: 'string', description: 'Table ID' },
        limit:   { type: 'number', description: 'Number of rows (default 10)', default: 10 },
      },
      required: ['dataset', 'table'],
    },
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function ok(data) {
  return {
    content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  };
}

function err(msg) {
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

// ── Tool handlers ────────────────────────────────────────────────────────────

async function handleQuery({ sql, maxResults = 100 }) {
  const [rows] = await bq.query({ query: sql, maximumBytesBilled: '1000000000' });
  return ok(rows.slice(0, maxResults));
}

async function handleDatasets() {
  const [datasets] = await bq.getDatasets();
  return ok(datasets.map(d => d.id));
}

async function handleTables({ dataset }) {
  const [tables] = await bq.dataset(dataset).getTables();
  return ok(tables.map(t => t.id));
}

async function handleSchema({ dataset, table }) {
  const [meta] = await bq.dataset(dataset).table(table).getMetadata();
  const fields = meta.schema.fields.map(f => ({ name: f.name, type: f.type, mode: f.mode }));
  return ok(fields);
}

async function handlePreview({ dataset, table, limit = 10 }) {
  const sql = `SELECT * FROM \`${PROJECT}.${dataset}.${table}\` LIMIT ${Number(limit)}`;
  const [rows] = await bq.query({ query: sql });
  return ok(rows);
}

// ── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'bigquery', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'bq_query':   return await handleQuery(args);
      case 'bq_datasets': return await handleDatasets();
      case 'bq_tables':  return await handleTables(args);
      case 'bq_schema':  return await handleSchema(args);
      case 'bq_preview': return await handlePreview(args);
      default:           return err(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err(e.message);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
