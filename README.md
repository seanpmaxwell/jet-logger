# Jet-Logger

> A super quick, easy to setup logging tool for NodeJS/TypeScript.

<img
    border='0'
    alt='jet-loggerjs'
    src='https://github.com/seanpmaxwell/jet-logger/raw/master/jet-loggerjs.png'
/>


## What is it
Jet-Logger is an easy to configure logging that allows you change settings via the environment
variables (recommended) or manually in code. You can easily switch your logs to be printed out to the command line, a file, sent through your own custom logging logic, or turned off completely. Logs printed to the console also are printed out in different colors depending on whether they're info, a warning, an error, etc. The file for holding logs can be specified manually or left as the default. You can also have
logs formatted as lines for easy reading or as JSON objects.
<br/>

### Installation
```batch
$ npm install --save jet-logger
```

### Guide
The logger package's main export is the `Logger` class. Logger can used statically or as an instance 
with settings configured through a constructor.

- The three environment variables are:
    - `JET_LOGGER_MODE`: can be `'CONSOLE'`(default), `'FILE'`, `'CUSTOM'`, and `'OFF'`.
    - `JET_LOGGER_FORMAT`: can be `'LINE'`(default), `'JSON'`.
    - `JET_LOGGER_FILEPATH`: the file-path for file mode. Default is _home_dir/jet-logger.log_.
    - `JET_LOGGER_TIMESTAMP`: adds a timestamp next to each log. Can be `'TRUE'` (default) or `'FALSE'`.

_logger_ has an export `LoggerModes` which is an enum that provides all the modes if you want to
use them in code. I would recommend using `Console` for local development, `File` for remote development, 
and `Custom` or `Off` for production. If you want to change the settings in code, you can do so via 
the constructor or getters/setters.
<br>

- There are 4 functions on Logger to print logs. Each has a static counterpart:
    - `info` or `Info`: prints green.
    - `imp` or `Imp`: prints magenta. 
    - `warn` or `Warn`: prints yellow.
    - `err` or `Err`: prints red.

There is an optional second param to each method which is a `boolean`. If you pass `true` as the second 
param, Logger will use node's `util` so that the full object gets printed. You should NOT normally 
use this param, but it is especially useful when debugging errors so that you can print out the full 
error object and observe the stack trace.<br>

Let's look at some sample code in an express route:

````typescript
import { OK } from 'http-status-codes';
import { Router, Request, Response } from 'express';
import { Logger } from 'jet-logger';

const router = Router();


// Apply logger settings (Note you could also use a tool "dotenv" to set env variables)
const logFilePath = path.join(__dirname, '../sampleProject.log');
process.env.JET_LOGGER_MODE = LoggerModes.File; // Can also be Console, Custom, or Off
process.env.JET_LOGGER_FILEPATH = logFilePath;


router.get('api/users', async (req: Request, res: Reponse) => {
    Logger.Info(req.params.msg);
    Logger.Imp(req.params.msg);
    Logger.Warn(req.params.msg);
    Logger.Err(req.params.msg);
    Logger.Err(new Error('printing out an error'));
    Logger.Err(new Error('printing out an error full'), true); // <-- print the full Error object
    return res.status(OK).json({
        message: 'static_console_mode',
    });
});

router.get('api/users/alt', async (req: Request, res: Reponse) => {
    logger = new Logger();
    logger.info(req.params.msg);
    logger.imp(req.params.msg);
    logger.warn(req.params.msg);
    logger.err(req.params.msg);
    logger.err(new Error('printing out an error'));
    logger.err(new Error('printing out an error full'), true);  // <-- print the full Error object
    return res.status(OK).json({
        message: 'console_mode',
    });
});
````


- The previous code-snippet will  show the following content when printed to a file:
````
IMPORTANT: [2019-04-07T19:17:28.799Z]: jet-logger with standard express router started on port: 3000
INFO: [2019-04-07T19:18:08.939Z]: hello-logger
IMPORTANT: [2019-04-07T19:18:08.939Z]: hello-logger
WARNING: [2019-04-07T19:18:08.939Z]: hello-logger
ERROR: [2019-04-07T19:18:08.940Z]: hello-logger
ERROR: [2019-04-07T19:18:08.940Z]: Error: printing out an error
ERROR: [2019-04-07T19:18:08.956Z]: Error: printing out an error full
    at class_1.LoggerPracticeController.printLogsFile (/home/seanmaxwell/WebstormProjects/jet-logger/sample-project/src/controllers/LoggerPracticeController.ts:49:20)
    at class_1.descriptor.value [as printLogsFile] (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/lib/PropertyDecorators.ts:36:35)
    at callBack (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/lib/Server.ts:78:50)
    at Layer.handle [as handle_request] (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/layer.js:95:5)
    at next (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/layer.js:95:5)
    at /home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:281:22
    at param (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:354:14)
    at param (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:365:14)
    at Function.process_params (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:410:3)
    at next (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:275:10)
    at Function.handle (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:174:3)
    at router (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:47:12)
    at Layer.handle [as handle_request] (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/home/seanmaxwell/WebstormProjects/jet-logger/src/core/node_modules/express/lib/router/index.js:317:13)
````


### Using a custom logger 
For production you'll probably have some third party logging tool like ElasticSearch or Splunk. _logger_ exports one interface `ICustomLogger` which has one method `sendLog()` that needs to implemented. If you created a class which implements this interface, and add it to Logger through a setter or the constructor and set the mode to `CUSTOM`, Logger will call whatever logic you created for `sendLog()`.

````typescript
// CustomLoggerTool.ts
import { ICustomLogger } from 'jet-logger';

export class CustomLoggerTool implements ICustomLogger {

    private readonly thirdPartyLoggingApplication: ThirdPartyLoggingApplication;

    constructor() {
        this.thirdPartyLoggingApplication = new ThirdPartyLoggingApplication();
    }

    // Needs to be implemented
    public sendLog(content: any, prefix: string): void {
        // prefix is either: INFO | ERROR | WARNING | IMPORTANT
        this.thirdPartyLoggingApplication.doStuff(content);
    }
}
````

````typescript
// In the route file
import { OK } from 'http-status-codes';
import { Router, Request, Response } from 'express';
import { CustomLoggerTool } from 'CustomLoggerTool';

const customLoggerTool = new CustomLoggerTool();


router.get('api/users', async (req: Request, res: Reponse) => {
    const logger = new Logger(LoggerModes.CUSTOM, '', true, customLoggerTool);
    logger.rmTimestamp = true;
    logger.info(req.params.msg);
    return res.status(OK).json({
        message: 'console_mode',
    });
});
````
