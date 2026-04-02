<script lang="ts">
  import type { ExteriorScopeData, ExteriorSurface } from '$lib/types/index.js';
  import { v4 as uuidv4 } from 'uuid';

  let { onSubmit }: { onSubmit: (data: ExteriorScopeData) => void } = $props();

  let step = $state(1);

  // Step 1: Client Info
  let clientName = $state('');
  let clientEmail = $state('');
  let clientPhone = $state('');
  let clientAddress = $state('');
  let clientNotes = $state('');
  let clientSource = $state('');

  // Step 2: Surfaces
  let surfaces = $state<ExteriorSurface[]>([createSurface('Front')]);

  // Step 3: Project Details
  let surfaceGrade = $state<'A' | 'B' | 'C' | 'D'>('B');
  let prepLevel = $state<'Basic' | 'Standard' | 'Superior' | 'Restoration'>('Standard');
  let colorScheme = $state<'1-2 Colors' | '3 Colors' | '4 Colors'>('1-2 Colors');
  let staging = $state(false);
  let colorSamples = $state(false);
  let projectNotes = $state('');

  const SURFACE_NAMES = ['Front', 'Left Side', 'Rear', 'Right Side', 'Garage', 'Porch', 'Deck', 'Other'];

  const SIDING_ITEMS = ['Cedar Shingles', 'Clapboard', 'HardieBoard', 'PVC Siding', 'Decking'];
  const DOOR_ITEMS = ['Standard Frame', 'Double Frame', 'w/Glass', 'w/Panels', 'Metal', 'High Gloss', 'Bulkhead', 'Garage'];
  const WINDOW_ITEMS = ['Standard', 'Non-Standard', 'Dormer', 'Bay', 'Shutters', 'Basement'];
  const TRIM_ITEMS = ['Fascia (10ft)', 'Dentil Molding', 'Downspout', 'Column', 'Soffit (10ft)', 'Spindles (10ft)', 'Staircase', 'Handrail', 'Fencing (10ft)', 'Dormer Fascia', 'Porch Ceiling', 'Ornate'];
  const CARPENTRY_ITEMS = ['Cedar Shingle (1/2 Sq)', 'Cedar Shingle (1 Sq)', 'Clapboard', 'Fascia Board (8ft)', 'Molding (8ft)', 'Window Sill', 'Window Frame', 'Window Flashing', 'Spindle', 'Newel Post', 'Handrail Assy', 'Deck Board (12ft)', 'Deck Board Premium'];

  function createSurface(name: string): ExteriorSurface {
    return { id: uuidv4(), name, siding: {}, doors: {}, windows: {}, trim: {}, carpentry_repairs: {}, notes: '' };
  }

  function addSurface() {
    if (surfaces.length < 8) {
      const usedNames = new Set(surfaces.map(s => s.name));
      const nextName = SURFACE_NAMES.find(n => !usedNames.has(n)) || `Surface ${surfaces.length + 1}`;
      surfaces = [...surfaces, createSurface(nextName)];
    }
  }

  function removeSurface(idx: number) {
    if (surfaces.length > 1) surfaces = surfaces.filter((_, i) => i !== idx);
  }

  function setQty(surfIdx: number, category: 'siding' | 'doors' | 'windows' | 'trim' | 'carpentry_repairs', item: string, val: string) {
    const qty = Math.max(0, parseInt(val) || 0);
    surfaces[surfIdx][category][item] = qty;
    surfaces = [...surfaces];
  }

  function handleSubmit() {
    const data: ExteriorScopeData = {
      client: { name: clientName, email: clientEmail, phone: clientPhone, address: clientAddress, notes: clientNotes, source: clientSource },
      surfaces,
      project: { surface_grade: surfaceGrade, prep_level: prepLevel, color_scheme: colorScheme, staging, color_samples: colorSamples, notes: projectNotes },
    };
    onSubmit(data);
  }

  let activeSurfaceIdx = $state(0);
</script>

<div class="space-y-6">
  <div class="flex gap-2">
    {#each ['Client Info', 'Surface Builder', 'Project Details', 'Review'] as label, i}
      <button onclick={() => step = i + 1} class="flex-1 text-center py-2 text-xs font-medium rounded-lg {step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
        {label}
      </button>
    {/each}
  </div>

  {#if step === 1}
    <div class="space-y-4">
      <div>
        <label for="ext-client-name" class="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
        <input id="ext-client-name" type="text" bind:value={clientName} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="ext-client-email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-gray-400 font-normal">(optional)</span></label>
          <input id="ext-client-email" type="email" bind:value={clientEmail} placeholder="Add before sending" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
        </div>
        <div>
          <label for="ext-client-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone <span class="text-gray-400 font-normal">(optional)</span></label>
          <input id="ext-client-phone" type="tel" bind:value={clientPhone} placeholder="Add before sending" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label for="ext-client-addr" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input id="ext-client-addr" type="text" bind:value={clientAddress} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="ext-client-source" class="block text-sm font-medium text-gray-700 mb-1">How'd they find you? <span class="text-gray-400 font-normal">(optional)</span></label>
          <select id="ext-client-source" bind:value={clientSource} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500">
            <option value="">—</option>
            <option value="google">Google Search</option>
            <option value="referral">Referral</option>
            <option value="repeat">Repeat Client</option>
            <option value="social">Social Media</option>
            <option value="yard_sign">Yard Sign / Job Site</option>
            <option value="nextdoor">Nextdoor</option>
            <option value="yelp">Yelp</option>
            <option value="homeadvisor">HomeAdvisor / Angi</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label for="ext-client-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="ext-client-notes" bind:value={clientNotes} rows="1" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"></textarea>
        </div>
      </div>
      <div class="flex justify-end">
        <button onclick={() => step = 2} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Surfaces</button>
      </div>
    </div>

  {:else if step === 2}
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        {#each surfaces as surf, i}
          <button onclick={() => activeSurfaceIdx = i}
            class="px-3 py-1.5 text-xs font-medium rounded-lg {activeSurfaceIdx === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            {surf.name}
          </button>
        {/each}
        {#if surfaces.length < 8}
          <button onclick={addSurface} class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100">+ Add Surface</button>
        {/if}
      </div>

      {#if surfaces[activeSurfaceIdx]}
        {@const si = activeSurfaceIdx}
        {@const surf = surfaces[si]}
        <div class="rounded-xl border border-gray-200 p-5 space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h3 class="font-semibold text-gray-900">{surf.name}</h3>
              <select bind:value={surf.name} class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600">
                {#each SURFACE_NAMES as n}<option value={n}>{n}</option>{/each}
              </select>
            </div>
            {#if surfaces.length > 1}
              <button onclick={() => { removeSurface(si); activeSurfaceIdx = Math.max(0, si - 1); }} class="text-xs text-red-600">Remove</button>
            {/if}
          </div>

          <!-- Siding -->
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Siding (quantity in squares, 1 Sq = 200 sqft)</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2">
              {#each SIDING_ITEMS as item}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700">{item}</span>
                  <input type="number" min="0" value={surf.siding[item] || 0} oninput={(e) => setQty(si, 'siding', item, (e.target as HTMLInputElement).value)} class="w-14 rounded border border-gray-200 px-2 py-1 text-xs text-right outline-none" />
                </div>
              {/each}
            </div>
          </div>

          <!-- Doors -->
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Doors</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2">
              {#each DOOR_ITEMS as item}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700">{item}</span>
                  <input type="number" min="0" value={surf.doors[item] || 0} oninput={(e) => setQty(si, 'doors', item, (e.target as HTMLInputElement).value)} class="w-14 rounded border border-gray-200 px-2 py-1 text-xs text-right outline-none" />
                </div>
              {/each}
            </div>
          </div>

          <!-- Windows -->
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Windows</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2">
              {#each WINDOW_ITEMS as item}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700">{item}</span>
                  <input type="number" min="0" value={surf.windows[item] || 0} oninput={(e) => setQty(si, 'windows', item, (e.target as HTMLInputElement).value)} class="w-14 rounded border border-gray-200 px-2 py-1 text-xs text-right outline-none" />
                </div>
              {/each}
            </div>
          </div>

          <!-- Trim -->
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Trim</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2">
              {#each TRIM_ITEMS as item}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700">{item}</span>
                  <input type="number" min="0" value={surf.trim[item] || 0} oninput={(e) => setQty(si, 'trim', item, (e.target as HTMLInputElement).value)} class="w-14 rounded border border-gray-200 px-2 py-1 text-xs text-right outline-none" />
                </div>
              {/each}
            </div>
          </div>

          <!-- Carpentry Repairs -->
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Carpentry Repairs</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2">
              {#each CARPENTRY_ITEMS as item}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700">{item}</span>
                  <input type="number" min="0" value={surf.carpentry_repairs[item] || 0} oninput={(e) => setQty(si, 'carpentry_repairs', item, (e.target as HTMLInputElement).value)} class="w-14 rounded border border-gray-200 px-2 py-1 text-xs text-right outline-none" />
                </div>
              {/each}
            </div>
          </div>

          <!-- Surface Notes -->
          <div>
            <label for="surface-notes-{si}" class="block text-xs font-medium text-gray-600 mb-1">Surface Notes</label>
            <textarea id="surface-notes-{si}" bind:value={surf.notes} rows="2" placeholder="e.g., peeling paint on north face, wood rot near foundation" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-500"></textarea>
          </div>
        </div>
      {/if}

      <div class="flex justify-between">
        <button onclick={() => step = 1} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
        <button onclick={() => step = 3} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Project Details</button>
      </div>
    </div>

  {:else if step === 3}
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="ext-grade" class="block text-sm font-medium text-gray-700 mb-1">Surface Grade</label>
          <select id="ext-grade" bind:value={surfaceGrade} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
            <option value="A">A — Excellent</option>
            <option value="B">B — Good</option>
            <option value="C">C — Fair</option>
            <option value="D">D — Poor</option>
          </select>
        </div>
        <div>
          <label for="ext-prep" class="block text-sm font-medium text-gray-700 mb-1">Prep Level</label>
          <select id="ext-prep" bind:value={prepLevel} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Superior">Superior</option>
            <option value="Restoration">Restoration</option>
          </select>
        </div>
      </div>
      <div>
        <label for="ext-colors" class="block text-sm font-medium text-gray-700 mb-1">Color Scheme</label>
        <select id="ext-colors" bind:value={colorScheme} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
          <option value="1-2 Colors">1-2 Colors</option>
          <option value="3 Colors">3 Colors</option>
          <option value="4 Colors">4 Colors</option>
        </select>
      </div>
      <div class="flex gap-6">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={staging} class="rounded border-gray-300" /> Staging Required
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={colorSamples} class="rounded border-gray-300" /> Color Samples ($98.95)
        </label>
      </div>
      <div>
        <label for="ext-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea id="ext-notes" bind:value={projectNotes} rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"></textarea>
      </div>
      <div class="flex justify-between">
        <button onclick={() => step = 2} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
        <button onclick={() => step = 4} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Review</button>
      </div>
    </div>

  {:else if step === 4}
    <div class="space-y-4">
      <div class="rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Client</h3>
        <p class="text-sm text-gray-700">{clientName} — {clientAddress}</p>
        <p class="text-xs text-gray-500">{clientEmail} {clientPhone ? `| ${clientPhone}` : ''}</p>
      </div>

      <div class="rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-3">{surfaces.length} Surface{surfaces.length > 1 ? 's' : ''}</h3>
        {#each surfaces as surf, i}
          {@const totalItems = Object.values(surf.siding).reduce((a,b) => a+b, 0) + Object.values(surf.doors).reduce((a,b) => a+b, 0) + Object.values(surf.windows).reduce((a,b) => a+b, 0) + Object.values(surf.trim).reduce((a,b) => a+b, 0) + Object.values(surf.carpentry_repairs).reduce((a,b) => a+b, 0)}
          <div class="flex items-center justify-between py-2 {i > 0 ? 'border-t border-gray-100' : ''}">
            <span class="text-sm font-medium text-gray-800">{surf.name}</span>
            <span class="text-xs text-gray-500">{totalItems} items</span>
          </div>
        {/each}
      </div>

      <div class="rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Project Details</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="text-gray-500">Surface Grade:</span> <span class="font-medium">{surfaceGrade}</span></div>
          <div><span class="text-gray-500">Prep Level:</span> <span class="font-medium">{prepLevel}</span></div>
          <div><span class="text-gray-500">Color Scheme:</span> <span class="font-medium">{colorScheme}</span></div>
          {#if staging}<div class="text-blue-600">Staging: Yes</div>{/if}
          {#if colorSamples}<div class="text-blue-600">Color Samples: Yes</div>{/if}
        </div>
      </div>

      <div class="flex justify-between">
        <button onclick={() => step = 3} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
        <button onclick={handleSubmit} class="rounded-lg bg-green-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
          Generate Estimate
        </button>
      </div>
    </div>
  {/if}
</div>
