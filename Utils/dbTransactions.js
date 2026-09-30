const mongoose = require("mongoose");

/**
 * Executes a function within a MongoDB transaction if replica set transactions are supported.
 * If running on a standalone MongoDB deployment (common in local dev), executes safely without a session.
 *
 * @param {Function} workFn - async function(session) that performs database operations.
 * @returns {Promise<any>}
 */
const runInTransaction = async (workFn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Suppress abort errors if transaction failed to start
      }
    }

    // Check if error is due to MongoDB standalone not supporting transactions
    const errMsg = err.message || "";
    if (
      errMsg.includes("replica set") ||
      errMsg.includes("does not support transactions") ||
      errMsg.includes("Transaction numbers are only allowed on a replica set member")
    ) {
      // Fallback: execute workFn without session
      return await workFn(null);
    }

    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = { runInTransaction };
