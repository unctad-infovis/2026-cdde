import { useEffect, useId, useRef, useState } from 'react';
import CircleFlag from '@unctad-infovis/general-tools/components/CircleFlag.jsx';
import './CountrySearch.css';

export default function CountrySearch({ countries, value, onChange, placeholder = 'Select economy…' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const fieldId = useId();

  const list = countries || [];
  const selected = value ? list.find(c => c.iso3 === value) : null;
  const results = query.trim() ? list.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) : list;

  function handleFocus() {
    setQuery('');
    setOpen(true);
  }

  function handleChange(e) {
    setQuery(e.target.value);
    setOpen(true);
  }

  function handleSelect(c) {
    onChange(c.iso3);
    setQuery('');
    setOpen(false);
  }

  function handleClear(e) {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    setQuery('');
    setOpen(false);
  }

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="cs_wrap" ref={ref}>
      <label htmlFor={fieldId} className={`cs_field${open ? ' cs_field--open' : ''}${selected ? ' cs_field--filled' : ''}`}>
        <input id={fieldId} ref={inputRef} className="cs_input" type="text" placeholder={placeholder} value={open ? query : (selected?.name ?? '')} onChange={handleChange} onFocus={handleFocus} autoComplete="off" spellCheck={false} />
        {selected && (
          <button type="button" className="cs_clear" onMouseDown={handleClear} tabIndex={-1} aria-label="Clear selection">
            ×
          </button>
        )}
      </label>

      {open && results.length > 0 && (
        <ul className="cs_dropdown">
          {results.map(c => (
            <li key={c.iso3} className={`cs_item${c.iso3 === value ? ' cs_item--selected' : ''}`} onMouseDown={() => handleSelect(c)}>
              <CircleFlag countryCode={c.iso2} width={18} height={18} />
              <span className="cs_name">{c.name}</span>
              <span className="cs_region">{c.region}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
