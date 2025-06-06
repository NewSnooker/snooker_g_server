export const errMsg = {
  AdminCannotLogout: {
    status: 403,
    message: "ไม่สามารถ Logout Admin/SuperAdmin ได้",
  },
  AdminCannotDelete: {
    status: 403,
    message: "ไม่สามารถ ลบ Admin/SuperAdmin ได้",
  },
  AdminCannotRestore: {
    status: 403,
    message: "ไม่สามารถ กู้คืน Admin/SuperAdmin ได้",
  },
  InvalidId: {
    status: 400,
    message: "รหัสผู้ใช้ไม่ถูกต้อง",
  },
  InvalidUserData: {
    status: 400,
    message: "ข้อมูลผู้ใช้ไม่ถูกต้อง",
  },
  CannotDeleteSelf: {
    status: 400,
    message: "ไม่สามารถลบตัวเองได้",
  },
  UserNotDeleted: {
    status: 400,
    message: "ผู้ใช้ยังไม่ถูกลบ",
  },
  UserDeleted: {
    status: 400,
    message: "ผู้ใช้ถูกลบแล้ว",
  },
  TokenInvalidated: {
    status: 401,
    message: "โทเค็น หมดอายุ",
  },
  TempNotFound: {
    status: 404,
    message: "ไม่พบไฟล์ชั่วคราว",
  },
  Unauthorized: {
    status: 401,
    message: "ไม่อนุญาต",
  },
  Forbidden: {
    status: 403,
    message: "สิทธิ์ไม่ถูกต้อง",
  },
  UserNotFound: {
    status: 404,
    message: "ไม่พบผู้ใช้",
  },
  ImageIdNotFound: {
    status: 404,
    message: "ไม่พบไอดีของรูปภาพ",
  },
  InvalidPassword: {
    status: 409,
    message: "รหัสผ่านไม่ถูกต้อง",
  },
  EmailExists: {
    status: 409,
    message: "มีอีเมลนี้ในระบบแล้ว",
  },
  UsernameExists: {
    status: 409,
    message: "มีชื่อผู้ใช้นี้ในระบบแล้ว",
  },
  GoogleIdExists: {
    status: 409,
    message: "มีไอดี Google นี้ในระบบแล้ว",
  },
} as const;
