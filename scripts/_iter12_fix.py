# Iteration 12 critic fixes — applied then deleted.
def edit(path, reps):
    s = open(path, encoding='utf-8').read()
    for old, new, exp in reps:
        n = s.count(old)
        if n != exp: print(f"WARN {path}: {n}!={exp} for {old[:58]!r}")
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8', newline='\n').write(s)

# 1) Update endpoint: symmetric folder move (undo a mis-tapped Lost restores Drive too)
U = 'src/routes/api/submissions/[id]/update/+server.ts'
edit(U, [
 ("""  // If status changed to declined, move project folder from Active to Inactive
  if (body.estimate_status === 'declined') {""",
  """  // Folder moves mirror status: declined -> Inactive; leaving declined -> back
  // to Active (this is what makes Undo on a mis-tapped "Lost" complete).
  const leavingDeclined =
    prevStatus === 'declined' && body.estimate_status && body.estimate_status !== 'declined';
  if (body.estimate_status === 'declined' || leavingDeclined) {""", 1),
 ("""          await moveProjectToInactive(drive, sub.google_drive_project_folder_id, tenant.google_drive_active_folder_id, tenant.google_drive_inactive_folder_id);""",
  """          if (leavingDeclined) {
            // Same parent-swap, reversed direction
            await moveProjectToInactive(drive, sub.google_drive_project_folder_id, tenant.google_drive_inactive_folder_id, tenant.google_drive_active_folder_id);
          } else {
            await moveProjectToInactive(drive, sub.google_drive_project_folder_id, tenant.google_drive_active_folder_id, tenant.google_drive_inactive_folder_id);
          }""", 1),
])
# capture prevStatus before the db.update
s = open(U, encoding='utf-8').read()
anchor = "db.update(submissions).set(updates)"
idx = s.index(anchor)
insert = "  const prevStatus = db.select({ estimate_status: submissions.estimate_status }).from(submissions)\n    .where(eq(submissions.id, params.id)).get()?.estimate_status;\n\n  "
# insert just before the line containing the anchor
line_start = s.rfind('\n', 0, idx) + 1
s = s[:line_start] + insert + s[line_start:]
open(U, 'w', encoding='utf-8', newline='\n').write(s)

# 2) Dashboard: undo toast + busy-all + sort/import hygiene + precise errors
P = 'src/routes/dashboard/+page.svelte'
edit(P, [
 # hoist import to top of script; replace mid-script import
 ("""  import { invalidateAll, goto } from '$app/navigation';

  let actionError = $state('');""",
  """  let actionError = $state('');""", 1),
 ("  let { data }: { data: PageData } = $props();",
  "  import { invalidateAll, goto } from '$app/navigation';\n\n  let { data }: { data: PageData } = $props();", 1),
 # toSorted -> spread sort (browser floor)
 (".toSorted((a, b) =>", ".slice().sort((a, b) =>", 1),
 # undo state + revised quickMark
 ("""  async function quickMark(id: string, status: 'accepted' | 'declined', salesPrice: number | null, e: Event) {
    e.stopPropagation();
    busyId = id;
    actionError = '';
    try {
      const body: Record<string, unknown> = {
        estimate_status: status,
        outcome_date: new Date().toISOString(),
      };
      if (status === 'accepted' && salesPrice) body.close_price = salesPrice;
      const res = await fetch(`/api/submissions/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      await invalidateAll();
    } catch {
      actionError = "That didn't save. Check your connection and try again.";
    }
    busyId = '';
  }""",
  """  let undoState = $state<{ id: string; prevStatus: string; label: string } | null>(null);
  let undoTimer: ReturnType<typeof setTimeout> | null = null;

  async function quickMark(id: string, status: 'accepted' | 'declined', salesPrice: number | null, e: Event) {
    e.stopPropagation();
    busyId = id;
    actionError = '';
    const prevStatus = data.submissions.find((s) => s.id === id)?.estimate_status ?? 'sent';
    let saved = false;
    try {
      const body: Record<string, unknown> = {
        estimate_status: status,
        outcome_date: new Date().toISOString(),
      };
      if (status === 'accepted' && salesPrice) body.close_price = salesPrice;
      const res = await fetch(`/api/submissions/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      saved = res.ok;
    } catch {
      saved = false;
    }
    if (!saved) {
      actionError = "That didn't save. Check your connection and try again.";
      busyId = '';
      return;
    }
    if (undoTimer) clearTimeout(undoTimer);
    undoState = { id, prevStatus, label: status === 'accepted' ? 'Marked as Won' : 'Marked as Lost' };
    undoTimer = setTimeout(() => (undoState = null), 8000);
    await invalidateAll().catch(() => {});
    busyId = '';
  }

  async function undoMark() {
    if (!undoState) return;
    const { id, prevStatus } = undoState;
    undoState = null;
    if (undoTimer) clearTimeout(undoTimer);
    busyId = id;
    try {
      const res = await fetch(`/api/submissions/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimate_status: prevStatus, close_price: null, decline_reason: null, outcome_date: null }),
      });
      if (!res.ok) throw new Error();
    } catch {
      actionError = "Couldn't undo that. Open the estimate to fix its status.";
    }
    await invalidateAll().catch(() => {});
    busyId = '';
  }""", 1),
 # quickCopy: goto outside try; precise errors
 ("""  async function quickCopy(id: string, e: Event) {
    e.stopPropagation();
    busyId = id;
    actionError = '';
    try {
      const res = await fetch(`/api/submissions/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const result = await res.json();
      if (result.id || result.submission_id) {
        await goto(`/dashboard/${result.id || result.submission_id}`);
        return;
      }
      await invalidateAll();
    } catch {
      actionError = "Couldn't copy that estimate. Try again in a minute.";
    }
    busyId = '';
  }""",
  """  async function quickCopy(id: string, e: Event) {
    e.stopPropagation();
    busyId = id;
    actionError = '';
    let newId: string | null = null;
    try {
      const res = await fetch(`/api/submissions/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const result = await res.json();
      newId = result.id ?? null;
    } catch {
      actionError = "Couldn't copy that estimate. Try again in a minute.";
      busyId = '';
      return;
    }
    busyId = '';
    if (newId) await goto(`/dashboard/${newId}`);
    else await invalidateAll().catch(() => {});
  }""", 1),
 # disable every action while any request is in flight
 ("disabled={busyId === sub.id}", "disabled={busyId !== ''}", 3),
])

# undo toast markup before the closing of the page wrapper
s = open(P, encoding='utf-8').read()
tail = "  </div>\n</div>"
assert s.rstrip().endswith(tail.strip()) or s.count(tail) >= 1
last = s.rfind(tail)
toast = """  {#if undoState}
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-lg">
      <span class="text-sm">{undoState.label}</span>
      <button onclick={undoMark} class="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25">Undo</button>
    </div>
  {/if}
"""
s = s[:last] + toast + s[last:]
open(P, 'w', encoding='utf-8', newline='\n').write(s)
print('critic fixes applied')
