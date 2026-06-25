import { useEffect, useState } from 'react';

export default function AdminSubscribersPage() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/subscribers').then((r) => r.json()).then((data) => setSubs(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 ml-64 p-8">
        <h1 className="font-serif text-3xl mb-6">Newsletter Subscribers</h1>
        <div className="grid grid-cols-1 gap-4">
          {subs.map((s) => (
            <div key={s._id} className="p-4 border rounded bg-white flex justify-between items-center">
              <div>
                <div className="font-medium">{s.email}</div>
                <div className="text-sm text-neutral-500">{new Date(s.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
