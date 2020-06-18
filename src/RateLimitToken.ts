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
	#revert: () => void;

	/**
	 * If this token has been used.
	 */
	#used = false;

	/**
	 * @param expires When this token expires.
	 * @param revert The reject handler that restores the remaining to the RateLimit this is for.
	 */
	public constructor(expires: number, revert: () => void) {
		this.#expires = expires;
		this.#revert = revert;
	}

	/**
	 * Marks this token as used (for use when the underlying task completes successfully).
	 */
	public commit(): void {
		if (this.#used) throw new Error('Token has already been used.');
		this.#used = true;
	}

	/**
	 * Marks this token as used and returns the token to the ratelimit (for use when the underlying task fails).
	 */
	public revert(): void {
		this.commit();
		if (Date.now() < this.#expires) this.#revert();
	}

}
