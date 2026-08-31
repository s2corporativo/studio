CREATE TABLE IF NOT EXISTS `migration_reconciliations` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `migrationTag` VARCHAR(120) NOT NULL,
  `status` ENUM('applied', 'application_guard') NOT NULL,
  `description` TEXT NOT NULL,
  `recordedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `migration_reconciliations_id` PRIMARY KEY(`id`),
  CONSTRAINT `migration_reconciliations_tag_unique` UNIQUE(`migrationTag`)
);

INSERT INTO `migration_reconciliations` (`migrationTag`, `status`, `description`) VALUES
  ('0011_social_os_platform', 'applied', 'Estruturas principais do Social Media OS aplicadas e verificadas no TiDB.'),
  ('0012_social_profiles_reconcile', 'applied', 'Reconciliação de perfis sociais aplicada sem exclusão de dados.'),
  ('0013_growth_modules', 'applied', 'Módulos de crescimento aplicados e verificados no TiDB.'),
  ('0014_content_governance_triggers', 'application_guard', 'Triggers indisponíveis no TiDB; integridade de conteúdo e aprovação aplicada por guards transacionais testados.'),
  ('0015_approval_invalidation_guards', 'application_guard', 'Invalidação de aprovação após alteração de conteúdo aplicada por guards transacionais testados.'),
  ('0016_safe_autopilot', 'applied', 'Estruturas do Autopilot aplicadas com exigência de aprovação humana.'),
  ('0017_status_requires_bound_approval', 'application_guard', 'Mudança de status protegida por aprovação vinculada validada na aplicação.'),
  ('0018_campaign_idempotency_per_user', 'applied', 'Índice de idempotência por usuário aplicado após auditoria de duplicidades.')
ON DUPLICATE KEY UPDATE
  `status` = VALUES(`status`),
  `description` = VALUES(`description`);
