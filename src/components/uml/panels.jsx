/* global React */
const { useState: useStatePanels, useMemo: useMemoPanels } = React;

// ---------- Overview ----------
function Overview({ goTo }) {
  const { ACTORS, RFS, RNFS, USE_CASES, GROUPS } = window.UPA;
  return (
    <div>
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Visão Geral · Levantamento de Requisitos</div>
          <h2 className="section-title">Um sistema inteligente para a <em>UPA 24h</em>,<br/>desenhado em quatro vistas.</h2>
          <p className="section-lede">
            Modelagem UML de um sistema de agendamento que conecta paciente, recepção, triagem,
            consulta, exames e notificações em um único fluxo auditável. As quatro vistas a seguir
            descrevem o quem, o quê, o como e o quando do sistema.
          </p>
        </div>
        <div className="section-aside">
          <div>UML 2.5 · 4 diagramas</div>
          <div>35 RFs · 22 RNFs</div>
          <div>5 atores externos · 1 sistema</div>
        </div>
      </div>

      <div className="ov-stats">
        <div className="stat-card">
          <div className="k">Requisitos Funcionais</div>
          <div className="v">35<sup>RF</sup></div>
          <div className="v-sub">Distribuídos em 7 módulos do sistema</div>
        </div>
        <div className="stat-card">
          <div className="k">Requisitos Não-Funcionais</div>
          <div className="v">22<sup>RNF</sup></div>
          <div className="v-sub">Desempenho, segurança, LGPD, integração</div>
        </div>
        <div className="stat-card">
          <div className="k">Casos de Uso</div>
          <div className="v">19</div>
          <div className="v-sub">Mapeados a 6 atores do sistema</div>
        </div>
        <div className="stat-card">
          <div className="k">Classes do Domínio</div>
          <div className="v">11</div>
          <div className="v-sub">3 especializações via herança</div>
        </div>
      </div>

      <h3 className="section-h3"><span>Atores do sistema</span> <span className="right">06 perfis · clique para ver casos relacionados</span></h3>
      <div className="ov-actor-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {ACTORS.map(a => (
          <div className="actor-card" key={a.id} data-kind={a.kind} onClick={() => goTo('use-cases', { kind: 'actor', id: a.id })}>
            <div className="ico"><window.ActorGlyph size={22}/></div>
            <div style={{ flex: 1 }}>
              <div className="nm">{a.label}</div>
              <div className="sub">{a.kind} · {a.cases} casos de uso</div>
              <div className="desc">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="section-h3"><span>Módulos &amp; cobertura</span> <span className="right">07 módulos · RF01 → RF35</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Object.entries(GROUPS).map(([key, g]) => {
          const rfs = RFS.filter(r => r.group === key);
          const ucs = USE_CASES.filter(u => u.group === key);
          return (
            <div key={key} className="actor-card module-card" onClick={() => goTo('requirements', { group: key })}>
              <window.Chip group={key}/>
              <div className="mod-title">{g.label}</div>
              <div className="mod-meta">{ucs.length} casos · {rfs.length} RFs</div>
              <div className="mod-desc">{rfs.slice(0, 2).map(r => r.title).join(' · ')}{rfs.length > 2 ? '…' : ''}</div>
            </div>
          );
        })}
      </div>

      <h3 className="section-h3"><span>Como navegar</span> <span className="right">os quatro diagramas</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { num: '01', name: 'Casos de Uso',  goal: 'use-cases',    desc: 'Quem usa o sistema e que ações executa. Clique nos atores ou nas elipses para ver os RFs vinculados.' },
          { num: '02', name: 'Classes',       goal: 'classes',      desc: 'O modelo de domínio: classes, atributos, métodos, herança e associações com multiplicidade.' },
          { num: '03', name: 'Atividades',    goal: 'activities',   desc: 'O fluxo de atendimento, da chegada do paciente ao encerramento, com decisões e ramificações.' },
          { num: '04', name: 'Sequência',     goal: 'sequence',     desc: 'A interação ordenada entre paciente, profissional, sistema, BD e notificações.' },
        ].map(d => (
          <div key={d.num} className="actor-card module-card" onClick={() => goTo(d.goal)}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em', color: 'var(--teal-deep)' }}>{d.num}</div>
            <div className="mod-title" style={{ fontSize: 26, marginTop: 6 }}>{d.name}</div>
            <div className="mod-desc">{d.desc}</div>
            <div style={{ marginTop: 14, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.08em', color: 'var(--ink-mid)', textTransform: 'uppercase' }}>
              abrir diagrama →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Requirements ----------
function Requirements({ initialGroup }) {
  const { RFS, RNFS, GROUPS } = window.UPA;
  const [type, setType] = useStatePanels('RF');
  const [filter, setFilter] = useStatePanels(initialGroup || 'all');
  const [query, setQuery] = useStatePanels('');

  const data = type === 'RF' ? RFS : RNFS;
  const groupKey = type === 'RF' ? 'group' : 'cat';

  const filtered = useMemoPanels(() => {
    const q = query.trim().toLowerCase();
    return data.filter(r => {
      const matchesGroup = filter === 'all' || r[groupKey] === filter;
      const matchesQ = !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);
      return matchesGroup && matchesQ;
    });
  }, [data, filter, query, groupKey]);

  const groupCounts = useMemoPanels(() => {
    const c = {};
    data.forEach(r => { c[r[groupKey]] = (c[r[groupKey]] || 0) + 1; });
    return c;
  }, [data, groupKey]);

  const groupKeys = Object.keys(groupCounts).sort();

  return (
    <div>
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Requisitos · 35 RFs + 22 RNFs</div>
          <h2 className="section-title">Catálogo de <em>requisitos</em></h2>
          <p className="section-lede">
            Navegue, filtre e busque os 57 requisitos do sistema. Os requisitos funcionais (RF)
            descrevem comportamentos esperados; os não-funcionais (RNF) descrevem qualidades
            transversais como desempenho, segurança e conformidade.
          </p>
        </div>
        <div className="section-aside">
          <div><b>{filtered.length}</b> de {data.length}</div>
          <div>{type === 'RF' ? 'Requisitos Funcionais' : 'Requisitos Não-Funcionais'}</div>
        </div>
      </div>

      <div className="req-toolbar">
        <div className="toggle">
          <button className={type === 'RF' ? 'on' : ''} onClick={() => { setType('RF'); setFilter('all'); }}>RF · funcionais</button>
          <button className={type === 'RNF' ? 'on' : ''} onClick={() => { setType('RNF'); setFilter('all'); }}>RNF · não-funcionais</button>
        </div>
        <input className="search" placeholder="Buscar por código, título ou descrição…" value={query} onChange={e => setQuery(e.target.value)}/>
        <span className="req-count">{filtered.length} resultados</span>
      </div>

      <div className="req-layout">
        <aside className="req-side">
          <h4>{type === 'RF' ? 'Módulos' : 'Categorias'}</h4>
          <ul>
            <li className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
              <span>Todos</span><span className="cnt">{data.length}</span>
            </li>
            {groupKeys.map(g => (
              <li key={g} className={filter === g ? 'on' : ''} onClick={() => setFilter(g)}>
                <span>{type === 'RF' ? GROUPS[g]?.label || g : g}</span>
                <span className="cnt">{groupCounts[g]}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="req-list">
          {filtered.map(r => (
            <div className="req-item" key={r.id}>
              <div className="req-id">{r.id}</div>
              <div>
                <div className="req-title">{r.title}</div>
                <div className="req-desc">{r.desc}</div>
              </div>
              <div>
                {type === 'RF'
                  ? <window.Chip group={r.group}/>
                  : <span className="chip" style={{ borderColor: 'var(--rule)' }}>{r.cat}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Overview = Overview;
window.Requirements = Requirements;
