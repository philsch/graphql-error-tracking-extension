/**
 * Helper to generate a unique (at least in a given timeframe) log id
 */
class TraceId {

  /**
   * Create a random log trace id
   *
   * @return {string}
   */
  static generate() {
    return Math.random().toString(16).slice(2);
  }
}

export {TraceId};