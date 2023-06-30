import { createHelia } from 'helia';
import { ipns } from '@helia/ipns';
import { unixfs } from '@helia/unixfs';
import { memoize } from 'lodash-es';

export const loadIpfs = memoize(async () => {
	const helia = await createHelia();
	return {
		helia,
		ipns: ipns(helia),
		fs: unixfs(helia),
	};
});
