import { RedisClientType } from 'redis';

export class RedisClientMapWrapper<K, V> {
  _client: RedisClientType;
  _key: K;
  constructor(client: RedisClientType, key: K) {
    this._client = client;
    this._key = key;
  }
  async set(key: K, value: V) {
    const k = `${this._key}:${key}`;
    const v = JSON.stringify(value);
    await this._client.set(k, v);
  }
  async get(key: K): Promise<V | null> {
    const k = `${this._key}:${key}`;
    const res = await this._client.get(k);
    if (res) {
      return JSON.parse(res) as V;
    }
    return null;
  }
  async has(key: K): Promise<boolean> {
    const k = `${this._key}:${key}`;
    const ex = await this._client.exists(k);
    return ex >= 1;
  }
  async delete(key: K) {
    const k = `${this._key}:${key}`;
    await this._client.del(k);
  }
}

export class RedisClientKVWrapper {
  _client: RedisClientType;
  _key: string;
  constructor(client: RedisClientType, key: string) {
    this._client = client;
    this._key = key;
  }
  async set(key: string, value: string) {
    const k = `${this._key}:${key}`;
    await this._client.set(k, value);
  }
  async get(key: string) {
    const k = `${this._key}:${key}`;
    return await this._client.get(k);
  }
  async has(key: string) {
    const k = `${this._key}:${key}`;
    return await this._client.exists(k);
  }
  async delete(key: string) {
    const k = `${this._key}:${key}`;
    await this._client.del(k);
  }
}

export class RedisClientSetsMapper {
  _client: RedisClientType;
  _key: string;
  constructor(client: RedisClientType, key: string) {
    this._client = client;
    this._key = key;
  }
  async push(v: string) {
    await this._client.sAdd(this._key, v);
  }
  async pop(): Promise<string> {
    const s = await this._client.sPop(this._key);
    if (Array.isArray(s)) {
      const [x] = s;
      return x;
    }
    return s as string;
  }
  async length() {
    return await this._client.sCard(this._key);
  }
  async delete(v: string) {
    await this._client.sRem(this._key, v);
  }
}
