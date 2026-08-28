DROP TRIGGER IF EXISTS `content_posts_invalidate_approval`;--> statement-breakpoint
CREATE TRIGGER `content_posts_invalidate_approval`
AFTER UPDATE ON `content_posts`
FOR EACH ROW
BEGIN
  IF (
    NOT (OLD.sourceId <=> NEW.sourceId)
    OR NOT (OLD.strategicObjective <=> NEW.strategicObjective)
    OR NOT (OLD.contentPillar <=> NEW.contentPillar)
    OR NOT (OLD.campaign <=> NEW.campaign)
    OR NOT (OLD.funnelStage <=> NEW.funnelStage)
    OR NOT (OLD.templateKey <=> NEW.templateKey)
    OR NOT (OLD.title <=> NEW.title)
    OR NOT (OLD.hook <=> NEW.hook)
    OR NOT (OLD.caption <=> NEW.caption)
    OR NOT (OLD.cta <=> NEW.cta)
    OR NOT (OLD.hashtags <=> NEW.hashtags)
    OR NOT (OLD.altText <=> NEW.altText)
    OR NOT (OLD.keyStatement <=> NEW.keyStatement)
    OR NOT (OLD.legalSource <=> NEW.legalSource)
    OR NOT (OLD.mediaUrl <=> NEW.mediaUrl)
  ) THEN
    UPDATE `post_approval_bindings`
      SET `invalidatedAt` = CURRENT_TIMESTAMP,
          `invalidationReason` = 'Conteudo alterado; aprovacao invalidada automaticamente pelo banco.'
      WHERE `userId` = NEW.userId
        AND `postId` = NEW.id
        AND `invalidatedAt` IS NULL;
  END IF;
END;--> statement-breakpoint
DROP TRIGGER IF EXISTS `content_media_insert_invalidate_approval`;--> statement-breakpoint
CREATE TRIGGER `content_media_insert_invalidate_approval`
AFTER INSERT ON `content_media`
FOR EACH ROW
BEGIN
  UPDATE `post_approval_bindings`
    SET `invalidatedAt` = CURRENT_TIMESTAMP,
        `invalidationReason` = 'Midia adicionada; aprovacao invalidada automaticamente pelo banco.'
    WHERE `userId` = NEW.userId
      AND `postId` = NEW.postId
      AND `invalidatedAt` IS NULL;
END;--> statement-breakpoint
DROP TRIGGER IF EXISTS `content_media_delete_invalidate_approval`;--> statement-breakpoint
CREATE TRIGGER `content_media_delete_invalidate_approval`
AFTER DELETE ON `content_media`
FOR EACH ROW
BEGIN
  UPDATE `post_approval_bindings`
    SET `invalidatedAt` = CURRENT_TIMESTAMP,
        `invalidationReason` = 'Midia removida; aprovacao invalidada automaticamente pelo banco.'
    WHERE `userId` = OLD.userId
      AND `postId` = OLD.postId
      AND `invalidatedAt` IS NULL;
END;--> statement-breakpoint
DROP TRIGGER IF EXISTS `publication_jobs_require_active_approval`;--> statement-breakpoint
CREATE TRIGGER `publication_jobs_require_active_approval`
BEFORE INSERT ON `publication_jobs`
FOR EACH ROW
BEGIN
  DECLARE approval_count INT DEFAULT 0;
  SELECT COUNT(*) INTO approval_count
    FROM `post_approval_bindings`
    WHERE `userId` = NEW.userId
      AND `postId` = NEW.postId
      AND `invalidatedAt` IS NULL;
  IF approval_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Publicacao bloqueada: nao existe aprovacao ativa para o conteudo atual';
  END IF;
END;
