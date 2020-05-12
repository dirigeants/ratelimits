import ava from 'ava';
import { RateLimitManager } from '../dist';
import { sleep } from '@klasa/utils';
import { Cache } from '@klasa/Cache';

// ... others

ava('Acquiring', (test): void => {
	test.plan(2);
	const manager = new RateLimitManager(1, 1);

	const ratelimit1 = manager.acquire('one');
	const ratelimit2 = manager.acquire('two');
	test.is(ratelimit1, manager.get('one'));
	test.is(ratelimit2, manager.get('two'));
});

ava('Set guard', (test): void => {
	const manager = new RateLimitManager(2, 30000);

	test.throws(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		manager.set('foo', 'bar');
	}, {
		instanceOf: Error,
		message: 'Invalid RateLimit'
	});
});

ava('Change Bucket', (test): void => {
	test.plan(4);

	const manager = new RateLimitManager(2, 30000);
	const ratelimit = manager.acquire('one');

	test.is(manager.bucket, 2);
	test.is(ratelimit.bucket, 2);
	manager.bucket = 3;
	test.is(manager.bucket, 3);
	test.is(ratelimit.bucket, 3);
});

ava('Change Cooldown', (test): void => {
	test.plan(4);

	const manager = new RateLimitManager(2, 30000);
	const ratelimit = manager.acquire('one');

	test.is(manager.cooldown, 30000);
	test.is(ratelimit.cooldown, 30000);
	manager.cooldown = 330000;
	test.is(manager.cooldown, 330000);
	test.is(ratelimit.cooldown, 330000);
});

ava('Basic Drip', (test): void => {
	const manager = new RateLimitManager(2, 30000);

	const ratelimit = manager.acquire('one');
	ratelimit.drip()
		.drip();
	test.throws(ratelimit.drip.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Proper resetting', async (test): Promise<void> => {
	test.plan(3);
	const manager = new RateLimitManager(2, 1000);

	const ratelimit = manager.acquire('one');
	ratelimit.drip()
		.drip();

	test.true(ratelimit.limited);

	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);

	test.false(ratelimit.limited);
	test.notThrows(ratelimit.drip.bind(ratelimit));
});

ava('Proper sweeping (everything)', async (test): Promise<void> => {
	const manager = new RateLimitManager(2, 1000);

	manager.acquire('one').drip();

	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);
	manager.sweep();

	test.false(manager.has('one'));
});

ava('Proper sweeping (not everything)', async (test): Promise<void> => {
	test.plan(2);
	const manager = new RateLimitManager(2, 1000);

	manager.acquire('one').drip();

	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);
	manager.acquire('two').drip();
	manager.sweep();

	test.false(manager.has('one'));
	test.true(manager.has('two'));
});

ava('Clones are just Caches', async (test): Promise<void> => {
	test.plan(2);

	const manager = new RateLimitManager(2, 1000);

	test.false(manager.clone() instanceof RateLimitManager);
	test.true(manager.clone() instanceof Cache);
});
