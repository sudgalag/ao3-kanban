import { Button, Tag } from "../pcds";

interface Props {
  facets: string[];
  filter: string | null;
  onChange: (f: string | null) => void;
}

export function FilterRow({ facets, filter, onChange }: Props) {
  return (
    <div className="filters">
      <span className="filters__label">Filter</span>
      {facets.map((f) => (
        <Tag key={f} label={f} selected={filter === f} onClick={() => onChange(filter === f ? null : f)} />
      ))}
      {filter && <Button variant="ghost" size="sm" label="Clear" onClick={() => onChange(null)} />}
    </div>
  );
}
