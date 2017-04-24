class Counters {
  constructor() {
    this.map = new Map();
  }
  canonicalize(name) {
    return name
      .replace(/[^a-z0-9]/ig, '_')
      .replace(/_{2,}/g, '_');
  }
  get(counter) {
    return this.map.get(this.canonicalize(counter));
  }
  set(counter, value) {
    return this.map.set(this.canonicalize(counter), value);
  }
  getOrZero(counter) {
    return this.get(counter) || 0;
  }
  add(counter, value) {
    return this.set(counter, this.getOrZero(counter) + value);
  }
  increment(counter) {
    return this.add(counter, 1);
  }
  toPrometheus(line, end) {
    Array.from(this.map)
      .forEach(([k, v]) => {
        return line(`${k} ${v.toFixed(2)}\n`);
      });
    return end();
  }
}

module.exports = { Counters };
