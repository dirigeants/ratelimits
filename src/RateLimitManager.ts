import { Snowflake } from 'discord.js';
import Collection, { CollectionConstructor } from '@discordjs/collection';
import RateLimit from './RateLimit';

export default class RateLimitManager<K = Snowflake> extends Collection<K, RateLimit> {

	private _bucket!: number;
	private _cooldown!: number;
	private sweepInterval!: NodeJS.Timer | null;

	public constructor(bucket: number, cooldown: number) {
		super();

		Object.defineProperty(this, 'sweepInterval', { value: null, writable: true });
		Object.defineProperty(this, '_bucket', { value: bucket, writable: true });
		Object.defineProperty(this, '_cooldown', { value: cooldown, writable: true });
	}

	public get bucket(): number {
		return this._bucket;
	}

	public set bucket(value: number) {
		for (const ratelimit of this.values()) ratelimit.bucket = value;
		this._bucket = value;
	}

	public get cooldown(): number {
		return this._cooldown;
	}

	public set cooldown(value: number) {
		for (const ratelimit of this.values()) ratelimit.cooldown = value;
		this._cooldown = value;
	}

	public acquire(id: K): RateLimit {
		return this.get(id) || this.create(id);
	}

	public create(id: K): RateLimit {
		const ratelimit = new RateLimit(this._bucket, this._cooldown);
		this.set(id, ratelimit);
		return ratelimit;
	}

	public set(id: K, ratelimit: RateLimit): this {
		if (!(ratelimit instanceof RateLimit)) throw new Error('Invalid RateLimit');
		if (!this.sweepInterval) this.sweepInterval = setInterval(this.sweep.bind(this), 30000);
		return super.set(id, ratelimit);
	}

	public sweep(fn: (value: RateLimit, key: K, collection: this) => boolean = (rl): boolean => rl.expired, thisArg?: any): number {
		const amount = super.sweep(fn, thisArg);

		if (this.size === 0) {
			clearInterval(this.sweepInterval);
			this.sweepInterval = null;
		}

		return amount;
	}

	public static get [Symbol.species](): CollectionConstructor {
		return Collection as unknown as CollectionConstructor;
	}

}
