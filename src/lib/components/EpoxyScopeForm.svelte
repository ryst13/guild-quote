<script lang="ts">
  import type { EpoxyScopeData, EpoxyFloor } from '$lib/types/index.js';
  import { v4 as uuidv4 } from 'uuid';

  let { onSubmit, demo = false }: { onSubmit: (data: EpoxyScopeData) => void; demo?: boolean } = $props();

  let step = $state(1);

  // Step 1: Client Info
  let clientName = $state(demo ? 'Sarah Mitchell' : '');
  let clientEmail = $state(demo ? 'sarah@example.com' : '');
  let clientPhone = $state(demo ? '(512) 555-0147' : '');
  let clientAddress = $state(demo ? '42 Maple Ave, Austin TX 78701' : '');
  let clientNotes = $state('');
  let clientSource = $state('');

  // Step 2: Floors
  let floors = $state<EpoxyFloor[]>(demo ? createDemoFloors() : [createFloor()]);

  // Step 3: Project Details
  let concreteGrinding = $state(false);
  let crackRepair = $state<'none' | 'minor' | 'major'>('none');
  let timeline = $state('');
  let projectNotes = $state('');

  const AREA_TYPES = ['Garage (1-car)', 'Garage (2-car)', 'Garage (3-car)', 'Basement', 'Patio', 'Commercial'];
  const COATING_TYPES = ['Standard Epoxy', 'Premium Epoxy', 'Polyurea', 'Polyaspartic'];

  function createFloor(): EpoxyFloor {
    return {
      id: uuidv4(),
      area_type: 'Garage (2-car)',
      sqft: 400,
      coating_type: 'Standard Epoxy',
      floor_condition: 'Good',
      existing_coating_removal: false,
      moisture_issues: false,
      color_flake: 'none',
      cove_base: false,
      cove_base_linear_feet: 0,
    };
  }

  function createDemoFloors(): EpoxyFloor[] {
    return [{
      id: uuidv4(),
      area_type: 'Garage (2-car)',
      sqft: 480,
      coating_type: 'Premium Epoxy',
      floor_condition: 'Fair',
      existing_coating_removal: false,
      moisture_issues: false,
      color_flake: 'standard',
      cove_base: false,
      cove_base_linear_feet: 0,
    }];
  }

  function addFloor() { floors = [...floors, createFloor()]; }
  function removeFloor(idx: number) { if (floors.length > 1) floors = floors.filter((_, i) => i !== idx); }

  function handleSubmit() {
    const data: EpoxyScopeData = {
      client: { name: clientName, email: clientEmail, phone: clientPhone, address: clientAddress, notes: clientNotes, source: clientSource },
      floors,
      project: { concrete_grinding: concreteGrinding, crack_repair: crackRepair, timeline, notes: projectNotes },
    };
    onSubmit(data);
  }

  let activeFloorIdx = $state(0);
</script>

<div class="space-y-6">
  <div class="flex gap-2">
    {#each ['Client Info', 'Floor Builder', 'Project Details', 'Review'] as label, i}
      <button onclick={() => step = i + 1} class="flex-1 text-center py-2 text-xs font-medium rounded-lg {step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
        {label}
      </button>
    {/each}
  </div>

  {#if step === 1}
    <div class="space-y-4">
      {#if demo}
        <div class="rounded-lg bg-blue-50 border border-blue-100 px-4 py-2.5 text-sm text-blue-700">
          Pre-filled with sample data — edit or skip ahead.
        </div>
      {/if}
      <div>
        <label for="epoxy-name" class="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
        <input id="epoxy-name" type="text" bind:value={clientName} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="epoxy-email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-gray-400 font-normal">(optional)</span></label>
          <input id="epoxy-email" type="email" bind:value={clientEmail} placeholder="Add before sending" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>
        <div>
          <label for="epoxy-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone <span class="text-gray-400 font-normal">(optional)</span></label>
          <input id="epoxy-phone" type="tel" bind:value={clientPhone} placeholder="Add before sending" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label for="epoxy-addr" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input id="epoxy-addr" type="text" bind:value={clientAddress} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
      </div>
      {#if !demo}
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="epoxy-client-source" class="block text-sm font-medium text-gray-700 mb-1">How'd they find you? <span class="text-gray-400 font-normal">(optional)</span></label>
            <select id="epoxy-client-source" bind:value={clientSource} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500">
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
            <label for="epoxy-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="epoxy-notes" bind:value={clientNotes} rows="1" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"></textarea>
          </div>
        </div>
      {/if}
      <div class="flex justify-end">
        <button onclick={() => step = 2} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Floors</button>
      </div>
    </div>

  {:else if step === 2}
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        {#each floors as floor, i}
          <button onclick={() => activeFloorIdx = i}
            class="px-3 py-1.5 text-xs font-medium rounded-lg {activeFloorIdx === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            {floor.area_type}
          </button>
        {/each}
        <button onclick={addFloor} class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100">+ Add Floor</button>
      </div>

      {#if floors[activeFloorIdx]}
        {@const fi = activeFloorIdx}
        {@const floor = floors[fi]}
        <div class="rounded-xl border border-gray-200 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Floor {fi + 1}</h3>
            {#if floors.length > 1}
              <button onclick={() => { removeFloor(fi); activeFloorIdx = Math.max(0, fi - 1); }} class="text-xs text-red-600">Remove</button>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="floor-type-{fi}" class="block text-xs font-medium text-gray-600 mb-1">Area Type</label>
              <select id="floor-type-{fi}" bind:value={floor.area_type} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none">
                {#each AREA_TYPES as at}<option value={at}>{at}</option>{/each}
              </select>
            </div>
            <div>
              <label for="floor-sqft-{fi}" class="block text-xs font-medium text-gray-600 mb-1">Square Footage</label>
              <input id="floor-sqft-{fi}" type="number" min="0" bind:value={floor.sqft} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="floor-coating-{fi}" class="block text-xs font-medium text-gray-600 mb-1">Coating Type</label>
              <select id="floor-coating-{fi}" bind:value={floor.coating_type} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none">
                {#each COATING_TYPES as ct}<option value={ct}>{ct}</option>{/each}
              </select>
            </div>
            <div>
              <label for="floor-cond-{fi}" class="block text-xs font-medium text-gray-600 mb-1">Floor Condition</label>
              <select id="floor-cond-{fi}" bind:value={floor.floor_condition} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none">
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>

          <div>
            <label for="floor-flake-{fi}" class="block text-xs font-medium text-gray-600 mb-1">Color/Flake Selection</label>
            <select id="floor-flake-{fi}" bind:value={floor.color_flake} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none">
              <option value="none">None</option>
              <option value="standard">Standard Flake</option>
              <option value="full">Full Flake</option>
              <option value="metallic">Metallic</option>
            </select>
          </div>

          <div class="flex flex-wrap gap-6">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={floor.existing_coating_removal} class="rounded border-gray-300" /> Existing Coating Removal
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={floor.moisture_issues} class="rounded border-gray-300" /> Moisture Issues
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={floor.cove_base} class="rounded border-gray-300" /> Cove Base
            </label>
          </div>

          {#if floor.cove_base}
            <div>
              <label for="floor-cove-{fi}" class="block text-xs font-medium text-gray-600 mb-1">Cove Base Linear Feet</label>
              <input id="floor-cove-{fi}" type="number" min="0" bind:value={floor.cove_base_linear_feet} class="w-32 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none" />
            </div>
          {/if}
        </div>
      {/if}

      <div class="flex justify-between">
        <button onclick={() => step = 1} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
        <button onclick={() => step = 3} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Project Details</button>
      </div>
    </div>

  {:else if step === 3}
    <div class="space-y-4">
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" bind:checked={concreteGrinding} class="rounded border-gray-300" /> Concrete Grinding Required
      </label>
      <div>
        <label for="epoxy-crack" class="block text-sm font-medium text-gray-700 mb-1">Crack Repair</label>
        <select id="epoxy-crack" bind:value={crackRepair} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
          <option value="none">None</option>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
        </select>
      </div>
      <div>
        <label for="epoxy-timeline" class="block text-sm font-medium text-gray-700 mb-1">Timeline Preference</label>
        <input id="epoxy-timeline" type="text" bind:value={timeline} placeholder="e.g., ASAP, next month" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
      </div>
      <div>
        <label for="epoxy-proj-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea id="epoxy-proj-notes" bind:value={projectNotes} rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"></textarea>
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
        <h3 class="font-semibold text-gray-900 mb-3">{floors.length} Floor{floors.length > 1 ? 's' : ''}</h3>
        {#each floors as floor, i}
          <div class="py-2 {i > 0 ? 'border-t border-gray-100' : ''}">
            <span class="text-sm font-medium text-gray-800">{floor.area_type}</span>
            <span class="text-xs text-gray-500 ml-2">{floor.sqft} sqft — {floor.coating_type} — {floor.floor_condition}</span>
            {#if floor.color_flake !== 'none'}<span class="text-xs text-blue-600 ml-2">+{floor.color_flake} flake</span>{/if}
          </div>
        {/each}
      </div>

      <div class="rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Project Details</h3>
        <div class="text-sm space-y-1">
          {#if concreteGrinding}<div class="text-blue-600">Concrete Grinding: Yes</div>{/if}
          <div><span class="text-gray-500">Crack Repair:</span> <span class="font-medium">{crackRepair}</span></div>
          {#if timeline}<div><span class="text-gray-500">Timeline:</span> <span class="font-medium">{timeline}</span></div>{/if}
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
