const inputClass =
  "w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent";
const labelClass = "mb-1.5 block font-body text-small font-semibold text-text-primary";
const hintClass = "mb-1.5 mt-[-4px] block font-body text-small text-text-secondary";

export function Field({ field, value, onChange }) {
  const { name, label, hint, type, required, placeholder, options } = field;

  if (type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    function toggle(v) {
      onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
    }
    return (
      <div>
        <label className={labelClass}>{label}</label>
        {hint && <span className={hintClass}>{hint}</span>}
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                aria-pressed={isSelected}
                className={[
                  "rounded-pill border px-3 py-1.5 font-body text-small transition-colors duration-150",
                  isSelected
                    ? "border-accent bg-accent text-green-950"
                    : "border-border-subtle text-text-secondary hover:border-accent hover:text-text-accent",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "radio-group") {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        {hint && <span className={hintClass}>{hint}</span>}
        <div className="flex flex-wrap gap-4">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 font-body text-small text-text-primary">
              <input
                type="radio"
                name={name}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 accent-accent"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (type === "select") {
    return (
      <div>
        <label className={labelClass} htmlFor={name}>
          {label}
        </label>
        {hint && <span className={hintClass}>{hint}</span>}
        <select
          id={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClass}
        >
          <option value="">Select</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div>
        <label className={labelClass} htmlFor={name}>
          {label}
        </label>
        {hint && <span className={hintClass}>{hint}</span>}
        <textarea
          id={name}
          rows={3}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`${inputClass} resize-none`}
        />
      </div>
    );
  }

  // text | email | tel | url | date
  return (
    <div>
      <label className={labelClass} htmlFor={name}>
        {label} {required && <span className="text-mint-700">*</span>}
      </label>
      {hint && <span className={hintClass}>{hint}</span>}
      <input
        id={name}
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}
