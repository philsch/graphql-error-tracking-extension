import {TraceId} from "../../src/lib/TraceId";

describe('TraceId', () => {
  it('generates an ID with expected pattern', () => {
    const id = TraceId.generate();
    expect(id.length).toEqual(6);
    expect(id).toEqual(expect.stringMatching(/[0-9a-f]*/));
  });

  it('generates different IDs', () => {
    const id1 = TraceId.generate();
    const id2 = TraceId.generate();

    expect(id1).not.toEqual(id2);
  });
});
