import { array, nullable, number, object, optional, schema, string } from '../validation';

const point = schema(
  object({
    name: string,
    depth: nullable(number),
    tags: optional(array(string)),
  }),
);

describe('validation', () => {
  it('accepts the expected shape and drops keys it does not know', () => {
    expect(point.safeParse({ name: 'Яма', depth: null, extra: 1 })).toEqual({
      success: true,
      data: { name: 'Яма', depth: null, tags: undefined },
    });
  });

  it.each([
    [{ name: 'Яма', depth: '3' }, '$.depth: expected a number'],
    [{ name: 'Яма', depth: Number.POSITIVE_INFINITY }, '$.depth: expected a number'],
    [{ depth: 3 }, '$.name: expected a string'],
    [{ name: 'Яма', depth: 3, tags: ['a', 2] }, '$.tags[1]: expected a string'],
    [{ name: 'Яма', depth: 3, tags: 'a' }, '$.tags: expected an array'],
    [null, '$: expected an object'],
    [[], '$: expected an object'],
  ])('rejects %j, saying where', (input, error) => {
    expect(point.safeParse(input)).toEqual({ success: false, error });
  });

  it('does not swallow bugs that are not validation failures', () => {
    const broken = schema(() => {
      throw new TypeError('boom');
    });
    expect(() => broken.safeParse({})).toThrow(TypeError);
  });
});
