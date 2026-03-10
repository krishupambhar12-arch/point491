/**
 * Migration script to rename medical roles to legal roles.
 *
 * - Patient  -> Client
 * - Doctor   -> Attorney
 *
 * It also updates ConsultationMessage.sender_role where those values are stored.
 *
 * USAGE (from backend folder, with NODE_ENV configured to point at your DB):
 *   node scripts/migrateRoles.js
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const ConsultationMessage = require("../models/ConsultationMessage");
const dbConnect = require("../config/dbConnect");

async function run() {
  try {
    await dbConnect();

    console.log("Connected. Migrating user roles...");

    const userResult1 = await User.updateMany(
      { role: "Patient" },
      { $set: { role: "Client" } }
    );
    const userResult2 = await User.updateMany(
      { role: "Doctor" },
      { $set: { role: "Attorney" } }
    );

    console.log(`Updated ${userResult1.modifiedCount} users from Patient -> Client`);
    console.log(`Updated ${userResult2.modifiedCount} users from Doctor -> Attorney`);

    console.log("Migrating ConsultationMessage.sender_role values...");

    const msgResult1 = await ConsultationMessage.updateMany(
      { sender_role: "Patient" },
      { $set: { sender_role: "Client" } }
    );
    const msgResult2 = await ConsultationMessage.updateMany(
      { sender_role: "Doctor" },
      { $set: { sender_role: "Attorney" } }
    );

    console.log(`Updated ${msgResult1.modifiedCount} messages from Patient -> Client`);
    console.log(`Updated ${msgResult2.modifiedCount} messages from Doctor -> Attorney`);

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();

