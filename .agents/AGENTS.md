# 칭찬 스티커판 프로젝트 전역 절대 규칙 (Sticker Board Universal Isolation Rules)

> **CRITICAL & ABSOLUTE MANDATE (최우선 절대 준수 명령)**
> 본 규칙은 기존의 모든 스티커판 및 **향후 새롭게 생성되는 모든 스티커판(새로운 Git 리포지토리 및 폴더)**에 대해 100% 영구적으로 적용되는 절대 규칙입니다.
> 어떠한 경우에도 각 스티커판이 서로의 스티커판에 간섭하거나, 타 앱의 스티커판이 목록에 노출되거나, 브라우저 스토리지가 충돌하는 일이 발생해서는 안 됩니다.

---

## 1. 보드 식별 및 검증: 엄격한 양의 화이트리스트 (Strict Positive Whitelist) 필수
- 모든 스티커판 앱은 동일한 Supabase 데이터베이스(`praise_boards`, `praise_stickers`)를 공유할 수 있습니다.
- 따라서 각 앱의 보드 검증 함수(`is...Board`)는 **절대 블랙리스트 방식(기본값 `return true;`)을 사용해서는 안 되며, 반드시 엄격한 양의 화이트리스트(기본값 `return false;`)로 구현**해야 합니다.
  1. **1단계 (배제)**: 타 앱의 고유 접두사(`CAT_`, `GUN_`, `BON_WOOK_`, `CHAEDO_` 등), 타 앱 관련 키워드, 테스트 보드(`TEST_`) 감지 시 즉각 `return false;`
  2. **2단계 (화이트리스트)**: 오직 본인 앱에 배정된 고유 보드 ID 접두사 및 승인된 명칭과 정확히 일치할 때만 `return true;`
  3. **3단계 (기본 폴백)**: 일치하지 않는 모든 보드는 **무조건 `return false;`로 완전 차단**하여, 다른 앱에서 새 보드가 생성되더라도 본 앱에 절대 노출되지 않도록 함.

## 2. 신규 스티커판(새 Git 리포지토리) 생성 시 필수 준수 사항
새로운 스티커판(예: 강아지, 공룡, 별 등 새로운 테마 및 리포지토리)을 만들 때는 반드시 아래 설정을 처음부터 갖추어야 합니다:
1. **고유 접두사(Prefix) 부여**:
   - 앱 고유의 대문자 접두사를 하나만 확정합니다 (예: `DOG_`, `DINO_`, `STAR_` 등).
   - `getNextSequentialBoardCode()` 함수는 반드시 해당 접두사를 기반으로 번호를 매겨야 합니다 (예: `DOG_1`, `DOG_2`...).
   - 웰컴 스크린(`btnSetupSubmit`)에서도 사용자가 입력한 코드에 해당 접두사가 없으면 자동으로 붙여주어야 합니다.
2. **타 앱 상호 배제 목록 동기화**:
   - 신규 앱의 검증 함수는 기존의 모든 앱 접두사(`CAT_`, `GUN_`, `BON_WOOK_`, `CHAEDO_` 등)를 배제 목록에 포함해야 합니다.
   - 기존 앱들의 배제 목록에도 신규 앱의 접두사를 추가합니다.

## 3. LocalStorage 브라우저 스토리지 네임스페이스 완전 격리
모든 스티커판이 동일 도메인(GitHub Pages `https://<user>.github.io/*` 또는 `localhost`)에서 구동될 수 있으므로, 브라우저 스토리지 키 충돌을 원천 차단해야 합니다:
- 활성 보드 ID: `{app_prefix}_current_board_id` (예: `cat_current_board_id`, `gun_current_board_id` 등)
- 등록 보드 목록: `{app_prefix}_registered_boards`
- 편집자 모드 권한: `{app_prefix}_is_editor`
- 보드 정렬 순서: `{app_prefix}_board_order`
- 앱 대제목/라벨: `{app_prefix}_global_app_title`, `{app_prefix}_global_editor_role_name` 등
- **주의**: 앱 초기화 시 다른 앱의 로컬 캐시(`board_*`, `stickers_*`)를 일괄 삭제하는 루프를 절대로 작성하지 마십시오.

## 4. 주소창 URL 파라미터 및 API 단일 조회 2중 방어 가드 필수
- **URL 파라미터(`?board=...`) 검증**: 사용자가 주소창에 타 앱의 보드 ID를 치고 들어오더라도, `if (!isThisAppBoard(paramId))`로 검증하여 본인 앱의 보드가 아니면 거부하고, 주소창 URL을 자동 교정한 뒤 기본 보드로 리셋해야 합니다.
- **`apiGetBoard(boardId)` 함수 가드**: 함수 시작 시 `if (!isThisAppBoard(boardId)) return null;`을 반드시 삽입하여 타 앱 보드의 데이터 조회를 원천 거부해야 합니다.

---

## 5. 현재 운영 중인 4대 스티커판 고유 매핑 규격
| 스티커판 | GitHub 리포지토리 | 고유 보드 ID 접두사 | 현재 유효 보드 목록 | 스토리지 접두사 |
| :--- | :--- | :--- | :--- | :--- |
| **고양이** | `Cat_Stickers` | `CAT_` | `CAT_1`, `CAT_3` (향후 `CAT_4`...) | `cat_` |
| **건** | `Gun_Sticker` | `GUN_` | `GUN_1`, `GUN_2`, `GUN_4` (향후 `GUN_5`...) | `gun_` |
| **달** | `sticker` | `BON_WOOK_`, `0427` | `BON_WOOK`, `BON_WOOK_1`, `0427` (향후 `BON_WOOK_2`...) | `moon_` |
| **채소가게** | `Vegetable_Sticker` | `CHAEDO_` | `CHAEDO_` (향후 `CHAEDO_1`...) | `chaedo_` |
