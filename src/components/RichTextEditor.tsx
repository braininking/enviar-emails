import React, { useRef } from 'react';
import { Bold, Italic, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escreva sua mensagem aqui...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    const newValue = `${textBefore}${variable}${textAfter}`;
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 10);
  };

  const applyFormat = (syntax: string, wrap = true) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let replacement = '';
    if (wrap) {
      replacement = `${syntax}${selectedText || 'texto'}${syntax}`;
    } else {
      // line prefix like list item
      replacement = `\n- ${selectedText}`;
    }
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    const newValue = `${textBefore}${replacement}${textAfter}`;
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 10);
  };

  return (
    <div className="space-y-2">
      {/* Formatting & Variable Insertion Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-t-xl text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyFormat('**')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Negrito (**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('*')}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Itálico (*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('- ', false)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Lista com marcadores"
          >
            <List className="w-4 h-4" />
          </button>
          <span className="h-4 w-px bg-slate-800 mx-1" />
          <span className="text-[11px] text-slate-500 hidden sm:inline">Variáveis:</span>
          <button
            type="button"
            onClick={() => insertVariable('{{nome}}')}
            className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 font-mono transition-colors cursor-pointer"
          >
            {`{{nome}}`}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('{{empresa}}')}
            className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 font-mono transition-colors cursor-pointer"
          >
            {`{{empresa}}`}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('{{cargo}}')}
            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-mono transition-colors cursor-pointer"
          >
            {`{{cargo}}`}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('{{email}}')}
            className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 font-mono transition-colors cursor-pointer"
          >
            {`{{email}}`}
          </button>
        </div>
        <div className="text-[11px] text-slate-500">
          {value.length} caracteres
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-900 border border-t-0 border-slate-800 rounded-b-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed resize-y font-sans"
      />
    </div>
  );
};
