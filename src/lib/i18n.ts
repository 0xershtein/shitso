export type Locale = 'en' | 'tr';
export const LOCALES: Locale[] = ['en', 'tr'];

type Dict = Record<string, string>;

const en: Dict = {
	'nav.signin': 'sign in',
	'nav.signout': 'sign out',
	'footer.rule': 'one X account, one vote per person. {f}+ followers, {d}+ day old account. change your mind anytime.',

	'home.title': 'give a shit.',
	'home.sub': 'rate anyone on X with one of ten emojis. one vote per person, and you can change it whenever they change.',
	'home.placeholder': 'elonmusk',
	'home.lookup': 'look up',
	'home.badHandle': 'that is not an X handle',
	'home.stats': '{votes} shits given about {targets} people',
	'home.hot': '🔥 hot right now · last 24h',
	'home.today': '+{n} today',
	'home.votes': '{n} votes',
	'home.mostShit': 'most shit',
	'home.mostGoat': 'most goat',
	'home.emptyShit': 'nobody is shit yet. suspicious.',
	'home.emptyGoat': 'no goats yet. be the first to respect someone.',
	'home.live': 'live shits',
	'home.someone': 'someone',
	'home.gave': 'gave',
	'home.to': 'to',

	'profile.nobody': 'nobody has given a shit yet.',
	'profile.shit': 'shit',
	'profile.vote': 'vote',
	'profile.votes': 'votes',
	'profile.mostly': 'mostly',
	'profile.moreVotes': '{n} more {votes} until a tier is assigned.',
	'profile.give': 'give a shit',
	'profile.yours': 'your shit',
	'profile.self': 'this is you. you cannot rate yourself, but you can share this page and find out.',
	'profile.remove': "actually, i don't give a shit anymore",
	'profile.signinHint': "you'll be asked to sign in with X first. {f}+ followers, {d}+ day old account.",
	'profile.peopleWhoCare': 'people who care',
	'profile.last24h': 'last 24h',
	'profile.dayBefore': '{n} the day before',
	'profile.mindChanges': 'mind changes',
	'profile.editedOrRemoved': 'votes edited or removed',
	'profile.lastShit': 'last shit',
	'profile.first': 'first {t}',
	'profile.rhythm': 'shit rhythm',
	'profile.perDay': 'shits/day',
	'profile.newThisWeek': 'new this week',
	'profile.vsLastWeek': '{pct}% vs last week',
	'profile.daysAgo': '14 days ago',
	'profile.today': 'today',
	'profile.virality': 'virality potential',
	'profile.breakdown': 'the breakdown',
	'profile.share': 'share this on X',
	'profile.shareRated': '@{h} is {e} {tier} ({pct}% shit, {n} votes). agree? {url}',
	'profile.shareUnrated': 'does @{h} deserve a 💩 or a 🐐? give a shit: {url}',
	'profile.x': 'x ↗',
	'profile.tierPending': 'no verdict yet',

	'ago.now': 'just now',
	'ago.m': '{n}m ago',
	'ago.h': '{n}h ago',
	'ago.d': '{n}d ago',
	'ago.short.now': 'now',
	'ago.short.m': '{n}m',
	'ago.short.h': '{n}h',
	'ago.short.d': '{n}d',

	'v.volume': 'volume',
	'v.heat': 'heat',
	'v.controversy': 'controversy',
	'v.diversity': 'diversity',
	'v.dead': 'dead',
	'v.simmering': 'simmering',
	'v.spicy': 'spicy',
	'v.volatile': 'volatile',
	'v.blow': 'about to blow up',

	'tier.unrated.label': 'unrated',
	'tier.unrated.blurb': 'nobody has given a shit yet.',
	'tier.respected.label': 'respected',
	'tier.respected.blurb': 'the people have spoken. this one is alright.',
	'tier.questionable.label': 'questionable',
	'tier.questionable.blurb': 'jury is out. keep an eye on this one.',
	'tier.certified.label': 'certified shit',
	'tier.certified.blurb': 'most people who bothered think this account is shit.',
	'tier.certified.warning': 'heads up: the majority of voters flagged this account as shit. read with caution.',
	'tier.biohazard.label': 'biohazard',
	'tier.biohazard.blurb': 'this is not an account, this is a hazard zone.',
	'tier.biohazard.warning': 'biohazard: almost everyone who voted thinks this account is shit. do not engage without protection.',

	'emoji.shit': 'shit',
	'emoji.cap': 'cap',
	'emoji.clown': 'clown',
	'emoji.snake': 'snake',
	'emoji.bot': 'bot',
	'emoji.brain': 'big brain',
	'emoji.fire': 'fire',
	'emoji.goat': 'goat',
	'emoji.respect': 'respect',
	'emoji.gem': 'gem',

	'signin.title': 'sign in to give a shit',
	'signin.sub': 'one account, one vote per person. we only read your handle, follower count and account age.',
	'signin.x': 'continue with X',
	'signin.none': 'no login provider configured yet.',

	'err.Configuration.title': 'that took too long.',
	'err.Configuration.body': 'the X login screen sat open for more than 15 minutes, so the sign-in expired. try again and click authorize right away.',
	'err.AccessDenied.title': 'you said no.',
	'err.AccessDenied.body': 'you cancelled on the X screen. no hard feelings, you can still browse.',
	'err.OAuthCallbackError.title': 'X hiccupped.',
	'err.OAuthCallbackError.body': 'the handshake with X failed halfway. try once more.',
	'err.Default.title': 'something went sideways.',
	'err.Default.body': 'sign-in failed. try again, and if it keeps happening tell @erendotdmg.',
	'err.retry': 'try again',
	'err.code': 'error code: {c}',

	'elig.signin': 'sign in with X first.',
	'elig.xOnly': 'only X accounts can give a shit.',
	'elig.noProfile': 'could not read your X profile. sign out and back in.',
	'elig.followers': 'you need {f}+ followers to give a shit. bots stay quiet.',
	'elig.age': 'your X account needs to be {d}+ days old. come back soon.',
	'vote.self': 'you cannot rate yourself, nice try',
	'vote.unknown': 'unknown emoji',
	'vote.cooldown': 'easy. wait {s} seconds between changes.'
};

const tr: Dict = {
	'nav.signin': 'giriş yap',
	'nav.signout': 'çıkış',
	'footer.rule': 'bir X hesabı, kişi başı bir oy. {f}+ takipçi, {d}+ günlük hesap. fikrin değişince oyun da değişir.',

	'home.title': 'give a shit.',
	'home.sub': "X'teki herhangi birine on emojiden birini bırak. kişi başı bir oy, o değişince sen de değiştirirsin.",
	'home.placeholder': 'elonmusk',
	'home.lookup': 'bak',
	'home.badHandle': 'bu bir X kullanıcı adı değil',
	'home.stats': '{targets} kişi hakkında {votes} shit verildi',
	'home.hot': '🔥 şu an sıcak · son 24 saat',
	'home.today': 'bugün +{n}',
	'home.votes': '{n} oy',
	'home.mostShit': 'en shit',
	'home.mostGoat': 'en goat',
	'home.emptyShit': 'henüz kimse shit değil. şüpheli.',
	'home.emptyGoat': 'henüz goat yok. ilk saygıyı sen ver.',
	'home.live': 'canlı shitler',
	'home.someone': 'biri',
	'home.gave': 'verdi:',
	'home.to': '→',

	'profile.nobody': 'henüz kimse bir shit vermedi.',
	'profile.shit': 'shit',
	'profile.vote': 'oy',
	'profile.votes': 'oy',
	'profile.mostly': 'çoğunlukla',
	'profile.moreVotes': 'seviye için {n} oy daha lazım.',
	'profile.give': 'give a shit',
	'profile.yours': 'senin shitin',
	'profile.self': 'bu sensin. kendine oy veremezsin ama sayfayı paylaşıp öğrenebilirsin.',
	'profile.remove': 'aslında artık umrumda değil',
	'profile.signinHint': "önce X ile giriş istenecek. {f}+ takipçi, {d}+ günlük hesap.",
	'profile.peopleWhoCare': 'umursayan',
	'profile.last24h': 'son 24 saat',
	'profile.dayBefore': 'önceki gün {n}',
	'profile.mindChanges': 'fikir değişimi',
	'profile.editedOrRemoved': 'düzenlenen veya silinen oy',
	'profile.lastShit': 'son shit',
	'profile.first': 'ilki {t}',
	'profile.rhythm': 'bok ritmi',
	'profile.perDay': 'shit/gün',
	'profile.newThisWeek': 'bu hafta yeni',
	'profile.vsLastWeek': 'geçen haftaya göre %{pct}',
	'profile.daysAgo': '14 gün önce',
	'profile.today': 'bugün',
	'profile.virality': 'viralite potansiyeli',
	'profile.breakdown': 'dağılım',
	'profile.share': "X'te paylaş",
	'profile.shareRated': '@{h} {e} {tier} (%{pct} shit, {n} oy). katılıyor musun? {url}',
	'profile.shareUnrated': '@{h} 💩 mu 🐐 mu? sen de ver: {url}',
	'profile.x': 'x ↗',
	'profile.tierPending': 'henüz karar yok',

	'ago.now': 'az önce',
	'ago.m': '{n} dk önce',
	'ago.h': '{n} sa önce',
	'ago.d': '{n} gün önce',
	'ago.short.now': 'şimdi',
	'ago.short.m': '{n}dk',
	'ago.short.h': '{n}sa',
	'ago.short.d': '{n}g',

	'v.volume': 'hacim',
	'v.heat': 'ısı',
	'v.controversy': 'tartışma',
	'v.diversity': 'çeşitlilik',
	'v.dead': 'ölü',
	'v.simmering': 'kaynamaya başlıyor',
	'v.spicy': 'acı',
	'v.volatile': 'oynak',
	'v.blow': 'patlamak üzere',

	'tier.unrated.label': 'puansız',
	'tier.unrated.blurb': 'henüz kimse bir shit vermedi.',
	'tier.respected.label': 'saygın',
	'tier.respected.blurb': 'halk konuştu. bu iyi biri.',
	'tier.questionable.label': 'şüpheli',
	'tier.questionable.blurb': 'jüri karar vermedi. gözün üstünde olsun.',
	'tier.certified.label': 'onaylı shit',
	'tier.certified.blurb': 'oy verenlerin çoğu bu hesabın shit olduğunu düşünüyor.',
	'tier.certified.warning': 'dikkat: oy verenlerin çoğunluğu bu hesabı shit olarak işaretledi. temkinli oku.',
	'tier.biohazard.label': 'biyolojik tehlike',
	'tier.biohazard.blurb': 'bu bir hesap değil, tehlikeli bölge.',
	'tier.biohazard.warning': 'biyolojik tehlike: oy veren neredeyse herkes bu hesabın shit olduğunu düşünüyor. korumasız yaklaşma.',

	'emoji.shit': 'bok',
	'emoji.cap': 'yalan',
	'emoji.clown': 'palyaço',
	'emoji.snake': 'yılan',
	'emoji.bot': 'bot',
	'emoji.brain': 'koca beyin',
	'emoji.fire': 'ateş',
	'emoji.goat': 'goat',
	'emoji.respect': 'saygı',
	'emoji.gem': 'elmas',

	'signin.title': 'shit vermek için giriş yap',
	'signin.sub': 'bir hesap, kişi başı bir oy. sadece kullanıcı adını, takipçi sayını ve hesap yaşını okuyoruz.',
	'signin.x': 'X ile devam et',
	'signin.none': 'henüz giriş sağlayıcısı ayarlanmamış.',

	'err.Configuration.title': 'çok uzun sürdü.',
	'err.Configuration.body': 'X giriş ekranı 15 dakikadan uzun açık kaldı, oturum zaman aşımına uğradı. tekrar dene ve hemen onayla.',
	'err.AccessDenied.title': 'hayır dedin.',
	'err.AccessDenied.body': 'X ekranında iptal ettin. sorun değil, gezmeye devam edebilirsin.',
	'err.OAuthCallbackError.title': 'X tökezledi.',
	'err.OAuthCallbackError.body': 'X ile el sıkışma yarıda kaldı. bir daha dene.',
	'err.Default.title': 'bir şeyler ters gitti.',
	'err.Default.body': 'giriş başarısız. tekrar dene, devam ederse @erendotdmg’e söyle.',
	'err.retry': 'tekrar dene',
	'err.code': 'hata kodu: {c}',

	'elig.signin': 'önce X ile giriş yap.',
	'elig.xOnly': 'sadece X hesapları shit verebilir.',
	'elig.noProfile': 'X profilin okunamadı. çıkıp tekrar gir.',
	'elig.followers': 'shit vermek için {f}+ takipçi lazım. botlar sessiz kalsın.',
	'elig.age': 'X hesabın en az {d} günlük olmalı. yakında gel.',
	'vote.self': 'kendine oy veremezsin, iyi denemeydi',
	'vote.unknown': 'bilinmeyen emoji',
	'vote.cooldown': 'sakin. değişiklikler arasında {s} saniye bekle.'
};

const dicts: Record<Locale, Dict> = { en, tr };

export function t(locale: Locale, key: string, vars: Record<string, string | number> = {}): string {
	let s = dicts[locale][key] ?? en[key] ?? key;
	for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
	return s;
}

export function isLocale(x: unknown): x is Locale {
	return typeof x === 'string' && (LOCALES as string[]).includes(x);
}

export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
	if (isLocale(cookie)) return cookie;
	const first = (acceptLanguage ?? '')
		.split(',')
		.map((p) => p.trim().split(';')[0].toLowerCase())
		.find((l) => l.startsWith('tr') || l.startsWith('en'));
	return first?.startsWith('tr') ? 'tr' : 'en';
}

/** Relative time, localized. `short` for feeds. */
export function ago(locale: Locale, d: Date | string | null, short = false): string {
	if (!d) return '—';
	const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
	const p = short ? 'ago.short.' : 'ago.';
	if (s < 60) return t(locale, p + 'now');
	if (s < 3600) return t(locale, p + 'm', { n: Math.floor(s / 60) });
	if (s < 86400) return t(locale, p + 'h', { n: Math.floor(s / 3600) });
	return t(locale, p + 'd', { n: Math.floor(s / 86400) });
}
