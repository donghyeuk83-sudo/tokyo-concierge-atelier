# 장소 사진 직접 추가하기

허락받은 사진(가게·운영사가 제공한 사진, 직접 찍은 사진)을 사이트에 올리는 방법입니다.
올린 사진은 모든 방문자에게 보입니다.

## 표시 우선순위

1. 기존 승인 사진(라이선스 확인된 사진)
2. **직접 추가한 사진** ← 이 기능
3. 스톡 사진(Unsplash, "참고 사진" 표시)
4. AI 일러스트
5. 기본 일러스트

타베로그·공식 사이트에 공개된 사진은 **허락 없이 올리면 안 됩니다.** 운영사에서 사용 허락을 받은 사진만 올려 주세요.

## 휴대폰에서 올리는 방법 (GitHub 앱/웹)

1. 저장소 `assets/manual-photos/inbox` 폴더를 엽니다.
2. **Add file → Upload files**로 사진을 올립니다.
   - 파일 이름은 **장소 ID로 시작**해야 합니다. 예: `r02.jpg`, `a50-market.heic`
   - 장소 ID는 사이트 카드의 상세 보기 주소나 `audits/missing-photo-queue*.csv`에서 확인할 수 있습니다.
   - iPhone 사진(HEIC), JPG, PNG, WebP 모두 됩니다. 최대 25MB, 짧은 변 320px 이상.
3. 아래쪽에서 **Create a new branch … and start a pull request**를 선택하고 **Propose changes**를 누릅니다.
4. 풀 리퀘스트 설명란에 아래 줄을 적습니다.

```
credit: 사진을 찍었거나 제공한 사람·가게 이름 (카드에 표시됨)
rights: 게시해도 되는 이유 (예: 직접 찍은 사진 / 2026-10-22 가게에서 사용 허락)
source: official   ← 가게·운영사가 제공한 사진이면 official, 직접 찍었으면 owner
actual: yes        ← 그 장소를 실제로 찍은 사진이면 yes, 분위기 참고용이면 no
permission: https://...   ← (선택) 허락받은 메일·페이지 링크
replace: r02       ← (선택) 이미 사진이 있는 장소를 바꿀 때만
```

5. **Create pull request**를 누르면 몇 분 안에 자동으로
   - 사진을 검사하고 1280px WebP로 변환합니다 (사진 속 위치정보 등 메타데이터는 삭제됩니다).
   - 목록에 등록하고 같은 풀 리퀘스트에 커밋합니다.
   - 전체 브라우저 검사(Chromium·iPhone WebKit)를 돌립니다.
6. 검사가 모두 초록색이면 **Merge pull request**를 누릅니다. 몇 분 뒤 사이트에 반영됩니다.

설명란의 `credit`·`rights`가 빠지면 처리가 멈추고 이유가 표시됩니다. 설명을 고치면 자동으로 다시 실행됩니다.

## 카드에 표시되는 라벨

| 상황 | 라벨 |
|---|---|
| source: official, actual: yes | 공식 제공 사진 |
| source: owner, actual: yes | 장소 사진 · 직접 추가 |
| actual: no | 참고 사진 · 직접 추가 |

## 컴퓨터에서 직접 처리할 때

```
pip install pillow pillow-heif
cp 사진.jpg assets/manual-photos/inbox/r02.jpg
printf 'credit: ...\nrights: ...\n' > meta.txt
python3 scripts/manual-photo-intake.py --metadata meta.txt
node tests/manual-photos.cjs
```

## 사진 지우기

`assets/manual-photos/registry.json`에서 해당 항목을 지우고 `assets/manual-photos/<ID>.webp` 파일을 삭제한 뒤
`python3 scripts/manual-photo-intake.py --regenerate-only`를 실행합니다(또는 Claude에게 요청).
