var appRoot = require('app-root-path');
var winston = require('winston');

/**
 * Logger
 * @type {{console: {handleExceptions: boolean, colorize: boolean, level: string, json: boolean, timestamp: boolean}, file: {filename: string, handleExceptions: boolean, colorize: boolean, level: string, json: boolean, maxsize: number, maxFiles: number}}}
 */

// define the custom settings for each transport (file, console)
var options = {
    file: {
      level: 'info',
      filename: `${appRoot}/logs/app.log`,
      handleExceptions: true,
      json: false,
      maxsize: 52428800, // 50MB
      maxFiles: 5,
      colorize: false,
    },
    console: {
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: true,
    },
  };




  // instantiate a new Winston Logger with the settings defined above
  var logger = winston.createLogger({
  format: winston.format.simple(),
    transports: [
      new winston.transports.File(options.file),
      new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
  
  // create a stream object with a 'write' function that will be used by `morgan`
  logger.stream = {
    write: function(message, encoding) {
      // use the 'info' log level so the output will be picked up by both transports (file and console)
      logger.info(message);
    },
  };

  module.exports = logger;