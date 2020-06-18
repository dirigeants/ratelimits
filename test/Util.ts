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

ava('limited', (test): void => {
	const manager = new RateLimitManager(30000, 2);

	const ratelimit = manager.acquire('one');
	test.false(ratelimit.limited);
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

ava('Basic Consume', (test): void => {
	const manager = new RateLimitManager(30000, 2);

	const ratelimit = manager.acquire('one');
	ratelimit.consume()
		.consume();
	test.throws(ratelimit.consume.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Basic Take-commit', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	ratelimit.take().commit();
	test.throws(ratelimit.take.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Basic Take-revert', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	ratelimit.take().revert();
	test.notThrows(ratelimit.take.bind(ratelimit));
});

ava('Double Take-commit', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	const token = ratelimit.take();
	token.commit();
	test.throws(token.commit.bind(token), {
		instanceOf: Error,
		message: 'Token has already been used.'
	});
});

ava('Double Take-revert', (test): void => {
	const manager = new RateLimitManager(30000);

	const ratelimit = manager.acquire('one');
	const token = ratelimit.take();
	token.revert();
	test.throws(token.revert.bind(token), {
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
	ratelimit.consume();
	token.revert();

	test.throws(ratelimit.consume.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('Proper resetting', async (test): Promise<void> => {
	test.plan(3);
	const manager = new RateLimitManager(1000, 2);

	const ratelimit = manager.acquire('one');
	ratelimit.consume()
		.consume();

	test.true(ratelimit.limited);

	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);

	test.false(ratelimit.limited);
	test.notThrows(ratelimit.consume.bind(ratelimit));
});

ava('Proper sweeping (everything)', async (test): Promise<void> => {
	const manager = new RateLimitManager(1000, 2);

	manager.acquire('one').consume();

	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);
	manager.sweep();

	test.false(manager.has('one'));
});

ava('Proper sweeping (not everything)', async (test): Promise<void> => {
	test.plan(2);
	const manager = new RateLimitManager(1000, 2);

	manager.acquire('one').consume();

	// Sleep for 1.2 seconds because of how timers work.
	await sleep(1200);
	manager.acquire('two').consume();
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
