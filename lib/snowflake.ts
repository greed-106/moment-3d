export class Snowflake {
  private workerId: bigint;
  private dataCenterId: bigint;
  private sequence: bigint = 0n;

  private twepoch = 1288834974657n; // Nov 04 2010 01:42:54
  private workerIdBits = 5n;
  private dataCenterIdBits = 5n;
  private sequenceBits = 12n;

  private maxWorkerId = -1n ^ (-1n << this.workerIdBits);
  private maxDataCenterId = -1n ^ (-1n << this.dataCenterIdBits);
  
  private workerIdShift = this.sequenceBits;
  private dataCenterIdShift = this.sequenceBits + this.workerIdBits;
  private timestampLeftShift = this.sequenceBits + this.workerIdBits + this.dataCenterIdBits;
  
  private sequenceMask = -1n ^ (-1n << this.sequenceBits);
  private lastTimestamp = -1n;

  constructor(workerId: number = 1, dataCenterId: number = 1) {
    if (BigInt(workerId) > this.maxWorkerId || workerId < 0) {
      throw new Error(`worker Id can't be greater than ${this.maxWorkerId} or less than 0`);
    }
    if (BigInt(dataCenterId) > this.maxDataCenterId || dataCenterId < 0) {
      throw new Error(`datacenter Id can't be greater than ${this.maxDataCenterId} or less than 0`);
    }
    this.workerId = BigInt(workerId);
    this.dataCenterId = BigInt(dataCenterId);
  }

  private timeGen(): bigint {
    return BigInt(Date.now());
  }

  private tilNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.timeGen();
    while (timestamp <= lastTimestamp) {
      timestamp = this.timeGen();
    }
    return timestamp;
  }

  public nextId(): string {
    let timestamp = this.timeGen();

    if (timestamp < this.lastTimestamp) {
      throw new Error(`Clock moved backwards. Refusing to generate id for ${this.lastTimestamp - timestamp} milliseconds`);
    }

    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1n) & this.sequenceMask;
      if (this.sequence === 0n) {
        timestamp = this.tilNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    const id = ((timestamp - this.twepoch) << this.timestampLeftShift) |
      (this.dataCenterId << this.dataCenterIdShift) |
      (this.workerId << this.workerIdShift) |
      this.sequence;

    return id.toString();
  }
}

export const snowflake = new Snowflake(1, 1);
