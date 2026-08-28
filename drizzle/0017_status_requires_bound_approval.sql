DROP TRIGGER IF EXISTS `content_posts_status_requires_bound_approval`;--> statement-breakpoint
CREATE TRIGGER `content_posts_status_requires_bound_approval`
BEFORE UPDATE ON `content_posts`
FOR EACH ROW
BEGIN
  DECLARE active_approval_count INT DEFAULT 0;
  IF NEW.status IN ('approved','scheduled')
    AND NOT (OLD.status <=> NEW.status)
  THEN
    SELECT COUNT(*) INTO active_approval_count
      FROM `post_approval_bindings`
      WHERE `userId` = NEW.userId
        AND `postId` = NEW.id
        AND `invalidatedAt` IS NULL;
    IF active_approval_count = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status aprovado/agendado exige aprovacao vinculada a versao atual';
    END IF;
  END IF;
END;
