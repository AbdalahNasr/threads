"use server";

import { connectToDB, checkMongoDBConnection } from "./mongoose";
import Community from "./models/community.model";
import User from "./models/user.model";

/**
 * Test MongoDB connection and basic operations
 * @returns A diagnostic report about the MongoDB connection
 */
export async function testMongoDBConnection() {
  const report = {
    timestamp: new Date().toISOString(),
    connectionTest: false,
    environmentVariables: {
      hasMongoDBUrl: false,
      mongoUrlLength: 0,
      mongoUrlPattern: false,
    },
    mongodbReadyState: -1,
    queriesTest: {
      countCommunities: -1,
      countUsers: -1,
    },
    errors: [] as string[]
  };

  try {
    // Check environment variables
    if (process.env.MONGODB_URL) {
      report.environmentVariables.hasMongoDBUrl = true;
      report.environmentVariables.mongoUrlLength = process.env.MONGODB_URL.length;
      report.environmentVariables.mongoUrlPattern = 
        /^mongodb(\+srv)?:\/\/([^:]+:[^@]+@)?([^:]+)(:\d+)?(\/[^?]+)?(\?.*)?$/.test(process.env.MONGODB_URL);
    } else {
      report.errors.push("MONGODB_URL environment variable is missing");
    }

    // Try to connect
    try {
      await connectToDB();
      report.connectionTest = true;
    } catch (connError: any) {
      report.errors.push(`Connection error: ${connError.message}`);
    }

    // Check connection state
    const isConnected = await checkMongoDBConnection();
    report.mongodbReadyState = isConnected ? 1 : 0;

    // Try basic queries if connected
    if (isConnected) {
      try {
        report.queriesTest.countCommunities = await Community.countDocuments();
      } catch (communityError: any) {
        report.errors.push(`Community query error: ${communityError.message}`);
      }

      try {
        report.queriesTest.countUsers = await User.countDocuments();
      } catch (userError: any) {
        report.errors.push(`User query error: ${userError.message}`);
      }
    }

    return {
      success: report.connectionTest && report.errors.length === 0,
      report
    };
  } catch (error: any) {
    return {
      success: false,
      report: {
        ...report,
        errors: [...report.errors, `Unexpected error: ${error.message}`]
      }
    };
  }
}

/**
 * API route to test MongoDB connection from client side
 */
export async function getMongoDBStatus() {
  try {
    const result = await testMongoDBConnection();
    return {
      success: result.success,
      connected: result.report.connectionTest,
      message: result.success 
        ? `Connected to MongoDB. Found ${result.report.queriesTest.countCommunities} communities and ${result.report.queriesTest.countUsers} users.` 
        : `Connection issues: ${result.report.errors.join(', ')}`,
      details: result.report
    };
  } catch (error: any) {
    return {
      success: false,
      connected: false,
      message: `Error checking MongoDB status: ${error.message}`,
      details: { errors: [error.message] }
    };
  }
}