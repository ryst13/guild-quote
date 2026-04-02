<script lang="ts">
  import type { InteriorScopeData, InteriorRoom } from '$lib/types/index.js';
  import { v4 as uuidv4 } from 'uuid';

  let { onSubmit }: { onSubmit: (data: InteriorScopeData) => void } = $props();

  let step = $state(1);

  // Step 1: Client Info
  let clientName = $state('');
  let clientEmail = $state('');
  let clientPhone = $state('');
  let clientAddress = $state('');
  let clientNotes = $state('');
  let clientSource = $state('');

  // Step 2: Rooms
  let rooms = $state<InteriorRoom[]>([createRoom()]);

  // Step 3: Project Details
  let surfaceGrade = $state<'A' | 'B' | 'C' | 'D'>('B');
  let prepLevel = $state<'Basic' | 'Standard' | 'Superior' | 'Restoration'>('Standard');
  let colorSamples = $state(false);
  let transportation = $state(false);
  let projectNotes = $state('');

  const ROOM_TYPES = [
    'Kitchen', 'Living Room', 'Bedroom', 'Master Bedroom', 'Dining Room',
    'Bathroom', 'Full Bathroom', 'Foyer/Hallway', 'Closet', 'Den', 'Office',
    'Media Room', 'Eating Area', 'Pantry', 'Laundry Room', 'Utility/Mud Room',
    'Recreation Room', 'Family Room', 'Staircase Hallway',
  ];

  const ITEMS = [
    'Window - Standard Frame', 'Window - Small Frame',
    'Door - Frame Standard', 'Door - Frame Double', 'Door - Flat',
    'Door - w/ Panels', 'Door - w/ Glass',
    'Trim - Baseboard/Crown', 'Trim - Wainscotting', 'Trim - Spindles/Balusters',
    'Trim - Radiator', 'Trim - Handrail',
    'Repair - Drywall Repair',
  ];

  const SPECIALTIES = [
    'Drywall Install', 'Floor Refinishing', 'Plaster Wall/Ceiling',
    'Wallpaper', 'Window Cleaning', 'Room Cleaning',
  ];

  function createRoom(): InteriorRoom {
    return {
      id: uuidv4(),
      room_type: 'Bedroom',
      room_size: 'Medium',
      ceiling_included: false,
      closet: 'not_included',
      primer_required: false,
      items: {},
      specialty: [],
      notes: '',
    };
  }

  function addRoom() {
    if (rooms.length < 16) rooms = [...rooms, createRoom()];
  }

  function duplicateRoom(idx: number) {
    if (rooms.length < 16) {
      const src = rooms[idx];
      rooms = [...rooms, { ...src, id: uuidv4(), items: { ...src.items }, specialty: [...src.specialty] }];
    }
  }

  function removeRoom(idx: number) {
    if (rooms.length > 1) rooms = rooms.filter((_, i) => i !== idx);
  }

  function toggleSpecialty(roomIdx: number, spec: string) {
    const room = rooms[roomIdx];
    if (room.specialty.includes(spec)) {
      room.specialty = room.specialty.filter(s => s !== spec);
    } else {
      room.specialty = [...room.specialty, spec];
    }
    rooms = [...rooms];
  }

  function setItemQty(roomIdx: number, item: string, val: string) {
    rooms[roomIdx].items[item] = Math.max(0, parseInt(val) || 0);
    rooms = [...rooms];
  }

  function handleSubmit() {
    const data: InteriorScopeData = {
      client: { name: clientName, email: clientEmail, phone: clientPhone, address: clientAddress, notes: clientNotes, source: clientSource },
      rooms,
      project: { surface_grade: surfaceGrade, prep_level: prepLevel, color_samples: colorSamples, transportation, notes: projectNotes },
    };
    onSubmit(data);
  }

  let activeRoomIdx = $state(0);
</script>

<div class="space-y-6">
  <!-- Step indicator -->
  <div class="flex gap-2">
    {#each ['Client Info', 'Room Builder', 'Project Details', 'Review'] as label, i}
      <button onclick={() => step = i + 1} class="flex-1 text-center py-2 text-xs font-medium rounded-lg {step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
        {label}
      </button>
    {/each}
  </div>

  {#if step === 1}
    <!-- Client Info -->
    <div class="space-y-4">
      <div>
        <label for="int-client-name" class="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
        <input id="int-client-name" type="text" bind:value={clientName} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="int-client-email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-gray-400 font-normal">(optional)</span></label>
          <input id="int-client-email" type="email" bind:value={clientEmail} placeholder="Add before sending" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
        </div>
        <div>
          <label for="int-client-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone <span class="text-gray-400 font-normal">(optional)</span></label>
          <input id="int-client-phone" type="tel" bind:value={clientPhone} placeholder="Add before sending" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label for="int-client-address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input id="int-client-address" type="text" bind:value={clientAddress} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="int-client-source" class="block text-sm font-medium text-gray-700 mb-1">How'd they find you? <span class="text-gray-400 font-normal">(optional)</span></label>
          <select id="int-client-source" bind:value={clientSource} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500">
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
          <label for="int-client-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="int-client-notes" bind:value={clientNotes} rows="1" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"></textarea>
        </div>
      </div>
      <div class="flex justify-end">
        <button onclick={() => step = 2} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Rooms</button>
      </div>
    </div>

  {:else if step === 2}
    <!-- Room Builder -->
    <div class="space-y-4">
      <!-- Room tabs -->
      <div class="flex flex-wrap gap-2">
        {#each rooms as room, i}
          <button onclick={() => activeRoomIdx = i}
            class="px-3 py-1.5 text-xs font-medium rounded-lg {activeRoomIdx === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
            {room.room_type} {i + 1}
          </button>
        {/each}
        {#if rooms.length < 16}
          <button onclick={addRoom} class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100">+ Add Room</button>
        {/if}
      </div>

      {#if rooms[activeRoomIdx]}
        {@const room = rooms[activeRoomIdx]}
        {@const ri = activeRoomIdx}
        <div class="rounded-xl border border-gray-200 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Room {ri + 1}</h3>
            <div class="flex gap-2">
              <button onclick={() => duplicateRoom(ri)} class="text-xs text-blue-600 hover:text-blue-700">Duplicate</button>
              {#if rooms.length > 1}
                <button onclick={() => { removeRoom(ri); activeRoomIdx = Math.max(0, ri - 1); }} class="text-xs text-red-600 hover:text-red-700">Remove</button>
              {/if}
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="room-type-{ri}" class="block text-xs font-medium text-gray-600 mb-1">Room Type</label>
              <select id="room-type-{ri}" bind:value={room.room_type} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 outline-none">
                {#each ROOM_TYPES as rt}<option value={rt}>{rt}</option>{/each}
              </select>
            </div>
            <div>
              <label for="room-size-{ri}" class="block text-xs font-medium text-gray-600 mb-1">Room Size</label>
              <select id="room-size-{ri}" bind:value={room.room_size} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 outline-none">
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
            <div>
              <label for="room-closet-{ri}" class="block text-xs font-medium text-gray-600 mb-1">Closet</label>
              <select id="room-closet-{ri}" bind:value={room.closet} class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 outline-none">
                <option value="not_included">Not Included</option>
                <option value="small">Small (2x3)</option>
                <option value="medium">Medium (2x4)</option>
                <option value="large">Large (2x6)</option>
              </select>
            </div>
          </div>

          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={room.ceiling_included} class="rounded border-gray-300" /> Ceiling Included
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={room.primer_required} class="rounded border-gray-300" /> Primer Required
            </label>
          </div>

          <!-- Items -->
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Items (quantity)</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2">
              {#each ITEMS as item}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-700">{item}</span>
                  <input
                    type="number" min="0"
                    value={room.items[item] || 0}
                    oninput={(e) => setItemQty(ri, item, (e.target as HTMLInputElement).value)}
                    class="w-14 rounded border border-gray-200 px-2 py-1 text-xs text-right text-gray-900 outline-none"
                  />
                </div>
              {/each}
            </div>
          </div>

          <!-- Specialty -->
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Specialty</h4>
            <div class="flex flex-wrap gap-2">
              {#each SPECIALTIES as spec}
                <label class="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" checked={room.specialty.includes(spec)} onchange={() => toggleSpecialty(ri, spec)} class="rounded border-gray-300" />
                  {spec}
                </label>
              {/each}
            </div>
          </div>

          <!-- Room Notes -->
          <div>
            <label for="room-notes-{ri}" class="block text-xs font-medium text-gray-600 mb-1">Room Notes</label>
            <textarea id="room-notes-{ri}" bind:value={room.notes} rows="2" placeholder="e.g., accent wall in Hale Navy, water damage on north wall" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-500"></textarea>
          </div>
        </div>
      {/if}

      <div class="flex justify-between">
        <button onclick={() => step = 1} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
        <button onclick={() => step = 3} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Project Details</button>
      </div>
    </div>

  {:else if step === 3}
    <!-- Project Details -->
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="int-surface-grade" class="block text-sm font-medium text-gray-700 mb-1">Surface Grade</label>
          <select id="int-surface-grade" bind:value={surfaceGrade} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none">
            <option value="A">A — Excellent</option>
            <option value="B">B — Good</option>
            <option value="C">C — Fair</option>
            <option value="D">D — Poor</option>
          </select>
        </div>
        <div>
          <label for="int-prep-level" class="block text-sm font-medium text-gray-700 mb-1">Prep Level</label>
          <select id="int-prep-level" bind:value={prepLevel} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none">
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Superior">Superior</option>
            <option value="Restoration">Restoration</option>
          </select>
        </div>
      </div>
      <div class="flex gap-6">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={colorSamples} class="rounded border-gray-300" /> Color Samples ($98.95)
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={transportation} class="rounded border-gray-300" /> Transportation Included ($50)
        </label>
      </div>
      <div>
        <label for="int-project-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea id="int-project-notes" bind:value={projectNotes} rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"></textarea>
      </div>
      <div class="flex justify-between">
        <button onclick={() => step = 2} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
        <button onclick={() => step = 4} class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Next: Review</button>
      </div>
    </div>

  {:else if step === 4}
    <!-- Review -->
    <div class="space-y-4">
      <div class="rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Client</h3>
        <p class="text-sm text-gray-700">{clientName} — {clientAddress}</p>
        <p class="text-xs text-gray-500">{clientEmail} {clientPhone ? `| ${clientPhone}` : ''}</p>
      </div>

      <div class="rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-3">{rooms.length} Room{rooms.length > 1 ? 's' : ''}</h3>
        {#each rooms as room, i}
          <div class="flex items-center justify-between py-2 {i > 0 ? 'border-t border-gray-100' : ''}">
            <div>
              <span class="text-sm font-medium text-gray-800">{room.room_type}</span>
              <span class="text-xs text-gray-500 ml-2">{room.room_size}</span>
              {#if room.ceiling_included}<span class="text-xs text-blue-600 ml-2">+Ceiling</span>{/if}
              {#if room.primer_required}<span class="text-xs text-orange-600 ml-2">+Primer</span>{/if}
            </div>
            <span class="text-xs text-gray-500">
              {Object.values(room.items).reduce((s, v) => s + v, 0)} items
            </span>
          </div>
        {/each}
      </div>

      <div class="rounded-xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Project Details</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="text-gray-500">Surface Grade:</span> <span class="font-medium">{surfaceGrade}</span></div>
          <div><span class="text-gray-500">Prep Level:</span> <span class="font-medium">{prepLevel}</span></div>
          {#if colorSamples}<div class="text-blue-600">Color Samples: Yes</div>{/if}
          {#if transportation}<div class="text-blue-600">Transportation: Yes</div>{/if}
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
