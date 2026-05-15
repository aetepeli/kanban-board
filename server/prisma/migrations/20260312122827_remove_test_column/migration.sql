/*
  Warnings:

  - You are about to drop the column `testUnique` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_testUnique_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "testUnique";
