import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Empty, Page, Stagger, Item } from '../components/ui';
import { fmtDate, fmtTime, scoreBadge } from '../lib/hooks';

export default function History() {
  const [list, setList] = useState(null);
  const toast = useToast();
  const load = () => api.get('/interviews').then((r) => setList(r.data.interviews)).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  const del = async (id) => {
    if (!confirm('Is interview ko delete karna hai?')) return;
    await api.delete('/interviews/' + id); toast('Deleted', 'success'); load();
  };
  return (
    <Page>
      <div className="section">
        <h1 className="page-title">Interview History</h1>
        <p className="muted mb">Purane interviews dekho aur progress track karo.</p>
        {!list ? <div className="skeleton h160" /> : !list.length ? <Empty icon="🗂️" title="Koi interview nahi mila" text="Pehla interview do, uska report yaha save hoga."><Link className="btn btn-primary" to="/app/interview/setup">Start Interview</Link></Empty> : (
          <Stagger className="list">
            {list.map((i) => (
              <Item key={i._id} className="card hist">
                <Link to={`/app/results/${i._id}`} className="hist-main">
                  <div className={`hist-score ${scoreBadge(i.score)}`}>{i.score}</div>
                  <div className="grow"><b>{i.company}</b> <span className="badge badge-purple">{i.type}</span><small>{fmtDate(i.createdAt)} • {fmtTime(i.duration)} • {i.grade}</small></div>
                  <div className="hist-mini hide-xs">
                    {i.breakdown?.answer != null && <span>📝 {i.breakdown.answer}</span>}
                    {i.breakdown?.voice != null && <span>🎙️ {i.breakdown.voice}</span>}
                    {i.breakdown?.face != null && <span>😊 {i.breakdown.face}</span>}
                  </div>
                </Link>
                <button className="icon-btn" onClick={() => del(i._id)} aria-label="Delete">🗑️</button>
              </Item>
            ))}
          </Stagger>
        )}
      </div>
    </Page>
  );
}
