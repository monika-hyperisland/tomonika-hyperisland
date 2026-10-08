import mongoose from "mongoose";

/**
 * Connection cache for a serverless runtime.
 *
 * Kept on `globalThis` rather than in module scope so that it survives module
 * reloads: in development every hot reload would otherwise open a new pool, and
 * on Vercel a warm lambda reuses the process across invocations.
 */
type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: ConnectionCache;
};

const cache: ConnectionCache = (globalWithMongoose._mongooseCache ??= {
  conn: null,
  promise: null,
});

// mongoose.connection.readyState
const DISCONNECTED = 0;
const CONNECTED = 1;
const CONNECTING = 2;

const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DB] ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(
      `[DB Error] ${message}`,
      error instanceof Error ? error.message : error
    );
  },
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  const mongodbUri = process.env.MONGODB_CONNECTION;

  if (!mongodbUri) {
    logger.error("MONGODB_CONNECTION environment variable is missing");
    throw new Error(
      "Please define the MONGODB_CONNECTION environment variable inside .env.local"
    );
  }

  const state = mongoose.connection.readyState;

  if (state === CONNECTED) {
    cache.conn ??= mongoose;
    return cache.conn;
  }

  // Mid-connect: join the attempt already running rather than starting another.
  if (state === CONNECTING) {
    if (!cache.promise) {
      cache.promise = (mongoose.connection.asPromise
        ? mongoose.connection.asPromise()
        : Promise.resolve(mongoose)
      ).then(() => {
        cache.conn = mongoose;
        return mongoose;
      });
    }
    return cache.promise;
  }

  // Anything else means what we cached is no longer usable. A lambda that was
  // frozen and thawed can hold a dead socket, and returning it produced
  // "MongoNotConnectedError: Client must be connected before running
  // operations" at the first query. Drop it and reconnect.
  if (state === DISCONNECTED) {
    cache.conn = null;
    cache.promise = null;
  }

  cache.promise ??= mongoose
    .connect(mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      // Queue operations while the driver is establishing or re-establishing a
      // connection, instead of throwing immediately. With this off, a
      // momentary blip failed the request outright; with it on, the operation
      // waits for the connection it is about to get.
      bufferCommands: true,
    })
    .then((connection) => {
      logger.info("MongoDB connected successfully");
      cache.conn = connection;

      connection.connection.on("error", (error) => {
        logger.error("MongoDB connection error", error);
        cache.conn = null;
        cache.promise = null;
      });

      connection.connection.on("disconnected", () => {
        logger.info("MongoDB disconnected");
        cache.conn = null;
        cache.promise = null;
      });

      return connection;
    });

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    // Leave nothing cached, or every later call replays this same failure.
    cache.conn = null;
    cache.promise = null;
    logger.error("Failed to connect to MongoDB", error);
    throw new Error("Failed to connect to database");
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cache.conn) {
    await cache.conn.disconnect();
  }
  cache.conn = null;
  cache.promise = null;
}
