import DOMPurify from 'dompurify';

export default function HighlightedText({ html, plainText }) {
  const raw = html || plainText || '';
  const safe = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: ['class'],
  });

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-60 overflow-y-auto">
      <p
        className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    </div>
  );
}
