// test/invoiceIdGenerator.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Counter from '../src/modules/school/counter/counter.model';
import { createInvoiceIdGenerator } from '../src/modules/school/counter/counter.model';

const mockCounterModel = {
  findOneAndUpdate: vi.fn()
} as any;

const mockDate = (dateString: string) => {
  const date = new Date(dateString);
  vi.useFakeTimers().setSystemTime(date);
};

describe('Invoice ID Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should generate sequential IDs for the same date', async () => {
    mockDate('2024-06-10T12:00:00Z');
    const generator = createInvoiceIdGenerator(mockCounterModel);
    
    mockCounterModel.findOneAndUpdate
      .mockResolvedValueOnce({ date: '240610', sequence: 1 })
      .mockResolvedValueOnce({ date: '240610', sequence: 2 });

    const id1 = await generator();
    const id2 = await generator();

    expect(id1.slice(0, -1)).toMatch(/2406100001/);
    expect(id2.slice(0, -1)).toMatch(/2406100002/);
    expect(id1).toHaveLength(11);
    expect(id2).toHaveLength(11);
  });

  it('should reset sequence for new date', async () => {
    mockDate('2024-06-10T23:59:59Z');
    const generator = createInvoiceIdGenerator(mockCounterModel);
    mockCounterModel.findOneAndUpdate.mockResolvedValue({ date: '240610', sequence: 100 });

    const id1 = await generator();
    
    mockDate('2024-06-11T00:00:01Z');
    mockCounterModel.findOneAndUpdate.mockResolvedValue({ date: '240611', sequence: 1 });
    const id2 = await generator();

    expect(id1.slice(0, 6)).toBe('240610');
    expect(id2.slice(0, 6)).toBe('240611');
    expect(id2.slice(6, 10)).toBe('0001');
  });

  it('should generate valid check character', async () => {
    mockDate('2024-06-10T12:00:00Z');
    const generator = createInvoiceIdGenerator(mockCounterModel);
    
    // Test check character calculation
    mockCounterModel.findOneAndUpdate.mockResolvedValue({ date: '240610', sequence: 1 });
    const id = await generator();
    const baseString = '2406100001';
    const sum = baseString.split('').reduce((acc, char) => acc + parseInt(char, 36), 0);
    const expectedCheckChar = (sum % 36).toString(36).toUpperCase();
    
    expect(id).toBe(`${baseString}${expectedCheckChar}`);
  });

  it('should handle sequence numbers with padding', async () => {
    mockDate('2024-06-10T12:00:00Z');
    const generator = createInvoiceIdGenerator(mockCounterModel);
    
    mockCounterModel.findOneAndUpdate.mockResolvedValue({ date: '240610', sequence: 999 });
    const id = await generator();
    
    expect(id.slice(6, 10)).toBe('0999');
    expect(id).toHaveLength(11);
  });
});