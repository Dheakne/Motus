import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getUser, updateUser } from '../api/usersApi';
import type { ChallengeProgressRow } from '../api/usersApi';
import { ErrorBox, Loading } from '../components/QueryState';
import { categoryLabel, formatDate, formatDateTime, formatNumber } from '../utils/format';

const WEEK = [
  ['monday', 'S'],
  ['tuesday', 'T'],
  ['wednesday', 'Q'],
  ['thursday', 'Q'],
  ['friday', 'S'],
  ['saturday', 'S'],
  ['sunday', 'D'],
] as const;

function WeekDots({ row }: { row: ChallengeProgressRow }) {
  return (
    <span className="week-dots" aria-label={`${row.days_completed} de 7 dias`}>
      {WEEK.map(([key, letter]) => (
        <span key={key} className={`week-dot${row[key] ? ' is-done' : ''}`}>
          {letter}
        </span>
      ))}
    </span>
  );
}

const yesNo = (v: boolean | null) => (v ? 'Sim' : 'Não');

export default function UserDetail() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();

  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id),
  });

  const premium = useMutation({
    mutationFn: (isPremium: boolean) => updateUser(id, { is_premium: isPremium }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  function togglePremium() {
    if (!data) return;
    const next = !data.profile.is_premium;
    const name = data.profile.display_name || data.profile.email;
    const ok = window.confirm(
      next ? `Ativar o plano premium para ${name}?` : `Remover o plano premium de ${name}?`
    );
    if (ok) premium.mutate(next);
  }

  return (
    <section>
      <Link to="/users" className="back-link">
        ← Usuários
      </Link>

      {isPending && <Loading />}
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}

      {data && (
        <>
          <header className="detail-header">
            <div>
              <h2 className="page-title">{data.profile.full_name || data.profile.display_name}</h2>
              <p className="muted">{data.profile.email ?? 'sem email'}</p>
            </div>
            <div className="detail-actions">
              {data.profile.is_premium ? (
                <span className="badge badge-premium">Premium</span>
              ) : (
                <span className="badge">Gratuito</span>
              )}
              <button className="btn btn-ghost" onClick={togglePremium} disabled={premium.isPending}>
                {premium.isPending ? 'Salvando…' : data.profile.is_premium ? 'Remover premium' : 'Ativar premium'}
              </button>
            </div>
          </header>

          {premium.error && <ErrorBox error={premium.error} />}

          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Nível</span>
              <span className="kpi-value">{formatNumber(data.profile.level)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Pontos</span>
              <span className="kpi-value">{formatNumber(data.profile.total_points)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Sessões concluídas</span>
              <span className="kpi-value">{formatNumber(data.stats.sessions_completed)}</span>
            </div>
          </div>

          <dl className="info-grid">
            <div>
              <dt>Nome no app</dt>
              <dd>{data.profile.display_name || '—'}</dd>
            </div>
            <div>
              <dt>Cadastro</dt>
              <dd>{formatDateTime(data.profile.created_at)}</dd>
            </div>
            <div>
              <dt>Último login</dt>
              <dd>{formatDateTime(data.profile.last_sign_in_at)}</dd>
            </div>
            <div>
              <dt>Viu o onboarding do Tutus</dt>
              <dd>{yesNo(data.profile.has_seen_tutus)}</dd>
            </div>
            <div>
              <dt>Aceitou os termos</dt>
              <dd>{yesNo(data.profile.consent_terms)}</dd>
            </div>
            <div>
              <dt>Consentiu dados de saúde</dt>
              <dd>
                {yesNo(data.profile.consent_health_data)}
                {data.profile.consented_at && ` (${formatDate(data.profile.consented_at)})`}
              </dd>
            </div>
          </dl>

          <h3 className="section-title">Últimas sessões de áudio</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sessão</th>
                  <th>Categoria</th>
                  <th>Concluída em</th>
                  <th>Pontos</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.session?.title ?? 'Sessão removida'}</td>
                    <td>{categoryLabel(s.session?.category)}</td>
                    <td>{s.completed ? formatDateTime(s.completed_at) : 'Não concluída'}</td>
                    <td>{formatNumber(s.points_earned)}</td>
                  </tr>
                ))}
                {data.recent_sessions.length === 0 && (
                  <tr>
                    <td className="table-empty" colSpan={4}>
                      Nenhuma sessão ouvida ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3 className="section-title">Exercícios semanais</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Exercício</th>
                  <th>Dias feitos</th>
                </tr>
              </thead>
              <tbody>
                {data.challenge_progress.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(`${row.week_start}T12:00:00Z`)}</td>
                    <td>{row.challenge?.title ?? 'Exercício removido'}</td>
                    <td>
                      <div className="week-cell">
                        <WeekDots row={row} />
                        <span className="muted">{row.days_completed}/7</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.challenge_progress.length === 0 && (
                  <tr>
                    <td className="table-empty" colSpan={3}>
                      Nenhum exercício semanal escolhido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
