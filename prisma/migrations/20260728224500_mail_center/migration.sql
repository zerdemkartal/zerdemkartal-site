-- Hermes Kurumsal Posta Merkezi
CREATE TABLE "MailThread" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "normalizedSubject" TEXT NOT NULL,
    "participantName" TEXT,
    "participantEmail" TEXT,
    "mailbox" TEXT NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'inbox',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MailThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "resendId" TEXT,
    "messageId" TEXT,
    "direction" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "to" JSONB NOT NULL,
    "cc" JSONB NOT NULL,
    "bcc" JSONB NOT NULL,
    "replyTo" JSONB NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT,
    "html" TEXT,
    "headers" JSONB NOT NULL,
    "attachments" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "sentBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MailMessage_resendId_key" ON "MailMessage"("resendId");
CREATE UNIQUE INDEX "MailMessage_messageId_key" ON "MailMessage"("messageId");
CREATE INDEX "MailThread_folder_lastMessageAt_idx" ON "MailThread"("folder", "lastMessageAt");
CREATE INDEX "MailThread_normalizedSubject_participantEmail_idx" ON "MailThread"("normalizedSubject", "participantEmail");
CREATE INDEX "MailMessage_threadId_createdAt_idx" ON "MailMessage"("threadId", "createdAt");
CREATE INDEX "MailMessage_direction_createdAt_idx" ON "MailMessage"("direction", "createdAt");

ALTER TABLE "MailMessage"
ADD CONSTRAINT "MailMessage_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "MailThread"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
