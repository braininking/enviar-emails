import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Check,
  Send,
  X,
} from 'lucide-react';
import { EmailTemplate } from '../types';
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '../services/templateService';

interface TemplatesPageProps {
  templates: EmailTemplate[];
  onTemplatesUpdated: (updatedList: EmailTemplate[]) => void;
  onUseTemplate: (template: EmailTemplate) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  templates,
  onTemplatesUpdated,
  onUseTemplate,
}) => {
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenNew = () => {
    setEditingTemplate({
      name: '',
      subject: '',
      message: `Olá, equipe de recrutamento da {{empresa}},\n\nEstou encaminhando meu currículo para avaliação para a oportunidade de {{cargo}}.\n\nFico à disposição para uma entrevista.\n\nAtenciosamente,\n{{nome}}`,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (tpl: EmailTemplate) => {
    setEditingTemplate({ ...tpl });
    setIsModalOpen(true);
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateTemplate(id);
    if (copy) {
      const all = getTemplates();
      onTemplatesUpdated(all);
    }
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    const updated = templates.filter((t) => t.id !== id);
    onTemplatesUpdated(updated);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.message) {
      return;
    }

    saveTemplate({
      id: editingTemplate.id,
      name: editingTemplate.name,
      subject: editingTemplate.subject,
      message: editingTemplate.message,
    });

    const refreshed = getTemplates();
    onTemplatesUpdated(refreshed);
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Modelos de Mensagem</h2>
          <p className="text-xs text-slate-400">
            Crie, personalize e reutilize templates prontos para diferentes áreas e vagas.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> + Novo modelo
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(tpl.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Duplicar modelo"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleEdit(tpl)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Editar modelo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Excluir modelo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  <strong>Assunto:</strong> {tpl.subject}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-sans line-clamp-5 whitespace-pre-wrap leading-relaxed">
                {tpl.message}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Criado em {new Date(tpl.createdAt).toLocaleDateString('pt-BR')}
              </span>
              <button
                onClick={() => onUseTemplate(tpl)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3 h-3" /> Usar modelo
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editingTemplate?.id ? 'Editar Modelo' : 'Novo Modelo de Mensagem'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome de identificação do modelo
                </label>
                <input
                  type="text"
                  required
                  value={editingTemplate?.name || ''}
                  onChange={(e) =>
                    setEditingTemplate((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Desenvolvedor Front-end Pleno"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Assunto padrão do e-mail
                </label>
                <input
                  type="text"
                  required
                  value={editingTemplate?.subject || ''}
                  onChange={(e) =>
                    setEditingTemplate((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  placeholder="Candidatura - {{cargo}} - {{empresa}}"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Mensagem do modelo
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Use {`{{nome}}`}, {`{{empresa}}`}, {`{{cargo}}`}
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={editingTemplate?.message || ''}
                  onChange={(e) =>
                    setEditingTemplate((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
