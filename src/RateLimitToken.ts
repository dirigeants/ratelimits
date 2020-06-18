/**
 * Class that handles ratelimits for long running actions that may error.
 */
export class RateLimitToken {

	/**
	 * When this token expires.
	 */
	#expires: number;

	/**
	 * The reject handler that restores the remaining to the RateLimit this is for.
	 */
	#reject: () => void;

	/**
	 * If this token has been used.
	 */
	#used = false;

	/**
	 * @param expires When this token expires.
	 * @param reject The reject handler that restores the remaining to the RateLimit this is for.
	 */
	public constructor(expires: number, reject: () => void) {
		this.#expires = expires;
		this.#reject = reject;
	}

	/**
	 * Marks this token as used (for use when the underlying task completes successfully).
	 */
	public resolve(): this {
		if (this.#used) throw new Error('Token has already been used.');
		this.#used = true;
		return this;
	}

	/**
	 * Marks this token as used and returns the token to the ratelimit (for use when the underlying task fails).
	 */
	public reject(): this {
		if (this.#used) throw new Error('Token has already been used.');
		this.#used = true;
		if (Date.now() < this.#expires) this.#reject();
		return this;
	}

}
