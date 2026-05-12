import DOMPurify from 'dompurify';

export default function HighlightedText({ html, plainText }) {
  const raw = html || plainText || '';
  const safe = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: ['class'],
  });

  return (
    <div
      className="p-4 rounded-xl max-h-60 overflow-y-auto transition-theme"
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}
    >
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{ color: 'var(--text-secondary)' }}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    </div>
  );
}
