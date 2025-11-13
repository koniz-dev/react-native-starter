import { sum } from '@/utils/sum';

describe('sum utility function', () => {
  test('adds two positive numbers correctly', () => {
    expect(sum(2, 3)).toBe(5);
  });

  test('adds negative numbers correctly', () => {
    expect(sum(-1, -2)).toBe(-3);
  });

  test('adds positive and negative numbers correctly', () => {
    expect(sum(5, -3)).toBe(2);
  });

  test('handles zero correctly', () => {
    expect(sum(0, 0)).toBe(0);
    expect(sum(5, 0)).toBe(5);
    expect(sum(0, 5)).toBe(5);
  });
});

