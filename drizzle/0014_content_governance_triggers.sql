DROP TRIGGER IF EXISTS `content_posts_approval_guard`;--> statement-breakpoint
CREATE TRIGGER `content_posts_approval_guard`
BEFORE UPDATE ON `content_posts`
FOR EACH ROW
BEGIN
  IF OLD.status IN ('approved','scheduled','published')
    AND NEW.status <> 'draft'
    AND (
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
    )
  THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Conteudo aprovado/agendado deve voltar a rascunho antes de alteracoes materiais';
  END IF;
END;--> statement-breakpoint
DROP TRIGGER IF EXISTS `content_media_insert_guard`;--> statement-breakpoint
CREATE TRIGGER `content_media_insert_guard`
BEFORE INSERT ON `content_media`
FOR EACH ROW
BEGIN
  DECLARE post_status VARCHAR(32);
  SELECT `status` INTO post_status FROM `content_posts` WHERE `id` = NEW.postId AND `userId` = NEW.userId LIMIT 1;
  IF post_status IN ('approved','scheduled','published') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Midias de conteudo aprovado/agendado sao imutaveis; retorne o conteudo a rascunho';
  END IF;
END;--> statement-breakpoint
DROP TRIGGER IF EXISTS `content_media_delete_guard`;--> statement-breakpoint
CREATE TRIGGER `content_media_delete_guard`
BEFORE DELETE ON `content_media`
FOR EACH ROW
BEGIN
  DECLARE post_status VARCHAR(32);
  SELECT `status` INTO post_status FROM `content_posts` WHERE `id` = OLD.postId AND `userId` = OLD.userId LIMIT 1;
  IF post_status IN ('approved','scheduled','published') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Midias de conteudo aprovado/agendado sao imutaveis; retorne o conteudo a rascunho';
  END IF;
END;
