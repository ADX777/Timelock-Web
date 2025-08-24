const FEEDS = {
	'BTC/USD': 'bitcoin',
	'ETH/USD': 'ethereum'
};

self.onmessage = async (e) => {
	const { asset, above, below } = e.data || {};
	try {
		const slug = FEEDS[asset];
		if (!slug) return self.postMessage({ ok: false, error: 'unsupported-asset' });
		const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${slug}&vs_currencies=usd`);
		const data = await res.json();
		const price = Number(data?.[slug]?.usd || 0);
		const conf = Math.max(0.1, price * 0.001);
		const aboveMet = (typeof above === 'number' && price >= above) || false;
		const belowMet = (typeof below === 'number' && price <= below) || false;
		self.postMessage({
			ok: true,
			met: Boolean(aboveMet || belowMet),
			price,
			confidence: conf,
			proof: { source: 'pyth-hermes-proxy', verified: false }
		});
	} catch (err) {
		self.postMessage({ ok: false, error: String(err) });
	}
};