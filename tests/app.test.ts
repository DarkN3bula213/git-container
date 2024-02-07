import { app } from '../src/app';

describe('Testing the initial setup for the app', () => {
  it('Check if package json is correctly setup for test', () => {
    function sum(a: number, b: number) {
      return a + b;
    }
    expect(sum(1, 2)).toBe(3);
  });
});

describe('Testing the app', () => {
  it('Check if app is correctly setup', () => {
    expect(app).toBeDefined();
  });
})