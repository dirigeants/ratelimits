export default class RateLimit {

	public bucket: number;
	public cooldown: number;
	private remaining: number;
	private time: number;

	public constructor(bucket: number, cooldown: number) {
		this.bucket = bucket;
		this.cooldown = cooldown;
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
