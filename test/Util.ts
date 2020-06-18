import ava from 'ava';
import { RateLimitManager } from '../src';
import { sleep } from '@klasa/utils';
import { Cache } from '@klasa/cache';

ava('Acquiring', (test): void => {
	test.plan(2);
	const manager = new RateLimitManager(1);

	const ratelimit1 = manager.acquire('one');
	const ratelimit2 = manager.acquire('two');
	test.is(ratelimit1, manager.get('one'));
	test.is(ratelimit2, manager.get('two'));
});

ava('Set guard', (test): void => {
	const manager = new RateLimitManager(30000, 2);

	test.throws(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		manager.set('foo', 'bar');
	}, {
		instanceOf: Error,
		message: 'Invalid RateLimit'
	});
});

ava('Basic Drip', (test): void => {
	const manager = new RateLimitManager(30000, 2);

	const ratelimit = manager.acquire('one');
	ratelimit.drip()
		.drip();
	test.throws(ratelimit.drip.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Basic Take-resolve', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	ratelimit.take().resolve();
	test.throws(ratelimit.take.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Basic Take-reject', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	ratelimit.take().reject();
	test.notThrows(ratelimit.take.bind(ratelimit));
});

ava('Double Take-resolve', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	const token = ratelimit.take().resolve();
	test.throws(token.resolve.bind(token), {
		instanceOf: Error,
		message: 'Token has already been used.'
	});
});

ava('Double Take-reject', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	const token = ratelimit.take().reject();
	test.throws(token.reject.bind(token), {
		instanceOf: Error,
		message: 'Token has already been used.'
	});
});

ava('Tokens expire', async (test): Promise<void> => {
	const manager = new RateLimitManager(1000);

	const ratelimit = manager.acquire('one');
	const token = ratelimit.take();
	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);
	ratelimit.drip();
	token.reject();

	test.throws(ratelimit.drip.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Proper resetting', async (test): Promise<void> => {
	test.plan(3);
	const manager = new RateLimitManager(1000, 2);

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
	const manager = new RateLimitManager(1000, 2);

	manager.acquire('one').drip();

	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);
	manager.sweep();

	test.false(manager.has('one'));
});

ava('Proper sweeping (not everything)', async (test): Promise<void> => {
	test.plan(2);
	const manager = new RateLimitManager(1000, 2);

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

	const manager = new RateLimitManager(1000, 2);

	test.false(manager.clone() instanceof RateLimitManager);
	test.true(manager.clone() instanceof Cache);
});
