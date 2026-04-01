-- CreateTable
CREATE TABLE "DrawElement" (
    "id" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "strokeColor" TEXT NOT NULL DEFAULT '#ffffff',
    "fillColor" TEXT NOT NULL DEFAULT 'transparent',
    "strokeWidth" INTEGER NOT NULL DEFAULT 2,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawElement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DrawElement" ADD CONSTRAINT "DrawElement_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
