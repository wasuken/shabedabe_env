import * as winston from 'winston';
import { config } from 'dotenv';
export type LogStage = 'production' | 'development';

config();

export default function makeLogger(dirname: string, filename: string, stage: LogStage) {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.json(), winston.format.timestamp()),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        dirname,
        filename,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
        tailable: true,
      }),
    ],
  });

  // 検証環境の場合、loggingをdebugレベルまで上げる
  // if (stage !== 'production') {
  //   // clear()をする事によって、createLoggerの際に指定したtransportsの設定を消せる
  //   logger.clear();
  //   logger.add(
  //     new winston.transports.Console({
  //       level: 'debug',
  //     }),
  //   );
  // }

  return logger;
}
