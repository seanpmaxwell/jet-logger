# Jet-Logger ✈️

> Super fast logging for Node.js and TypeScript with just one lightweight dependency.

[![npm version](https://img.shields.io/npm/v/jet-logger?logo=npm&label=npm)](https://www.npmjs.com/package/jet-logger)
[![npm downloads](https://img.shields.io/npm/dm/jet-logger?color=orange)](https://www.npmjs.com/package/jet-logger)
[![License](https://img.shields.io/npm/l/jet-logger)](https://github.com/seanpmaxwell/jet-logger/blob/master/LICENSE)
[![TypeScript definitions](https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white)](https://www.npmjs.com/package/jet-logger)

Jet-Logger is an easy-to-configure logger that can print to the console, write to disk, or forward events to your own transport. Configure it entirely through environment variables or in code, and get colorized output, timestamps, and JSON log formatting out-of-the-box.
<br/><br/>


## Features ✨

- TypeScript-first logging tool
- Console, file, custom, and silent modes with one-line configuration
- Color-coded output for `info`, `imp`, `warn`, and `err` levels
- Optional JSON formatting, timestamps, and automatic file names
- Strongly typed API with enums and helper types for custom transports
- Only a single dependency: <a href="https://www.npmjs.com/package/colors">colors</a>
<br/>


## Installation 📦

```bash
npm install jet-logger
# or
yarn add jet-logger
```
<br/>


## Quick Start ⚡

```typescript
import logger from 'jet-logger';

logger.info('hello jet-logger');
logger.imp('hello jet-logger');
logger.warn('hello jet-logger');
logger.err('hello jet-logger');
```

The above prints out:
```markdown
🟢 INFO      [2020-10-11T04:50:59.339Z] INFO: hello jet-logger
🟣 IMPORTANT [2020-10-11T04:50:59.341Z] IMPORTANT: hello jet-logger
🟡 WARNING   [2020-10-11T04:50:59.341Z] WARNING: hello jet-logger
🔴 ERROR     [2020-10-11T04:50:59.342Z] ERROR: hello jet-logger
```

> Quick Note: I used emojis to show the colors cause github strips out inline styling. 
<br/>


## Guide 📘

Each log method accepts an optional second parameter (`true`) to print full objects via Node's `util.inspect`, which is helpful when debugging nested data or stack traces.

The default export is a pre-configured `jetLogger` object. For custom behavior, you can import the function directly:

```typescript
import { jetLogger, JetLogger } from 'jet-logger';

const fileLogger = jetLogger({
  mode: JetLogger.Modes.FILE,
  filepath: './logs/app.log',
  filepathDatetimeParam: true,
  timestamp: true,
  format: JetLogger.Formats.JSON,
});
fileLogger.info('Writing to disk now!');
```

> `JetLogger` is a helper export that exposes the available modes and formats.
<br/>


## Configuration ⚙️

You can configure Jet-Logger through environment variables (recommended for deployments) or via constructor arguments. All options you omit fall back to sensible defaults.

### Environment Variables

> Note: case does not matter

| Environment variable         | Description                                                                 | Default              |
| ---------------------------- | --------------------------------------------------------------------------- | -------------------- |
| `JET_LOGGER_MODE`            | `'console'`, `fFile'`, `'custom'`, `off'`                                   | `console`            |
| `JET_LOGGER_FILEPATH`        | File path used when mode is `file`                                          | `jet-logger.log`     |
| `JET_LOGGER_FILEPATH_DATETIME` | Prefix the log file name with a timestamp (`true`/`false`)                | `true`               |
| `JET_LOGGER_TIMESTAMP`       | Show a timestamp next to each log line (`true`/`false`)                      | `true`               |
| `JET_LOGGER_FORMAT`          | `'line'` for plain text or `'json'` for structured logs                      | `line`               |

```typescript
// Apply settings before importing logger
process.env.JET_LOGGER_MODE = 'file';
process.env.JET_LOGGER_FILEPATH = './logs/server.log';

import logger from 'jet-logger';
logger.info('Logs will now be written to ./logs/server.log');
```

### Function options

| Option                    | Type                                   | Description                                                                 | Default            |
| ------------------------- | -------------------------------------- | --------------------------------------------------------------------------- | ------------------ |
| `mode`                    | `console`, `file`, `custom`, or `off`  | You can also access this values with `Jetlogger.Modes`                      | `console`          |
| `filepath`                | `string`                               | Destination file when using `File` mode                                     | `jet-logger.log`   |
| `filepathDatetimeParam`   | `boolean`                              | Prefix file name with a timestamp when writing to disk                      | `true`             |
| `timestamp`               | `boolean`                              | Include timestamps in each log entry                                        | `true`             |
| `format`                  | `line` or `json`                       | You can also access this values with `Jetlogger.Formats`                    | `line`             |
| `customLogger`            | `CustomLogger`                         | Callback used when `mode` is `Custom` (required for that mode)              | `() => ({})`       |
<br/>


## Custom Transports 🚚 

Integrate Jet-Logger with tools such as Elasticsearch, Splunk, Datadog, or any HTTP collector by providing your own transport callback:

```ts
import { jetLogger, JetLogger, CustomLogger } from 'jet-logger';

const forwardToSplunk: CustomLogger = (timestamp, level, content) => {
  splunkClient.emit({
    timestamp,
    level,
    content,
  });
};

const remoteLogger = jetLogger({
  mode: JetLogger.Modes.CUSTOM,
  timestamp: true,
  customLogger: forwardToSplunk,
);
remoteLogger.imp('Sent to Splunk');
```
