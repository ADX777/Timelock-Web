/* Minimal crypto helpers for AES-256-GCM with AAD */
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getRandomBytes(length) {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return bytes;
}

function bytesToBase64(bytes) {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

function base64ToBytes(b64) {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

async function sha256Hex(input) {
	const data = typeof input === 'string' ? textEncoder.encode(input) : input;
	const hash = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveAesGcmKey(secret, saltBytes, iterations = 120000) {
	const secretBytes = textEncoder.encode(secret);
	const baseKey = await crypto.subtle.importKey(
		'raw',
		secretBytes,
		'PBKDF2',
		false,
		['deriveKey']
	);
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

async function encryptAesGcm(plaintext, secret, metadataObj) {
	const iv = getRandomBytes(12);
	const salt = getRandomBytes(16);
	const key = await deriveAesGcmKey(secret, salt);
	const aadBytes = textEncoder.encode(JSON.stringify(metadataObj));
	const ptBytes = textEncoder.encode(plaintext);
	const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aadBytes }, key, ptBytes);
	const ctBytes = new Uint8Array(ct);
	return {
		v: 1,
		iv: bytesToBase64(iv),
		salt: bytesToBase64(salt),
		ct: bytesToBase64(ctBytes),
		meta: metadataObj
	};
}

async function decryptAesGcm(envelope, secret) {
	const iv = base64ToBytes(envelope.iv);
	const salt = base64ToBytes(envelope.salt);
	const key = await deriveAesGcmKey(secret, salt);
	const aadBytes = textEncoder.encode(JSON.stringify(envelope.meta));
	const ctBytes = base64ToBytes(envelope.ct);
	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aadBytes }, key, ctBytes);
	return textDecoder.decode(pt);
}

window.CryptoUtils = {
	getRandomBytes,
	bytesToBase64,
	base64ToBytes,
	sha256Hex,
	encryptAesGcm,
	decryptAesGcm
};