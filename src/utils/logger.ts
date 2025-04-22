import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
// const logFormat = printf(({ level, message, timestamp }) => {
//   return `${timestamp} [${level}] ${message}`;
// });

// // สร้าง logger instance
// export const logger = createLogger({
//   level: process.env.NODE_ENV === "development" ? "debug" : "info",
//   format: combine(
//     timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
//     colorize({ level: true }), // ใส่สีให้ console log
//     // format.align(),
//     logFormat
//   ),
// กำหนดรูปแบบ log
const logFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}] ${message}`;
});

// ตั้งค่า logger
export const logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: format.combine(
    format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }), // รูปแบบวันที่และเวลา
    format.colorize({ all: true }), // ใส่สีให้ log
    logFormat
  ),
  transports: [
    new transports.Console(), // แสดง log ใน console
    new DailyRotateFile({
      filename: "logs/daily/%DATE%.log",
      datePattern: "DD-MM-YYYY",
      level: "error",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new transports.File({ filename: "logs/error.log", level: "error" }), // เก็บ log ระดับ error
  ],
});
