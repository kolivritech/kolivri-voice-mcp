export const SUPPORTED_LANGUAGES = Object.freeze([
  'he',
  'en',
  'ar',
  'ru',
  'fr',
  'es',
  'de',
  'pt',
]);

export const ISRAELI_CARRIERS = Object.freeze({
  partner: {
    id: 'partner',
    displayName: 'Partner (פרטנר)',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Dial each code and press Call. Wait for the confirmation tone/pop-up (takes ~30 seconds total).',
  },
  pelephone: {
    id: 'pelephone',
    displayName: 'Pelephone (פלאפון)',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Works on all Pelephone 4G/5G plans. Ensure VoLTE is enabled for fastest call handoff.',
  },
  cellcom: {
    id: 'cellcom',
    displayName: 'Cellcom (סלקום)',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Standard GSM forwarding codes apply. Dial ##002# at any time to clear all forwarding rules.',
  },
  hot_mobile: {
    id: 'hot_mobile',
    displayName: 'HOT Mobile (הוט מובייל)',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'If *004* combined forwarding is rejected by your SIM profile, dial *61*, *67*, and *62* individually.',
  },
  golan: {
    id: 'golan',
    displayName: 'Golan Telecom (גולן טלקום)',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Ensure call forwarding is enabled in your Golan web self-service portal before dialing GSM codes.',
  },
  '019': {
    id: '019',
    displayName: '019 Mobile (019 מובייל)',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Uses standard GSM USSD codes (*61*, *67*, *62*, *21*) and ##002# to reset.',
  },
  we4g: {
    id: 'we4g',
    displayName: 'We4G / Wecom',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Uses standard GSM USSD forwarding codes across the Cellcom/Wecom network.',
  },
  bezeq: {
    id: 'bezeq',
    displayName: 'Bezeq Landline (בזק קווי)',
    networkType: 'landline',
    supportsTimerSeconds: true,
    notes: 'GSM/IMS codes (*61*, *67*, *62*, *21*, ##002#) work on modern Bezeq NGN/fiber lines; legacy analog lines also support *73* (unconditional) and #73# (cancel).',
  },
  us_gsm: {
    id: 'us_gsm',
    displayName: 'AT&T / T-Mobile / Rogers US & Canada GSM',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Standard North American 3GPP GSM forwarding codes (*61*, *67*, *62*, *004*, *21*) and ##002# to reset.',
  },
  verizon: {
    id: 'verizon',
    displayName: 'Verizon Wireless / Xfinity US',
    networkType: 'mobile',
    supportsTimerSeconds: false,
    notes: 'Verizon / Xfinity US star codes: *71 (No Answer / Conditional), *90 (Busy), *72 (Unconditional), and *73 to reset all forwarding.',
  },
  uk_eu_gsm: {
    id: 'uk_eu_gsm',
    displayName: 'Vodafone / EE / O2 / Orange / T-Mobile UK & EU',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Standard UK & EU 3GPP GSM forwarding codes (*61*, *67*, *62*, *004*, *21*) and ##002# to reset.',
  },
  au_global: {
    id: 'au_global',
    displayName: 'Telstra / Optus / Global 3GPP GSM',
    networkType: 'mobile',
    supportsTimerSeconds: true,
    notes: 'Standard Australian & global 3GPP GSM forwarding codes (*61*, *67*, *62*, *004*, *21*) and ##002# to reset.',
  },
  twilio_sip: {
    id: 'twilio_sip',
    displayName: 'Twilio Elastic SIP Trunk / BYOC',
    networkType: 'sip_trunk',
    supportsTimerSeconds: true,
    notes: 'Forward inbound calls or Failover/Origination routes to the Kolivri SIP URI (sip:<targetNumberE164>@sip.kolivri.com).',
  },
});

export const UNIFIED_PLANS = Object.freeze([
  {
    id: 'starter',
    name: 'Starter',
    label: 'Starter $69 / ₪247',
    priceUsd: 69,
    priceIls: 247,
    includedCallsPerMonth: 150,
    includedNumbers: 1,
    highlights: [
      'Up to 150 AI voice calls/month',
      '1 dedicated Israeli or international phone number',
      '24/7 missed-call recovery in Hebrew & English',
      'Instant WhatsApp & SMS call summaries',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    label: 'Business $139 / ₪479',
    priceUsd: 139,
    priceIls: 479,
    includedCallsPerMonth: 450,
    includedNumbers: 3,
    highlights: [
      'Up to 450 AI voice calls/month',
      'Up to 3 phone numbers & multi-language support (8 languages)',
      'Calendar appointment booking & CRM webhook sync',
      'Outbound follow-up triggers via MCP & REST API',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    label: 'Pro $249 / ₪880',
    priceUsd: 249,
    priceIls: 880,
    includedCallsPerMonth: 1200,
    includedNumbers: 10,
    highlights: [
      'Up to 1,200 AI voice calls/month',
      'Up to 10 phone numbers & custom brand voice tuning',
      'Priority low-latency voice engine & dedicated webhook triggers',
      'Full transcript analytics, recordings, and SLA support',
    ],
  },
]);

export function normalizePhoneNumber(rawInput, fieldName = 'phone') {
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    throw new Error(`Invalid ${fieldName}: phone number must be a non-empty string.`);
  }

  const cleaned = rawInput.trim().replace(/[\s\-().]/g, '');

  // Israeli domestic mobile/landline: 05X-XXXXXXX (10 digits) or 0[23489]-XXXXXXX (9 digits) or 07X-XXXXXXX (10 digits)
  if (/^0(?:5\d{8}|7\d{8}|[23489]\d{7})$/.test(cleaned)) {
    return `+972${cleaned.slice(1)}`;
  }

  // Israeli E.164 without leading plus: 9725XXXXXXXX or 972[23489]XXXXXXX
  if (/^972(?:5\d{8}|7\d{8}|[23489]\d{7})$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Israeli E.164 with leading plus
  if (/^\+972(?:5\d{8}|7\d{8}|[23489]\d{7})$/.test(cleaned)) {
    return cleaned;
  }

  // General international E.164 (+ followed by 8 to 15 digits, not starting with +0 or +972 invalid length)
  if (/^\+[1-9]\d{7,14}$/.test(cleaned) && !cleaned.startsWith('+972')) {
    return cleaned;
  }

  throw new Error(
    `Invalid ${fieldName} "${rawInput}": must be a valid Israeli number (e.g. 054-1234567 or +972541234567) or E.164 number (e.g. +14155550123).`
  );
}

export function toDomesticIsraeliNumber(normalizedE164) {
  if (normalizedE164.startsWith('+972')) {
    return `0${normalizedE164.slice(4)}`;
  }
  return normalizedE164;
}

export function generateCarrierForwardingCodes(carrierOrArgs = {}, maybeTargetNumber, maybeRingSeconds) {
  const args =
    typeof carrierOrArgs === 'string'
      ? {
          carrier: carrierOrArgs,
          targetNumber: maybeTargetNumber,
          ...(maybeRingSeconds !== undefined ? { ringSeconds: maybeRingSeconds } : {}),
        }
      : carrierOrArgs || {};

  const carrierKey = typeof args.carrier === 'string' ? args.carrier.trim().toLowerCase() : '';
  const carrierInfo = ISRAELI_CARRIERS[carrierKey];
  if (!carrierInfo) {
    throw new Error(
      `Unsupported carrier "${args.carrier}". Supported carriers: ${Object.keys(ISRAELI_CARRIERS).join(', ')}.`
    );
  }

  const normalizedTarget = normalizePhoneNumber(args.targetNumber, 'targetNumber');
  const domesticTarget = toDomesticIsraeliNumber(normalizedTarget);
  const dialTarget = normalizedTarget.startsWith('+972') ? domesticTarget : normalizedTarget;
  const digitsOnly = dialTarget.replace(/\D/g, '');

  const rawRing = args.ringSeconds === undefined ? 15 : Number(args.ringSeconds);
  if (!Number.isFinite(rawRing) || rawRing < 5 || rawRing > 30) {
    throw new Error('Validation error: ringSeconds must be between 5 and 30 seconds.');
  }
  const ringSeconds = Math.round(rawRing / 5) * 5;

  let codes;
  let quickStartSteps;

  if (carrierKey === 'verizon') {
    codes = {
      noAnswer: `*71${digitsOnly}`,
      busy: `*90${digitsOnly}`,
      unreachable: `*71${digitsOnly}`,
      allConditional: `*71${digitsOnly}`,
      unconditional: `*72${digitsOnly}`,
      resetAll: '*73',
    };
    quickStartSteps = [
      `1. Conditional forwarding on No Answer: dial ${codes.noAnswer} and press Call.`,
      `2. Conditional forwarding on Busy: dial ${codes.busy} and press Call.`,
      `3. To forward all calls immediately (24/7 AI reception): dial ${codes.unconditional}.`,
      `4. To disable all call forwarding and reset to default: dial ${codes.resetAll}.`,
    ];
  } else if (carrierKey === 'twilio_sip') {
    const sipUri = `sip:${normalizedTarget}@sip.kolivri.com`;
    codes = {
      sipUri,
      noAnswer: sipUri,
      busy: sipUri,
      unreachable: sipUri,
      allConditional: sipUri,
      unconditional: sipUri,
      resetAll: 'Remove Origination SIP URI in Twilio Console / PBX trunk settings',
    };
    quickStartSteps = [
      `1. In Twilio Elastic SIP Trunking / PBX settings, add Origination / Failover SIP URI: ${sipUri}.`,
      `2. Set ring timeout to ${ringSeconds}s for No-Answer / Busy failover to ${sipUri}.`,
      `3. For 24/7 AI reception, route primary inbound calls directly to ${sipUri}.`,
      `4. To disable forwarding: ${codes.resetAll}.`,
    ];
  } else {
    codes = {
      noAnswer: `*61*${dialTarget}**${ringSeconds}#`,
      busy: `*67*${dialTarget}#`,
      unreachable: `*62*${dialTarget}#`,
      allConditional: `*004*${dialTarget}**${ringSeconds}#`,
      unconditional: `*21*${dialTarget}#`,
      resetAll: '##002#',
    };

    if (carrierKey === 'bezeq') {
      codes.bezeqLegacyUnconditional = `*73*${dialTarget}#`;
      codes.bezeqLegacyCancel = '#73#';
    }

    quickStartSteps = [
      `1. Recommended 1-step conditional forwarding (No Answer + Busy + Unreachable): dial ${codes.allConditional} and press Call.`,
      `2. Or dial individually: No Answer (${codes.noAnswer}), Busy (${codes.busy}), Unreachable (${codes.unreachable}).`,
      `3. To forward all calls immediately (24/7 AI reception): dial ${codes.unconditional}.`,
      `4. To disable all call forwarding and reset to default: dial ${codes.resetAll}.`,
    ];
  }

  return {
    carrier: carrierInfo.id,
    carrierDisplayName: carrierInfo.displayName,
    networkType: carrierInfo.networkType,
    targetNumberE164: normalizedTarget,
    targetNumberDomestic: domesticTarget,
    ringSeconds,
    estimatedSetupSeconds: 30,
    ...(carrierKey === 'twilio_sip' ? { sipUri: `sip:${normalizedTarget}@sip.kolivri.com` } : {}),
    codes,
    quickStartSteps,
    notes: carrierInfo.notes,
  };
}

export class SlidingWindowRateLimiter {
  constructor({ maxCallsPerMinute = 5, windowMs = 60_000, nowFn = () => Date.now() } = {}) {
    this.maxCallsPerMinute = maxCallsPerMinute;
    this.windowMs = windowMs;
    this.nowFn = nowFn;
    this.buckets = new Map();
  }

  consume(key = 'default') {
    const now = this.nowFn();
    const cutoff = now - this.windowMs;
    const existing = (this.buckets.get(key) || []).filter((ts) => ts > cutoff);

    if (existing.length >= this.maxCallsPerMinute) {
      const oldest = existing[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      throw new Error(
        `Rate limit exceeded: maximum ${this.maxCallsPerMinute} outbound calls per minute allowed per API key. Retry in ${retryAfterSeconds}s.`
      );
    }

    existing.push(now);
    this.buckets.set(key, existing);
    return {
      remaining: this.maxCallsPerMinute - existing.length,
      limit: this.maxCallsPerMinute,
    };
  }
}

export const MCP_TOOLS = Object.freeze([
  {
    name: 'kolivri_place_call',
    description:
      'Place an outbound AI voice call via Kolivri Engine with KYC verified-caller and anti-abuse rate-limit protection.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Destination phone number in E.164 (+972541234567) or Israeli format (054-1234567).',
        },
        objective: {
          type: 'string',
          description: 'Clear mission/objective for the AI voice agent during the call.',
        },
        verifiedCallerId: {
          type: 'string',
          description: 'KYC-verified outbound caller ID registered to your Kolivri account (E.164 or Israeli format).',
        },
        language: {
          type: 'string',
          enum: SUPPORTED_LANGUAGES,
          default: 'he',
          description: 'Conversation language code (defaults to "he").',
        },
        webhookId: {
          type: 'string',
          description: 'Kolivri campaign/engine webhook ID (defaults to KOLIVRI_WEBHOOK_ID env var).',
        },
        contactName: {
          type: 'string',
          description: 'Optional name of the person being called.',
        },
        context: {
          type: 'object',
          description: 'Optional structured variables passed to the voice prompt.',
        },
      },
      required: ['to', 'objective', 'verifiedCallerId'],
    },
  },
  {
    name: 'kolivri_get_call_status',
    description:
      'Retrieve structured call status, outcome, transcript, summary, appointment status, and recording URL for a Kolivri call.',
    inputSchema: {
      type: 'object',
      properties: {
        callId: {
          type: 'string',
          description: 'Unique Kolivri call ID returned by kolivri_place_call.',
        },
      },
      required: ['callId'],
    },
  },
  {
    name: 'kolivri_carrier_forwarding_codes',
    description:
      'Generate 30-second GSM/carrier call-forwarding dial codes (*61*, *67*, *62*, *21* and ##002# reset) for Israeli telecom carriers.',
    inputSchema: {
      type: 'object',
      properties: {
        carrier: {
          type: 'string',
          enum: Object.keys(ISRAELI_CARRIERS),
          description: 'Israeli carrier identifier (partner, pelephone, cellcom, hot_mobile, golan, 019, we4g, bezeq).',
        },
        targetNumber: {
          type: 'string',
          description: 'Kolivri AI reception phone number to forward missed/busy calls to.',
        },
        ringSeconds: {
          type: 'integer',
          minimum: 5,
          maximum: 30,
          default: 15,
          description: 'Ring timeout in seconds before forwarding on no-answer (5, 10, 15, 20, 25, or 30).',
        },
      },
      required: ['carrier', 'targetNumber'],
    },
  },
  {
    name: 'kolivri_preview_roi',
    description:
      'Calculate SMB missed-call revenue loss and recommend the matching Kolivri unified plan (Starter $69 / ₪247, Business $139 / ₪479, Pro $249 / ₪880).',
    inputSchema: {
      type: 'object',
      properties: {
        missedCallsPerWeek: {
          type: 'number',
          description: 'Estimated number of unanswered or missed inbound calls per week.',
        },
        avgDealValueIls: {
          type: 'number',
          description: 'Average customer transaction or deal value in ILS (₪).',
        },
        closeRatePercent: {
          type: 'number',
          default: 25,
          description: 'Percentage of answered leads that convert into paying customers (0-100, default 25).',
        },
        aiRecoveryRatePercent: {
          type: 'number',
          default: 60,
          description: 'Percentage of missed calls recovered/qualified by Kolivri AI (0-100, default 60).',
        },
        estimatedMonthlyCalls: {
          type: 'number',
          description: 'Optional total monthly AI call volume override used for plan sizing.',
        },
      },
      required: ['missedCallsPerWeek', 'avgDealValueIls'],
    },
  },
]);

export function createKolivriVoiceService(options = {}) {
  const apiUrl = (options.apiUrl || process.env.KOLIVRI_API_URL || 'https://app.kolivri.co.il').replace(/\/+$/, '');
  const defaultApiKey = options.apiKey ?? process.env.KOLIVRI_API_KEY ?? '';
  const defaultWebhookId = options.webhookId ?? process.env.KOLIVRI_WEBHOOK_ID ?? 'default-webhook';
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const requestTimeoutMs = Number(options.requestTimeoutMs ?? process.env.KOLIVRI_TIMEOUT_MS ?? 15_000);

  const configuredVerifiedCallers = new Set(
    (
      options.verifiedCallerIds ||
      (process.env.KOLIVRI_VERIFIED_CALLER_ID ? process.env.KOLIVRI_VERIFIED_CALLER_ID.split(',') : [])
    )
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => normalizePhoneNumber(v, 'KOLIVRI_VERIFIED_CALLER_ID'))
  );

  const maxCallsPerMinute = Number(
    options.maxCallsPerMinute ?? process.env.KOLIVRI_MAX_CALLS_PER_MINUTE ?? 5
  );

  const rateLimiter =
    options.rateLimiter ||
    new SlidingWindowRateLimiter({
      maxCallsPerMinute: Number.isFinite(maxCallsPerMinute) && maxCallsPerMinute > 0 ? maxCallsPerMinute : 5,
      windowMs: options.rateLimitWindowMs ?? 60_000,
      nowFn: options.nowFn,
    });

  function verifyCallerId(rawCallerId) {
    if (typeof rawCallerId !== 'string' || !rawCallerId.trim()) {
      throw new Error('KYC guard: verifiedCallerId is required and cannot be empty.');
    }
    if (/unverified/i.test(rawCallerId)) {
      throw new Error('KYC guard: caller ID is not KYC-verified on this Kolivri account.');
    }
    const normalized = normalizePhoneNumber(rawCallerId, 'verifiedCallerId');
    if (configuredVerifiedCallers.size > 0 && !configuredVerifiedCallers.has(normalized)) {
      throw new Error(
        `KYC guard: caller ID "${normalized}" is not in the verified caller ID allowlist for this account.`
      );
    }
    return normalized;
  }

  async function placeCall(args = {}) {
    const apiKey = (args.apiKey || defaultApiKey || '').trim();
    if (!apiKey) {
      throw new Error('Missing Kolivri API key: set KOLIVRI_API_KEY in environment or pass apiKey.');
    }

    const normalizedCallerId = verifyCallerId(args.verifiedCallerId);
    const normalizedTo = normalizePhoneNumber(args.to, 'to');

    if (normalizedTo === normalizedCallerId) {
      throw new Error('Validation error: destination phone number "to" cannot be identical to "verifiedCallerId".');
    }

    const objective = typeof args.objective === 'string' ? args.objective.trim() : '';
    if (!objective) {
      throw new Error('Validation error: "objective" is required and must be a non-empty string.');
    }

    const language = args.language === undefined || args.language === '' ? 'he' : String(args.language).trim().toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new Error(
        `Validation error: unsupported language "${language}". Allowed values: ${SUPPORTED_LANGUAGES.join(', ')}.`
      );
    }

    const webhookId = (args.webhookId || defaultWebhookId || '').trim();
    if (!webhookId) {
      throw new Error('Validation error: webhookId is required (pass webhookId or set KOLIVRI_WEBHOOK_ID).');
    }

    const rateStatus = rateLimiter.consume(apiKey);

    const endpoint = `${apiUrl}/api/v1/engine/trigger/${encodeURIComponent(webhookId)}`;
    const payload = {
      to: normalizedTo,
      verifiedCallerId: normalizedCallerId,
      objective,
      language,
      contactName: args.contactName ? String(args.contactName).trim() : undefined,
      context: args.context && typeof args.context === 'object' ? args.context : {},
      source: 'kolivri-voice-mcp',
    };

    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    const responseText = await response.text();
    let parsed = {};
    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { raw: responseText };
      }
    }

    if (!response.ok) {
      throw new Error(
        `Kolivri Engine API error (${response.status}): ${parsed.error || parsed.message || responseText || 'Request failed'}`
      );
    }

    return {
      callId: parsed.callId || parsed.id || `call_${Date.now()}`,
      status: parsed.status || 'queued',
      to: normalizedTo,
      verifiedCallerId: normalizedCallerId,
      language,
      objective,
      webhookId,
      rateLimitRemaining: rateStatus.remaining,
      engineResponse: parsed,
    };
  }

  async function getCallStatus(args = {}) {
    const apiKey = (args.apiKey || defaultApiKey || '').trim();
    if (!apiKey) {
      throw new Error('Missing Kolivri API key: set KOLIVRI_API_KEY in environment or pass apiKey.');
    }

    const callId = typeof args.callId === 'string' ? args.callId.trim() : '';
    if (!callId) {
      throw new Error('Validation error: "callId" is required.');
    }

    const endpoint = `${apiUrl}/api/v1/calls/${encodeURIComponent(callId)}`;
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
      },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    const responseText = await response.text();
    let parsed = {};
    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { raw: responseText };
      }
    }

    if (!response.ok) {
      throw new Error(
        `Kolivri Call Status API error (${response.status}): ${parsed.error || parsed.message || responseText || 'Request failed'}`
      );
    }

    return {
      callId: parsed.callId || parsed.id || callId,
      status: parsed.status || 'completed',
      outcome: parsed.outcome || 'answered',
      durationSeconds: Number(parsed.durationSeconds ?? parsed.duration ?? 0),
      language: parsed.language || 'he',
      transcript: Array.isArray(parsed.transcript) || typeof parsed.transcript === 'string' ? parsed.transcript : [],
      summary: parsed.summary || '',
      appointmentBooked: Boolean(parsed.appointmentBooked),
      appointmentTime: parsed.appointmentTime || null,
      recordingUrl: parsed.recordingUrl || null,
    };
  }

  function getCarrierForwardingCodes(args = {}) {
    return generateCarrierForwardingCodes(args);
  }

  function previewRoi(args = {}) {
    const missedCallsPerWeek = Number(args.missedCallsPerWeek);
    const avgDealValueIls = Number(args.avgDealValueIls);
    const closeRatePercent = args.closeRatePercent === undefined ? 25 : Number(args.closeRatePercent);
    const aiRecoveryRatePercent = args.aiRecoveryRatePercent === undefined ? 60 : Number(args.aiRecoveryRatePercent);

    if (!Number.isFinite(missedCallsPerWeek) || missedCallsPerWeek < 0) {
      throw new Error('Validation error: missedCallsPerWeek must be a non-negative number.');
    }
    if (!Number.isFinite(avgDealValueIls) || avgDealValueIls <= 0) {
      throw new Error('Validation error: avgDealValueIls must be a positive number.');
    }
    if (!Number.isFinite(closeRatePercent) || closeRatePercent <= 0 || closeRatePercent > 100) {
      throw new Error('Validation error: closeRatePercent must be between 1 and 100.');
    }
    if (!Number.isFinite(aiRecoveryRatePercent) || aiRecoveryRatePercent <= 0 || aiRecoveryRatePercent > 100) {
      throw new Error('Validation error: aiRecoveryRatePercent must be between 1 and 100.');
    }

    const monthlyMissedCalls = Math.round(missedCallsPerWeek * 4.33);
    const sizingCallsPerMonth =
      args.estimatedMonthlyCalls !== undefined && Number.isFinite(Number(args.estimatedMonthlyCalls))
        ? Math.max(monthlyMissedCalls, Math.round(Number(args.estimatedMonthlyCalls)))
        : monthlyMissedCalls;

    const closeRate = closeRatePercent / 100;
    const recoveryRate = aiRecoveryRatePercent / 100;

    const monthlyLostDeals = Number((monthlyMissedCalls * closeRate).toFixed(2));
    const monthlyLostRevenueIls = Math.round(monthlyLostDeals * avgDealValueIls);

    const monthlyRecoveredDeals = Number((monthlyLostDeals * recoveryRate).toFixed(2));
    const monthlyRecoveredRevenueIls = Math.round(monthlyRecoveredDeals * avgDealValueIls);

    let recommendedPlan = UNIFIED_PLANS[0];
    if (sizingCallsPerMonth > 450) {
      recommendedPlan = UNIFIED_PLANS[2];
    } else if (sizingCallsPerMonth > 150) {
      recommendedPlan = UNIFIED_PLANS[1];
    }

    const estimatedNetMonthlyGainIls = monthlyRecoveredRevenueIls - recommendedPlan.priceIls;
    const roiMultiple = Number((monthlyRecoveredRevenueIls / recommendedPlan.priceIls).toFixed(2));

    return {
      inputs: {
        missedCallsPerWeek,
        avgDealValueIls,
        closeRatePercent,
        aiRecoveryRatePercent,
        sizingCallsPerMonth,
      },
      metrics: {
        monthlyMissedCalls,
        monthlyLostDeals,
        monthlyLostRevenueIls,
        monthlyRecoveredDeals,
        monthlyRecoveredRevenueIls,
        estimatedNetMonthlyGainIls,
        roiMultiple,
      },
      recommendedPlan: {
        id: recommendedPlan.id,
        name: recommendedPlan.name,
        label: recommendedPlan.label,
        priceUsd: recommendedPlan.priceUsd,
        priceIls: recommendedPlan.priceIls,
        includedCallsPerMonth: recommendedPlan.includedCallsPerMonth,
        includedNumbers: recommendedPlan.includedNumbers,
        highlights: recommendedPlan.highlights,
      },
      allPlans: UNIFIED_PLANS.map((p) => p.label),
    };
  }

  async function callTool(name, args = {}) {
    switch (name) {
      case 'kolivri_place_call':
        return await placeCall(args);
      case 'kolivri_get_call_status':
        return await getCallStatus(args);
      case 'kolivri_carrier_forwarding_codes':
        return getCarrierForwardingCodes(args);
      case 'kolivri_preview_roi':
        return previewRoi(args);
      default:
        throw new Error(`Unknown tool: "${name}"`);
    }
  }

  async function handleJsonRpcMessage(message) {
    if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: message?.id ?? null,
        error: {
          code: -32600,
          message: 'Invalid JSON-RPC 2.0 request',
        },
      };
    }

    const { id, method, params } = message;

    // Notifications do not have an id and produce no response
    if (id === undefined) {
      return null;
    }

    try {
      if (method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: params?.protocolVersion || '2024-11-05',
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
            serverInfo: {
              name: 'kolivri-voice-mcp',
              version: '1.0.0',
            },
          },
        };
      }

      if (method === 'ping') {
        return {
          jsonrpc: '2.0',
          id,
          result: {},
        };
      }

      if (method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        };
      }

      if (method === 'tools/call') {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};

        if (!MCP_TOOLS.some((t) => t.name === toolName)) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: `Unknown tool: ${toolName}`,
            },
          };
        }

        try {
          const data = await callTool(toolName, toolArgs);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(data, null, 2),
                },
              ],
              structuredContent: data,
              isError: false,
            },
          };
        } catch (toolErr) {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: toolErr.message || String(toolErr),
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            },
          };
        }
      }

      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err.message || 'Internal JSON-RPC error',
        },
      };
    }
  }

  return {
    placeCall,
    getCallStatus,
    getCarrierForwardingCodes,
    generateCarrierForwardingCodes,
    previewRoi,
    callTool,
    handleJsonRpcMessage,
  };
}
