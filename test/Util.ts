import ava from 'ava';
import { RateLimitManager } from '../dist';

// ... others

ava('Acquiring', (test): void => {
	const manager = new RateLimitManager(1, 1);

	const ratelimit = manager.acquire('Hello, world');
	test.is(ratelimit, manager.get('Hello, world'));
});

ava('Basic Drip', (test): void => {
	const manager = new RateLimitManager(2, 30000);

	const ratelimit = manager.acquire('Hello, world');
	test.throws(ratelimit.drip.bind(ratelimit), 'Ratelimited');
});
