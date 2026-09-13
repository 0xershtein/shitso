<script lang="ts">
	import { t } from '$lib/i18n';
	import meta from '$lib/extension-meta.json';
	let { data } = $props();
	const L = $derived(data.locale);
	const EXT_REPO = 'https://github.com/0xershtein/shitso-extension';
	const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
	const HASH_CMD = 'shasum -a 256 shitso-extension.zip';
	const DIFF_CMD = `git clone ${EXT_REPO}.git\ndiff -r -x .git -x .github -x README.md -x .DS_Store shitso-extension ./unzipped-folder`;
	let copied = $state('');
	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = text;
			setTimeout(() => (copied = copied === text ? '' : copied), 1500);
		} catch {}
	}
</script>

<svelte:head>
	<title>{t(L, 'ext.title')} · shit.so</title>
	<meta name="description" content={t(L, 'ext.sub')} />
	<link rel="canonical" href="https://shit.so/extension" />
</svelte:head>

<section class="py-10">
	<h1 class="text-4xl font-black tracking-tight">🧩 {t(L, 'ext.title')}</h1>
	<p class="mt-3 max-w-xl text-neutral-400">{t(L, 'ext.sub')}</p>

	<div class="mt-8 grid gap-3 sm:grid-cols-3">
		{#each ['feed', 'profile', 'counts'] as k (k)}
			<div class="rounded-lg border border-neutral-900 bg-neutral-950/60 p-4">
				<div class="text-2xl">{t(L, `ext.f.${k}.icon`)}</div>
				<div class="mt-2 font-bold">{t(L, `ext.f.${k}`)}</div>
				<p class="mt-1 text-sm text-neutral-400">{t(L, `ext.f.${k}.d`)}</p>
			</div>
		{/each}
	</div>

	<h2 class="mt-12 text-sm font-semibold uppercase tracking-wider text-neutral-500">{t(L, 'ext.install')}</h2>
	<p class="mt-2 text-sm text-neutral-400">{t(L, 'ext.noStore')}</p>
	<ol class="mt-4 space-y-3">
		{#each [1, 2, 3, 4] as n (n)}
			<li class="flex gap-3">
				<span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold">{n}</span>
				<div class="text-sm leading-7">
					{#if n === 1}
						<a href="/downloads/shitso-extension.zip" class="font-semibold underline decoration-neutral-700 hover:decoration-white">{t(L, 'ext.s1')}</a>
						<span class="text-neutral-500"> · {t(L, 'ext.source')}: <a href="https://github.com/0xershtein/shitso-extension" target="_blank" rel="noopener" class="underline hover:text-neutral-300">github</a></span>
					{:else}
						{t(L, `ext.s${n}`)}
					{/if}
				</div>
			</li>
		{/each}
	</ol>
	<a href="/downloads/shitso-extension.zip" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black hover:bg-neutral-200">⬇️ {t(L, 'ext.download')}</a>

	<p class="mt-8 text-xs text-neutral-500">{t(L, 'ext.privacy')}</p>
</section>

{#snippet cmd(text: string)}
	<div class="group relative mt-2">
		<pre class="overflow-x-auto rounded-lg border border-neutral-900 bg-black px-3 py-2.5 pr-16 font-mono text-xs leading-5 text-neutral-200">{text}</pre>
		<button type="button" onclick={() => copy(text)} class="absolute top-1.5 right-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-[10px] text-neutral-400 hover:text-white">{copied === text ? '✓' : 'copy'}</button>
	</div>
{/snippet}

<section id="verify" class="border-t border-neutral-900 py-10">
	<h2 class="text-2xl font-black tracking-tight">🔍 {t(L, 'ext.verify')}</h2>
	<p class="mt-2 max-w-xl text-sm text-neutral-400">{t(L, 'ext.verify.sub')}</p>

	<div class="mt-6 grid gap-3">
		<div class="min-w-0 rounded-lg border border-neutral-900 bg-neutral-950/60 p-4">
			<div class="font-bold">1 · {t(L, 'ext.verify.hash')}</div>
			<p class="mt-1 text-sm text-neutral-400">{t(L, 'ext.verify.hashD')}</p>
			{@render cmd(HASH_CMD)}
			<div class="mt-3 text-[11px] uppercase tracking-wider text-neutral-500">sha-256 · v{meta.version} · {kb(meta.bytes)}</div>
			<code class="mt-1 block break-all rounded-lg bg-emerald-950/40 px-3 py-2 font-mono text-xs text-emerald-300">{meta.sha256}</code>
		</div>
		<div class="min-w-0 rounded-lg border border-neutral-900 bg-neutral-950/60 p-4">
			<div class="font-bold">2 · {t(L, 'ext.verify.source')}</div>
			<p class="mt-1 text-sm text-neutral-400">{t(L, 'ext.verify.sourceD')}</p>
			{@render cmd(DIFF_CMD)}
			<a href={EXT_REPO} target="_blank" rel="noopener" class="mt-3 inline-block text-xs text-neutral-400 underline hover:text-neutral-200">github.com/0xershtein/shitso-extension ↗</a>
		</div>
	</div>

	<div class="mt-3 grid gap-3 md:grid-cols-2">
		<div class="min-w-0 rounded-lg border border-neutral-900 bg-neutral-950/60 p-4">
			<div class="font-bold">3 · {t(L, 'ext.verify.perms')}</div>
			<ul class="mt-2 space-y-2 text-sm text-neutral-300">
				{#if meta.permissions.includes('storage')}<li>🗄️ {t(L, 'ext.verify.permStorage')}</li>{/if}
				<li>📡 {t(L, 'ext.verify.permHosts')}: {#each meta.hosts as h, i (h)}<code class="font-mono text-xs text-neutral-400">{h.replace('https://', '').replace('/*', '')}</code>{i < meta.hosts.length - 1 ? ', ' : ''}{/each}</li>
				<li>🧩 {t(L, 'ext.verify.permPages')}: {#each meta.matches as h, i (h)}<code class="font-mono text-xs text-neutral-400">{h.replace('https://', '').replace('/*', '')}</code>{i < meta.matches.length - 1 ? ', ' : ''}{/each}</li>
			</ul>
			<p class="mt-3 text-xs text-neutral-500">🚫 {t(L, 'ext.verify.permNot')}</p>
			<details class="mt-3 text-xs text-neutral-500">
				<summary class="cursor-pointer hover:text-neutral-300">{t(L, 'ext.verify.files')} ({meta.files.length})</summary>
				<ul class="mt-2 font-mono">
					{#each meta.files as f (f)}<li><a href="{EXT_REPO}/blob/main/{f}" target="_blank" rel="noopener" class="hover:text-neutral-300">{f}</a></li>{/each}
				</ul>
			</details>
		</div>
		<div class="min-w-0 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4">
			<div class="font-bold">4 · 🔒 {t(L, 'ext.verify.x')}</div>
			<p class="mt-2 text-sm text-neutral-300">{t(L, 'ext.verify.xD')}</p>
			<div class="mt-3 flex flex-wrap gap-1.5">
				<span class="rounded-full border border-emerald-800/60 px-2 py-0.5 font-mono text-[11px] text-emerald-300">users.read</span>
				<span class="rounded-full border border-emerald-800/60 px-2 py-0.5 font-mono text-[11px] text-emerald-300">tweet.read</span>
				<span class="rounded-full border border-neutral-800 px-2 py-0.5 font-mono text-[11px] text-neutral-600 line-through">tweet.write</span>
				<span class="rounded-full border border-neutral-800 px-2 py-0.5 font-mono text-[11px] text-neutral-600 line-through">offline.access</span>
			</div>
		</div>
	</div>
</section>
