export function CategoryChips({ categories, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            aria-pressed={isActive}
            className={[
              "rounded-pill border px-4 py-2 font-body text-small font-medium transition-colors duration-150",
              isActive
                ? "border-accent bg-accent text-green-950"
                : "border-border-subtle bg-surface-card text-text-secondary hover:border-accent hover:text-text-accent",
            ].join(" ")}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
