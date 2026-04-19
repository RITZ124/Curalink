#!/usr/bin/env node
/**
 * CuraLink Setup Script
 * Run: node setup.js
 * Guides you through environment config and LLM selection
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const colors = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  cyan: '\x1b[36m', green: '\x1b[32m',
  yellow: '\x1b[33m', red: '\x1b[31m',
  blue: '\x1b[34m', magenta: '\x1b[35m'
};
const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

async function main() {
  console.log('\n' + c('cyan', '╔══════════════════════════════════════════╗'));
  console.log(c('cyan', '║') + c('bold', '   🏥  CuraLink Setup Wizard              ') + c('cyan', '║'));
  console.log(c('cyan', '╚══════════════════════════════════════════╝') + '\n');

  // Check Node version
  const nodeVersion = process.versions.node.split('.')[0];
  if (parseInt(nodeVersion) < 18) {
    console.log(c('red', '❌ Node.js 18+ required. Current: ' + process.versions.node));
    process.exit(1);
  }
  console.log(c('green', '✅ Node.js ' + process.versions.node));

  // Check MongoDB
  try {
    execSync('mongod --version', { stdio: 'ignore' });
    console.log(c('green', '✅ MongoDB detected'));
  } catch {
    console.log(c('yellow', '⚠️  MongoDB not found locally — will use Atlas or skip persistence'));
  }

  console.log('\n' + c('bold', '🤖 LLM Configuration'));
  console.log('   1. Ollama (local, recommended — free, open-source)');
  console.log('   2. HuggingFace (cloud, free tier available)');
  console.log('   3. Anthropic Claude (cloud, paid)');
  console.log('   4. Skip (rule-based fallback only)\n');

  const llmChoice = await ask(c('cyan', '   Choose LLM option [1-4]: '));

  let envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/curalink
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
PUBMED_EMAIL=research@curalink.ai
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
`;

  switch (llmChoice.trim()) {
    case '1': {
      // Ollama setup
      try {
        execSync('ollama --version', { stdio: 'ignore' });
        console.log(c('green', '\n   ✅ Ollama detected'));
      } catch {
        console.log(c('yellow', '\n   ⚠️  Ollama not found. Install from https://ollama.com'));
        console.log(c('yellow', '   Then run: ollama pull llama3.2'));
      }

      const model = await ask(c('cyan', '   Ollama model [llama3.2]: ')) || 'llama3.2';
      envContent += `\n# Ollama (local open-source LLM)\nOLLAMA_BASE_URL=http://localhost:11434\nOLLAMA_MODEL=${model}\n`;
      console.log(c('green', `   ✅ Configured Ollama with model: ${model}`));
      console.log(c('yellow', `   Run: ollama pull ${model}`));
      break;
    }
    case '2': {
      console.log(c('blue', '   Get free token at: https://huggingface.co/settings/tokens'));
      const hfToken = await ask(c('cyan', '   HuggingFace API token (hf_...): '));
      const hfModel = await ask(c('cyan', '   Model [mistralai/Mistral-7B-Instruct-v0.3]: ')) || 'mistralai/Mistral-7B-Instruct-v0.3';
      envContent += `\n# HuggingFace\nHF_API_TOKEN=${hfToken.trim()}\nHF_MODEL=${hfModel.trim()}\n`;
      console.log(c('green', '   ✅ Configured HuggingFace'));
      break;
    }
    case '3': {
      const antKey = await ask(c('cyan', '   Anthropic API key (sk-ant-...): '));
      envContent += `\n# Anthropic Claude\nANTHROPIC_API_KEY=${antKey.trim()}\n`;
      console.log(c('green', '   ✅ Configured Anthropic'));
      break;
    }
    default:
      console.log(c('yellow', '   ⚠️  No LLM configured — will use rule-based fallback'));
  }

  // MongoDB
  console.log('\n' + c('bold', '🗄️  MongoDB Configuration'));
  const mongoChoice = await ask(c('cyan', '   1. Local MongoDB  2. MongoDB Atlas  [1]: ')) || '1';
  if (mongoChoice.trim() === '2') {
    const atlasUri = await ask(c('cyan', '   Atlas URI (mongodb+srv://...): '));
    envContent = envContent.replace('mongodb://localhost:27017/curalink', atlasUri.trim());
    console.log(c('green', '   ✅ Configured MongoDB Atlas'));
  } else {
    console.log(c('green', '   ✅ Using local MongoDB'));
  }

  // Write .env
  const envPath = path.join(__dirname, 'backend', '.env');
  fs.writeFileSync(envPath, envContent);
  console.log(c('green', '\n✅ Created backend/.env'));

  // Install dependencies
  console.log('\n' + c('bold', '📦 Installing Dependencies...'));
  try {
    console.log('   Installing backend...');
    execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
    console.log('   Installing frontend...');
    execSync('npm install', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
    console.log(c('green', '✅ Dependencies installed'));
  } catch (err) {
    console.log(c('red', '❌ Install failed: ' + err.message));
  }

  console.log('\n' + c('cyan', '╔══════════════════════════════════════════╗'));
  console.log(c('cyan', '║') + c('green', '  🚀  Setup Complete! Start with:         ') + c('cyan', '║'));
  console.log(c('cyan', '║') + c('bold', '                                          ') + c('cyan', '║'));
  console.log(c('cyan', '║') + '  Terminal 1: ' + c('yellow', 'cd backend && npm run dev') + '   ' + c('cyan', '║'));
  console.log(c('cyan', '║') + '  Terminal 2: ' + c('yellow', 'cd frontend && npm start') + '   ' + c('cyan', '║'));
  console.log(c('cyan', '║') + '                                          ' + c('cyan', '║'));
  console.log(c('cyan', '║') + '  Open: ' + c('blue', 'http://localhost:3000') + '             ' + c('cyan', '║'));
  console.log(c('cyan', '╚══════════════════════════════════════════╝') + '\n');

  rl.close();
}

main().catch(err => { console.error(err); rl.close(); });
