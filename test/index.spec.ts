import { hello } from '../src/index';

describe('hello', () => {
  it('is world', () => {
    expect(hello).toBe('world');
  });
});
