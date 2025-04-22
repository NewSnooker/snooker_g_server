export const errMsg = {
  InvalidId: {
    status: 400,
    message: "รหัสผู้ใช้ไม่ถูกต้อง",
  },
  InvalidUserData: {
    status: 400,
    message: "ข้อมูลผู้ใช้ไม่ถูกต้อง",
  },
  InvalidPassword: {
    status: 409,
    message: "รหัสผ่านไม่ถูกต้อง",
  },
  EmailExists: {
    status: 409,
    message: "มีอีเมลนี้ในระบบแล้ว",
  },
  UserNotFound: {
    status: 404,
    message: "ไม่พบผู้ใช้",
  },
  Unauthorized: {
    status: 401,
    message: "ไม่อนุญาต",
  },
  TokenInvalidated: {
    status: 401,
    message: "โทเค็น หมดอายุ",
  },
} as const;
