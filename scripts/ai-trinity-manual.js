/* Phase 5 manual three-provider review; no network, secrets, or persistence. */
(function (root) {
  'use strict';
  var PROVIDERS = Object.freeze(['chatgpt', 'claude', 'gemini']);
  var MAX_PROMPT = 500;
  var MAX_RESPONSE = 12000;
  var PRIVATE_SIGNAL = /(?:\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|(?:\d[\s()-]?){7,}|(?:api[_ -]?key|password|secret|bearer|access[_ -]?token|reservation[_ -]?(?:number|id)|flight[_ -]?number|room[_ -]?number|guest[_ -]?(?:name|id)|customer[_ -]?db)\b|sk-[a-zA-Z0-9-]{8,}|고객명|예약번호|객실번호|여권번호|비밀번호|カード番号|予約番号)/i;

  function containsPrivateSignal(value) {
    return typeof value === 'string' && PRIVATE_SIGNAL.test(value);
  }
  function validText(value, limit) {
    return typeof value === 'string' &&
      value.trim().length > 0 &&
      value.length <= limit &&
      !containsPrivateSignal(value) &&
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
  }
  function normalize(value) {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }
  function result(status, reason, provided, same) {
    return Object.freeze({
      status: status, reason: reason, provided: provided,
      exact_text_match: same, execution_authorized: false,
      api_calls: 0, transmitted_bytes: 0, api_cost_usd: 0
    });
  }
  function evaluate(prompt, responses) {
    if (!validText(prompt, MAX_PROMPT)) {
      return result('BLOCKED', 'PUBLIC_PROMPT_REQUIRED', 0, false);
    }
    if (!responses || typeof responses !== 'object' ||
        Object.keys(responses).some(function (key) { return PROVIDERS.indexOf(key) === -1; })) {
      return result('BLOCKED', 'INVALID_PROVIDER_SET', 0, false);
    }
    var values = PROVIDERS.map(function (provider) { return responses[provider] || ''; });
    if (values.some(function (value) {
      return typeof value !== 'string' || value.length > MAX_RESPONSE ||
        (value.trim().length > 0 && !validText(value, MAX_RESPONSE));
    })) {
      return result('BLOCKED', 'PRIVATE_OR_INVALID_RESPONSE', 0, false);
    }
    var filled = values.filter(function (value) { return value.trim() !== ''; });
    if (filled.length < 3) {
      return result('WAITING_FOR_MANUAL_PASTE', 'THREE_RESPONSES_REQUIRED', filled.length, false);
    }
    var identical = filled.every(function (value) {
      return normalize(value) === normalize(filled[0]);
    });
    return result(identical ? 'TEXT_IDENTICAL' : 'TEXT_DIFFERENT',
      'HUMAN_FACT_CHECK_REQUIRED', 3, identical);
  }
  function mount() {
    if (typeof document === 'undefined') return false;
    var form = document.getElementById('manual-trinity-form');
    var status = document.getElementById('manual-status');
    var prompt = document.getElementById('public-prompt');
    var select = document.getElementById('select-prompt');
    var compare = document.getElementById('compare-responses');
    if (!form || !status || !prompt || !select || !compare) return false;
    select.addEventListener('click', function () {
      if (!validText(prompt.value, MAX_PROMPT)) {
        status.textContent = '공개 관광 질문만 입력하세요. 개인정보·예약번호·인증정보는 차단됩니다.';
        return;
      }
      prompt.focus();
      prompt.select();
      status.textContent = '질문을 선택했어요. 직접 복사해 각 AI 서비스에 붙여넣으세요.';
    });
    compare.addEventListener('click', function () {
      var answers = {};
      PROVIDERS.forEach(function (provider) {
        answers[provider] = document.getElementById('response-' + provider).value;
      });
      var outcome = evaluate(prompt.value, answers);
      if (outcome.status === 'BLOCKED') {
        status.textContent = '차단됨: 공개 관광 정보만 허용하며 개인정보는 입력할 수 없어요.';
      } else if (outcome.status === 'WAITING_FOR_MANUAL_PASTE') {
        status.textContent = '응답 ' + outcome.provided + '/3개 입력됨. 세 응답을 직접 붙여넣으세요.';
      } else if (outcome.status === 'TEXT_IDENTICAL') {
        status.textContent = '세 텍스트가 정규화 후 동일합니다. 사실 여부는 직접 검증해야 해요.';
      } else {
        status.textContent = '세 텍스트가 다릅니다. 출처·최신성·장소 정보를 직접 비교하세요.';
      }
    });
    form.addEventListener('reset', function () {
      status.textContent = '입력 초기화됨. 저장·전송된 내용은 없습니다.';
    });
    return true;
  }
  var api = Object.freeze({
    providers: PROVIDERS, containsPrivateSignal: containsPrivateSignal,
    validText: validText, evaluate: evaluate, mount: mount
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && typeof root === 'object') root.AITrinityManual = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  }
}(typeof window !== 'undefined' ? window : null));
