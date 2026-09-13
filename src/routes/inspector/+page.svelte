<script lang="ts">
	import { enhance } from '$app/forms';
	import { emojiByKey } from '$lib/emojis';
	import { ago } from '$lib/i18n';

	let { data } = $props();
</script>

<svelte:head><title>the inspector · shit.so</title></svelte:head>

<h1 class="mt-4 text-2xl font-black">🕵️ the inspector</h1>
<p class="mt-1 text-sm text-neutral-500">approve puts it on the wall. reject deletes the file for good.</p>

{#snippet queue(title: string, rows: typeof data.pending, empty: string)}
	<section class="mt-8">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{title} · {rows.length}</h2>
		{#if rows.length === 0}
			<p class="text-sm text-neutral-600">{empty}</p>
		{:else}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
				{#each rows as b (b.id)}
					<div class="rounded-sm bg-[#f5f5f0] p-1.5 text-neutral-700 shadow-lg">
						<img src={b.url} alt="" class="w-full" />
						<div class="px-0.5 pt-1 text-[11px]">
							<div class="truncate">{b.voterHandle ? `@${b.voterHandle}` : '?'} → <a href="/@{b.target}" class="font-semibold underline">@{b.target}</a></div>
							<div class="text-neutral-500">{emojiByKey(b.emoji)?.char} · {ago(data.locale, b.createdAt)}{b.reports ? ` · ${b.reports} reports` : ''}{b.status !== 'pending' ? ` · ${b.status}` : ''}</div>
						</div>
						<form method="POST" action="?/decide" use:enhance class="mt-1.5 grid grid-cols-2 gap-1">
							<input type="hidden" name="id" value={b.id} />
							<button name="decision" value="approve" class="rounded bg-emerald-600 py-1 text-[11px] font-bold text-white hover:bg-emerald-500">approve</button>
							<button name="decision" value="reject" class="rounded bg-red-700 py-1 text-[11px] font-bold text-white hover:bg-red-600">reject</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/snippet}

{@render queue('pending', data.pending, 'queue is empty. go outside.')}
{@render queue('reported', data.reported, 'nobody is mad. suspicious.')}
