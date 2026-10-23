/* Phase 6: standalone, manual-only preview language switch. No storage or network. */
(function (root) {
  'use strict';
  var MESSAGES = Object.freeze({
    ko: {
      title: 'AI Trinity — 무료 수동 검토 미리보기', languageLabel: '언어',
      eyebrow: 'TOKYO CONCIERGE ATELIER · DRAFT PREVIEW',
      heading: 'AI Trinity · 0원 수동 검토',
      intro: 'ChatGPT · Claude · Gemini의 답변을 직접 가져와 나란히 비교합니다. API 연결이나 AI 자동 실행 기능은 없습니다.',
      privacyTitle: '공개 관광 정보만 사용하세요.',
      privacyBody: '고객 이름, 예약번호, 항공편, 연락처, 결제정보, 계정정보는 입력하거나 AI에 붙여넣지 마세요. 이 도구는 서버 전송·로그인·저장·분석 추적을 하지 않지만, 사용자가 각 서비스에 직접 붙여넣는 내용은 해당 서비스로 전달됩니다.',
      questionHeading: '1. 공개 관광 질문 준비', questionLabel: '질문 (최대 500자)',
      questionPlaceholder: '예: 에비스 근처의 비 오는 날 실내 관광지 5곳을 알려줘. 고객정보는 포함하지 마.',
      selectPrompt: '질문 전체 선택', copyHint: '선택한 질문을 직접 복사하고 각 공식 AI 서비스에 붙여넣으세요.',
      answersLabel: 'AI 답변 입력', openChatgpt: 'ChatGPT 열기 ↗', openClaude: 'Claude 열기 ↗', openGemini: 'Gemini 열기 ↗',
      pastedAnswer: '직접 복사한 답변', chatgptPlaceholder: 'ChatGPT 답변을 여기에 직접 붙여넣기',
      claudePlaceholder: 'Claude 답변을 여기에 직접 붙여넣기', geminiPlaceholder: 'Gemini 답변을 여기에 직접 붙여넣기',
      compare: '텍스트 비교하기', reset: '모든 입력 지우기',
      initialStatus: '응답을 붙여넣으면 비교할 수 있어요. AI 응답의 사실 여부는 사람이 확인해야 합니다.',
      invalidPrompt: '공개 관광 질문만 입력하세요. 개인정보·예약번호·인증정보는 차단됩니다.',
      promptSelected: '질문을 선택했어요. 직접 복사해 각 AI 서비스에 붙여넣으세요.',
      blocked: '차단됨: 공개 관광 정보만 허용하며 개인정보는 입력할 수 없어요.',
      waiting: '응답 {count}/3개 입력됨. 세 응답을 직접 붙여넣으세요.',
      identical: '세 텍스트가 정규화 후 동일합니다. 사실 여부는 직접 검증해야 해요.',
      different: '세 텍스트가 다릅니다. 출처·최신성·장소 정보를 직접 비교하세요.',
      cleared: '입력 초기화됨. 저장·전송된 내용은 없습니다.',
      footer: 'Phase 6 Draft · 비용 제한 $0 · 자동 요청 0회 · 영구 저장 없음 · 자동 승인 없음 · 수동 검토 전용'
    },
    en: {
      title: 'AI Trinity — Free Manual Review Preview', languageLabel: 'Language',
      eyebrow: 'TOKYO CONCIERGE ATELIER · DRAFT PREVIEW',
      heading: 'AI Trinity · Free Manual Review',
      intro: 'Paste responses from ChatGPT, Claude and Gemini to compare them side by side. There are no API connections or automatic AI requests.',
      privacyTitle: 'Use public tourism information only.',
      privacyBody: 'Never enter or paste guest names, reservation numbers, flight details, contact or payment information, or credentials. This page does not transmit, log in, store or track anything. Content you manually paste into an AI service is sent to that service.',
      questionHeading: '1. Prepare a public tourism question', questionLabel: 'Question (up to 500 characters)',
      questionPlaceholder: 'Example: Suggest five indoor attractions near Ebisu on a rainy day. Do not include guest information.',
      selectPrompt: 'Select question', copyHint: 'Copy the selected question yourself and paste it into each official AI service.',
      answersLabel: 'AI response entry', openChatgpt: 'Open ChatGPT ↗', openClaude: 'Open Claude ↗', openGemini: 'Open Gemini ↗',
      pastedAnswer: 'Manually pasted response', chatgptPlaceholder: 'Paste the ChatGPT response here',
      claudePlaceholder: 'Paste the Claude response here', geminiPlaceholder: 'Paste the Gemini response here',
      compare: 'Compare texts', reset: 'Clear all inputs',
      initialStatus: 'Paste all three responses to compare them. A person must verify their factual accuracy.',
      invalidPrompt: 'Enter public tourism questions only. Personal, reservation and authentication data are blocked.',
      promptSelected: 'Question selected. Copy it yourself and paste it into each AI service.',
      blocked: 'Blocked: only public tourism information is permitted. Do not enter personal data.',
      waiting: '{count}/3 responses entered. Paste all three manually.',
      identical: 'All three normalized texts match. You must still verify their factual accuracy.',
      different: 'The texts differ. Manually compare sources, freshness and place details.',
      cleared: 'Inputs cleared. Nothing was stored or transmitted.',
      footer: 'Phase 6 Draft · $0 budget · 0 automatic requests · no persistence · no automatic approval · manual review only'
    },
    ja: {
      title: 'AI Trinity — 無料の手動比較プレビュー', languageLabel: '言語',
      eyebrow: 'TOKYO CONCIERGE ATELIER · DRAFT PREVIEW',
      heading: 'AI Trinity · 無料の手動比較',
      intro: 'ChatGPT・Claude・Geminiの回答を手動で貼り付け、並べて比較します。API連携やAIへの自動リクエストはありません。',
      privacyTitle: '公開されている観光情報のみをご利用ください。',
      privacyBody: 'お客様のお名前、予約番号、便名、連絡先、決済情報、認証情報を入力したり、AIに貼り付けたりしないでください。この画面からの送信・ログイン・保存・追跡はありませんが、各AIサービスに手動で貼り付けた内容はそのサービスへ送信されます。',
      questionHeading: '1. 公開観光情報に関する質問を準備', questionLabel: '質問（最大500文字）',
      questionPlaceholder: '例：雨の日に恵比寿周辺で楽しめる屋内観光スポットを5か所教えてください。お客様の情報は含めないでください。',
      selectPrompt: '質問を全選択', copyHint: '選択した質問を手動でコピーし、各AIの公式サービスに貼り付けてください。',
      answersLabel: 'AI回答入力', openChatgpt: 'ChatGPTを開く ↗', openClaude: 'Claudeを開く ↗', openGemini: 'Geminiを開く ↗',
      pastedAnswer: '手動でコピーした回答', chatgptPlaceholder: 'ChatGPTの回答をここに貼り付け',
      claudePlaceholder: 'Claudeの回答をここに貼り付け', geminiPlaceholder: 'Geminiの回答をここに貼り付け',
      compare: 'テキストを比較', reset: '入力をすべて消去',
      initialStatus: '3つの回答を貼り付けると比較できます。事実関係は必ず人が確認してください。',
      invalidPrompt: '公開観光情報に関する質問のみ入力できます。個人情報・予約番号・認証情報はブロックされます。',
      promptSelected: '質問を選択しました。手動でコピーし、各AIサービスに貼り付けてください。',
      blocked: 'ブロック：公開観光情報のみ利用できます。個人情報は入力できません。',
      waiting: '回答は{count}/3件入力済みです。3件すべてを手動で貼り付けてください。',
      identical: '正規化後の3つのテキストは一致します。事実関係は必ずご確認ください。',
      different: '3つのテキストには相違があります。出典・情報の新しさ・施設情報をご確認ください。',
      cleared: '入力を消去しました。保存・送信は行われていません。',
      footer: 'Phase 6 Draft · 費用上限 $0 · 自動リクエスト0回 · 保存なし · 自動承認なし · 手動比較専用'
    }
  });
  var current = 'ko';
  var currentStatus = null;
  function translate(key, count) {
    var value = MESSAGES[current][key];
    if (typeof value !== 'string') return '';
    return value.replace('{count}', String(count == null ? 0 : count));
  }
  function setStatus(key, count) {
    currentStatus = { key: key, count: count };
    var node = document.getElementById('manual-status');
    if (node) node.textContent = translate(key, count);
  }
  function render(language) {
    if (!Object.prototype.hasOwnProperty.call(MESSAGES, language)) language = 'ko';
    current = language;
    document.documentElement.lang = language;
    document.title = translate('title');
    var selector = document.getElementById('ai-trinity-language');
    if (selector) selector.value = language;
    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      var key = node.getAttribute('data-i18n');
      if (key === 'initialStatus' && currentStatus) return;
      node.textContent = translate(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
      node.setAttribute('placeholder', translate(node.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (node) {
      node.setAttribute('aria-label', translate(node.getAttribute('data-i18n-aria-label')));
    });
    if (currentStatus) setStatus(currentStatus.key, currentStatus.count);
  }
  function mount() {
    var selector = document.getElementById('ai-trinity-language');
    if (!selector) return false;
    selector.addEventListener('change', function () { render(selector.value); });
    render('ko');
    return true;
  }
  root.AITrinityPreviewI18n = Object.freeze({ translate: translate, setStatus: setStatus, render: render });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
}(window));
