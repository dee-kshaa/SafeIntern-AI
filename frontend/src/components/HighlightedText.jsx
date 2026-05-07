export default function HighlightedText({ html, plainText }) {
  const content = html || plainText || '';

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-60 overflow-y-auto">
      <p
        className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
