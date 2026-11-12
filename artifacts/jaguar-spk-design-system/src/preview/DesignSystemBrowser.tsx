import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { JaguarMark } from '../components/ui/jaguar-mark';
import {
  ALL_ENTRIES,
  DESIGN_SYSTEM,
  NAV_GROUPS,
  OVERVIEW_ENTRY,
  type NavGroup,
} from './registry';

function readHashId(): string {
  const id = new URLSearchParams(window.location.hash.slice(1)).get('page');
  if (!id) {
    return OVERVIEW_ENTRY.id;
  }
  return ALL_ENTRIES.some((entry) => entry.id === id)
    ? id
    : OVERVIEW_ENTRY.id;
}

function useSelectedId(): [string, (id: string) => void] {
  const [selected, setSelected] = useState(readHashId);

  useEffect(() => {
    const onHashChange = () => setSelected(readHashId());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const select = (id: string) => {
    setSelected(id);
    window.location.hash = new URLSearchParams({ page: id }).toString();
  };

  return [selected, select];
}

function NavigationItems({
  showOverview,
  groups,
  activeId,
  query,
  select,
}: {
  showOverview: boolean;
  groups: NavGroup[];
  activeId: string;
  query: string;
  select: (id: string) => void;
}) {
  return (
    <nav aria-label="Design system navigation" className="space-y-5 py-2">
      {showOverview ? (
        <button
          type="button"
          onClick={() => select(OVERVIEW_ENTRY.id)}
          aria-current={OVERVIEW_ENTRY.id === activeId}
          className="block w-full rounded-md px-2 py-2 text-left text-sm font-medium transition-colors hover:bg-muted aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
        >
          {OVERVIEW_ENTRY.name}
        </button>
      ) : null}

      {groups.map((group) => (
        <div key={group.name}>
          <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.name}
          </p>
          <div className="mt-2 space-y-1 border-l pl-2">
            {group.entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => select(entry.id)}
                aria-current={entry.id === activeId}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
              >
                {entry.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!showOverview && groups.length === 0 ? (
        <p className="px-2 py-4 text-sm text-muted-foreground">
          No sections match “{query}”.
        </p>
      ) : null}
    </nav>
  );
}

export function DesignSystemBrowser() {
  const [selectedId, select] = useSelectedId();
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(true);
  const mobileNav = useRef<HTMLDetailsElement>(null);
  const mobileNavSummary = useRef<HTMLElement>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        entries: group.name.toLowerCase().includes(normalizedQuery)
          ? group.entries
          : group.entries.filter((entry) =>
              `${entry.name} ${entry.description}`
                .toLowerCase()
                .includes(normalizedQuery),
            ),
      })).filter((group) => group.entries.length > 0),
    [normalizedQuery],
  );

  const active =
    ALL_ENTRIES.find((entry) => entry.id === selectedId) ?? OVERVIEW_ENTRY;
  const activeGroup = NAV_GROUPS.find((group) =>
    group.entries.some((entry) => entry.id === active.id),
  );
  const ActivePage = active.Page;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [active.id]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const showOverview = `${OVERVIEW_ENTRY.name} ${OVERVIEW_ENTRY.description}`
    .toLowerCase()
    .includes(normalizedQuery);
  const selectPage = (id: string) => {
    select(id);
    if (mobileNav.current?.open) {
      mobileNav.current.removeAttribute('open');
      mobileNavSummary.current?.focus();
    }
  };

  return (
    <div className="ds-app lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="ds-browser-sidebar lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="ds-browser-brand">
          <JaguarMark size={42} title="JAGUAR SPK" />
          <div><p>{DESIGN_SYSTEM.title}</p><span>Design system · Source extracted</span></div>
        </div>
        <div className="ds-browser-search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search design system"
            placeholder="ค้นหาในระบบดีไซน์"
          />
        </div>
        <div className="ds-browser-scroll hidden min-h-0 flex-1 px-4 pb-4 lg:block">
          <NavigationItems
            showOverview={showOverview}
            groups={filteredGroups}
            activeId={active.id}
            query={query}
            select={selectPage}
          />
        </div>
        <details ref={mobileNav} className="ds-browser-mobile-nav lg:hidden">
          <summary
            ref={mobileNavSummary}
            className="cursor-pointer text-sm font-medium"
          >
            เลือกหมวด: <span>{active.name}</span>
          </summary>
          <div className="mt-3 max-h-64 overflow-y-auto pb-2">
            <NavigationItems
              showOverview={showOverview}
              groups={filteredGroups}
              activeId={active.id}
              query={query}
              select={selectPage}
            />
          </div>
        </details>
      </aside>

      <main className="ds-browser-main min-w-0 px-5 py-7 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <header className="ds-browser-header">
            {active.id === OVERVIEW_ENTRY.id ? (
              <>
                <div><p className="ds-eyebrow">JAGUAR SPK · JAGUAR KRATOM HOUSE</p><h1>{DESIGN_SYSTEM.title}</h1><p>{DESIGN_SYSTEM.description}</p></div>
              </>
            ) : (
              <>
                <div><p className="ds-eyebrow">{activeGroup?.name}</p><h1>{active.name}</h1><p>{active.description}</p></div>
              </>
            )}
            <button type="button" className="ds-theme-toggle" onClick={() => setDark((value) => !value)} aria-label={dark ? "ใช้ธีมสว่าง" : "ใช้ธีมมืด"}>
              {dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
              <span>{dark ? "สว่าง" : "มืด"}</span>
            </button>
          </header>

          <div className="ds-browser-page">
            <Suspense
              fallback={
                <div role="status" className="ds-glass ds-loading">
                  กำลังเปิดตัวอย่าง…
                </div>
              }
            >
              <ActivePage />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
