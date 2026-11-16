import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RequestReviewPanel, type RequestFilter } from '../../../src/components/features/dashboard/RequestReviewPanel';
import type { MaterialRequestWithUser, RequestStatus } from '../../../src/hooks/useMaterialRequests';
import '../../../src/index.css';

// In-memory props fixture. No auth, Supabase client, network mutations or live user records.
const initial = ['pending', 'reviewing', 'completed', 'rejected'].map((status, index) => ({
  id: `request-${index}`, topic: `Topic ${index}`, status,
  category: index === 0 ? 'AI Dasar' : null, user_display_name: index === 0 ? 'Test Learner' : null,
  created_at: '2026-11-16T00:00:00Z',
})) as MaterialRequestWithUser[];

function Fixture() {
  const [requests, setRequests] = useState(initial);
  const [filter, setFilter] = useState<RequestFilter>('all');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setGenerating] = useState(false);
  const [showCategory, setCategory] = useState(true);
  const [events, setEvents] = useState<unknown[]>([]);
  return <main className="p-6 max-w-6xl mx-auto">
    <h1>Request review fixture</h1>
    <div className="flex gap-4 my-4">
      <button onClick={() => setLoading(!loading)}>Toggle loading</button>
      <button onClick={() => setRequests([])}>Empty requests</button>
      <button onClick={() => setGenerating(!isGenerating)}>Toggle generating</button>
      <button onClick={() => setCategory(!showCategory)}>Switch role view</button>
    </div>
    <RequestReviewPanel requests={requests.filter(r => filter === 'all' || r.status === filter)}
      requestsLoading={loading} statusFilter={filter} onFilterChange={setFilter}
      onStatusChange={(id: string, status: RequestStatus) => {
        setEvents(previous => [...previous, { update: { id, status } }]);
        setRequests(previous => previous.map(r => r.id === id ? { ...r, status } : r));
      }} onGenerate={id => setEvents(previous => [...previous, { generate: id }])}
      isGenerating={isGenerating} showCategory={showCategory} />
    <output data-testid="events">{JSON.stringify(events)}</output>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
