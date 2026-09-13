<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { t, type Locale } from '$lib/i18n';

	let {
		handle,
		emojiChar,
		locale,
		ttlDays,
		onclose,
		ondone
	}: {
		handle: string;
		emojiChar: string;
		locale: Locale;
		ttlDays: number;
		onclose: () => void;
		ondone: (url: string) => void;
	} = $props();

	type Step = 'consent' | 'camera' | 'countdown' | 'review' | 'sending' | 'done' | 'error';
	let step = $state<Step>('consent');
	let error = $state<string | null>(null);
	let count = $state(3);
	let flash = $state(false);
	const stepIndex = $derived(step === 'consent' ? 0 : step === 'camera' || step === 'countdown' ? 1 : 2);
	let shot = $state<string | null>(null);
	let video: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | null = null;

	const L = $derived(locale);

	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
				audio: false
			});
			step = 'camera';
			await tick();
			if (video) {
				video.srcObject = stream;
				await video.play();
			}
		} catch {
			error = t(L, 'bs.camDenied');
			step = 'error';
		}
	}
	const tick = () => new Promise((r) => setTimeout(r, 0));

	async function takeIt() {
		step = 'countdown';
		for (count = 3; count > 0; count--) await new Promise((r) => setTimeout(r, 700));
		flash = true;
		shot = capture();
		setTimeout(() => (flash = false), 350);
		step = 'review';
	}

	/** Polaroid: 360x460, photo 320x360 at (20,20), white band with emoji + brand. */
	function capture(): string {
		const v = video!;
		const W = 360, H = 460, PX = 320, PY = 360;
		const c = document.createElement('canvas');
		c.width = W;
		c.height = H;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = '#f5f5f0';
		ctx.fillRect(0, 0, W, H);

		// cover-crop the video into the photo area. Preview is mirrored like a selfie,
		// the saved shot is not, so text in the background reads correctly.
		const vw = v.videoWidth || 640, vh = v.videoHeight || 480;
		const scale = Math.max(PX / vw, PY / vh);
		const sw = PX / scale, sh = PY / scale;
		const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
		ctx.save();
		ctx.filter = 'grayscale(1) contrast(1.35) brightness(1.05) sepia(0.12)';
		ctx.drawImage(v, sx, sy, sw, sh, 20, 20, PX, PY);
		ctx.restore();

		// film grain + vignette
		const img = ctx.getImageData(20, 20, PX, PY);
		const d = img.data;
		for (let i = 0; i < d.length; i += 4) {
			const n = (Math.random() - 0.5) * 38;
			d[i] += n; d[i + 1] += n; d[i + 2] += n;
		}
		ctx.putImageData(img, 20, 20);
		const g = ctx.createRadialGradient(20 + PX / 2, 20 + PY / 2, PY * 0.35, 20 + PX / 2, 20 + PY / 2, PY * 0.75);
		g.addColorStop(0, 'rgba(0,0,0,0)');
		g.addColorStop(1, 'rgba(0,0,0,0.45)');
		ctx.fillStyle = g;
		ctx.fillRect(20, 20, PX, PY);

		// caption band
		ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
		ctx.fillStyle = '#525252';
		ctx.textBaseline = 'middle';
		ctx.fillText(`💩 shit.so · @${handle}`, 22, H - 40);
		ctx.font = '56px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText(emojiChar, W - 18, H - 42);
		return c.toDataURL('image/jpeg', 0.82);
	}

	async function sendIt() {
		if (!shot) return;
		step = 'sending';
		try {
			const n = await fetch(`/api/bullshit?handle=${handle}`).then((r) => r.json());
			if (!n.nonce) throw new Error(n.error || 'nonce');
			const r = await fetch('/api/bullshit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ handle, nonce: n.nonce, image: shot })
			});
			const body = await r.json();
			if (!r.ok) throw new Error(body.error || 'error');
			stop();
			step = 'done';
			ondone(body.url);
		} catch (e) {
			error = (e as Error).message;
			step = 'error';
		}
	}

	function retake() {
		shot = null;
		step = 'camera';
	}
	function stop() {
		stream?.getTracks().forEach((tr) => tr.stop());
		stream = null;
	}
	function close() {
		stop();
		onclose();
	}
	onDestroy(stop);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" transition:fade={{ duration: 150 }}>
	<div class="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl" transition:scale={{ start: 0.96, duration: 180 }}>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-xl font-black">📸 {t(L, 'bs.title')}</h3>
			<button onclick={close} class="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200" aria-label={t(L, 'bs.cancel')}>✕</button>
		</div>

		<div class="mb-5 flex gap-1.5">
			{#each [0, 1, 2] as i (i)}
				<div class="h-1 flex-1 rounded-full transition-colors {i <= stepIndex ? 'bg-white' : 'bg-neutral-800'}"></div>
			{/each}
		</div>

		{#if step === 'consent'}
			<div in:fly={{ y: 8, duration: 180 }}>
				<p class="text-sm leading-relaxed text-neutral-300">{t(L, 'bs.consent', { d: ttlDays })}</p>
				<ul class="mt-4 space-y-2 text-xs text-neutral-500">
					<li class="flex items-center gap-2"><span class="text-base">🚫</span> {t(L, 'bs.p1')}</li>
					<li class="flex items-center gap-2"><span class="text-base">🕵️</span> {t(L, 'bs.p2')}</li>
					<li class="flex items-center gap-2"><span class="text-base">💣</span> {t(L, 'bs.p3', { d: ttlDays })}</li>
				</ul>
				<button onclick={startCamera} class="mt-6 w-full rounded-xl bg-white py-3.5 text-base font-bold text-black hover:bg-neutral-200">{t(L, 'bs.consentOk')}</button>
			</div>
		{:else if step === 'camera' || step === 'countdown'}
			<div in:fly={{ y: 8, duration: 180 }}>
				<div class="mx-auto w-72 rotate-[-1.5deg] rounded-sm bg-[#f5f5f0] p-[5.5%] pb-[22%] shadow-2xl">
					<div class="relative aspect-[8/9] overflow-hidden bg-black">
						<!-- svelte-ignore a11y_media_has_caption -->
						<video bind:this={video} autoplay playsinline muted class="size-full -scale-x-100 object-cover [filter:grayscale(1)_contrast(1.35)_brightness(1.05)_sepia(0.12)]"></video>
						<div class="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]"></div>
						{#if step === 'countdown'}
							{#key count}
								<div class="absolute inset-0 flex items-center justify-center text-9xl font-black text-white drop-shadow-lg" in:scale={{ start: 1.6, duration: 300 }}>{count}</div>
							{/key}
						{/if}
						{#if flash}<div class="absolute inset-0 bg-white" out:fade={{ duration: 300 }}></div>{/if}
					</div>
					<div class="relative">
						<span class="absolute top-3 left-0 text-[11px] font-semibold text-neutral-500">💩 shit.so · @{handle}</span>
						<span class="absolute top-0.5 right-0 text-3xl">{emojiChar}</span>
					</div>
				</div>
				<button onclick={takeIt} disabled={step === 'countdown'} class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-base font-bold text-black hover:bg-neutral-200 disabled:opacity-50">
					<span class="inline-block size-3 rounded-full bg-red-600"></span> {t(L, 'bs.take')}
				</button>
			</div>
		{:else if step === 'review' && shot}
			<div in:fly={{ y: 8, duration: 180 }}>
				<img src={shot} alt="" class="mx-auto w-72 rotate-[1.5deg] rounded-sm shadow-2xl" in:scale={{ start: 0.9, duration: 250 }} />
				<div class="mt-6 grid grid-cols-2 gap-2">
					<button onclick={retake} class="rounded-xl border border-neutral-800 py-3.5 font-bold hover:bg-neutral-900">{t(L, 'bs.retake')}</button>
					<button onclick={sendIt} class="rounded-xl bg-white py-3.5 font-bold text-black hover:bg-neutral-200">{t(L, 'bs.send')} →</button>
				</div>
			</div>
		{:else if step === 'sending'}
			<div class="flex flex-col items-center gap-3 py-10 text-sm text-neutral-400" in:fade>
				<span class="size-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white"></span>
				{t(L, 'bs.sending')}
			</div>
		{:else if step === 'done'}
			<div class="py-4 text-center" in:fly={{ y: 8, duration: 180 }}>
				<div class="text-5xl">🫡</div>
				<p class="mt-3 text-sm text-emerald-400">{t(L, 'bs.done')}</p>
				<button onclick={close} class="mt-6 w-full rounded-xl border border-neutral-800 py-3.5 font-bold hover:bg-neutral-900">ok</button>
			</div>
		{:else if step === 'error'}
			<div in:fly={{ y: 8, duration: 180 }}>
				<p class="py-4 text-center text-sm text-red-400">{error}</p>
				<div class="grid grid-cols-2 gap-2">
					<button onclick={close} class="rounded-xl border border-neutral-800 py-3.5 font-bold hover:bg-neutral-900">{t(L, 'bs.cancel')}</button>
					<button onclick={() => { error = null; step = stream ? 'camera' : 'consent'; }} class="rounded-xl bg-white py-3.5 font-bold text-black hover:bg-neutral-200">{t(L, 'bs.retake')}</button>
				</div>
			</div>
		{/if}
	</div>
</div>
