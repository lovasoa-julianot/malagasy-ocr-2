import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface SearchableSelectProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  required?: boolean;
  emptyMessage?: string;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SearchableSelect({
  label,
  value,
  options,
  placeholder = "Rechercher...",
  disabled = false,
  onChange,
  required = false,
  emptyMessage = "Aucune donnée correspondante.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * Synchronise la recherche avec la valeur sélectionnée
   * depuis le composant parent.
   */
  useEffect(() => {
    setSearch(value);
  }, [value]);

  /*
   * Fermeture lorsque l'utilisateur clique en dehors.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);

        // Si aucune sélection n'a été faite,
        // on restaure la valeur actuelle.
        setSearch(value);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [value]);

  /*
   * Nettoyage des doublons + filtrage.
   */
  const filteredOptions = useMemo(() => {
    const normalizedSearch = normalize(search);

    return [...new Set(options)]
      .filter((option) => {
        if (!normalizedSearch) {
          return true;
        }

        return normalize(option).includes(normalizedSearch);
      })
      .slice(0, 10);
  }, [options, search]);

  /*
   * Sélection d'une option.
   */
  function handleSelect(option: string) {
    setSearch(option);
    setOpen(false);
    onChange(option);
  }

  /*
   * Ouverture du dropdown.
   */
  function handleFocus() {
    if (disabled) return;

    setOpen(true);
  }

  /*
   * Recherche locale uniquement.
   *
   * IMPORTANT :
   * on ne modifie PAS la valeur du formulaire ici.
   * La valeur du formulaire change uniquement lorsqu'une
   * option est réellement sélectionnée.
   */
  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
    setOpen(true);
  }

  /*
   * Effacement de la sélection.
   */
  function handleClear(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    setSearch("");
    onChange("");
    setOpen(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  const hasValue = Boolean(value);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* LABEL */}

      <label
        htmlFor={`searchable-${label}`}
        className="mb-1.5 block text-xs font-semibold text-slate-700"
      >
        {label}

        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      {/* INPUT */}

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400"
        />

        <input
          ref={inputRef}
          id={`searchable-${label}`}
          type="text"
          value={search}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={handleFocus}
          onChange={handleSearchChange}
          className={`
            h-11 w-full rounded-xl border
            bg-white
            pl-10
            ${hasValue ? "pr-20" : "pr-10"}
            text-sm text-slate-800
            placeholder:text-slate-400
            outline-none
            transition-all
            shadow-2xs

            ${
              disabled
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                : "border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            }
          `}
        />

        {/* ACTIONS À DROITE */}

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {hasValue && !disabled && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClear}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label={`Effacer ${label}`}
            >
              <X size={14} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (disabled) return;

              setOpen((previous) => !previous);

              requestAnimationFrame(() => {
                inputRef.current?.focus();
              });
            }}
            className={`rounded-lg p-1.5 transition ${
              disabled
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
            aria-label={open ? `Fermer ${label}` : `Ouvrir ${label}`}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* DROPDOWN */}

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          {/* HEADER */}

          <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sélectionner {label.toLowerCase()}
            </p>
          </div>

          {/* OPTIONS */}

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const selected = normalize(option) === normalize(value);

                return (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                    className={`
                      flex w-full items-center justify-between
                      gap-3 px-3.5 py-2.5
                      text-left text-sm
                      transition-colors

                      ${
                        selected
                          ? "bg-blue-50 text-blue-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span className="truncate">{option}</span>

                    {selected && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Search size={14} className="text-slate-400" />
                </div>

                <p className="text-xs font-medium text-slate-500">
                  {emptyMessage}
                </p>

                {search && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Aucun résultat pour « {search} »
                  </p>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}

          {filteredOptions.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2">
              <p className="text-[10px] text-slate-400">
                {filteredOptions.length} résultat
                {filteredOptions.length > 1 ? "s" : ""} affiché
                {filteredOptions.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
