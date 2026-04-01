/*
  Warnings:

  - Added the required column `password` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "password" TEXT NOT NULL;
