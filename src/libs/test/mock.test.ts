import { describe, expect, test } from 'bun:test';
import { mocked } from './mock';

class TestClass {
  testMethod() {
    return 'test';
  }
}

describe('mocked Test', () => {
  test('should mock an object', () => {
    const instance = new TestClass();
    expect(instance.testMethod()).toBe('test');

    const mockedInstance = mocked(instance);
    mockedInstance.testMethod.mockReturnValue('mocked');

    expect(mockedInstance.testMethod()).toBe('mocked');
  });
});
