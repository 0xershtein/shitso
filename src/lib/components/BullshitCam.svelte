<script lang="ts">
	import { onDestroy } from 'svelte';
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
		shot = capture();
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

		// cover-crop the video into the photo area, mirrored like a selfie
		const vw = v.videoWidth || 640, vh = v.videoHeight || 480;
		const scale = Math.max(PX / vw, PY / vh);
		const sw = PX / scale, sh = PY / scale;
		const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
		ctx.save();
		ctx.filter = 'grayscale(1) contrast(1.35) brightness(1.05) sepia(0.12)';
		ctx.translate(20 + PX, 20);
		ctx.scale(-1, 1);
		ctx.drawImage(v, sx, sy, sw, sh, 0, 0, PX, PY);
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

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
	<div class="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl">
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-lg font-black">📸 {t(L, 'bs.title')}</h3>
			<button onclick={close} class="text-neutral-500 hover:text-neutral-200" aria-label={t(L, 'bs.cancel')}>✕</button>
		</div>

		{#if step === 'consent'}
			<p class="text-sm leading-relaxed text-neutral-400">{t(L, 'bs.consent', { d: ttlDays })}</p>
			<button onclick={startCamera} class="mt-5 w-full rounded-lg bg-white py-3 font-semibold text-black hover:bg-neutral-200">{t(L, 'bs.consentOk')}</button>
		{:else if step === 'camera' || step === 'countdown'}
			<div class="relative mx-auto aspect-[8/9] w-64 overflow-hidden rounded-lg bg-black">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={video} autoplay playsinline muted class="size-full -scale-x-100 object-cover [filter:grayscale(1)_contrast(1.35)_brightness(1.05)_sepia(0.12)]"></video>
				{#if step === 'countdown'}
					<div class="absolute inset-0 flex items-center justify-center bg-black/30 text-8xl font-black text-white drop-shadow">{count}</div>
				{/if}
			</div>
			<button onclick={takeIt} disabled={step === 'countdown'} class="mt-4 w-full rounded-lg bg-white py-3 font-semibold text-black hover:bg-neutral-200 disabled:opacity-50">{t(L, 'bs.take')}</button>
		{:else if step === 'review' && shot}
			<img src={shot} alt="" class="mx-auto w-64 rotate-[-2deg] rounded-sm shadow-xl" />
			<div class="mt-5 grid grid-cols-2 gap-2">
				<button onclick={retake} class="rounded-lg border border-neutral-800 py-3 font-semibold hover:bg-neutral-900">{t(L, 'bs.retake')}</button>
				<button onclick={sendIt} class="rounded-lg bg-white py-3 font-semibold text-black hover:bg-neutral-200">{t(L, 'bs.send')}</button>
			</div>
		{:else if step === 'sending'}
			<p class="py-8 text-center text-sm text-neutral-400">{t(L, 'bs.sending')}</p>
		{:else if step === 'done'}
			<p class="py-6 text-center text-sm text-emerald-400">{t(L, 'bs.done')}</p>
			<button onclick={close} class="w-full rounded-lg border border-neutral-800 py-3 font-semibold hover:bg-neutral-900">ok</button>
		{:else if step === 'error'}
			<p class="py-4 text-center text-sm text-red-400">{error}</p>
			<div class="grid grid-cols-2 gap-2">
				<button onclick={close} class="rounded-lg border border-neutral-800 py-3 font-semibold hover:bg-neutral-900">{t(L, 'bs.cancel')}</button>
				<button onclick={() => { error = null; step = stream ? 'camera' : 'consent'; }} class="rounded-lg bg-white py-3 font-semibold text-black hover:bg-neutral-200">{t(L, 'bs.retake')}</button>
			</div>
		{/if}
	</div>
</div>
