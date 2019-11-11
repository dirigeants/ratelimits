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

	public get expired(): boolean {
		return this.remainingTime === 0;
	}

	public get limited(): boolean {
		return !(this.remaining > 0 || this.expired);
	}

	public get remainingTime(): number {
		return Math.max(this.time - Date.now(), 0);
	}

	public drip(): this {
		if (this.limited) throw new Error('Ratelimited');
		if (this.expired) this.reset();

		this.remaining--;
		return this;
	}

	public reset(): this {
		return this.resetRemaining().resetTime();
	}

	public resetRemaining(): this {
		this.remaining = this.bucket;

		return this;
	}

	public resetTime(): this {
		this.time = Date.now() + this.cooldown;

		return this;
	}

}
