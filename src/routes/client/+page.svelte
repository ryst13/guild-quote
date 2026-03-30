<script lang="ts">
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
</script>

<svelte:head>
  <title>My Projects — Smart Quote Pro</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
      <h1 class="font-bold text-gray-900">My Projects</h1>
      <button onclick={logout} class="text-sm text-gray-500 hover:text-gray-700">Log out</button>
    </div>
  </div>

  <div class="mx-auto max-w-4xl px-4 py-6">
    {#if data.projects.length === 0}
      <div class="rounded-2xl bg-white border border-gray-200 p-12 text-center">
        <p class="text-gray-500">No projects found.</p>
      </div>
    {:else}
      <div class="space-y-6">
        {#each data.projects as project}
          <div class="rounded-2xl bg-white border border-gray-200 p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="font-semibold text-gray-900">{project.address}</h2>
                <p class="text-sm text-gray-500">{project.company_name}</p>
              </div>
              <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium" style="background: {project.primary_color}15; color: {project.primary_color}">
                {project.stage_label}
              </span>
            </div>

            <!-- Stage Progress Bar -->
            <div class="mb-4">
              <div class="flex gap-1">
                {#each project.stages.filter(s => s.portal_client_label) as stage, i}
                  {@const currentIdx = project.stages.findIndex(s => s.key === project.stage_key)}
                  {@const stageIdx = project.stages.indexOf(stage)}
                  <div class="flex-1">
                    <div class="h-2 rounded-full {stageIdx <= currentIdx ? '' : 'bg-gray-200'}" style="{stageIdx <= currentIdx ? `background: ${project.primary_color}` : ''}"></div>
                    <span class="text-[10px] text-gray-400 mt-0.5 block">{stage.portal_client_label}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Estimate</span>
                <div class="font-medium text-gray-900">{project.sales_price ? `$${project.sales_price.toLocaleString()}` : '-'}</div>
              </div>
              <div>
                <span class="text-gray-500">Crew</span>
                <div class="font-medium text-gray-900">{project.assigned_crew || 'Not assigned'}</div>
              </div>
              <div>
                <span class="text-gray-500">Start date</span>
                <div class="font-medium text-gray-900">{project.scheduled_start_date || 'Not scheduled'}</div>
              </div>
              <div>
                <span class="text-gray-500">Submitted</span>
                <div class="font-medium text-gray-900">{new Date(project.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            {#if project.estimate_pdf_url}
              <div class="mt-4 pt-4 border-t border-gray-100">
                <a href={project.estimate_pdf_url} target="_blank" class="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Download Estimate PDF &rarr;
                </a>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
