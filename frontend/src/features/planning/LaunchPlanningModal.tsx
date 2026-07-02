import { useEffect, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import type { LaunchOptions } from '@/features/planning/useLaunchPlanning';
import { useLaunchPlanning } from '@/features/planning/useLaunchPlanning';
import { cn } from '@/lib/utils';

const INPUT = cn(
  'h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
);
const ALGORITHMS: LaunchOptions['algorithm'][] = ['CPSAT', 'RANDOM', 'GREEDY'];
const EQUITY_MODES: LaunchOptions['equityMode'][] = ['UTILITARIAN', 'MAX_MIN', 'NASH'];

/**
 * Launch-planning modal (issue #79): algorithm + equity selectors, a spinner
 * while the solver runs, and clear handling of a failed run or an INFEASIBLE
 * result. On a feasible run it redirects to the PlanningRun view.
 */
export function LaunchPlanningModal({
  sprintId,
  sprintName,
  onClose,
}: {
  sprintId: string;
  sprintName: string;
  onClose: () => void;
}): ReactElement {
  const navigate = useNavigate();
  const { launch } = useLaunchPlanning();
  const [algorithm, setAlgorithm] = useState<LaunchOptions['algorithm']>('CPSAT');
  const [equityMode, setEquityMode] = useState<LaunchOptions['equityMode']>('UTILITARIAN');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infeasible, setInfeasible] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isRunning) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, isRunning]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setInfeasible(false);
    setIsRunning(true);
    try {
      const run = await launch(sprintId, { algorithm, equityMode });
      if (run.status === 'INFEASIBLE') {
        setInfeasible(true);
        return;
      }
      navigate(`/planning-runs/${run.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not launch the planning run.');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plan sprint"
        className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg"
      >
        <h2 className="mb-4 text-lg font-semibold">Plan “{sprintName}”</h2>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
          className="space-y-3"
        >
          <label className="block text-sm">
            Algorithm
            <select
              aria-label="Algorithm"
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value as LaunchOptions['algorithm']);
              }}
              className={INPUT}
              disabled={isRunning}
            >
              {ALGORITHMS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Equity mode
            <select
              aria-label="Equity mode"
              value={equityMode}
              onChange={(e) => {
                setEquityMode(e.target.value as LaunchOptions['equityMode']);
              }}
              className={INPUT}
              disabled={isRunning}
            >
              {EQUITY_MODES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          {infeasible && (
            <p role="alert" className="text-sm text-destructive">
              No feasible plan exists for this sprint with the current tasks and rules.
            </p>
          )}
          {error !== null && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isRunning}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isRunning}>
              {isRunning ? 'Planning…' : 'Run planning'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
