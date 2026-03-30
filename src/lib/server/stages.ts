import type { Stage, StageKey, TenantConfig } from '$lib/types/index.js';

interface SubmissionState {
  sales_price: number | null;
  estimator_approved: boolean | null;
  client_accepted: boolean | null;
  assigned_crew: string | null;
  scheduled_start_date: string | null;
}

const gateCheckers: Record<string, (state: SubmissionState) => boolean> = {
  sales_price: (s) => s.sales_price != null && s.sales_price > 0,
  estimator_approved: (s) => s.estimator_approved === true,
  client_accepted: (s) => s.client_accepted === true,
  assigned_crew: (s) => !!s.assigned_crew,
  scheduled_start_date: (s) => !!s.scheduled_start_date,
};

export function canAdvanceToStage(targetKey: StageKey, state: SubmissionState, stages: Stage[]): { allowed: boolean; missing: string[] } {
  const stage = stages.find((s) => s.key === targetKey);
  if (!stage) return { allowed: false, missing: ['unknown_stage'] };

  const missing: string[] = [];
  for (const field of stage.gate_fields) {
    const checker = gateCheckers[field];
    if (checker && !checker(state)) missing.push(field);
  }

  return { allowed: missing.length === 0, missing };
}

export function getStageIndex(key: string, stages: Stage[]): number {
  return stages.findIndex((s) => s.key === key);
}

export function getNextStage(currentKey: string, stages: Stage[]): Stage | undefined {
  const idx = stages.findIndex((s) => s.key === currentKey);
  return idx >= 0 && idx < stages.length - 1 ? stages[idx + 1] : undefined;
}

export function getVisibleStages(stages: Stage[]): Stage[] {
  return stages.filter((s) => s.portal_client_label != null);
}

export function getPortalLabel(stageKey: string, stages: Stage[]): string {
  const stage = stages.find((s) => s.key === stageKey);
  return stage?.portal_client_label || stageKey;
}
