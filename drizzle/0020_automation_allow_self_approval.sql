-- Trava de dupla revisão configurável: quando desativada a autoaprovação,
-- quem produziu a versão não pode aprová-la (guard transacional em
-- server/socialOsGovernance.ts, padrão application_guard do baseline TiDB).
-- Migration aditiva e idempotente: nenhuma remoção ou alteração de dados.
ALTER TABLE `automation_settings` ADD COLUMN IF NOT EXISTS `allowSelfApproval` BOOLEAN NOT NULL DEFAULT true;
