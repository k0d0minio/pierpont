-- CreateTable
CREATE TABLE "Day" (
    "id" SERIAL NOT NULL,
    "dateISO" TIMESTAMP(3) NOT NULL,
    "weekday" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PDJGroup" (
    "id" SERIAL NOT NULL,
    "dayId" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "label" TEXT,
    "notes" TEXT,
    "isAmbiguous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PDJGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelGuestEntry" (
    "id" SERIAL NOT NULL,
    "dayId" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelGuestEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservedTable" (
    "id" SERIAL NOT NULL,
    "dayId" INTEGER NOT NULL,
    "name" TEXT,
    "size" INTEGER,
    "time" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservedTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GolfEntry" (
    "id" SERIAL NOT NULL,
    "dayId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "participantsCount" INTEGER,
    "time" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GolfEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEntry" (
    "id" SERIAL NOT NULL,
    "dayId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "capacity" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Day_dateISO_key" ON "Day"("dateISO");

-- CreateIndex
CREATE INDEX "PDJGroup_dayId_idx" ON "PDJGroup"("dayId");

-- CreateIndex
CREATE INDEX "HotelGuestEntry_dayId_idx" ON "HotelGuestEntry"("dayId");

-- CreateIndex
CREATE INDEX "ReservedTable_dayId_idx" ON "ReservedTable"("dayId");

-- CreateIndex
CREATE INDEX "GolfEntry_dayId_idx" ON "GolfEntry"("dayId");

-- CreateIndex
CREATE INDEX "EventEntry_dayId_idx" ON "EventEntry"("dayId");

-- AddForeignKey
ALTER TABLE "PDJGroup" ADD CONSTRAINT "PDJGroup_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelGuestEntry" ADD CONSTRAINT "HotelGuestEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservedTable" ADD CONSTRAINT "ReservedTable_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GolfEntry" ADD CONSTRAINT "GolfEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntry" ADD CONSTRAINT "EventEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
