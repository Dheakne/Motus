import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/Modal';
import { createCategory, updateCategory } from '../../api/contentApi';
import type { Category, CategoryInput } from '../../api/contentApi';
import { changedFields } from '../../utils/diff';

interface CategoryFormProps {
  category?: Category;
  nextOrder: number;
  onClose: () => void;
}

export default function CategoryForm({ category, nextOrder, onClose }: CategoryFormProps) {
  const queryClient = useQueryClient();
  const editing = Boolean(category);

  const [title, setTitle] = useState(category?.title ?? '');
  const [description, setDescription] = useState(category?.description ?? 'Áudio');
  const [emoji, setEmoji] = useState(category?.icon_emoji ?? '');
  const [color, setColor] = useState(category?.color ?? '#1066E7');
  const [order, setOrder] = useState(String(category?.order ?? nextOrder));
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const input: CategoryInput = {
        title: title.trim(),
        description: description.trim(),
        icon_emoji: emoji.trim(),
        color: color.trim(),
        order: Number(order),
      };
      if (!category) return createCategory(input);
      const changes = changedFields(category, input);
      return Object.keys(changes).length ? updateCategory(category.id, changes) : Promise.resolve(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'categories'] });
      onClose();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) return setFormError('Informe o título.');
    if (!description.trim()) return setFormError('Informe o rótulo do card.');
    if (!emoji.trim()) return setFormError('Informe o emoji do card.');
    if (!/^#[0-9A-Fa-f]{6}$/.test(color.trim())) return setFormError('Cor deve estar no formato #RRGGBB.');
    if (!Number.isInteger(Number(order)) || Number(order) < 0) return setFormError('Ordem deve ser um número inteiro.');
    save.mutate();
  }

  const titleChanged = editing && title.trim() !== category?.title;
  const error = formError ?? (save.error as Error | null)?.message;

  return (
    <Modal title={editing ? 'Editar categoria' : 'Nova categoria'} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <p className="warning-note">
          O app encontra as sessões de cada card da Home pelo <strong>nome da categoria</strong>. Renomear ou criar
          categorias novas exige ajuste no app (CategoryScreen) para as sessões aparecerem.
        </p>

        <label className="form-field">
          Título
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required />
          {titleChanged && <span className="form-help warn-text">Atenção: o nome mudou.</span>}
        </label>

        <label className="form-field">
          Rótulo do card
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={100} required />
          <span className="form-help">Texto pequeno do card na Home, como "Áudio" ou "Missões".</span>
        </label>

        <div className="form-row">
          <label className="form-field">
            Emoji do card
            <input className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={16} required />
          </label>
          <label className="form-field">
            Ordem na Home
            <input className="input" type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
          </label>
        </div>

        <label className="form-field">
          Cor
          <div className="color-field">
            <input type="color" value={color || '#1066E7'} onChange={(e) => setColor(e.target.value.toUpperCase())} aria-label="Escolher cor" />
            <input className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#RRGGBB" maxLength={7} />
          </div>
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={save.isPending}>
            {save.isPending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar categoria'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
