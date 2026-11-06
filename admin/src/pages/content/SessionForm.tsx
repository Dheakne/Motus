import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/Modal';
import {
  createSession,
  getSessionAudioUrl,
  readAudioMinutes,
  updateSession,
  uploadAudio,
} from '../../api/contentApi';
import type { AudioSession, SessionCategory, SessionInput } from '../../api/contentApi';
import { SESSION_CATEGORIES } from '../../utils/format';
import { changedFields, emptyToNull } from '../../utils/diff';

interface SessionFormProps {
  /** Sessão em edição; ausente = criar nova */
  session?: AudioSession;
  onClose: () => void;
  /** Chamado com a sessão salva (para a lista mostrar onde ela ficou) */
  onSaved?: (session: AudioSession, created: boolean) => void;
}

export default function SessionForm({ session, onClose, onSaved }: SessionFormProps) {
  const queryClient = useQueryClient();
  const editing = Boolean(session);

  const [title, setTitle] = useState(session?.title ?? '');
  const [description, setDescription] = useState(session?.description ?? '');
  const [fullDescription, setFullDescription] = useState(session?.full_description ?? '');
  const [category, setCategory] = useState<SessionCategory>(session?.category ?? 'meditacao');
  const [duration, setDuration] = useState(session ? String(session.duration) : '');
  const [isPremium, setIsPremium] = useState(session?.is_premium ?? false);
  const [isActive, setIsActive] = useState(session?.is_active ?? true);
  const [audioMode, setAudioMode] = useState<'upload' | 'url'>(editing ? 'url' : 'upload');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState(session?.audio_url ?? '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      let finalUrl = audioUrl.trim();
      if (audioMode === 'upload' && file) {
        setStep('Enviando áudio…');
        finalUrl = await uploadAudio(file);
      }
      setStep('Salvando…');

      const input: SessionInput = {
        title: title.trim(),
        description: description.trim(),
        full_description: emptyToNull(fullDescription),
        category,
        duration: Number(duration),
        audio_url: finalUrl,
        is_premium: isPremium,
        is_active: isActive,
      };

      if (!session) return createSession(input);
      const changes = changedFields(session, input);
      return Object.keys(changes).length ? updateSession(session.id, changes) : session;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      onSaved?.(saved, !session);
      onClose();
    },
    onSettled: () => setStep(null),
  });

  async function handleFile(selected: File | null) {
    setFile(selected);
    if (!selected) return;
    if (!title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    const minutes = await readAudioMinutes(selected);
    if (minutes) setDuration(String(minutes));
  }

  async function loadPreview() {
    if (!session) return;
    try {
      setPreviewUrl((await getSessionAudioUrl(session.id)).url);
    } catch (err) {
      setFormError((err as Error).message);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const minutes = Number(duration);
    if (!title.trim()) return setFormError('Informe o título.');
    if (!description.trim()) return setFormError('Informe a descrição curta.');
    if (!Number.isInteger(minutes) || minutes < 1) return setFormError('Duração deve ser um número inteiro de minutos.');
    if (audioMode === 'upload' && !file && !editing) return setFormError('Escolha o arquivo de áudio.');
    if (audioMode === 'url' && !audioUrl.trim()) return setFormError('Informe a URL do áudio.');
    save.mutate();
  }

  const busy = save.isPending;
  const error = formError ?? (save.error as Error | null)?.message;

  return (
    <Modal title={editing ? 'Editar sessão de áudio' : 'Nova sessão de áudio'} onClose={busy ? () => {} : onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="form-field">
          Título
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </label>

        <label className="form-field">
          Descrição curta
          <textarea
            className="textarea textarea-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            required
          />
          <span className="form-help">Uma frase sobre a sessão, como nas que já existem.</span>
        </label>

        <label className="form-field">
          Texto completo (opcional)
          <textarea
            className="textarea"
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            maxLength={10000}
          />
        </label>

        <div className="form-row">
          <label className="form-field">
            Categoria
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value as SessionCategory)}>
              {Object.entries(SESSION_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Duração (minutos)
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

        <fieldset className="form-field fieldset">
          <legend>Áudio</legend>
          <div className="tabs">
            <button
              type="button"
              className={`tab${audioMode === 'upload' ? ' is-active' : ''}`}
              onClick={() => setAudioMode('upload')}
            >
              {editing ? 'Trocar arquivo' : 'Enviar arquivo'}
            </button>
            <button
              type="button"
              className={`tab${audioMode === 'url' ? ' is-active' : ''}`}
              onClick={() => setAudioMode('url')}
            >
              {editing ? 'Manter / colar URL' : 'Colar URL'}
            </button>
          </div>

          {audioMode === 'upload' ? (
            <>
              <input
                className="input file-input"
                type="file"
                accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,.mp3,.m4a,.aac,.wav,.ogg"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <span className="form-help">mp3, m4a, aac, wav ou ogg, até 50 MB. A duração é preenchida sozinha.</span>
            </>
          ) : (
            <>
              <input
                className="input"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://…/arquivo.mp3"
              />
              {editing && (
                <div className="audio-preview">
                  {previewUrl ? (
                    <audio controls src={previewUrl} />
                  ) : (
                    <button type="button" className="btn-link" onClick={loadPreview}>
                      Ouvir áudio atual
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </fieldset>

        <label className="form-check">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
          Conteúdo premium
        </label>
        <label className="form-check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Ativa (aparece no app)
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            {step ?? (editing ? 'Salvar alterações' : 'Criar sessão')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
