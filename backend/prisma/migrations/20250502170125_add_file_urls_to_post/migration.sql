/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "fileUrl",
ADD COLUMN     "fileUrls" TEXT[];
