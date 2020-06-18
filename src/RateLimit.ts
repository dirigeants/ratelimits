import { RateLimitToken } from './RateLimitToken';

import type { RateLimitManager } from './RateLimitManager';

export class RateLimit<K> {

	/**
	 * The RateLimitManager this Ratelimit is for
	 */
	private manager: RateLimitManager<K>;

	/**
	 * The remaining times this RateLimit can be dripped before the RateLimit bucket is empty
	 */
	#remaining!: number;

	/**
	 * When this RateLimit is reset back to a full state
	 */
	#expires!: number;

	/**
	 * @param manager The manager for this RateLimit
	 */
	public constructor(manager: RateLimitManager<K>) {
		this.manager = manager;
		this.reset();
	}

	/**
	 * Whether this RateLimit is expired or not, allowing the bucket to be reset
	 */
	public get expired(): boolean {
		return this.remainingTime === 0;
	}

	/**
	 * Whether this RateLimit is limited or not
	 */
	public get limited(): boolean {
		return !(this.#remaining > 0 || this.expired);
	}

	/**
	 * The remaining time in milliseconds before this RateLimit instance is reset
	 */
	public get remainingTime(): number {
		return Math.max(this.#expires - Date.now(), 0);
	}

	/**
	 * Consumes remaining limit from the RateLimit bucket
	 */
	public consume(): this {
		if (this.limited) throw new Error('Ratelimited');
		if (this.expired) this.reset();

		this.#remaining--;
		return this;
	}

	/**
	 * Takes a token that can be returned to the bucket if something goes wrong before this resets.
	 */
	public take(): RateLimitToken {
		this.consume();
		return new RateLimitToken(this.#expires, () => {
			this.#remaining++;
		});
	}

	/**
	 * Resets the RateLimit back to it's full state
	 */
	public reset(): this {
		return this.resetRemaining().resetTime();
	}

	/**
	 * Resets the RateLimit's remaining uses back to full state
	 */
	public resetRemaining(): this {
		this.#remaining = this.manager.limit;
		return this;
	}

	/**
	 * Resets the RateLimit's reset time back to full state
	 */
	public resetTime(): this {
		this.#expires = Date.now() + this.manager.time;
		return this;
	}

}
