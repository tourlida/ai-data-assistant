import { useEffect, useState } from 'react';
import { z } from 'zod';

const metricSchema = z.object({
  customers: z.number(),
  products: z.number(),
  orders: z.number(),
  order_items: z.number(),
  completed_orders: z.number(),
  completed_sales: z.number()
});

const summarySchema = metricSchema.extend({
  source: metricSchema,
  matchesSource: z.boolean()
});

type Summary = z.infer<typeof summarySchema>;
const chatResponseSchema = z.object({ answer: z.string(), status: z.enum(['answered', 'cannot_answer']), reason: z.string().optional(), metrics: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })) });
type ChatResponse = z.infer<typeof chatResponseSchema>;

const numberFormatter = new Intl.NumberFormat('en-US');
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

async function loadSummary(): Promise<Summary> {
  const response = await fetch('/api/verification/summary');
  if (!response.ok) throw new Error('The dashboard could not reach the data service.');
  return summarySchema.parse(await response.json());
}

async function askQuestion(question: string): Promise<ChatResponse> {
  const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }) });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error((payload as { error?: string }).error ?? 'The assistant could not answer.');
  return chatResponseSchema.parse(payload);
}

function MetricCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return (
    <article className="metric-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="metric-topline"><span className="metric-dot" />{label}</div>
      <strong>{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  );
}

export default function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary()
      .then(setSummary)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load dashboard data.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || isAsking) return;
    setIsAsking(true); setChatError(null);
    try { setChat(await askQuestion(question)); setQuestion(''); }
    catch (reason: unknown) { setChatError(reason instanceof Error ? reason.message : 'Unable to reach the assistant.'); }
    finally { setIsAsking(false); }
  }

  return (
    <main className="shell">
      <header className="header">
        <div>
          <p className="eyebrow">INTERNAL SALES ASSISTANT <span>•</span> LIVE DATABASE</p>
          <h1>Sales intelligence,<br /><em>at a glance.</em></h1>
          <p className="lede">A clean read on the PostgreSQL sales dataset and its source-file parity.</p>
        </div>
        <div className="status-pill"><span className="status-light" /> Data service online</div>
      </header>

      {isLoading && <section className="message">Loading database snapshot...</section>}
      {error && <section className="message error">{error}</section>}

      {summary && (
        <>
          <section className="metrics-grid" aria-label="Database metrics">
            <MetricCard label="Customers" value={numberFormatter.format(summary.customers)} detail="unique customer records" accent="#d46f4d" />
            <MetricCard label="Products" value={numberFormatter.format(summary.products)} detail="catalog entries" accent="#2f7c76" />
            <MetricCard label="Orders" value={numberFormatter.format(summary.orders)} detail={`${numberFormatter.format(summary.order_items)} line items`} accent="#d5a33c" />
            <MetricCard label="Completed sales" value={currencyFormatter.format(summary.completed_sales)} detail={`${numberFormatter.format(summary.completed_orders)} completed orders`} accent="#6b638f" />
          </section>

          <section className="lower-grid">
            <article className="panel parity-panel">
              <div className="panel-heading"><div><p className="eyebrow">DATA INTEGRITY</p><h2>Source parity</h2></div><span className={summary.matchesSource ? 'check-badge' : 'warning-badge'}>{summary.matchesSource ? '✓' : '!'}</span></div>
              <p className="panel-copy">The database snapshot is compared directly with the validated CSV source after import.</p>
              <div className="parity-result"><strong>{summary.matchesSource ? 'Everything matches.' : 'Review required.'}</strong><span>{summary.matchesSource ? 'Counts and completed-sales totals are aligned.' : 'The database differs from the source dataset.'}</span></div>
            </article>
            <article className="panel breakdown-panel">
              <div className="panel-heading"><div><p className="eyebrow">RECORD MIX</p><h2>Dataset composition</h2></div><span className="database-mark">DB</span></div>
              <div className="bar-row"><span>Orders</span><div className="bar-track"><div className="bar-fill orders" style={{ width: '100%' }} /></div><strong>{numberFormatter.format(summary.orders)}</strong></div>
              <div className="bar-row"><span>Customers</span><div className="bar-track"><div className="bar-fill customers" style={{ width: `${(summary.customers / summary.orders) * 100}%` }} /></div><strong>{numberFormatter.format(summary.customers)}</strong></div>
              <div className="bar-row"><span>Products</span><div className="bar-track"><div className="bar-fill products" style={{ width: `${(summary.products / summary.orders) * 100}%` }} /></div><strong>{numberFormatter.format(summary.products)}</strong></div>
            </article>
          </section>
          <section className="chat-panel">
            <div className="chat-intro"><p className="eyebrow">ASK THE DATA</p><h2>What would you like to know?</h2><p>Ask about anonymous sales totals, products, categories, trends, statuses, channels, payments, or countries.</p></div>
            <form className="chat-form" onSubmit={handleAsk}>
              <label htmlFor="question">Your question</label>
              <div className="chat-input-row"><input id="question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1000} placeholder="What were our completed sales by product?" /><button type="submit" disabled={isAsking || !question.trim()}>{isAsking ? 'Thinking...' : 'Ask assistant'}</button></div>
            </form>
            {chatError && <div className="chat-result chat-error">{chatError}</div>}
            {chat && <div className={`chat-result ${chat.status === 'cannot_answer' ? 'chat-warning' : ''}`}><div className="result-label">{chat.status === 'answered' ? 'ASSISTANT RESPONSE' : 'REQUEST NOT ANSWERED'}</div><strong>{chat.answer}</strong>{chat.metrics.length > 0 && <div className="chat-metrics">{chat.metrics.map((metric) => <span key={metric.label}><small>{metric.label}</small>{metric.value}</span>)}</div>}</div>}
          </section>
          <footer className="footer"><span>POSTGRESQL • VERIFIED IMPORT</span><span>Last snapshot: 26 SEP 2026</span></footer>
        </>
      )}
    </main>
  );
}
