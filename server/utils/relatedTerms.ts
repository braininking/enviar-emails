/**
 * Related terms dictionary and generator for job search expansion
 */

const RELATED_TERMS_MAP: Record<string, string[]> = {
  telemarketing: [
    'Operador de Telemarketing',
    'Telemarketing',
    'Call Center',
    'Atendente de Call Center',
    'Operador de Atendimento',
    'Teleatendimento',
    'SAC',
    'Agente de Atendimento',
    'Operadora de Telemarketing',
  ],
  'operador de telemarketing': [
    'Operador de Telemarketing',
    'Telemarketing',
    'Call Center',
    'Atendente de Call Center',
    'Operador de Atendimento',
    'Teleatendimento',
    'SAC',
    'Agente de Atendimento',
  ],
  'auxiliar administrativo': [
    'Auxiliar Administrativo',
    'Assistente Administrativo',
    'Administrativo',
    'Secretária',
    'Recepcionista',
    'Apoio Administrativo',
    'Faturamento',
    'Auxiliar de Escritório',
  ],
  'assistente administrativo': [
    'Assistente Administrativo',
    'Auxiliar Administrativo',
    'Administrativo',
    'Secretária',
    'Recepcionista',
    'Apoio Administrativo',
  ],
  'tecnico de informatica': [
    'Técnico de Informática',
    'Informática',
    'TI',
    'Suporte Técnico',
    'Suporte de TI',
    'Analista de Suporte',
    'Helpdesk',
    'Redes',
    'Manutenção de Computadores',
  ],
  'tecnico em informatica': [
    'Técnico em Informática',
    'Técnico de Informática',
    'TI',
    'Suporte Técnico',
    'Analista de Suporte',
    'Helpdesk',
  ],
  ti: [
    'TI',
    'Técnico de Informática',
    'Suporte Técnico',
    'Desenvolvedor',
    'Programador',
    'Analista de Sistemas',
    'Helpdesk',
  ],
  'tecnico de enfermagem': [
    'Técnico de Enfermagem',
    'Técnico em Enfermagem',
    'Enfermagem',
    'Enfermeiro',
    'Cuidador',
    'Auxiliar de Enfermagem',
    'Hospitalar',
  ],
  enfermagem: [
    'Enfermagem',
    'Técnico de Enfermagem',
    'Enfermeiro',
    'Cuidador',
    'Auxiliar de Enfermagem',
  ],
  vendedor: [
    'Vendedor',
    'Vendedora',
    'Vendedor Interno',
    'Vendedor Externo',
    'Consultor de Vendas',
    'Atendente Comercial',
    'Vendas',
    'Promotor de Vendas',
  ],
  vendas: [
    'Vendas',
    'Vendedor',
    'Vendedora',
    'Consultor de Vendas',
    'Promotor de Vendas',
    'Comercial',
  ],
  recepcionista: [
    'Recepcionista',
    'Recepção',
    'Atendente',
    'Secretária',
    'Telefonista',
    'Portaria',
  ],
  motorista: [
    'Motorista',
    'Condutor',
    'Entregador',
    'Motorista Categoria B',
    'Motorista Categoria D',
    'Manobrista',
  ],
  estoquista: [
    'Estoquista',
    'Almoxarife',
    'Repositor',
    'Auxiliar de Depósito',
    'Conferente',
    'Logística',
  ],
  caixa: [
    'Operador de Caixa',
    'Caixa',
    'Fiscal de Caixa',
    'Atendente de Caixa',
    'Frente de Loja',
  ],
  'operador de caixa': [
    'Operador de Caixa',
    'Caixa',
    'Fiscal de Caixa',
    'Atendente de Caixa',
  ],
  cozinha: [
    'Auxiliar de Cozinha',
    'Cozinheiro',
    'Ajudante de Cozinha',
    'Cozinheira',
  ],
  'servicos gerais': [
    'Serviços Gerais',
    'Auxiliar de Limpeza',
    'Zelador',
    'Auxiliar de Serviços Gerais',
    'Limpeza',
    'ASG',
  ],
  'recursos humanos': [
    'Recursos Humanos',
    'RH',
    'Departamento Pessoal',
    'Analista de RH',
    'Assistente de RH',
    'Recrutador',
  ],
  rh: [
    'RH',
    'Recursos Humanos',
    'Departamento Pessoal',
    'Analista de RH',
    'Assistente de DP',
  ],
  financeiro: [
    'Assistente Financeiro',
    'Auxiliar Financeiro',
    'Contas a Pagar',
    'Contas a Receber',
    'Tesouraria',
    'Financeiro',
  ],
};

function normalizeTermForLookup(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Returns a list of related search terms for a given query
 */
export function getRelatedTerms(query: string): string[] {
  const normalized = normalizeTermForLookup(query);
  const results = new Set<string>();

  // Include original term first
  results.add(query.trim());

  // Direct lookup
  if (RELATED_TERMS_MAP[normalized]) {
    for (const term of RELATED_TERMS_MAP[normalized]) {
      results.add(term);
    }
  }

  // Partial match search
  for (const [key, terms] of Object.entries(RELATED_TERMS_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      for (const term of terms) {
        results.add(term);
      }
    }
  }

  // Common Portuguese gender/role suffix variants if not found
  if (results.size <= 1) {
    if (normalized.endsWith('or')) {
      // e.g. consultor -> consultora
      results.add(`${query}a`);
    } else if (normalized.endsWith('ora')) {
      results.add(query.slice(0, -1));
    } else if (normalized.endsWith('eiro')) {
      results.add(query.replace(/eiro$/i, 'eira'));
    } else if (normalized.endsWith('eira')) {
      results.add(query.replace(/eira$/i, 'eiro'));
    }
  }

  return Array.from(results);
}
