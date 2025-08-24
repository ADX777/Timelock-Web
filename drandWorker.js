self.onmessage = async (e) => {
	const { targetIso } = e.data || {};
	try {
		const res = await fetch('https://api.drand.sh/public/latest');
		const data = await res.json();
		const nowUnix = (data && data.time) ? data.time : Math.floor(Date.now() / 1000);
		const targetUnix = Math.floor(new Date(targetIso).getTime() / 1000);
		const met = Number.isFinite(targetUnix) ? (nowUnix >= targetUnix) : false;
		self.postMessage({
			ok: true,
			met,
			proof: {
				source: 'drand',
				round: data?.round,
				signature: data?.signature,
				time: nowUnix
			}
		});
	} catch (err) {
		const nowUnix = Math.floor(Date.now() / 1000);
		const targetUnix = Math.floor(new Date(targetIso).getTime() / 1000);
		self.postMessage({ ok: false, error: String(err), met: nowUnix >= targetUnix, proof: { source: 'drand', time: nowUnix } });
	}
};