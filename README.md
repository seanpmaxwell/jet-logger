# Jet-Logger ✈️

> Super fast, zero-dependency logging for Node.js and TypeScript projects.

[![npm version](https://img.shields.io/npm/v/jet-logger?logo=npm&label=npm)](https://www.npmjs.com/package/jet-logger)
[![npm downloads](https://img.shields.io/npm/dm/jet-logger?color=orange)](https://www.npmjs.com/package/jet-logger)
[![License](https://img.shields.io/npm/l/jet-logger)](https://github.com/seanpmaxwell/jet-logger/blob/master/LICENSE)
[![TypeScript definitions](https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white)](https://www.npmjs.com/package/jet-logger)

Jet-Logger is an easy-to-configure logger that can print to the console, write to disk, or forward events to your own transport. Configure it entirely through environment variables or in code, and get colorized output, timestamps, and JSON log formatting out-of-the-box.

## Features

- Zero-dependency logger written in TypeScript
- Console, file, custom, and silent modes with one-line configuration
- Color-coded output for `info`, `imp`, `warn`, and `err` levels
- Optional JSON formatting, timestamps, and automatic file names
- Strongly typed API with enums and helper types for custom transports

## Installation

```bash
npm install jet-logger
# or
yarn add jet-logger
```

## Quick Start

```typescript
import logger from 'jet-logger';

logger.info('Server started');
logger.imp('Ready for requests');
logger.warn('Cache miss');
logger.err(new Error('Unexpected error'));
```

The default export is a pre-configured `JetLogger` instance. For custom behavior you can import the class directly:

```typescript
import { JetLogger, LoggerModes } from 'jet-logger';

const fileLogger = new JetLogger(LoggerModes.FILE, './logs/app.log', true, true);
fileLogger.info('Writing to disk now!');
```

## Configuration

You can configure Jet-Logger through environment variables (recommended for deployments) or via constructor arguments. All options are optional—unset values fall back to sensible defaults.

| Environment variable         | Description                                                                 | Default              |
| ---------------------------- | --------------------------------------------------------------------------- | -------------------- |
| `JET_LOGGER_MODE`            | `'CONSOLE'`, `'FILE'`, `'CUSTOM'`, `'OFF'`                                   | `CONSOLE`            |
| `JET_LOGGER_FILEPATH`        | File path used when mode is `FILE`                                          | `~/jet-logger.log`   |
| `JET_LOGGER_FILEPATH_DATETIME` | Prefix the log file name with a timestamp (`TRUE`/`FALSE`)                | `TRUE`               |
| `JET_LOGGER_TIMESTAMP`       | Show a timestamp next to each log line (`TRUE`/`FALSE`)                      | `TRUE`               |
| `JET_LOGGER_FORMAT`          | `'LINE'` for plain text or `'JSON'` for structured logs                      | `LINE`               |

```typescript
// Apply settings before importing logger
process.env.JET_LOGGER_MODE = 'FILE';
process.env.JET_LOGGER_FILEPATH = './logs/server.log';

import logger from 'jet-logger';
logger.info('Logs will now be written to ./logs/server.log');
```

Each log method accepts an optional second parameter (`true`) to print full objects via Node's `util.inspect`, which is helpful when debugging nested data or stack traces.

## API Surface

- `info(content, fullPrint?)`
- `imp(content, fullPrint?)`
- `warn(content, fullPrint?)`
- `err(content, fullPrint?)`
- `LoggerModes` enum: `CONSOLE`, `FILE`, `CUSTOM`, `OFF`
- `TCustomLogFn`: `(timestamp: Date, level: string, content: unknown) => void`

## Custom Transports

Integrate Jet-Logger with tools such as ElasticSearch, Splunk, DataDog, or any HTTP collector by providing your own transport callback:

```typescript
import { JetLogger, LoggerModes, TCustomLogFn } from 'jet-logger';

const forwardToSplunk: TCustomLogFn = (timestamp, level, content) => {
  splunkClient.emit({
    timestamp,
    level,
    content,
  });
};

const remoteLogger = new JetLogger(LoggerModes.CUSTOM, '', true, true, undefined, forwardToSplunk);
remoteLogger.imp('Sent to Splunk');
```

## Sample Output

```
[2020-10-11T04:50:59.339Z] INFO: hello jet-logger
[2020-10-11T04:50:59.341Z] IMPORTANT: hello jet-logger
[2020-10-11T04:50:59.341Z] WARNING: hello jet-logger
[2020-10-11T04:50:59.342Z] ERROR: hello jet-logger
```

## Links

- [NPM package](https://www.npmjs.com/package/jet-logger)
- [Issue tracker](https://github.com/seanpmaxwell/jet-logger/issues)
- [License](https://github.com/seanpmaxwell/jet-logger/blob/master/LICENSE)
