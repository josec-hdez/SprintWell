import { useEffect, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import type { UpsertRule } from '@/features/rules/useRules';
import { cn } from '@/lib/utils';

const INPUT = cn(
  'h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);
const CATEGORIES = ['feature', 'bug', 'infra', 'sre', 'on_call', 'docs', 'research'];
const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

type RuleType = UpsertRule['type'];
type Field = 'skill_id' | 'category' | 'after_category' | 'weekday' | 'domain' | 'dates' | 'max_tasks' | 'rest_days' | 'min_tasks';

const RULE_TYPES: RuleType[] = [
  'PREFER_SKILL',
  'AVOID_SKILL',
  'LEARN_SKILL',
  'PREFER_CATEGORY',
  'AVOID_CATEGORY',
  'PREFER_DOMAIN',
  'PREFER_WEEKDAY',
  'AVOID_WEEKDAY',
  'BLACKOUT_DATE',
  'MAX_TASKS_PER_SPRINT',
  'COOLDOWN_AFTER',
  'FOCUS_PREFERENCE',
];

const FIELDS_BY_TYPE: Record<RuleType, Field[]> = {
  PREFER_SKILL: ['skill_id'],
  AVOID_SKILL: ['skill_id'],
  LEARN_SKILL: ['skill_id', 'min_tasks'],
  PREFER_CATEGORY: ['category'],
  AVOID_CATEGORY: ['category'],
  PREFER_DOMAIN: ['domain'],
  PREFER_WEEKDAY: ['weekday'],
  AVOID_WEEKDAY: ['weekday'],
  BLACKOUT_DATE: ['dates'],
  MAX_TASKS_PER_SPRINT: ['max_tasks'],
  COOLDOWN_AFTER: ['after_category', 'rest_days'],
  FOCUS_PREFERENCE: [],
};

/** Add-rule modal with per-type dynamic fields (issue #77). */
export function RuleModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (rule: UpsertRule) => void;
  onClose: () => void;
}): ReactElement {
  const [type, setType] = useState<RuleType>('PREFER_CATEGORY');
  const [weight, setWeight] = useState(20);
  const [isHard, setIsHard] = useState(false);
  const [values, setValues] = useState<Record<Field, string>>({
    skill_id: '',
    category: 'feature',
    after_category: 'feature',
    weekday: 'monday',
    domain: '',
    dates: '',
    max_tasks: '3',
    rest_days: '1',
    min_tasks: '2',
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function setField(field: Field, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function buildParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    for (const field of FIELDS_BY_TYPE[type]) {
      if (field === 'dates') {
        params.dates = values.dates === '' ? [] : [values.dates];
      } else if (field === 'max_tasks' || field === 'rest_days' || field === 'min_tasks') {
        params[field] = Number(values[field]);
      } else {
        params[field] = values[field];
      }
    }
    return params;
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit({ type, params: buildParams(), weight, isHard });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add rule"
        className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg"
      >
        <h2 className="mb-4 text-lg font-semibold">Add rule</h2>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            Type
            <select
              aria-label="Rule type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as RuleType);
              }}
              className={INPUT}
            >
              {RULE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          {FIELDS_BY_TYPE[type].map((field) => (
            <FieldInput
              key={field}
              field={field}
              value={values[field]}
              onChange={(value) => {
                setField(field, value);
              }}
            />
          ))}

          <label className="block text-sm">
            Weight: {weight}
            <input
              aria-label="Weight"
              type="range"
              min={0}
              max={100}
              value={weight}
              onChange={(e) => {
                setWeight(Number(e.target.value));
              }}
              className="w-full"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              aria-label="Hard rule"
              type="checkbox"
              checked={isHard}
              onChange={(e) => {
                setIsHard(e.target.checked);
              }}
            />
            Hard rule (must be satisfied)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save rule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const label = field.replace(/_/g, ' ');
  const common = { 'aria-label': label, className: INPUT, value, onChange: (e: { target: { value: string } }) => { onChange(e.target.value); } };

  if (field === 'category' || field === 'after_category') {
    return (
      <label className="block text-sm capitalize">
        {label}
        <select {...common}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (field === 'weekday') {
    return (
      <label className="block text-sm capitalize">
        {label}
        <select {...common}>
          {WEEKDAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const inputType = field === 'dates' ? 'date' : field === 'skill_id' || field === 'domain' ? 'text' : 'number';
  return (
    <label className="block text-sm capitalize">
      {label}
      <input type={inputType} {...common} />
    </label>
  );
}
