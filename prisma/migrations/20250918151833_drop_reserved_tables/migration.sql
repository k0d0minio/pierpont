/*
  Warnings:

  - You are about to drop the `ReservedTable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ReservedTable" DROP CONSTRAINT "ReservedTable_dayId_fkey";

-- DropTable
DROP TABLE "public"."ReservedTable";
