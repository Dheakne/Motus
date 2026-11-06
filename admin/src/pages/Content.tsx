import { useSearchParams } from 'react-router-dom';
import SessionsTab from './content/SessionsTab';
import CategoriesTab from './content/CategoriesTab';

const TABS = [
  { value: 'sessions', label: 'Sessões de áudio' },
  { value: 'categories', label: 'Categorias' },
] as const;

export default function Content() {
  // A aba fica na URL (?tab=categories) para sobreviver a um recarregamento
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'categories' ? 'categories' : 'sessions';

  return (
    <section>
      <div className="toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>
          Conteúdo
        </h2>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={t.value === tab}
              className={`tab${t.value === tab ? ' is-active' : ''}`}
              onClick={() => setParams(t.value === 'sessions' ? {} : { tab: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sessions' ? <SessionsTab /> : <CategoriesTab />}
    </section>
  );
}
