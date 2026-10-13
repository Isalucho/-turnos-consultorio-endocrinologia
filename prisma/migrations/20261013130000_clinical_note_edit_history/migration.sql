-- AlterTable
ALTER TABLE "ClinicalNote" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ClinicalNoteRevision" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalNoteRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalNoteRevision_noteId_idx" ON "ClinicalNoteRevision"("noteId");

-- AddForeignKey
ALTER TABLE "ClinicalNoteRevision" ADD CONSTRAINT "ClinicalNoteRevision_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ClinicalNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
