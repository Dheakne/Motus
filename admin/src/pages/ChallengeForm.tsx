import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/Modal';
import { createChallenge, updateChallenge } from '../api/contentApi';
import type { Challenge, ChallengeInput } from '../api/contentApi';
import { changedFields, emptyToNull } from '../utils/diff';

// Categorias que o app já reconhece (ícone próprio na lista de exercícios)
const KNOWN_CATEGORIES = [
  'Meditação',
  'Respiração',
  'Movimento',
  'Alimentação',
  'Gratidão',
  'Reflexão',
  'Relacionamentos',
  'Concentração',
  'Foco',
  'Sono',
];

interface ChallengeFormProps {
  challenge?: Challenge;
  onClose: () => void;
}

export default function ChallengeForm({ challenge, onClose }: ChallengeFormProps) {
  const queryClient = useQueryClient();
  const editing = Boolean(challenge);

  const [title, setTitle] = useState(challenge?.title ?? '');
  const [category, setCategory] = useState(challenge?.category ?? '');
  const [duration, setDuration] = useState(challenge ? String(challenge.duration_minutes) : '');
  const [description, setDescription] = useState(challenge?.description ?? '');
  const [discoveries, setDiscoveries] = useState(challenge?.discoveries ?? '');
  const [tips, setTips] = useState(challenge?.tips ?? '');
  const [isFree, setIsFree] = useState(challenge?.is_free ?? true);
  // Novo exercício nasce inativo (mesmo padrão do banco) para revisar antes de publicar
  const [isActive, setIsActive] = useState(challenge?.is_active ?? false);
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const input: ChallengeInput = {
        title: title.trim(),
        category: category.trim(),
        duration_minutes: Number(duration),
        description: emptyToNull(description),
        discoveries: emptyToNull(discoveries),
        tips: emptyToNull(tips),
        is_free: isFree,
        is_active: isActive,
      };
      if (!challenge) return createChallenge(input);
      const changes = changedFields(challenge, input);
      return Object.keys(changes).length ? updateChallenge(challenge.id, changes) : Promise.resolve(challenge);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'challenges'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      onClose();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const minutes = Number(duration);
    if (!title.trim()) return setFormError('Informe o título.');
    if (!category.trim()) return setFormError('Informe a categoria.');
    if (!Number.isInteger(minutes) || minutes < 1) return setFormError('Tempo diário deve ser um número inteiro de minutos.');
    save.mutate();
  }

  const error = formError ?? (save.error as Error | null)?.message;

  return (
    <Modal title={editing ? 'Editar exercício semanal' : 'Novo exercício semanal'} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          Título
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </label>

        <div className="form-row">
          <label className="form-field">
            Categoria
            <input
              className="input"
              list="challenge-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={60}
              required
            />
            <datalist id="challenge-categories">
              {KNOWN_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="form-field">
            Tempo diário (minutos)
            <input
              className="input"
              type="number"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </label>
        </div>

        <label className="form-field">
          Descrição
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
        </label>
        <label className="form-field">
          Descobertas
          <textarea className="textarea" value={discoveries} onChange={(e) => setDiscoveries(e.target.value)} maxLength={5000} />
          <span className="form-help">Uma por linha.</span>
        </label>
        <label className="form-field">
          Dicas
          <textarea className="textarea" value={tips} onChange={(e) => setTips(e.target.value)} maxLength={5000} />
          <span className="form-help">Uma por linha.</span>
        </label>

        <label className="form-check">
          <input type="checkbox" checked={!isFree} onChange={(e) => setIsFree(!e.target.checked)} />
          Conteúdo premium
        </label>
        <label className="form-check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Ativo (aparece no app)
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
            {save.isPending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar exercício'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
