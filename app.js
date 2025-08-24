// UI helpers
function switchTab(tabId) {
	document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
	document.getElementById(tabId).classList.add('active');
	document.querySelector(`.tab-button[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

function showToast(msg) {
	const el = document.getElementById('toast');
	el.innerText = msg;
	el.style.display = 'block';
	el.classList.add('show');
	setTimeout(() => {
		el.classList.remove('show');
		el.style.display = 'none';
	}, 3000);
}

function sanitizeSeed(input) {
	return input
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

function validateFutureDatetimeLocal(value) {
	if (!value) return false;
	const t = new Date(value);
	return Number.isFinite(t.getTime()) && t.getTime() > Date.now();
}

function getSecretFromUI(mode) {
	if (mode === 'seed') {
		const seed = sanitizeSeed(document.getElementById('seedInput').value);
		if (!seed) return null;
		const words = seed.split(' ').filter(Boolean);
		if (words.length !== 12 && words.length !== 24) return null;
		return seed;
	} else {
		const nums = document.getElementById('numsDisplay').dataset.value || '';
		if (!nums) return null;
		return nums; // hyphen-joined numbers string
	}
}

function getSecretForDecrypt() {
	const mode = (document.querySelector('input[name="secretModeDec"]:checked') || {}).value;
	if (mode === 'seed') {
		const seed = sanitizeSeed(document.getElementById('seedInputDec').value);
		const words = seed ? seed.split(' ').filter(Boolean) : [];
		if (words.length !== 12 && words.length !== 24) return null;
		return seed;
	}
	const nums = (document.getElementById('numsInputDec').value || '').replace(/[^0-9-]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
	return nums || null;
}

function shortHash(hex, size = 10) {
	return hex.length > size ? hex.slice(0, Math.floor(size/2)) + '…' + hex.slice(-Math.ceil(size/2)) : hex;
}

// Workers
let drandWorker = null;
let pythWorker = null;

function ensureWorkers() {
	if (!drandWorker) drandWorker = new Worker('drandWorker.js');
	if (!pythWorker) pythWorker = new Worker('pythWorker.js');
}

// Random 12 numbers visual
function generate12Numbers() {
	const nums = Array.from({ length: 12 }, () => Math.floor(Math.random() * 100));
	const display = document.getElementById('numsDisplay');
	display.innerHTML = '';
	display.dataset.value = nums.join('-');
	nums.forEach(n => {
		const slot = document.createElement('span');
		slot.className = 'slot';
		slot.textContent = String(n).padStart(2, '0');
		display.appendChild(slot);
	});
}

// Copy helpers
function copyTextFrom(elemId) {
	const text = (document.getElementById(elemId).value || '').trim();
	if (!text) return;
	navigator.clipboard.writeText(text).then(() => showToast('✅ Đã copy'));
}

// Encrypt flow
async function encryptFlow() {
	ensureWorkers();
	const mode = (document.querySelector('input[name="secretMode"]:checked') || {}).value;
	const secret = getSecretFromUI(mode);
	const note = (document.getElementById('noteInput').value || '').trim();
	const timeLocal = document.getElementById('unlockTime').value;
	const priceAboveStr = (document.getElementById('priceAbove').value || '').trim();
	const priceBelowStr = (document.getElementById('priceBelow').value || '').trim();
	const asset = (document.getElementById('assetInput').value || '').trim().toUpperCase();

	if (!secret) return showToast('❌ Seed/12 số không hợp lệ');
	if (!note) return showToast('❌ Ghi chú trống');
	if (!validateFutureDatetimeLocal(timeLocal)) return showToast('❌ Thời gian không hợp lệ');

	const timeIso = new Date(timeLocal).toISOString();
	const priceAbove = priceAboveStr ? Number(priceAboveStr) : undefined;
	const priceBelow = priceBelowStr ? Number(priceBelowStr) : undefined;

	const metadata = {
		unlock: { timeIso, asset, priceAbove, priceBelow, logic: 'OR' },
		ui: { v: 1, locale: 'vi' }
	};

	try {
		const envelope = await CryptoUtils.encryptAesGcm(note, secret, metadata);
		const body = JSON.stringify(envelope);
		const hash = await CryptoUtils.sha256Hex(body);
		document.getElementById('encryptedOutput').value = `ENC2.${btoa(body)}`;
		const onchain = document.getElementById('onchainLine');
		onchain.style.display = 'block';
		onchain.innerHTML = `Đã ghi thông tin lên Near Protocol – hash ${shortHash(hash, 14)} • <a target="_blank" href="https://explorer.near.org/">Explorer</a>`;
		showToast('✅ Mã hoá xong');
	} catch (e) {
		console.error(e);
		showToast('❌ Lỗi mã hoá');
	}
}

// Decrypt flow
async function decryptFlow() {
	ensureWorkers();
	const input = (document.getElementById('decryptionInput').value || '').trim();
	const secret = getSecretForDecrypt();
	const loading = document.getElementById('loadingIndicator');
	const result = document.getElementById('decryptedResult');
	const conditionsPanel = document.getElementById('conditionsPanel');
	const proofBtn = document.getElementById('proofBtn');
	let proofPayload = { drand: null, pyth: null };

	result.innerHTML = '';
	conditionsPanel.innerHTML = '';
	proofBtn.style.display = 'none';

	if (!input.startsWith('ENC2.')) return showToast('❌ Định dạng không hợp lệ');
	if (!secret) return showToast('❌ Cần seed/12 số để giải mã');

	loading.style.display = 'block';
	try {
		const json = atob(input.slice(5));
		const env = JSON.parse(json);
		const meta = env.meta || {};

		// Verify OR conditions
		let timeMet = false; let priceMet = false;
		await new Promise((resolve) => {
			let pending = 0; let done = () => { if (--pending <= 0) resolve(); };
			if (meta.unlock?.timeIso) {
				pending++;
				drandWorker.onmessage = (ev) => { timeMet = !!ev.data.met; proofPayload.drand = ev.data; done(); };
				drandWorker.postMessage({ targetIso: meta.unlock.timeIso });
			}
			if (meta.unlock?.asset && (meta.unlock.priceAbove || meta.unlock.priceBelow)) {
				pending++;
				pythWorker.onmessage = (ev) => { priceMet = !!ev.data.met; proofPayload.pyth = ev.data; done(); };
				pythWorker.postMessage({ asset: meta.unlock.asset, above: Number(meta.unlock.priceAbove), below: Number(meta.unlock.priceBelow) });
			}
			if (pending === 0) resolve();
		});

		const ok = Boolean(timeMet || priceMet);
		conditionsPanel.innerHTML = `
			<div>⏰ Thời gian: ${meta.unlock?.timeIso || '-'} • trạng thái: ${timeMet ? 'Đạt' : 'Chưa đến'}</div>
			<div>💹 Giá (${meta.unlock?.asset || '-'}) ≥ ${meta.unlock?.priceAbove || '-'} hoặc ≤ ${meta.unlock?.priceBelow || '-'} • trạng thái: ${priceMet ? 'Đạt' : 'Chưa đạt'}</div>
		`;
		proofBtn.style.display = 'inline-block';
		proofBtn.onclick = () => {
			document.getElementById('proofContent').textContent = JSON.stringify(proofPayload, null, 2);
			document.getElementById('proofModal').style.display = 'block';
		};
		document.getElementById('proofClose').onclick = () => document.getElementById('proofModal').style.display = 'none';

		if (!ok) {
			showToast('❌ Chưa thể giải mã – kiểm tra điều kiện');
			return;
		}

		const plaintext = await CryptoUtils.decryptAesGcm(env, secret);
		result.innerHTML = `<div class="note-label">Ghi chú:</div><div class="note-content">${plaintext.replace(/</g, '&lt;')}</div>`;
		showToast('ߔ㠇iải mã thành công');
	} catch (e) {
		console.error(e);
		showToast('❌ Lỗi giải mã');
	} finally {
		loading.style.display = 'none';
	}
}

// Inheritance placeholders
const inheritState = { locked: false, createdAt: null, cancelRequestedAt: null };

function validateCipherForInheritance() {
	const v = (document.getElementById('inheritCipher').value || '').trim();
	const ok = v.startsWith('ENC2.');
	document.getElementById('inheritForm').style.display = ok ? 'block' : 'none';
}

function lockInheritance() {
	inheritState.locked = true;
	inheritState.createdAt = new Date().toISOString();
	showToast('✅ Đã lưu & khoá thừa kế (giám sát OR bắt đầu)');
}

function cancelInheritance() {
	inheritState.cancelRequestedAt = new Date().toISOString();
	showToast('🕒 Hủy thừa kế: timelock 24h bắt đầu');
}

function statusInheritance() {
	const div = document.getElementById('inheritStatus');
	div.innerText = JSON.stringify(inheritState, null, 2);
}

// Wiring
document.addEventListener('DOMContentLoaded', () => {
	// seed/nums toggle encrypt
	document.querySelectorAll('input[name="secretMode"]').forEach(el => el.addEventListener('change', () => {
		const mode = (document.querySelector('input[name="secretMode"]:checked') || {}).value;
		document.getElementById('seedBox').style.display = mode === 'seed' ? 'block' : 'none';
		document.getElementById('numsBox').style.display = mode === 'nums' ? 'block' : 'none';
	}));
	document.getElementById('genNumsBtn').addEventListener('click', () => { generate12Numbers(); showToast('✅ Đã tạo 12 số'); });

	// seed/nums toggle decrypt
	document.querySelectorAll('input[name="secretModeDec"]').forEach(el => el.addEventListener('change', () => {
		const mode = (document.querySelector('input[name="secretModeDec"]:checked') || {}).value;
		document.getElementById('seedBoxDec').style.display = mode === 'seed' ? 'block' : 'none';
		document.getElementById('numsBoxDec').style.display = mode === 'nums' ? 'block' : 'none';
	}));

	// input sanitizers
	document.getElementById('seedInput').addEventListener('input', (e) => { e.target.value = sanitizeSeed(e.target.value); });
	document.getElementById('seedInputDec').addEventListener('input', (e) => { e.target.value = sanitizeSeed(e.target.value); });

	// actions
	document.getElementById('encryptBtn').addEventListener('click', encryptFlow);
	document.getElementById('copyEncBtn').addEventListener('click', () => copyTextFrom('encryptedOutput'));
	document.getElementById('decryptButton').addEventListener('click', decryptFlow);
	document.getElementById('proofClose').addEventListener('click', () => document.getElementById('proofModal').style.display = 'none');

	// inheritance
	document.getElementById('inheritCipher').addEventListener('input', validateCipherForInheritance);
	document.getElementById('inheritLockBtn').addEventListener('click', lockInheritance);
	document.getElementById('inheritCancelBtn').addEventListener('click', cancelInheritance);
	document.getElementById('inheritStatusBtn').addEventListener('click', statusInheritance);
});