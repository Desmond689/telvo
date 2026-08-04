export function CommunityGuidelines() {
  const rules = [
    { title: 'Be honest', desc: 'Provide accurate information in your profile, quotes, and job descriptions.' },
    { title: 'Be respectful', desc: 'Treat every customer, professional, and business with respect. Harassment of any kind is not tolerated.' },
    { title: 'Keep it on TELVO', desc: 'Communicate and transact through TELVO so we can protect you if something goes wrong.' },
    { title: 'Deliver what you promise', desc: 'Professionals should complete work as quoted; customers should pay as agreed.' },
    { title: 'Report bad behavior', desc: "If someone violates these guidelines, report it — don't confront them directly." },
  ];
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-extrabold text-ink-900">Community Guidelines</h1>
      <p className="text-ink-500 mt-3">TELVO works because people trust each other. These guidelines keep it that way.</p>
      <div className="mt-8 space-y-6">
        {rules.map((r, i) => (
          <div key={r.title} className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</span>
            <div>
              <h3 className="font-semibold text-ink-900">{r.title}</h3>
              <p className="text-sm text-ink-500 mt-1">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
