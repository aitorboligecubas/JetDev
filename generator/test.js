// =============================================================================
// test.js — Standalone test for the generator
//
// Run: node test.js
//
// This tests the full pipeline end-to-end:
//   prompt → enhance → generate → build → deploy → URL
// =============================================================================

const { generateProject, stopAllPreviews } = require("./src/index.js");

async function main() {
  console.log("🧪 Testing JetDev Generator...\n");

  try {
    const result = await generateProject({
      prompt: "Quiero una web para un gimnasio con precios y reservas",
      taskId: "test-123",
    });

    console.log("\n🧪 TEST RESULT:");
    console.log(JSON.stringify(result, null, 2));

    // Verify the contract
    if (!result.projectPath) throw new Error("Missing projectPath");
    if (!result.previewUrl) throw new Error("Missing previewUrl");
    if (typeof result.projectPath !== "string") throw new Error("projectPath must be string");
    if (typeof result.previewUrl !== "string") throw new Error("previewUrl must be string");

    console.log("\n✅ ALL CHECKS PASSED");
    console.log(`\n🌐 Open ${result.previewUrl} in your browser to see the result`);
    console.log("   Press Ctrl+C to stop\n");

    // Keep alive for preview
    process.on("SIGINT", () => {
      console.log("\n🛑 Stopping previews...");
      stopAllPreviews();
      process.exit(0);
    });
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}\n`);
    stopAllPreviews();
    process.exit(1);
  }
}

main();
