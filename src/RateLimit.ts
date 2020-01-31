export class RateLimit {

	public bucket: number;
	public cooldown: number;
	private remaining: number;
	private time: number;

	/**
	 * @param bucket The number of requests before this is limited
	 * @param cooldown The amount of milliseconds for this ratelimit to expire
	 */
	public constructor(bucket: number, cooldown: number) {
		/**
		 * The number of requests before this is limited
		 */
		this.bucket = bucket;

		/**
		 * The amount of milliseconds for the ratelimit to expire
		 */
		this.cooldown = cooldown;

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
		return !(this.remaining > 0 || this.expired);
	}

	/**
	 * The remaining time in milliseconds before this RateLimit instance is reset
	 */
	public get remainingTime(): number {
		return Math.max(this.time - Date.now(), 0);
	}

	/**
	 * Drips the RateLimit bucket
	 */
	public drip(): this {
		if (this.limited) throw new Error('Ratelimited');
		if (this.expired) this.reset();

		this.remaining--;
		return this;
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
		/**
		 * The remaining times this RateLimit can be dripped before the RateLimit bucket is empty
		 */
		this.remaining = this.bucket;

		return this;
	}

	/**
	 * Resets the RateLimit's reset time back to full state
	 */
	public resetTime(): this {
		/**
		 * When this RateLimit is reset back to a full state
		 */
		this.time = Date.now() + this.cooldown;

		return this;
	}

}
