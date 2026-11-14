import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MCP_TOOLS, ISRAELI_CARRIERS, generateCarrierForwardingCodes } from '../src/core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, '../src/server.mjs');

function createStdioMcpClient(envOverrides = {}) {
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const rl = readline.createInterface({
    input: child.stdout,
    crlfDelay: Infinity,
  });

  const pending = new Map();

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const msg = JSON.parse(trimmed);
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  });

  let nextId = 1;

  function request(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timeout waiting for JSON-RPC response to ${method} (id=${id})`));
      }, 5000);

      pending.set(id, {
        resolve: (msg) => {
          clearTimeout(timer);
          resolve(msg);
        },
      });

      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  }

  function notify(method, params = {}) {
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
  }

  async function close() {
    rl.close();
    child.stdin.end();
    await new Promise((resolve) => {
      child.once('close', resolve);
      setTimeout(() => {
        child.kill();
        resolve();
      }, 500);
    });
  }

  return { request, notify, close };
}

describe('kolivri-voice-mcp end-to-end integration suite', () => {
  let mockServer;
  let mockBaseUrl;
  const capturedRequests = [];
  let mcpClient;

  before(async () => {
    mockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        let parsedBody = null;
        if (body) {
          try {
            parsedBody = JSON.parse(body);
          } catch {
            parsedBody = body;
          }
        }

        capturedRequests.push({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: parsedBody,
        });

        if (req.method === 'POST' && req.url.startsWith('/api/v1/engine/trigger/')) {
          const webhookId = req.url.split('/').pop();
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(
            JSON.stringify({
              callId: 'call_il_9001',
              status: 'queued',
              webhookId,
              acceptedAt: '2026-11-05T10:00:00.000Z',
            })
          );
          return;
        }

        if (req.method === 'GET' && req.url.startsWith('/api/v1/calls/')) {
          const callId = decodeURIComponent(req.url.split('/').pop());
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(
            JSON.stringify({
              callId,
              status: 'completed',
              outcome: 'appointment_confirmed',
              durationSeconds: 74,
              language: 'he',
              transcript: [
                { speaker: 'agent', text: 'שלום דנה, מדברת קוליברי ממרפאת השיניים.' },
                { speaker: 'user', text: 'היי, כן אני מאשרת הגעה למחר בעשר.' },
              ],
              summary: 'הלקוחה דנה אישרה הגעה לתור מחר בשעה 10:00.',
              appointmentBooked: true,
              appointmentTime: '2026-11-06T10:00:00+02:00',
              recordingUrl: 'https://app.kolivri.co.il/recordings/call_il_9001.mp3',
            })
          );
          return;
        }

        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      });
    });

    await new Promise((resolve) => {
      mockServer.listen(0, '127.0.0.1', () => {
        const { port } = mockServer.address();
        mockBaseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    mcpClient = createStdioMcpClient({
      KOLIVRI_API_URL: mockBaseUrl,
      KOLIVRI_API_KEY: 'klv_live_test_secret_123',
      KOLIVRI_WEBHOOK_ID: 'wh_dental_clinic_01',
      KOLIVRI_VERIFIED_CALLER_ID: '03-5550199,+972549998877',
      KOLIVRI_MAX_CALLS_PER_MINUTE: '2',
    });
  });

  after(async () => {
    if (mcpClient) {
      await mcpClient.close();
    }
    if (mockServer) {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });

  it('initializes over JSON-RPC 2.0 and lists all 4 Kolivri voice tools with schemas', async () => {
    const initRes = await mcpClient.request('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'opencode-test', version: '1.0.0' },
      capabilities: {},
    });

    assert.equal(initRes.jsonrpc, '2.0');
    assert.equal(initRes.result.serverInfo.name, 'kolivri-voice-mcp');
    assert.ok(initRes.result.capabilities.tools);

    mcpClient.notify('notifications/initialized');

    const listRes = await mcpClient.request('tools/list');
    const tools = listRes.result.tools;
    assert.equal(tools.length, 4);

    const names = tools.map((t) => t.name);
    assert.deepEqual(names, [
      'kolivri_place_call',
      'kolivri_get_call_status',
      'kolivri_carrier_forwarding_codes',
      'kolivri_preview_roi',
    ]);

    const placeCallTool = tools.find((t) => t.name === 'kolivri_place_call');
    assert.deepEqual(placeCallTool.inputSchema.required, ['to', 'objective', 'verifiedCallerId']);
    assert.deepEqual(placeCallTool.inputSchema.properties.language.enum, [
      'he',
      'en',
      'ar',
      'ru',
      'fr',
      'es',
      'de',
      'pt',
    ]);
  });

  it('places an outbound AI voice call on the happy path with x-api-key header, normalized E.164 phone, and Hebrew default', async () => {
    capturedRequests.length = 0;

    const callRes = await mcpClient.request('tools/call', {
      name: 'kolivri_place_call',
      arguments: {
        to: '054-123-4567',
        verifiedCallerId: '03-5550199',
        objective: 'Confirm dental hygiene appointment with Dana for tomorrow at 10:00',
        contactName: 'Dana Cohen',
      },
    });

    assert.equal(callRes.result.isError, false);
    const payload = JSON.parse(callRes.result.content[0].text);
    assert.equal(payload.callId, 'call_il_9001');
    assert.equal(payload.status, 'queued');
    assert.equal(payload.to, '+972541234567');
    assert.equal(payload.verifiedCallerId, '+97235550199');
    assert.equal(payload.language, 'he');
    assert.equal(payload.webhookId, 'wh_dental_clinic_01');
    assert.equal(payload.rateLimitRemaining, 1);

    assert.equal(capturedRequests.length, 1);
    const req = capturedRequests[0];
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/api/v1/engine/trigger/wh_dental_clinic_01');
    assert.equal(req.headers['x-api-key'], 'klv_live_test_secret_123');
    assert.equal(req.body.to, '+972541234567');
    assert.equal(req.body.verifiedCallerId, '+97235550199');
    assert.equal(req.body.language, 'he');
    assert.equal(req.body.contactName, 'Dana Cohen');
  });

  it('retrieves structured call status, transcript, summary, appointment status, and recording URL', async () => {
    const statusRes = await mcpClient.request('tools/call', {
      name: 'kolivri_get_call_status',
      arguments: {
        callId: 'call_il_9001',
      },
    });

    assert.equal(statusRes.result.isError, false);
    const data = JSON.parse(statusRes.result.content[0].text);
    assert.equal(data.callId, 'call_il_9001');
    assert.equal(data.status, 'completed');
    assert.equal(data.outcome, 'appointment_confirmed');
    assert.equal(data.language, 'he');
    assert.equal(data.appointmentBooked, true);
    assert.equal(data.appointmentTime, '2026-11-06T10:00:00+02:00');
    assert.equal(data.recordingUrl, 'https://app.kolivri.co.il/recordings/call_il_9001.mp3');
    assert.equal(data.transcript.length, 2);
  });

  it('enforces anti-abuse guards: unverified caller ID, invalid phone number, unsupported language, and rate-limit overflow', async () => {
    // 1. Unverified caller ID (not in allowlist)
    const unverifiedRes = await mcpClient.request('tools/call', {
      name: 'kolivri_place_call',
      arguments: {
        to: '054-1234567',
        verifiedCallerId: '+97239999999',
        objective: 'Follow up with lead',
      },
    });
    assert.equal(unverifiedRes.result.isError, true);
    assert.match(unverifiedRes.result.content[0].text, /KYC guard/i);

    // 2. Invalid destination phone number
    const badPhoneRes = await mcpClient.request('tools/call', {
      name: 'kolivri_place_call',
      arguments: {
        to: '12345',
        verifiedCallerId: '03-5550199',
        objective: 'Follow up with lead',
      },
    });
    assert.equal(badPhoneRes.result.isError, true);
    assert.match(badPhoneRes.result.content[0].text, /Invalid to/i);

    // 3. Unsupported language
    const badLangRes = await mcpClient.request('tools/call', {
      name: 'kolivri_place_call',
      arguments: {
        to: '052-7654321',
        verifiedCallerId: '03-5550199',
        objective: 'Follow up with lead',
        language: 'ja',
      },
    });
    assert.equal(badLangRes.result.isError, true);
    assert.match(badLangRes.result.content[0].text, /unsupported language/i);

    // 4. Consume the 2nd allowed call in this 60s window
    const secondCallRes = await mcpClient.request('tools/call', {
      name: 'kolivri_place_call',
      arguments: {
        to: '052-7654321',
        verifiedCallerId: '+972549998877',
        objective: 'Second allowed call within rate limit',
        language: 'en',
      },
    });
    assert.equal(secondCallRes.result.isError, false);

    // 5. Third call within same minute must be rejected by rate limiter (limit = 2/min)
    const thirdCallRes = await mcpClient.request('tools/call', {
      name: 'kolivri_place_call',
      arguments: {
        to: '050-1112233',
        verifiedCallerId: '03-5550199',
        objective: 'Third call exceeding rate limit',
      },
    });
    assert.equal(thirdCallRes.result.isError, true);
    assert.match(thirdCallRes.result.content[0].text, /Rate limit exceeded/i);
  });

  it('generates accurate GSM/carrier call-forwarding dial codes for Israeli carriers', async () => {
    const partnerRes = await mcpClient.request('tools/call', {
      name: 'kolivri_carrier_forwarding_codes',
      arguments: {
        carrier: 'partner',
        targetNumber: '+97235550199',
        ringSeconds: 20,
      },
    });

    assert.equal(partnerRes.result.isError, false);
    const partnerData = JSON.parse(partnerRes.result.content[0].text);
    assert.equal(partnerData.carrier, 'partner');
    assert.equal(partnerData.targetNumberDomestic, '035550199');
    assert.equal(partnerData.codes.noAnswer, '*61*035550199**20#');
    assert.equal(partnerData.codes.busy, '*67*035550199#');
    assert.equal(partnerData.codes.unreachable, '*62*035550199#');
    assert.equal(partnerData.codes.unconditional, '*21*035550199#');
    assert.equal(partnerData.codes.resetAll, '##002#');

    const bezeqRes = await mcpClient.request('tools/call', {
      name: 'kolivri_carrier_forwarding_codes',
      arguments: {
        carrier: 'bezeq',
        targetNumber: '03-5550199',
      },
    });
    assert.equal(bezeqRes.result.isError, false);
    const bezeqData = JSON.parse(bezeqRes.result.content[0].text);
    assert.equal(bezeqData.codes.bezeqLegacyUnconditional, '*73*035550199#');
    assert.equal(bezeqData.codes.resetAll, '##002#');
  });

  it('generates forwarding codes for Israeli and global carriers with international E.164 target numbers (+14155552671)', async () => {
    const expectedCarriers = [
      'partner',
      'pelephone',
      'cellcom',
      'hot_mobile',
      'golan',
      '019',
      'we4g',
      'bezeq',
      'us_gsm',
      'verizon',
      'uk_eu_gsm',
      'au_global',
      'twilio_sip',
    ];
    for (const c of expectedCarriers) {
      assert.ok(ISRAELI_CARRIERS[c], `Carrier ${c} must be present in ISRAELI_CARRIERS`);
    }

    // Israeli domestic number via generateCarrierForwardingCodes
    const domesticPartner = generateCarrierForwardingCodes({
      carrier: 'partner',
      targetNumber: '0547875670',
      ringSeconds: 15,
    });
    assert.equal(domesticPartner.targetNumberE164, '+972547875670');
    assert.equal(domesticPartner.targetNumberDomestic, '0547875670');
    assert.equal(domesticPartner.codes.noAnswer, '*61*0547875670**15#');

    // Israeli carrier with international E.164 targetNumber
    const partnerIntlRes = await mcpClient.request('tools/call', {
      name: 'kolivri_carrier_forwarding_codes',
      arguments: {
        carrier: 'partner',
        targetNumber: '+14155552671',
        ringSeconds: 15,
      },
    });
    assert.equal(partnerIntlRes.result.isError, false);
    const partnerIntl = JSON.parse(partnerIntlRes.result.content[0].text);
    assert.equal(partnerIntl.targetNumberE164, '+14155552671');
    assert.equal(partnerIntl.codes.noAnswer, '*61*+14155552671**15#');
    assert.equal(partnerIntl.codes.busy, '*67*+14155552671#');
    assert.equal(partnerIntl.codes.unreachable, '*62*+14155552671#');
    assert.equal(partnerIntl.codes.allConditional, '*004*+14155552671**15#');
    assert.equal(partnerIntl.codes.unconditional, '*21*+14155552671#');
    assert.equal(partnerIntl.codes.resetAll, '##002#');

    const bezeqIntlRes = await mcpClient.request('tools/call', {
      name: 'kolivri_carrier_forwarding_codes',
      arguments: {
        carrier: 'bezeq',
        targetNumber: '+14155552671',
      },
    });
    assert.equal(bezeqIntlRes.result.isError, false);
    const bezeqIntl = JSON.parse(bezeqIntlRes.result.content[0].text);
    assert.equal(bezeqIntl.codes.bezeqLegacyUnconditional, '*73*+14155552671#');

    // us_gsm with +14155552671
    const usGsmRes = await mcpClient.request('tools/call', {
      name: 'kolivri_carrier_forwarding_codes',
      arguments: {
        carrier: 'us_gsm',
        targetNumber: '+14155552671',
        ringSeconds: 20,
      },
    });
    assert.equal(usGsmRes.result.isError, false);
    const usGsmData = JSON.parse(usGsmRes.result.content[0].text);
    assert.equal(usGsmData.carrier, 'us_gsm');
    assert.equal(usGsmData.codes.noAnswer, '*61*+14155552671**20#');
    assert.equal(usGsmData.codes.busy, '*67*+14155552671#');
    assert.equal(usGsmData.codes.unreachable, '*62*+14155552671#');
    assert.equal(usGsmData.codes.allConditional, '*004*+14155552671**20#');
    assert.equal(usGsmData.codes.resetAll, '##002#');

    // verizon with +14155552671
    const verizonRes = await mcpClient.request('tools/call', {
      name: 'kolivri_carrier_forwarding_codes',
      arguments: {
        carrier: 'verizon',
        targetNumber: '+14155552671',
      },
    });
    assert.equal(verizonRes.result.isError, false);
    const verizonData = JSON.parse(verizonRes.result.content[0].text);
    assert.equal(verizonData.carrier, 'verizon');
    assert.equal(verizonData.codes.noAnswer, '*7114155552671');
    assert.equal(verizonData.codes.busy, '*9014155552671');
    assert.equal(verizonData.codes.unconditional, '*7214155552671');
    assert.equal(verizonData.codes.resetAll, '*73');

    // uk_eu_gsm and au_global
    const ukEuData = generateCarrierForwardingCodes({
      carrier: 'uk_eu_gsm',
      targetNumber: '+18885550199',
      ringSeconds: 15,
    });
    assert.equal(ukEuData.codes.noAnswer, '*61*+18885550199**15#');
    assert.equal(ukEuData.codes.resetAll, '##002#');

    const auGlobalData = generateCarrierForwardingCodes({
      carrier: 'au_global',
      targetNumber: '+18885550199',
      ringSeconds: 15,
    });
    assert.equal(auGlobalData.codes.allConditional, '*004*+18885550199**15#');
    assert.equal(auGlobalData.codes.resetAll, '##002#');

    // twilio_sip with +14155552671
    const twilioSipRes = await mcpClient.request('tools/call', {
      name: 'kolivri_carrier_forwarding_codes',
      arguments: {
        carrier: 'twilio_sip',
        targetNumber: '+14155552671',
      },
    });
    assert.equal(twilioSipRes.result.isError, false);
    const twilioSipData = JSON.parse(twilioSipRes.result.content[0].text);
    assert.equal(twilioSipData.carrier, 'twilio_sip');
    assert.equal(twilioSipData.sipUri, 'sip:+14155552671@sip.kolivri.com');
    assert.equal(twilioSipData.codes.sipUri, 'sip:+14155552671@sip.kolivri.com');
    assert.equal(twilioSipData.codes.unconditional, 'sip:+14155552671@sip.kolivri.com');
    assert.equal(twilioSipData.codes.noAnswer, 'sip:+14155552671@sip.kolivri.com');
  });

  it('calculates SMB missed-call ROI and recommends Starter, Business, and Pro plans accurately', async () => {
    // Starter tier (<= 150 calls/month)
    const starterRes = await mcpClient.request('tools/call', {
      name: 'kolivri_preview_roi',
      arguments: {
        missedCallsPerWeek: 20,
        avgDealValueIls: 600,
        closeRatePercent: 25,
        aiRecoveryRatePercent: 60,
      },
    });
    assert.equal(starterRes.result.isError, false);
    const starterData = JSON.parse(starterRes.result.content[0].text);
    assert.equal(starterData.recommendedPlan.label, 'Starter $69 / ₪247');
    assert.ok(starterData.metrics.monthlyLostRevenueIls > 0);
    assert.ok(starterData.metrics.monthlyRecoveredRevenueIls > starterData.recommendedPlan.priceIls);

    // Business tier (151..450 calls/month)
    const businessRes = await mcpClient.request('tools/call', {
      name: 'kolivri_preview_roi',
      arguments: {
        missedCallsPerWeek: 60,
        avgDealValueIls: 800,
      },
    });
    const businessData = JSON.parse(businessRes.result.content[0].text);
    assert.equal(businessData.recommendedPlan.label, 'Business $139 / ₪479');

    // Pro tier (> 450 calls/month)
    const proRes = await mcpClient.request('tools/call', {
      name: 'kolivri_preview_roi',
      arguments: {
        missedCallsPerWeek: 140,
        avgDealValueIls: 1200,
      },
    });
    const proData = JSON.parse(proRes.result.content[0].text);
    assert.equal(proData.recommendedPlan.label, 'Pro $249 / ₪880');
  });

  it('validates Smithery, Glama, and Official MCP Registry manifests and all 4 tool names', () => {
    const pkgDir = path.resolve(__dirname, '..');
    const expectedTools = MCP_TOOLS.map((t) => t.name);
    assert.deepEqual(expectedTools, [
      'kolivri_place_call',
      'kolivri_get_call_status',
      'kolivri_carrier_forwarding_codes',
      'kolivri_preview_roi',
    ]);

    const smitheryPath = path.join(pkgDir, 'smithery.yaml');
    const glamaPath = path.join(pkgDir, 'glama.json');
    const serverJsonPath = path.join(pkgDir, 'server.json');

    assert.ok(fs.existsSync(smitheryPath), 'smithery.yaml must exist');
    assert.ok(fs.existsSync(glamaPath), 'glama.json must exist');
    assert.ok(fs.existsSync(serverJsonPath), 'server.json must exist');

    // 1. Validate smithery.yaml
    const smitheryRaw = fs.readFileSync(smitheryPath, 'utf8');
    assert.match(smitheryRaw, /startCommand:/);
    assert.match(smitheryRaw, /type:\s*stdio/);
    assert.match(smitheryRaw, /configSchema:/);
    assert.match(smitheryRaw, /kolivriApiKey:/);
    assert.match(smitheryRaw, /kolivriWebhookId:/);
    assert.match(smitheryRaw, /kolivriVerifiedCallerId:/);
    assert.match(smitheryRaw, /kolivriApiUrl:/);
    assert.match(smitheryRaw, /https:\/\/app\.kolivri\.co\.il/);
    assert.match(smitheryRaw, /commandFunction:/);
    assert.match(smitheryRaw, /src\/server\.mjs/);
    for (const toolName of expectedTools) {
      assert.ok(
        smitheryRaw.includes(toolName),
        `smithery.yaml must reference tool ${toolName}`
      );
    }

    const cmdFnMatch = smitheryRaw.match(/commandFunction:\s*\|-\n([\s\S]+)$/);
    assert.ok(cmdFnMatch, 'smithery.yaml must contain a block scalar commandFunction');
    const fnSource = cmdFnMatch[1]
      .split('\n')
      .map((line) => line.replace(/^ {4}/, ''))
      .join('\n')
      .trim();
    const commandFunction = new Function(`return (${fnSource});`)();
    const spawnSpec = commandFunction({
      kolivriApiKey: 'klv_test_key',
      kolivriWebhookId: 'wh_test',
      kolivriVerifiedCallerId: '+97235550199',
    });
    assert.equal(spawnSpec.command, 'node');
    assert.deepEqual(spawnSpec.args, ['src/server.mjs']);
    assert.equal(spawnSpec.env.KOLIVRI_API_KEY, 'klv_test_key');
    assert.equal(spawnSpec.env.KOLIVRI_WEBHOOK_ID, 'wh_test');
    assert.equal(spawnSpec.env.KOLIVRI_VERIFIED_CALLER_ID, '+97235550199');
    assert.equal(spawnSpec.env.KOLIVRI_API_URL, 'https://app.kolivri.co.il');

    // 2. Validate glama.json
    const glama = JSON.parse(fs.readFileSync(glamaPath, 'utf8'));
    assert.equal(glama.$schema, 'https://glama.ai/mcp/schemas/server.json');
    assert.equal(glama.maintainer, 'kolivritech');
    assert.ok(typeof glama.description === 'string' && glama.description.length > 10);
    assert.ok(Array.isArray(glama.tools));
    assert.deepEqual(
      glama.tools.map((t) => t.name),
      expectedTools
    );

    // 3. Validate server.json (Official MCP Registry)
    const serverManifest = JSON.parse(fs.readFileSync(serverJsonPath, 'utf8'));
    assert.equal(serverManifest.name, 'io.github.kolivritech/kolivri-voice-mcp');
    assert.ok(typeof serverManifest.description === 'string' && serverManifest.description.length > 10);
    assert.equal(serverManifest.version, '1.0.0');
    assert.ok(Array.isArray(serverManifest.packages) && serverManifest.packages.length === 1);
    const pkgEntry = serverManifest.packages[0];
    const registryKind = pkgEntry.registryType || pkgEntry.registry_name;
    assert.ok(['npm', 'mcpb'].includes(registryKind));
    assert.equal(pkgEntry.name, 'kolivri-voice-mcp');
    const envList = pkgEntry.environmentVariables || pkgEntry.environment_variables;
    assert.ok(Array.isArray(envList) && envList.length >= 4);
    const envNames = envList.map((e) => e.name);
    assert.ok(envNames.includes('KOLIVRI_API_KEY'));
    assert.ok(envNames.includes('KOLIVRI_WEBHOOK_ID'));
    assert.ok(envNames.includes('KOLIVRI_VERIFIED_CALLER_ID'));
    assert.ok(envNames.includes('KOLIVRI_API_URL'));
    assert.ok(Array.isArray(serverManifest.tools));
    assert.deepEqual(
      serverManifest.tools.map((t) => t.name),
      expectedTools
    );

    // 4. Validate production Dockerfile & README Glama badge / demo numbers
    const dockerfilePath = path.join(pkgDir, 'Dockerfile');
    assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile must exist for Glama introspection');
    const dockerfileRaw = fs.readFileSync(dockerfilePath, 'utf8');
    assert.match(dockerfileRaw, /^FROM node:22-alpine/m);
    assert.match(dockerfileRaw, /ENTRYPOINT \["node", "src\/server\.mjs"\]/);

    const readmeRaw = fs.readFileSync(path.join(pkgDir, 'README.md'), 'utf8');
    assert.ok(
      readmeRaw.includes(
        '[![kolivritech/kolivri-voice-mcp MCP server](https://glama.ai/mcp/servers/kolivritech/kolivri-voice-mcp/badges/score.svg)](https://glama.ai/mcp/servers/kolivritech/kolivri-voice-mcp)'
      )
    );
    assert.ok(readmeRaw.includes('+1 (507) 604-6732'));
    assert.ok(readmeRaw.includes('074-760-5550'));
  });
});
