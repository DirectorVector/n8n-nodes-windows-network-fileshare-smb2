/**
 * Offline regression test for File -> Get Metadata (no share needed).
 *
 * Stubs @marsaud/smb2 with a fake client that mimics its lazy connect: a second
 * call issued while the first is still connecting fails with EALREADY, exactly as
 * the real library does when two calls race socket.connect() on a fresh client.
 * The node must issue metadata calls one at a time and map not-found to
 * { exists: false, size: 0 }.
 */

const assert = require('assert');

const files = { 'present.pdf': 1234 };
let clientsCreated = 0;

function notFound(code) {
	const error = new Error(`${code} (0xC0000034) : The object name is not found.`);
	error.code = code;
	return error;
}

function FakeSMB2() {
	clientsCreated++;
	this.inFlight = 0;
}
FakeSMB2.prototype.call = function (answer, cb) {
	if (this.inFlight > 0) {
		const error = new Error('connect EALREADY 10.10.13.110:445');
		error.code = 'EALREADY';
		setImmediate(() => cb(error));
		return;
	}
	this.inFlight++;
	setImmediate(() => {
		this.inFlight--;
		answer(cb);
	});
};
FakeSMB2.prototype.getSize = function (path, cb) {
	this.call((done) => {
		if (path === 'missing-dir\\x.pdf') return done(notFound('STATUS_OBJECT_PATH_NOT_FOUND'));
		if (!(path in files)) return done(notFound('STATUS_OBJECT_NAME_NOT_FOUND'));
		done(null, files[path]);
	}, cb);
};
FakeSMB2.prototype.exists = function (path, cb) {
	this.call((done) => done(null, path in files), cb);
};
FakeSMB2.prototype.disconnect = function () {};

const smb2Path = require.resolve('@marsaud/smb2');
require.cache[smb2Path] = { id: smb2Path, filename: smb2Path, loaded: true, exports: FakeSMB2 };

const { WindowsFileshare } = require('./dist/nodes/WindowsFileshare/WindowsFileshare.node.js');

function mockThis(paths, continueOnFail = true) {
	return {
		getInputData: () => paths.map((p) => ({ json: { p } })),
		getCredentials: async () => ({ share: '\\\\server\\share', username: 'u', password: 'p' }),
		getNodeParameter: (name, i, fallback) => {
			if (name === 'resource') return 'file';
			if (name === 'operation') return 'metadata';
			if (name === 'filePath') return paths[i];
			return fallback;
		},
		getNode: () => ({ name: 'Metadata Offline Test' }),
		continueOnFail: () => continueOnFail,
		helpers: {},
	};
}

(async () => {
	const node = new WindowsFileshare();
	const result = await node.execute.call(
		mockThis(['present.pdf', '005755028.pdf', '020618-9.pdf', 'missing-dir\\x.pdf']),
	);
	const out = result[0].map((item) => item.json);

	assert.deepStrictEqual(out, [
		{ filePath: 'present.pdf', exists: true, size: 1234 },
		{ filePath: '005755028.pdf', exists: false, size: 0 },
		{ filePath: '020618-9.pdf', exists: false, size: 0 },
		{ filePath: 'missing-dir\\x.pdf', exists: false, size: 0 },
	]);
	assert.strictEqual(clientsCreated, 4, 'one client per item');

	console.log('PASSED: Get Metadata — sequential SMB calls, missing file -> { exists: false, size: 0 }');
})().catch((error) => {
	console.error('FAILED:', error.message);
	process.exit(1);
});
