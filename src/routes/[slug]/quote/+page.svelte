<script lang="ts">
  import type { PageData } from './$types.js';
  import IntakeWizard from '$lib/components/IntakeWizard.svelte';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Get a Free Quote — {data.tenant.company_name}</title>
  <meta name="description" content="Get an instant interior painting quote from {data.tenant.company_name}." />
</svelte:head>

<IntakeWizard tenant={data.tenant} catalog={data.catalog} />
