export const errMsg = {
  InvalidId: {
    status: "error",
    message: "รหัสผู้ใช้ไม่ถูกต้อง",
  },
  InvalidUserData: {
    status: "error",
    message: "ข้อมูลผู้ใช้ไม่ถูกต้อง",
  },
  InvalidPassword: {
    status: "error",
    message: "รหัสผ่านไม่ถูกต้อง",
  },
  EmailExists: {
    status: "error",
    message: "มีอีเมลนี้ในระบบแล้ว",
  },
  UserNotFound: {
    status: "error",
    message: "ไม่พบผู้ใช้",
  },
  Unauthorized: {
    status: "error",
    message: "ไม่อนุญาต",
  },
  TokenInvalidated: {
    status: "error",
    message: "Token หมดอายุ",
  },
} as const;
