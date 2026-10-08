/**
 * @jest-environment node
 *
 * The connector is shared by every server action, and its failure mode is
 * invisible locally: a page render connects first in the same process, so a
 * stale cache only ever shows up in production.
 */

const connection = { readyState: 0, on: jest.fn() };
const connect = jest.fn();

jest.mock("mongoose", () => ({
  __esModule: true,
  default: { connect, connection },
}));

const CONNECTED = 1;
const CONNECTING = 2;
const DISCONNECTED = 0;

const freshConnector = async () => {
  jest.resetModules();
  delete (globalThis as Record<string, unknown>)._mongooseCache;
  return (await import("serverActions/mongoose-connector")).connectToDatabase;
};

describe("connectToDatabase", () => {
  const originalUri = process.env.MONGODB_CONNECTION;

  beforeEach(() => {
    process.env.MONGODB_CONNECTION = "mongodb://localhost:27017/test";
    connection.readyState = DISCONNECTED;
    connect.mockReset();
    connection.on.mockReset();
    connect.mockImplementation(async () => {
      connection.readyState = CONNECTED;
      return { connection };
    });
  });

  afterAll(() => {
    process.env.MONGODB_CONNECTION = originalUri;
  });

  it("connects once and reuses the connection while it is live", async () => {
    const connectToDatabase = await freshConnector();
    await connectToDatabase();
    await connectToDatabase();
    await connectToDatabase();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("reuses an already active connection even if the module cache was reset", async () => {
    const connectToDatabase = await freshConnector();
    await connectToDatabase();

    connection.readyState = CONNECTED;
    delete (globalThis as Record<string, unknown>)._mongooseCache;

    const nextConnect = await freshConnector();
    await expect(nextConnect()).resolves.toBeDefined();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("reconnects when the cached connection has dropped", async () => {
    const connectToDatabase = await freshConnector();
    await connectToDatabase();
    expect(connect).toHaveBeenCalledTimes(1);

    // What a frozen-then-thawed lambda looks like: still cached, socket gone.
    connection.readyState = DISCONNECTED;

    await connectToDatabase();
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("does not start a second connection while one is in flight", async () => {
    const connectToDatabase = await freshConnector();
    let release!: () => void;
    connect.mockImplementation(
      () =>
        new Promise((resolve) => {
          connection.readyState = CONNECTING;
          release = () => {
            connection.readyState = CONNECTED;
            resolve({ connection });
          };
        })
    );

    const all = Promise.all([
      connectToDatabase(),
      connectToDatabase(),
      connectToDatabase(),
    ]);
    release();
    await all;
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("buffers commands, so a blip waits for the connection instead of throwing", async () => {
    const connectToDatabase = await freshConnector();
    await connectToDatabase();
    expect(connect.mock.calls[0][1]).toMatchObject({ bufferCommands: true });
  });

  it("caches nothing after a failure, so the next call retries", async () => {
    const connectToDatabase = await freshConnector();
    connect.mockRejectedValueOnce(new Error("no route to host"));

    await expect(connectToDatabase()).rejects.toThrow(
      "Failed to connect to database"
    );

    connect.mockImplementation(async () => {
      connection.readyState = CONNECTED;
      return { connection };
    });
    await expect(connectToDatabase()).resolves.toBeDefined();
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("throws a clear error when the connection string is missing", async () => {
    delete process.env.MONGODB_CONNECTION;
    const connectToDatabase = await freshConnector();
    await expect(connectToDatabase()).rejects.toThrow(
      /MONGODB_CONNECTION environment variable/
    );
    expect(connect).not.toHaveBeenCalled();
  });
});
