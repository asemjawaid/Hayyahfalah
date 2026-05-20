export default function PaymentsPage() {
  const amounts = [
    { value: 2, label: '$2/mo', desc: 'Cover server costs' },
    { value: 5, label: '$5/mo', desc: 'Support development' },
    { value: 10, label: '$10/mo', desc: 'Sponsor a family' },
    { value: 50, label: '$50 once', desc: 'Sponsor a year', oneTime: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0D1421', color: '#F4EDE4', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: 'serif', fontSize: '2rem', color: '#D4A574', marginBottom: 8 }}>
          حَيَّ عَلَى الْفَلَاح
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 400, marginBottom: 8 }}>
          Support Hayya Falah
        </h1>
        <p style={{ color: 'rgba(244,237,228,0.7)', marginBottom: 32, lineHeight: 1.6 }}>
          Hayya Falah is free for everyone, forever. If it has benefited you, consider a voluntary contribution to keep the lights on and the team building.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {amounts.map(a => (
            <button
              key={a.value}
              style={{
                background: '#1A2238',
                border: '1px solid #2D3654',
                borderRadius: 12,
                padding: '20px 16px',
                color: '#F4EDE4',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#D4A574' }}>{a.label}</div>
              <div style={{ fontSize: 13, color: 'rgba(244,237,228,0.6)', marginTop: 4 }}>{a.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ background: '#1A2238', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ color: 'rgba(244,237,228,0.7)', fontSize: 14, marginBottom: 8 }}>Custom amount</div>
          <input
            type="number"
            placeholder="$"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#0D1421',
              border: '1px solid #2D3654',
              borderRadius: 8,
              color: '#F4EDE4',
              fontSize: 16,
              outline: 'none',
            }}
          />
        </div>

        <button
          style={{
            width: '100%',
            padding: '16px',
            background: '#D4A574',
            color: '#0D1421',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          Continue to payment
        </button>

        <p style={{ color: 'rgba(244,237,228,0.4)', fontSize: 13 }}>
          No pressure. Hayya Falah is free for everyone, forever.
          <br />Contributions are not tax-deductible.
        </p>

        <div style={{ marginTop: 48, color: 'rgba(244,237,228,0.4)', fontSize: 13 }}>
          <div style={{ fontFamily: 'serif', fontSize: '1.2rem', color: '#D4A574', marginBottom: 8 }}>
            May Allah accept your sadaqah jariyah
          </div>
          آمين
        </div>
      </div>
    </div>
  );
}
