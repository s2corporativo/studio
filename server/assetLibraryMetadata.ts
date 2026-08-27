export type AssetLibraryMetadata = {
  area: string;
  title: string;
  assetType: "single" | "carousel_slide";
  groupKey: string | null;
  slideOrder: number | null;
  tags: string;
};

const singleAssets: Record<string, [string, string, string]> = {
  "post_01_consumidor.png": ["Consumidor", "Compra online: direito de arrependimento", "consumidor, compra online, arrependimento"],
  "post_02_consumidor_defeito.png": ["Consumidor", "Produto com defeito: direitos do consumidor", "consumidor, produto, defeito"],
  "post_03_consumidor_cobranca.png": ["Consumidor", "Cobrança indevida: como agir", "consumidor, cobrança, prova"],
  "post_04_consumidor_negativacao.png": ["Consumidor", "Negativação indevida: documentos essenciais", "consumidor, negativação, crédito"],
  "post_05_trabalhista_vinculo.png": ["Trabalhista", "Vínculo de emprego: sinais relevantes", "trabalhista, vínculo, trabalho"],
  "post_06_trabalhista_horas_extras.png": ["Trabalhista", "Horas extras: o que conferir", "trabalhista, jornada, horas extras"],
  "post_07_trabalhista_rescisao.png": ["Trabalhista", "Rescisão: conferência de documentos", "trabalhista, rescisão, documentos"],
  "post_08_trabalhista_assedio.png": ["Trabalhista", "Assédio no trabalho: preservação de provas", "trabalhista, assédio, provas"],
  "post_09_trabalhista_empresarial_desligamento.png": ["Trabalhista Empresarial", "Desligamento: procedimento e prevenção de risco", "trabalhista empresarial, desligamento, empresas"],
  "post_10_trabalhista_nr1.png": ["Trabalhista Empresarial", "NR-1: gestão preventiva", "trabalhista empresarial, nr-1, prevenção"],
  "post_11_trabalhista_jornada.png": ["Trabalhista Empresarial", "Jornada: controle e passivo trabalhista", "trabalhista empresarial, jornada, controle"],
  "post_12_consumidor_empresarial_oferta.png": ["Empresarial", "Oferta ao consumidor: cuidado na comunicação", "empresarial, consumidor, oferta"],
  "post_13_tributario_nfse.png": ["Tributário", "NFS-e: atenção à emissão", "tributário, nfse, empresa"],
  "post_14_tributario_regime.png": ["Tributário", "Regime tributário: revisão estratégica", "tributário, regime, empresa"],
  "post_15_tributario_reforma.png": ["Tributário", "Reforma tributária: pontos de atenção", "tributário, reforma tributária, empresa"],
  "post_16_ambiental_licenciamento.png": ["Ambiental", "Licenciamento ambiental: antes de operar", "ambiental, licenciamento, empresa"],
  "post_17_ambiental_condicionante.png": ["Ambiental", "Condicionantes ambientais: gestão contínua", "ambiental, condicionantes, conformidade"],
  "post_18_ambiental_responsabilidade.png": ["Ambiental", "Responsabilidade ambiental: prevenção", "ambiental, responsabilidade, prevenção"],
  "post_19_penal_investigacao.png": ["Penal", "Investigação: preservação de direitos", "penal, investigação, direitos"],
  "post_20_penal_intimacao.png": ["Penal", "Intimação: orientação inicial", "penal, intimação, defesa"],
  "post_21_pix_fraude.png": ["Consumidor", "Fraude no Pix: primeiras providências", "consumidor, pix, fraude"],
  "post_22_pensao_alimenticia.png": ["Família e Sucessões", "Pensão alimentícia: orientação inicial", "família, pensão alimentícia, alimentos"],
  "post_23_consignado_nao_contratado.png": ["Consumidor", "Consignado não contratado: o que documentar", "consumidor, consignado, fraude"],
  "post_24_contrato_empresarial.png": ["Empresarial", "Contrato empresarial: cláusulas essenciais", "empresarial, contrato, prevenção"],
  "post_25_dados_vazamento.png": ["LGPD", "Vazamento de dados: resposta responsável", "lgpd, dados pessoais, incidente"],
  "post_26_inventario.png": ["Família e Sucessões", "Inventário: organização documental", "família, inventário, sucessões"],
  "post_27_inss_documentos.png": ["Previdenciário", "INSS: documentos que apoiam o requerimento", "previdenciário, inss, documentos"],
  "post_28_acidente_trabalho.png": ["Trabalhista", "Acidente de trabalho: documentos e registros", "trabalhista, acidente de trabalho, provas"],
  "post_29_crime_cibernetico.png": ["Penal", "Crime cibernético: preservação de evidências", "penal, crime cibernético, evidência"],
  "post_30_ambiental_auto_infracao.png": ["Ambiental", "Auto de infração ambiental: resposta técnica", "ambiental, auto de infração, defesa"],
};

const carouselAssets: Record<string, [string, string, string]> = {
  carrossel_01_consumidor: ["Consumidor", "Compra online: direito de arrependimento", "consumidor, compra online, arrependimento, carrossel"],
  carrossel_02_trabalhista: ["Trabalhista", "Rescisão: conferência de documentos", "trabalhista, rescisão, documentos, carrossel"],
  carrossel_03_tributario: ["Tributário", "Reforma tributária: revisão operacional", "tributário, reforma tributária, empresa, carrossel"],
  carrossel_04_ambiental: ["Ambiental", "Licenciamento ambiental: etapas de controle", "ambiental, licenciamento, conformidade, carrossel"],
  carrossel_05_penal: ["Penal", "Documentos e investigação: integridade da prova", "penal, investigação, prova, carrossel"],
  carrossel_06_justa_causa: ["Trabalhista Empresarial", "Justa causa: procedimento e prova", "trabalhista empresarial, justa causa, prova, carrossel"],
  carrossel_07_jornada: ["Trabalhista Empresarial", "Jornada: controles que previnem passivo", "trabalhista empresarial, jornada, banco de horas, carrossel"],
  carrossel_08_terceirizacao: ["Trabalhista Empresarial", "Terceirização: fiscalização contratual", "trabalhista empresarial, terceirização, fiscalização, carrossel"],
  carrossel_09_assedio: ["Compliance", "Assédio: política, canal e apuração", "compliance, assédio, canal, carrossel"],
  carrossel_10_fiscalizacao: ["Trabalhista Empresarial", "Fiscalização trabalhista: resposta organizada", "trabalhista empresarial, fiscalização, documentos, carrossel"],
  carrossel_11_lgpd_rh: ["LGPD", "LGPD no RH: controles de dados pessoais", "lgpd, rh, dados pessoais, carrossel"],
  carrossel_12_incidente_lgpd: ["LGPD", "Incidente de dados: contenção e registro", "lgpd, incidente, segurança, carrossel"],
  carrossel_13_compliance_trabalhista: ["Compliance", "Compliance trabalhista: estrutura mínima", "compliance, trabalhista, indicadores, carrossel"],
};

export function metadataForExistingAsset(sourcePath: string): AssetLibraryMetadata {
  const normalized = sourcePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const fileName = parts.at(-1) ?? "";
  const carouselGroup = parts.find((part) => part.startsWith("carrossel_"));
  if (carouselGroup) {
    const item = carouselAssets[carouselGroup];
    const order = Number.parseInt(fileName.slice(0, 2), 10);
    if (!item || !Number.isInteger(order)) throw new Error(`Arte de carrossel sem metadados: ${sourcePath}`);
    return { area: item[0], title: item[1], assetType: "carousel_slide", groupKey: carouselGroup, slideOrder: order, tags: item[2] };
  }
  const item = singleAssets[fileName];
  if (!item) throw new Error(`Arte individual sem metadados: ${sourcePath}`);
  return { area: item[0], title: item[1], assetType: "single", groupKey: null, slideOrder: null, tags: item[2] };
}
