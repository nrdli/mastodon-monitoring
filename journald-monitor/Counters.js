class Counters {
  constructor() {
    this.map = new Map();
  }
  getOrZero(counter) {
    return this.map.get(counter) || 0;
  }
  add(counter, value) {
    return this.map.set(counter, this.getOrZero(counter) + value);
  }
  increment(counter) {
    return this.add(counter, 1);
  }
  toPrometheus(line, end) {
    Array.from(this.map)
      .forEach(([k, v]) => {
        return line(`${k} = ${v.toFixed(2)}\n`);
      });
    return end();
  }
}

module.exports = { Counters };
