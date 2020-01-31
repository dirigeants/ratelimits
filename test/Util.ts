import ava from 'ava';
import { RateLimitManager } from '../dist';
import { sleep } from '@klasa/utils';

// ... others

ava('Acquiring', (test): void => {
	const manager = new RateLimitManager(1, 1);

	const ratelimit = manager.acquire('Hello, world');
	test.is(ratelimit, manager.get('Hello, world'));
});

ava('Basic Drip', (test): void => {
	const manager = new RateLimitManager(2, 30000);

	const ratelimit = manager.acquire('Hello, world');
	ratelimit.drip()
		.drip();
	test.throws(ratelimit.drip.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Proper resetting', async (test): Promise<void> => {
	test.plan(2);
	const manager = new RateLimitManager(2, 1000);

	const ratelimit = manager.acquire('Hello, world');
	ratelimit.drip()
		.drip();

	test.is(ratelimit.limited, true);

	// Sleep for 12 seconds because of how timers work.
	await sleep(1200);

	test.is(ratelimit.limited, false);
});
