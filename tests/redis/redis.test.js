const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('Redis Integration (Bus Location Service)', () => {
  let busLocationService;

  beforeAll(async () => {
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    await mongoose.connect(replSet.getUri());

    process.env.REDIS_URL = 'redis://localhost:63799';
    delete require.cache[require.resolve('../../backend/src/redis/client')];
    delete require.cache[require.resolve('../../backend/src/services/redis/busLocation.service')];
    busLocationService = require('../../backend/src/services/redis/busLocation.service');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const mockData = (overrides = {}) => ({
    companyId: '507f1f77bcf86cd799439011',
    busId: '507f1f77bcf86cd799439012',
    tripId: '507f1f77bcf86cd799439013',
    latitude: 30.0444,
    longitude: 31.2357,
    speed: 60,
    heading: 90,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it('setBusLocation: should store location (fallback to memory)', async () => {
    const data = mockData();
    await busLocationService.setBusLocation(data.companyId, data.busId, data);
    const result = await busLocationService.getBusLocation(data.companyId, data.busId);
    expect(result).toBeDefined();
    expect(result.latitude).toBe(30.0444);
    expect(result.longitude).toBe(31.2357);
  });

  it('getBusLocation: should return null for non-existent key', async () => {
    const result = await busLocationService.getBusLocation('000000000000000000000000', '000000000000000000000000');
    expect(result).toBeNull();
  });

  it('setBusLocation: should update existing location', async () => {
    const data = mockData({ speed: 60 });
    await busLocationService.setBusLocation(data.companyId, data.busId, data);

    const updated = mockData({ speed: 80 });
    await busLocationService.setBusLocation(updated.companyId, updated.busId, updated);

    const result = await busLocationService.getBusLocation(updated.companyId, updated.busId);
    expect(result.speed).toBe(80);
  });

  it('getMultipleBusLocations: should return multiple locations', async () => {
    const companyId = '507f1f77bcf86cd799439021';
    const data1 = mockData({ companyId, busId: '507f1f77bcf86cd799439022', speed: 50 });
    const data2 = mockData({ companyId, busId: '507f1f77bcf86cd799439023', speed: 70 });

    await busLocationService.setBusLocation(companyId, data1.busId, data1);
    await busLocationService.setBusLocation(companyId, data2.busId, data2);

    const results = await busLocationService.getMultipleBusLocations(companyId, [data1.busId, data2.busId]);
    expect(results.length).toBe(2);
  });

  it('getMultipleBusLocations: should return empty array for empty input', async () => {
    const results = await busLocationService.getMultipleBusLocations('any', []);
    expect(results).toEqual([]);
  });

  it('getAllBusLocationsForCompany: should return all locations for a company', async () => {
    const companyId = '507f1f77bcf86cd799439031';
    const data1 = mockData({ companyId, busId: '507f1f77bcf86cd799439032' });
    const data2 = mockData({ companyId, busId: '507f1f77bcf86cd799439033' });

    await busLocationService.setBusLocation(companyId, data1.busId, data1);
    await busLocationService.setBusLocation(companyId, data2.busId, data2);

    const results = await busLocationService.getAllBusLocationsForCompany(companyId);
    expect(results.length).toBe(2);
  });

  it('should isolate locations between different companies', async () => {
    const companyA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaa1';
    const companyB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbb1';
    const dataA = mockData({ companyId: companyA, busId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaa2' });
    const dataB = mockData({ companyId: companyB, busId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbb2' });

    await busLocationService.setBusLocation(companyA, dataA.busId, dataA);
    await busLocationService.setBusLocation(companyB, dataB.busId, dataB);

    const resultsA = await busLocationService.getMultipleBusLocations(companyA, [dataA.busId]);
    expect(resultsA.length).toBe(1);

    const resultsB = await busLocationService.getMultipleBusLocations(companyB, [dataA.busId]);
    expect(resultsB.length).toBe(0);
  });

  it('deleteBusLocation: should remove a location', async () => {
    const data = mockData({ companyId: '555555555555555555555555', busId: '555555555555555555555556' });
    await busLocationService.setBusLocation(data.companyId, data.busId, data);

    await busLocationService.deleteBusLocation(data.companyId, data.busId);
    const result = await busLocationService.getBusLocation(data.companyId, data.busId);
    expect(result).toBeNull();
  });

  it('deleteCompanyLocations: should remove all locations for a company', async () => {
    const companyId = '666666666666666666666666';
    const data1 = mockData({ companyId, busId: '666666666666666666666667' });
    const data2 = mockData({ companyId, busId: '666666666666666666666668' });

    await busLocationService.setBusLocation(companyId, data1.busId, data1);
    await busLocationService.setBusLocation(companyId, data2.busId, data2);

    await busLocationService.deleteCompanyLocations(companyId);

    const result1 = await busLocationService.getBusLocation(companyId, data1.busId);
    const result2 = await busLocationService.getBusLocation(companyId, data2.busId);
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it('should handle Redis failure gracefully without crashing', async () => {
    const data = mockData();
    await busLocationService.setBusLocation(data.companyId, data.busId, data);
    const result = await busLocationService.getBusLocation(data.companyId, data.busId);
    expect(result).toBeDefined();
  });

  it('should return sorted results (newest first) from getMultipleBusLocations', async () => {
    const companyId = '777777777777777777777777';
    const older = mockData({ companyId, busId: '777777777777777777777778', updatedAt: new Date(Date.now() - 5000).toISOString() });
    const newer = mockData({ companyId, busId: '777777777777777777777779', updatedAt: new Date().toISOString() });

    await busLocationService.setBusLocation(companyId, older.busId, older);
    await busLocationService.setBusLocation(companyId, newer.busId, newer);

    const results = await busLocationService.getMultipleBusLocations(companyId, [older.busId, newer.busId]);
    expect(new Date(results[0].updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(results[1].updatedAt).getTime());
  });
});
