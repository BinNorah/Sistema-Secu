export function SchoolForm({ onSubmit, children, className = '' }) {
  return <form className={`school-form ${className}`} onSubmit={onSubmit}>{children}</form>;
}

export function FormField({ label, children, hint, className = '' }) {
  return (
    <label className={`school-field ${className}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function FormSelect({ value, onChange, options, placeholder, disabled = false, ...props }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
