import type { SupabaseClient } from "@supabase/supabase-js";

type Json = Record<string, unknown>;

export async function createPipelineJob(
  supabase: SupabaseClient,
  workflow: string,
  metadata?: Json,
): Promise<string> {
  const { data, error } = await supabase
    .from("pipeline_jobs")
    .insert({
      workflow,
      status: "running",
      started_at: new Date().toISOString(),
      attempt_count: 1,
      metadata: metadata ?? {},
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`createPipelineJob failed: ${error?.message ?? "no row"}`);
  return String(data.id);
}

export async function finishPipelineJob(
  supabase: SupabaseClient,
  jobId: string,
  status: "success" | "failed" | "failed_permanent",
  errorMessage?: string,
  metadataPatch?: Json,
) {
  const patch: Json = {
    status,
    finished_at: new Date().toISOString(),
  };
  if (errorMessage) patch.error_message = errorMessage.slice(0, 8000);
  if (metadataPatch) patch.metadata = metadataPatch;
  const { error } = await supabase.from("pipeline_jobs").update(patch).eq("id", jobId);
  if (error) throw new Error(`finishPipelineJob failed: ${error.message}`);
}

export async function createPipelineStep(
  supabase: SupabaseClient,
  jobId: string,
  stepName: string,
  metadata?: Json,
): Promise<string> {
  const { data, error } = await supabase
    .from("pipeline_steps")
    .upsert(
      {
        job_id: jobId,
        step_name: stepName,
        status: "running",
        started_at: new Date().toISOString(),
        attempt_count: 1,
        metadata: metadata ?? {},
      },
      { onConflict: "job_id,step_name", ignoreDuplicates: false },
    )
    .select("id")
    .single();
  if (error || !data) throw new Error(`createPipelineStep failed: ${error?.message ?? "no row"}`);
  return String(data.id);
}

export async function finishPipelineStep(
  supabase: SupabaseClient,
  stepId: string,
  status: "success" | "failed" | "retrying" | "failed_permanent" | "skipped",
  startedAtMs: number,
  errorMessage?: string,
  metadataPatch?: Json,
) {
  const durationMs = Math.max(0, Date.now() - startedAtMs);
  const patch: Json = {
    status,
    finished_at: new Date().toISOString(),
    duration_ms: durationMs,
  };
  if (errorMessage) patch.error_message = errorMessage.slice(0, 8000);
  if (metadataPatch) patch.metadata = metadataPatch;
  const { error } = await supabase.from("pipeline_steps").update(patch).eq("id", stepId);
  if (error) throw new Error(`finishPipelineStep failed: ${error.message}`);
}

export async function recordStepAttempt(
  supabase: SupabaseClient,
  stepId: string,
  attemptNo: number,
  success: boolean,
  startedAtMs: number,
  errorMessage?: string,
  metadata?: Json,
) {
  const durationMs = Math.max(0, Date.now() - startedAtMs);
  const { error } = await supabase.from("step_attempts").upsert(
    {
      step_id: stepId,
      attempt_no: attemptNo,
      success,
      started_at: new Date(startedAtMs).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      error_message: errorMessage?.slice(0, 4000) ?? null,
      metadata: metadata ?? {},
    },
    { onConflict: "step_id,attempt_no", ignoreDuplicates: false },
  );
  if (error) throw new Error(`recordStepAttempt failed: ${error.message}`);
}
