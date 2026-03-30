<script lang="ts">
  import type { CatalogConfig, IntakeFormData, RoomEntry, QuoteResult } from '$lib/types/index.js';

  interface TenantInfo {
    id: string;
    slug: string;
    company_name: string;
    logo_url: string | null;
    primary_color: string;
    accent_color: string;
    contact_phone: string;
    contact_email: string;
  }

  let { tenant, catalog }: { tenant: TenantInfo; catalog: CatalogConfig } = $props();

  let step = $state(0);
  let submitting = $state(false);
  let submitError = $state('');
  let quoteResult = $state<QuoteResult | null>(null);
  let submissionId = $state('');
  let pdfUrl = $state('');

  // Form data
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let phone = $state('');
  let address = $state('');
  let rooms = $state<RoomEntry[]>([]);
  let occupancy = $state<'occupied' | 'vacant' | 'partially_occupied'>('occupied');
  let furniture = $state<'owner_moves' | 'crew_moves' | 'stay_in_place'>('owner_moves');
  let timeline = $state<'flexible' | 'within_2_weeks' | 'within_1_month' | 'specific_dates'>('flexible');
  let timelineDates = $state('');
  let colorPreference = $state<'know_colors' | 'need_help' | 'not_sure'>('not_sure');
  let additionalNotes = $state('');

  // Room editing
  let editingRoomIndex = $state(-1);
  let editRoom = $state<RoomEntry | null>(null);

  function createRoom(): RoomEntry {
    return {
      id: crypto.randomUUID(),
      room_type: 'Bedroom',
      room_name: '',
      room_size: 'Medium',
      ceiling_height: 'standard',
      surfaces: { walls: true, ceiling: false, trim: false, doors: 0, windows: 0, crown_molding: false, shelving: 0, cabinets: false },
      condition: 'good',
      special_conditions: { wallpaper_removal: false, dark_to_light: false, textured_surfaces: false, wood_stain: false },
      notes: '',
    };
  }

  function addRoom() {
    if (rooms.length >= 16) return;
    editRoom = createRoom();
    editingRoomIndex = rooms.length;
  }

  function saveRoom() {
    if (!editRoom) return;
    if (editingRoomIndex >= rooms.length) {
      rooms = [...rooms, editRoom];
    } else {
      rooms = rooms.map((r, i) => i === editingRoomIndex ? editRoom! : r);
    }
    editRoom = null;
    editingRoomIndex = -1;
  }

  function editExistingRoom(index: number) {
    editRoom = JSON.parse(JSON.stringify(rooms[index]));
    editingRoomIndex = index;
  }

  function removeRoom(index: number) {
    rooms = rooms.filter((_, i) => i !== index);
  }

  function cancelEdit() {
    editRoom = null;
    editingRoomIndex = -1;
  }

  // Validation
  let step1Valid = $derived(true);
  let step2Valid = $derived(firstName.trim() && lastName.trim() && email.trim() && address.trim());
  let step3Valid = $derived(rooms.length > 0);

  function canAdvance(): boolean {
    if (step === 1) return !!step2Valid;
    if (step === 2) return !!step3Valid;
    return true;
  }

  function nextStep() {
    if (step < 4) step++;
  }
  function prevStep() {
    if (step > 0) step--;
  }

  function buildFormData(): IntakeFormData {
    return {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      rooms,
      occupancy,
      furniture,
      timeline,
      timeline_dates: timelineDates || undefined,
      color_preference: colorPreference,
      additional_notes: additionalNotes,
    };
  }

  async function handleSubmit() {
    submitting = true;
    submitError = '';

    try {
      const res = await fetch('/api/submit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: tenant.slug, formData: buildFormData() }),
      });
      const data = await res.json();

      if (res.ok) {
        quoteResult = data.quote;
        submissionId = data.submission_id;
        pdfUrl = data.estimate_pdf_url;
        step = 5;
      } else {
        submitError = data.error || 'Something went wrong. Please try again.';
      }
    } catch {
      submitError = 'Network error. Please check your connection and try again.';
    } finally {
      submitting = false;
    }
  }

  const stepLabels = ['Welcome', 'Contact', 'Rooms', 'Details', 'Review'];
</script>

<div class="min-h-screen" style="background: linear-gradient(180deg, {tenant.primary_color}08 0%, white 100%)">
  <div class="mx-auto max-w-2xl px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      {#if tenant.logo_url}
        <img src={tenant.logo_url} alt={tenant.company_name} class="h-12 mx-auto mb-2" />
      {:else}
        <div class="inline-flex items-center gap-2 mb-2">
          <div class="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg font-bold" style="background: {tenant.primary_color}">
            {tenant.company_name.charAt(0)}
          </div>
          <span class="text-xl font-bold" style="color: {tenant.primary_color}">{tenant.company_name}</span>
        </div>
      {/if}
    </div>

    <!-- Progress -->
    {#if step < 5}
      <div class="mb-8">
        <div class="flex gap-1.5">
          {#each stepLabels as label, i}
            <div class="flex-1">
              <div class="h-1.5 rounded-full {i <= step ? '' : 'bg-gray-200'}" style="{i <= step ? `background: ${tenant.primary_color}` : ''}"></div>
              <span class="text-xs text-gray-500 mt-1 block text-center">{label}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Step 0: Welcome -->
    {#if step === 0}
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-3">Get Your Free Painting Quote</h1>
        <p class="text-gray-600 mb-6">Answer a few questions about your project and get an instant estimate. Takes about 5 minutes.</p>
        <div class="text-left max-w-sm mx-auto mb-8">
          <p class="text-sm font-medium text-gray-700 mb-2">You'll need:</p>
          <ul class="space-y-1 text-sm text-gray-600">
            <li>&#10003; Your property address</li>
            <li>&#10003; Which rooms you want painted</li>
            <li>&#10003; A rough idea of room sizes</li>
          </ul>
        </div>
        <div class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 mb-6">
          This tool covers <strong>interior repainting</strong>. Heavy repairs, exterior, and commercial work are quoted separately.
        </div>
        <button onclick={nextStep} class="rounded-lg px-8 py-3 text-lg font-semibold text-white" style="background: {tenant.primary_color}">
          Get Started
        </button>
      </div>

    <!-- Step 1: Contact -->
    {:else if step === 1}
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Contact & Address</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First name *</label>
              <input type="text" bind:value={firstName} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
              <input type="text" bind:value={lastName} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" bind:value={email} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" bind:value={phone} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Property address *</label>
            <input type="text" bind:value={address} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500" placeholder="123 Main St, City, State" />
          </div>
        </div>
        <div class="mt-6 flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <button onclick={nextStep} disabled={!step2Valid} class="rounded-lg px-6 py-2 text-sm font-semibold text-white disabled:opacity-50" style="background: {tenant.primary_color}">Next</button>
        </div>
      </div>

    <!-- Step 2: Rooms -->
    {:else if step === 2}
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-2">Rooms to Paint</h2>
        <p class="text-sm text-gray-500 mb-6">Add each room you'd like painted (up to 16).</p>

        {#if editRoom}
          <!-- Room Editor -->
          <div class="rounded-xl border border-gray-200 p-6 mb-4">
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Room type</label>
                  <select bind:value={editRoom.room_type} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none">
                    {#each catalog.room_types as rt}
                      <option value={rt}>{rt}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Room name (optional)</label>
                  <input type="text" bind:value={editRoom.room_name} placeholder="e.g., Master Bedroom" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Room size</label>
                <div class="flex gap-2">
                  {#each catalog.room_sizes as size}
                    <button
                      type="button"
                      onclick={() => { if (editRoom) editRoom.room_size = size as 'Small' | 'Medium' | 'Large'; }}
                      class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium {editRoom.room_size === size ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}"
                    >{size}</button>
                  {/each}
                </div>
                <p class="mt-1 text-xs text-gray-400">{catalog.size_descriptions[editRoom.room_size] || ''}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ceiling height</label>
                <div class="flex gap-2">
                  {#each catalog.ceiling_heights as ch}
                    <button
                      type="button"
                      onclick={() => { if (editRoom) editRoom.ceiling_height = ch.key as 'standard' | 'tall' | 'vaulted'; }}
                      class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium {editRoom.ceiling_height === ch.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}"
                    >{ch.label}</button>
                  {/each}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Surfaces to paint</label>
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.surfaces.walls} class="rounded" /> Walls
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.surfaces.ceiling} class="rounded" /> Ceiling
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.surfaces.trim} class="rounded" /> Trim/Baseboards
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.surfaces.crown_molding} class="rounded" /> Crown Molding
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.surfaces.cabinets} class="rounded" /> Cabinets
                  </label>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Doors</label>
                    <input type="number" min="0" max="10" bind:value={editRoom.surfaces.doors} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Windows</label>
                    <input type="number" min="0" max="10" bind:value={editRoom.surfaces.windows} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Shelving units</label>
                    <input type="number" min="0" max="10" bind:value={editRoom.surfaces.shelving} class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <div class="flex gap-2">
                  {#each catalog.condition_levels as cl}
                    <button
                      type="button"
                      onclick={() => { if (editRoom) editRoom.condition = cl.key as 'good' | 'fair' | 'needs_work'; }}
                      class="flex-1 rounded-lg border px-3 py-2 text-sm {editRoom.condition === cl.key ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}"
                    >
                      <div class="font-medium">{cl.label}</div>
                      <div class="text-xs opacity-70">{cl.description}</div>
                    </button>
                  {/each}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Special conditions</label>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.special_conditions.wallpaper_removal} class="rounded" /> Wallpaper removal needed
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.special_conditions.dark_to_light} class="rounded" /> Dark-to-light color change
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.special_conditions.textured_surfaces} class="rounded" /> Textured surfaces
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" bind:checked={editRoom.special_conditions.wood_stain} class="rounded" /> Wood stain work
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Room notes</label>
                <textarea bind:value={editRoom.notes} rows={2} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" placeholder="Any special details about this room..."></textarea>
              </div>

              <div class="flex gap-3">
                <button onclick={cancelEdit} class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onclick={saveRoom} class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white" style="background: {tenant.primary_color}">
                  {editingRoomIndex >= rooms.length ? 'Add Room' : 'Save Room'}
                </button>
              </div>
            </div>
          </div>
        {:else}
          <!-- Room List -->
          {#if rooms.length > 0}
            <div class="space-y-2 mb-4">
              {#each rooms as room, i}
                <div class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                  <div>
                    <span class="font-medium text-gray-900">{room.room_name || room.room_type}</span>
                    <span class="text-sm text-gray-500 ml-2">{room.room_size}</span>
                  </div>
                  <div class="flex gap-2">
                    <button onclick={() => editExistingRoom(i)} class="text-sm text-blue-600 hover:text-blue-700">Edit</button>
                    <button onclick={() => removeRoom(i)} class="text-sm text-red-600 hover:text-red-700">Remove</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          {#if rooms.length < 16}
            <button onclick={addRoom} class="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600">
              + Add a room
            </button>
          {/if}
        {/if}

        <div class="mt-6 flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <button onclick={nextStep} disabled={!step3Valid} class="rounded-lg px-6 py-2 text-sm font-semibold text-white disabled:opacity-50" style="background: {tenant.primary_color}">Next</button>
        </div>
      </div>

    <!-- Step 3: Project Details -->
    {:else if step === 3}
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Project Details</h2>
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Home occupancy</label>
            <div class="flex gap-2">
              {#each [['occupied', 'Occupied'], ['vacant', 'Vacant'], ['partially_occupied', 'Partially occupied']] as [val, label]}
                <button type="button" onclick={() => { occupancy = val as typeof occupancy; }} class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium {occupancy === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}">{label}</button>
              {/each}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Furniture</label>
            <div class="space-y-2">
              {#each Object.entries(catalog.furniture_handling) as [key, fh]}
                <button type="button" onclick={() => { furniture = key as typeof furniture; }} class="w-full text-left rounded-lg border px-4 py-3 text-sm {furniture === key ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}">
                  {fh.label}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Timeline preference</label>
            <div class="grid grid-cols-2 gap-2">
              {#each [['flexible', 'Flexible'], ['within_2_weeks', 'Within 2 weeks'], ['within_1_month', 'Within 1 month'], ['specific_dates', 'Specific dates']] as [val, label]}
                <button type="button" onclick={() => { timeline = val as typeof timeline; }} class="rounded-lg border px-3 py-2 text-sm font-medium {timeline === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}">{label}</button>
              {/each}
            </div>
            {#if timeline === 'specific_dates'}
              <input type="text" bind:value={timelineDates} placeholder="e.g., First week of April" class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" />
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Color preference</label>
            <div class="flex gap-2">
              {#each [['know_colors', 'I know my colors'], ['need_help', 'Need help'], ['not_sure', 'Not sure yet']] as [val, label]}
                <button type="button" onclick={() => { colorPreference = val as typeof colorPreference; }} class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium {colorPreference === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}">{label}</button>
              {/each}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Additional notes</label>
            <textarea bind:value={additionalNotes} rows={3} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none" placeholder="Anything else we should know..."></textarea>
          </div>
        </div>
        <div class="mt-6 flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <button onclick={nextStep} class="rounded-lg px-6 py-2 text-sm font-semibold text-white" style="background: {tenant.primary_color}">Review</button>
        </div>
      </div>

    <!-- Step 4: Review & Submit -->
    {:else if step === 4}
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Review Your Project</h2>

        <div class="space-y-4 mb-6">
          <div class="rounded-lg bg-gray-50 p-4">
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Contact</h3>
            <p class="text-gray-900">{firstName} {lastName}</p>
            <p class="text-sm text-gray-600">{email}{phone ? ` | ${phone}` : ''}</p>
            <p class="text-sm text-gray-600">{address}</p>
          </div>

          <div class="rounded-lg bg-gray-50 p-4">
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Rooms ({rooms.length})</h3>
            {#each rooms as room}
              <div class="flex justify-between py-1 text-sm">
                <span class="text-gray-900">{room.room_name || room.room_type}</span>
                <span class="text-gray-500">{room.room_size}</span>
              </div>
            {/each}
          </div>

          <div class="rounded-lg bg-gray-50 p-4">
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Project Details</h3>
            <div class="text-sm text-gray-700 space-y-1">
              <p>Occupancy: {occupancy.replace(/_/g, ' ')}</p>
              <p>Furniture: {catalog.furniture_handling[furniture]?.label || furniture}</p>
              <p>Timeline: {timeline.replace(/_/g, ' ')}{timelineDates ? ` (${timelineDates})` : ''}</p>
            </div>
          </div>
        </div>

        <p class="text-xs text-gray-500 mb-4">By submitting, you agree that this is a conditional quote based on your inputs. Final pricing will be confirmed after a pre-project review.</p>

        {#if submitError}
          <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{submitError}</div>
        {/if}

        <div class="flex justify-between">
          <button onclick={prevStep} class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back</button>
          <button onclick={handleSubmit} disabled={submitting} class="rounded-lg px-8 py-3 text-sm font-semibold text-white disabled:opacity-50" style="background: {tenant.primary_color}">
            {submitting ? 'Calculating...' : 'Get My Quote'}
          </button>
        </div>
      </div>

    <!-- Step 5: Quote Result -->
    {:else if step === 5 && quoteResult}
      <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <span class="text-3xl">&#10003;</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Your Estimate</h2>
          <p class="text-sm text-gray-500 mt-1">A copy has been emailed to {email}</p>
        </div>

        <!-- Total -->
        <div class="rounded-xl p-6 text-center mb-6" style="background: {tenant.primary_color}11">
          <div class="text-sm text-gray-500">Estimated Total</div>
          <div class="text-4xl font-bold mt-1" style="color: {tenant.primary_color}">${quoteResult.total.toLocaleString()}</div>
        </div>

        <!-- Room Breakdown -->
        <div class="space-y-3 mb-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase">Room Breakdown</h3>
          {#each quoteResult.rooms as room}
            <div class="flex justify-between items-start py-2 border-b border-gray-100">
              <div>
                <span class="font-medium text-gray-900">{room.room_label}</span>
                {#if room.modifiers.length > 0}
                  <div class="mt-1">
                    {#each room.modifiers as mod}
                      <div class="text-xs text-gray-500">{mod.label}: +${mod.amount.toLocaleString()}</div>
                    {/each}
                  </div>
                {/if}
              </div>
              <span class="font-medium text-gray-900">${room.subtotal.toLocaleString()}</span>
            </div>
          {/each}
          {#each quoteResult.project_adders as adder}
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-gray-700">{adder.label}</span>
              <span class="text-gray-900">${adder.amount.toLocaleString()}</span>
            </div>
          {/each}
        </div>

        <!-- Assumptions -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Assumptions</h3>
          <ul class="space-y-1">
            {#each quoteResult.assumptions as a}
              <li class="text-xs text-gray-600">&#8226; {a}</li>
            {/each}
          </ul>
        </div>

        <!-- Exclusions -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">What's Not Included</h3>
          <ul class="space-y-1">
            {#each quoteResult.exclusions as e}
              <li class="text-xs text-gray-600">&#8226; {e}</li>
            {/each}
          </ul>
        </div>

        <!-- PDF Download -->
        <div class="flex justify-center gap-4">
          <a href={pdfUrl} target="_blank" class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Download PDF
          </a>
        </div>

        <p class="mt-6 text-center text-xs text-gray-400">
          Ref: {submissionId.slice(0, 8).toUpperCase()} | Powered by Smart Quote Pro
        </p>
      </div>
    {/if}
  </div>
</div>
