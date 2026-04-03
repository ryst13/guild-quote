<svelte:head>
  <title>Scope Entry — GuildQuote Docs</title>
  <meta name="description" content="How to scope painting jobs in GuildQuote. Interior room builder, exterior surface builder, epoxy floor builder. Surface grading, LOSP tiers, and tips for accurate scoping." />
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-3">Scope Entry</h1>
    <p class="text-lg text-gray-600">Each trade has its own scope form designed around how that work actually gets bid. You build scope by adding rooms, surfaces, or floors -- and GuildQuote calculates the rest.</p>
  </div>

  <!-- Interior -->
  <section id="interior">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Interior Painting</h2>
        <p>The interior form uses a <strong>room builder</strong>. You add rooms one at a time and configure each one.</p>

        <h3>What each room captures</h3>
        <ul>
          <li><strong>Room type</strong> -- bedroom, bathroom, kitchen, living room, hallway, stairwell, etc.</li>
          <li><strong>Room dimensions</strong> -- length, width, ceiling height. GuildQuote calculates wall square footage automatically.</li>
          <li><strong>Surfaces to paint</strong> -- walls, ceiling, trim/baseboard, crown molding, doors, windows, closets. Toggle each on or off.</li>
          <li><strong>Condition grade</strong> -- A through D for each surface (see grading below).</li>
          <li><strong>LOSP tier</strong> -- the level of service for the room (see LOSP below).</li>
          <li><strong>Coats</strong> -- number of coats for walls and ceiling.</li>
        </ul>

        <h3>Tips for accurate interior scoping</h3>
        <ul>
          <li>Measure actual room dimensions rather than guessing. A 12x14 room and a 14x16 room are very different jobs.</li>
          <li>Count doors and windows individually -- they affect both painting time and trim footage.</li>
          <li>Grade surfaces honestly. Marking everything as "A" when walls need patching will underestimate your time.</li>
          <li>Include closet interiors if the client expects them painted. Easy to miss on the walkthrough.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Exterior -->
  <section id="exterior">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Exterior Painting</h2>
        <p>The exterior form uses a <strong>surface builder</strong>. Instead of rooms, you add individual surface types and specify their measurements.</p>

        <h3>What each surface captures</h3>
        <ul>
          <li><strong>Surface type</strong> -- siding (clapboard, vinyl, shingle, etc.), trim, fascia, soffits, windows, doors, shutters, decks, railings, gutters/downspouts.</li>
          <li><strong>Measurement</strong> -- square footage for large surfaces, linear footage for trim and fascia, unit count for windows and doors.</li>
          <li><strong>Condition grade</strong> -- A through D.</li>
          <li><strong>Prep requirements</strong> -- scraping, sanding, priming, caulking, carpentry repairs.</li>
          <li><strong>Substrate and coating</strong> -- material type and paint system.</li>
        </ul>

        <h3>Tips for accurate exterior scoping</h3>
        <ul>
          <li>Walk all four sides. It is common to scope the front and back but miss side elevations.</li>
          <li>Note the substrate -- wood clapboard, vinyl, aluminum, stucco, and brick all have different production rates.</li>
          <li>Check for carpentry repairs (rotted trim, damaged clapboards). If you find any, add them as repair items. Missing these is the most common reason exterior estimates come in short.</li>
          <li>Factor in staging needs. Second-story work with ladder sets is slower than ground-floor work.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Epoxy -->
  <section id="epoxy">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Epoxy & Garage Coatings</h2>
        <p>The epoxy form uses a <strong>floor builder</strong>. You add floors (garage bays, commercial spaces) and configure coating options.</p>

        <h3>What each floor captures</h3>
        <ul>
          <li><strong>Floor area</strong> -- square footage of the floor surface.</li>
          <li><strong>Coating type</strong> -- solid epoxy, flake epoxy, polyaspartic, polyurea, etc.</li>
          <li><strong>Flake options</strong> -- flake color, flake density (light, medium, full broadcast).</li>
          <li><strong>Cove base</strong> -- whether to run coating up the walls at the base, and the height.</li>
          <li><strong>Condition grade</strong> -- floor condition, which affects grinding/prep time.</li>
          <li><strong>Prep requirements</strong> -- diamond grinding, shot blasting, crack repair, moisture testing.</li>
        </ul>

        <h3>Tips for accurate epoxy scoping</h3>
        <ul>
          <li>Measure the actual floor, not the garage door opening size. Most 2-car garages are 400-500 sqft, not the 576 sqft people assume.</li>
          <li>Check for moisture issues. Concrete that sweats or has efflorescence needs moisture testing before coating.</li>
          <li>Grade the floor condition realistically. A smooth, clean slab is a different job than one with old paint, oil stains, or cracks.</li>
          <li>Include cove base if the client wants it -- it adds material and labor but looks significantly more professional.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Surface Grading -->
  <section id="surface-grading">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">Surface Grading (A/B/C/D)</h2>
        <p>Every surface in GuildQuote gets a <strong>condition grade</strong>. The grade affects production hours and pricing -- worse conditions take longer to prep and paint.</p>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-sm font-bold">A</span>
            <span class="font-semibold text-gray-900 text-sm">Excellent</span>
          </div>
          <p class="text-sm text-gray-500">Clean, smooth surfaces in good condition. Minimal prep needed -- light cleaning, maybe a quick sand. New construction or recently painted surfaces that just need a fresh coat.</p>
        </div>

        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">B</span>
            <span class="font-semibold text-gray-900 text-sm">Good</span>
          </div>
          <p class="text-sm text-gray-500">Surfaces in decent shape with minor wear. Some patching, light sanding, spot priming. This is the most common grade for homes that have been lived in and maintained.</p>
        </div>

        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">C</span>
            <span class="font-semibold text-gray-900 text-sm">Fair</span>
          </div>
          <p class="text-sm text-gray-500">Noticeable wear, damage, or deferred maintenance. Significant patching, sanding, priming, and possible skim-coating. Older homes or rental properties that have not been painted in years.</p>
        </div>

        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-sm font-bold">D</span>
            <span class="font-semibold text-gray-900 text-sm">Poor</span>
          </div>
          <p class="text-sm text-gray-500">Heavy damage, peeling paint, water damage, or surfaces that need substantial repair before painting. Full prep: scrape, sand, repair, prime. Expect 2-3x the prep time compared to an A-grade surface.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- LOSP -->
  <section id="losp">
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <div class="prose prose-sm prose-gray max-w-none">
        <h2 class="text-xl font-bold text-gray-900 mt-0 mb-3">LOSP Tiers (Level of Service/Product)</h2>
        <p>GuildQuote uses three tiers to help you present options to clients. Each tier adjusts paint quality, number of coats, and prep level. This gives your client a choice without you building three separate estimates from scratch.</p>
      </div>

      <div class="mt-4 space-y-3">
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Rental Ready</div>
          <p class="text-sm text-gray-500">Basic refresh. Builder-grade paint, minimal prep, single coat on walls. Designed for landlords, flippers, and property managers who need functional coverage at the lowest cost.</p>
        </div>
        <div class="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Homeowner Standard</div>
          <p class="text-sm text-gray-500">The default tier. Quality paint, proper prep (patching, sanding, priming), two coats on walls. This is what most homeowners expect and where the majority of residential work lands.</p>
        </div>
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <div class="font-semibold text-gray-900 text-sm mb-1">Restoration Grade</div>
          <p class="text-sm text-gray-500">Premium work. Top-tier paint, extensive prep, multiple coats, and fine detail work. For high-end homes, historic restorations, and clients who want everything done to the highest standard.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Navigation -->
  <div class="flex items-center justify-between pt-4 border-t border-gray-200">
    <a href="/docs/getting-started" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Previous: Getting Started</a>
    <a href="/docs/pricing" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Next: Pricing</a>
  </div>
</div>
