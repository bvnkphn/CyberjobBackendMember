/**
 * ตรวจว่า error จาก Prisma เป็นการชน unique constraint หรือไม่
 * เขียนแบบไม่พึ่ง instanceof เพื่อให้ทำงานได้แม้ Prisma client ถูก re-generate
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}
