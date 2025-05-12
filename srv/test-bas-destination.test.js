// 引入要测试的模块
const path = require('path');
const fs = require('fs');

jest.mock('./destination-helper', () => ({
  callDestination: jest.fn()
}));

jest.mock('@sap-cloud-sdk/connectivity', () => ({
  getDestination: jest.fn()
}));
jest.mock('@sap-cloud-sdk/http-client', () => ({
  executeHttpRequest: jest.fn()
}));

const { callDestination } = require('./destination-helper');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

// 需要 require 被测文件以注册函数
let testDestination, testDestinationPost, testMyInternalApi, testMyInternalApiWithSdk;
beforeAll(() => {
  // 通过 require.main.require 方式拿到函数（因原文件未导出，需调整原文件导出函数更佳）
  const tested = require('./test-bas-destination');
  testDestination = tested.testDestination || global.testDestination;
  testDestinationPost = tested.testDestinationPost || global.testDestinationPost;
  testMyInternalApi = tested.testMyInternalApi || global.testMyInternalApi;
  testMyInternalApiWithSdk = tested.testMyInternalApiWithSdk || global.testMyInternalApiWithSdk;
});

describe('test-bas-destination.js 单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('testDestination 正常返回', async () => {
    callDestination.mockResolvedValue({ foo: 'bar' });
    const result = await testDestination();
    expect(result).toBe(true);
    expect(callDestination).toHaveBeenCalledWith('sap-demo', '');
  });

  test('testDestination 异常处理', async () => {
    callDestination.mockRejectedValue(new Error('fail'));
    const result = await testDestination();
    expect(result).toBe(false);
  });

  test('testDestinationPost 正常返回', async () => {
    callDestination.mockResolvedValue({ foo: 'bar' });
    const result = await testDestinationPost();
    expect(result).toBe(true);
    expect(callDestination).toHaveBeenCalledWith('sap-demo-post', '', expect.any(Object));
  });

  test('testMyInternalApi 正常返回', async () => {
    callDestination.mockResolvedValue({ foo: 'bar' });
    const result = await testMyInternalApi();
    expect(result).toBe(true);
    expect(callDestination).toHaveBeenCalledWith('my-internal-api', '/api/products', expect.any(Object));
  });

  test('testMyInternalApiWithSdk 正常返回', async () => {
    getDestination.mockResolvedValue({ destination: 'mock' });
    executeHttpRequest.mockResolvedValue({ data: { foo: 'bar' } });
    const result = await testMyInternalApiWithSdk();
    expect(result).toBe(true);
    expect(getDestination).toHaveBeenCalledWith({ destinationName: 'my-internal-api' });
    expect(executeHttpRequest).toHaveBeenCalled();
  });

  test('testMyInternalApiWithSdk 异常处理', async () => {
    getDestination.mockResolvedValue({ destination: 'mock' });
    executeHttpRequest.mockRejectedValue(new Error('fail'));
    const result = await testMyInternalApiWithSdk();
    expect(result).toBe(false);
  });
}); 