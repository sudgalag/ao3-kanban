export function PageDots({ count }: { count: number }) {
  return (
    <div className="page-dots" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="page-dots__dot" />
      ))}
    </div>
  );
}
