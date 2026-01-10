import { describe, expect, it } from 'vitest';
import { Money } from '../../src/domain/model/money.js';

describe('Money value object', () => {
  it('adds correctly', () => {
    const a = new Money(5000);
    const b = new Money(2500);
    expect(a.add(b).cents).toBe(7500);
  });

  it('subtracts correctly', () => {
    const a = new Money(5000);
    const b = new Money(2500);
    expect(a.subtract(b).cents).toBe(2500);
  });

  it('multiplies correctly', () => {
    const a = new Money(1000);
    expect(a.multiply(2).cents).toBe(2000);
  });

  it('compares equality', () => {
    const a = new Money(1000);
    const b = new Money(1000);
    expect(a.equals(b)).toBe(true);
  });
});
