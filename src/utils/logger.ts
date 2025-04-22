// utils/logger.ts
import { createLogger, format, transports } from "winston";

// กำหนดรูปแบบของ log ให้มี timestamp, ระดับ log, และ message
const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level}]: ${message}`;
});

// สร้าง logger instance
export const logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    colorize({ level: true }), // ใส่สีให้ console log
    format.align(),
    logFormat
  ),
  transports: [
    // แสดงผลใน console
    new transports.Console(),
    // ถ้าต้องการเก็บไฟล์ log เพิ่มเติม
    new transports.File({ filename: "logs/error.log", level: "error" }),
    // new transports.File({ filename: "logs/combined.log" }),
  ],
});
