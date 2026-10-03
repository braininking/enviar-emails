import { EmailTemplate } from '../types';

const TEMPLATES_STORAGE_KEY = 'curriculo_mail_templates';

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_1',
    name: 'Técnico de Informática',
    subject: 'Candidatura - Técnico de Informática',
    message: `Olá, tudo bem?\n\nEstou encaminhando meu currículo para avaliação para oportunidades na área de Técnico de Informática.\n\nFico à disposição para uma entrevista.\n\nAtenciosamente,\nWandeson`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_2',
    name: 'Desenvolvedor / TI Personalizado',
    subject: 'Candidatura para {{cargo}} - {{empresa}}',
    message: `Olá, equipe de recrutamento da {{empresa}},\n\nGostaria de submeter meu currículo para a oportunidade de {{cargo}} ou posições afins na sua equipe de tecnologia.\n\nPossuo sólida experiência prática, facilidade de adaptação a novos desafios e muita vontade de gerar resultados reais para a {{empresa}}.\n\nEm anexo, envio meu currículo detalhado em PDF.\n\nAgradeço desde já pela atenção e coloco-me à inteira disposição para contato.\n\nAtenciosamente,\n{{nome}}`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_3',
    name: 'Apresentação Comercial & Administrativo',
    subject: 'Currículo - Oportunidades Administrativas / Comerciais',
    message: `Prezada equipe da {{empresa}},\n\nEspero que este e-mail os encontre bem.\n\nVenho por meio deste apresentar meu perfil profissional para oportunidades na área administrativa ou comercial.\n\nEstou anexando meu currículo atualizado para que possam avaliar minhas qualificações e histórico profissional.\n\nAgradeço pela consideração e aguardo a oportunidade de conversar em uma entrevista.\n\nAtenciosamente,`,
    createdAt: new Date().toISOString(),
  },
];

export function getTemplates(): EmailTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      try {
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
      } catch (err) {
        console.warn('Não foi possível salvar templates padrão no localStorage:', err);
      }
      return DEFAULT_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler modelos do localStorage:', e);
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt'> & { id?: string }): EmailTemplate {
  const templates = getTemplates();
  let updatedItem: EmailTemplate;

  if (template.id) {
    const index = templates.findIndex((t) => t.id === template.id);
    if (index !== -1) {
      updatedItem = {
        ...templates[index],
        name: template.name,
        subject: template.subject,
        message: template.message,
        updatedAt: new Date().toISOString(),
      };
      templates[index] = updatedItem;
    } else {
      updatedItem = {
        id: template.id,
        name: template.name,
        subject: template.subject,
        message: template.message,
        createdAt: new Date().toISOString(),
      };
      templates.unshift(updatedItem);
    }
  } else {
    updatedItem = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: template.name,
      subject: template.subject,
      message: template.message,
      createdAt: new Date().toISOString(),
    };
    templates.unshift(updatedItem);
  }

  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.warn('Aviso: Falha ao salvar template no localStorage:', err);
  }

  return updatedItem;
}

export function duplicateTemplate(id: string): EmailTemplate | null {
  const templates = getTemplates();
  const found = templates.find((t) => t.id === id);
  if (!found) return null;

  const copy: EmailTemplate = {
    ...found,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${found.name} (Cópia)`,
    createdAt: new Date().toISOString(),
  };

  templates.unshift(copy);
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.warn('Aviso: Falha ao duplicar template no localStorage:', err);
  }

  return copy;
}

export function deleteTemplate(id: string): boolean {
  try {
    const templates = getTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Aviso: Falha ao deletar template do localStorage:', err);
  }
  return true;
}
