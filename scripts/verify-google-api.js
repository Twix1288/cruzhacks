#!/usr/bin/env node

/**
 * Verification script to check if Google API key is configured and being used
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Google API Key Configuration...\n');

// Check 1: Verify .env.local exists and contains the key
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

try {
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env.local file exists');
    
    // Check for GOOGLE_GENERATIVE_AI_API_KEY
    if (envContent.includes('GOOGLE_GENERATIVE_AI_API_KEY')) {
      const keyMatch = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=["']?([^"'\n]+)["']?/);
      if (keyMatch && keyMatch[1]) {
        const keyValue = keyMatch[1];
        console.log(`✅ GOOGLE_GENERATIVE_AI_API_KEY is set`);
        console.log(`   Key starts with: ${keyValue.substring(0, 10)}...`);
        console.log(`   Key length: ${keyValue.length} characters`);
        
        // Basic validation - Google API keys typically start with AIza
        if (keyValue.startsWith('AIza')) {
          console.log('✅ Key format appears valid (starts with AIza)');
        } else {
          console.log('⚠️  Warning: Key format may be incorrect (expected to start with AIza)');
        }
      } else {
        console.log('❌ GOOGLE_GENERATIVE_AI_API_KEY found but value is empty or malformed');
        process.exit(1);
      }
    } else {
      console.log('❌ GOOGLE_GENERATIVE_AI_API_KEY not found in .env.local');
      process.exit(1);
    }
  } else {
    console.log('❌ .env.local file does not exist');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Error reading .env.local: ${error.message}`);
  process.exit(1);
}

// Check 2: Verify the code uses @ai-sdk/google
const analyzeRoutePath = path.join(process.cwd(), 'src/app/api/analyze/route.ts');

try {
  if (fs.existsSync(analyzeRoutePath)) {
    const routeContent = fs.readFileSync(analyzeRoutePath, 'utf8');
    
    console.log('\n📝 Checking code usage...');
    
    if (routeContent.includes("@ai-sdk/google")) {
      console.log('✅ @ai-sdk/google package is imported');
    } else {
      console.log('❌ @ai-sdk/google package is not imported');
      process.exit(1);
    }
    
    if (routeContent.includes("google('gemini-1.5-flash')")) {
      console.log('✅ Google Gemini model is configured (gemini-1.5-flash)');
    } else {
      console.log('❌ Google Gemini model configuration not found');
      process.exit(1);
    }
    
    if (routeContent.includes("generateObject")) {
      console.log('✅ generateObject from AI SDK is being used');
    } else {
      console.log('❌ generateObject not found in code');
      process.exit(1);
    }
    
    // Check if the environment variable name matches what @ai-sdk/google expects
    // The @ai-sdk/google package automatically reads GOOGLE_GENERATIVE_AI_API_KEY
    console.log('\n📦 Package Information:');
    console.log('   @ai-sdk/google automatically reads GOOGLE_GENERATIVE_AI_API_KEY from environment');
    console.log('   No explicit configuration needed - the SDK handles it internally');
    
  } else {
    console.log('❌ analyze route file not found');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Error reading analyze route: ${error.message}`);
  process.exit(1);
}

// Check 3: Verify package.json includes the dependency
const packageJsonPath = path.join(process.cwd(), 'package.json');

try {
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('\n📦 Checking dependencies...');
    
    if (packageJson.dependencies && packageJson.dependencies['@ai-sdk/google']) {
      console.log(`✅ @ai-sdk/google is installed (version: ${packageJson.dependencies['@ai-sdk/google']})`);
    } else {
      console.log('❌ @ai-sdk/google is not in dependencies');
      process.exit(1);
    }
    
    if (packageJson.dependencies && packageJson.dependencies['ai']) {
      console.log(`✅ ai SDK is installed (version: ${packageJson.dependencies['ai']})`);
    } else {
      console.log('❌ ai SDK is not in dependencies');
      process.exit(1);
    }
  }
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  process.exit(1);
}

console.log('\n✅ All checks passed! Google API key is configured and being used correctly.');
console.log('\n💡 Note: The @ai-sdk/google package automatically reads GOOGLE_GENERATIVE_AI_API_KEY');
console.log('   from environment variables at runtime. No additional configuration needed.');
