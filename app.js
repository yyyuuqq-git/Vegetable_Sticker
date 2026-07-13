// ==========================================
// 채소가게 칭찬나라 JavaScript 핵심 기능 제어
// ==========================================

// 1. Supabase 연동 정보 설정
// TODO: Supabase 연동 시 아래 두 값을 채워주세요. 비어있으면 자동으로 로컬 모드로 부드럽게 작동합니다.
const SUPABASE_URL = "https://uewhzfktonpasqjnlzhm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVld2h6Zmt0b25wYXNxam5semhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODkxNTEsImV4cCI6MjA5OTQ2NTE1MX0.-o54WOhjWM6eV-ZI6u3_fiFLh9JyqhVMdtTqVkNtp0I";

let supabaseClient = null;
let isLocalMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

if (!isLocalMode) {
    try {
        if (!window.supabase) {
            throw new Error("Supabase CDN 라이브러리가 로드되지 않았습니다.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase 연동이 정상 활성화되었습니다.");
    } catch (e) {
        console.error("Supabase 초기화 실패. 로컬 모드로 전환합니다.", e);
        isLocalMode = true;
    }
} else {
    console.log("Supabase 설정이 비어있어 '로컬 모드(기기 브라우저 저장)'로 구동됩니다.");
}

// 2. 앱 전역 상태 관리
let currentBoardId = localStorage.getItem("current_board_id") || "DEFAULT";
let currentBoard = null;
let currentStickers = [];
let isEditorMode = false;
let deleteTargetIndex = null;

// 기본 가상의 보드 데이터 (체험용)
const defaultBoardData = {
    id: "DEFAULT",
    title: "스티치와 함께하는 칭찬판",
    target_count: 30,
    reward_text: "맛있는 디저트 데이트! 🍦",
    editor_pin: "1234"
};

// 3. HTML DOM 요소
const loadingSpinner = document.getElementById("loading-spinner");
const appContent = document.querySelector(".app-content");
const roleBanner = document.getElementById("role-banner");
const roleIcon = document.getElementById("role-icon");
const roleText = document.getElementById("role-text");
const btnToggleRole = document.getElementById("btn-toggle-role");
const boardTitle = document.getElementById("board-title");
const boardCodeDisplay = document.getElementById("board-code-display");
const progressCount = document.getElementById("progress-count");
const progressBarFill = document.getElementById("progress-bar-fill");
const rewardBanner = document.getElementById("reward-banner");
const rewardText = document.getElementById("reward-text");
const celebrationBanner = document.getElementById("celebration-banner");
const celebrationRewardDetail = document.getElementById("celebration-reward-detail");
const stickerGrid = document.getElementById("sticker-grid");

// 모달 및 입력 폼 요소
const modalPin = document.getElementById("modal-pin");
const inputPin = document.getElementById("input-pin");
const pinError = document.getElementById("pin-error");
const btnPinCancel = document.getElementById("btn-pin-cancel");
const btnPinSubmit = document.getElementById("btn-pin-submit");

const modalSettings = document.getElementById("modal-settings");
const inputSwitchBoard = document.getElementById("input-switch-board");
const btnSwitchBoard = document.getElementById("btn-switch-board");
const editTitle = document.getElementById("edit-title");
const editTargetCount = document.getElementById("edit-target-count");
const editReward = document.getElementById("edit-reward");
const editPin = document.getElementById("edit-pin");
const btnSettingsClose = document.getElementById("btn-settings-close");
const btnSettingsSave = document.getElementById("btn-settings-save");

const modalDelete = document.getElementById("modal-delete");
const deleteConfirmText = document.getElementById("delete-confirm-text");
const btnDeleteCancel = document.getElementById("btn-delete-cancel");
const btnDeleteConfirm = document.getElementById("btn-delete-confirm");

const modalShare = document.getElementById("modal-share");
const shareCodeText = document.getElementById("share-code-text");
const btnCopyCode = document.getElementById("btn-copy-code");
const inputCreateBoard = document.getElementById("input-create-board");
const btnCreateBoard = document.getElementById("btn-create-board");
const btnShareClose = document.getElementById("btn-share-close");

const welcomeScreen = document.getElementById("welcome-screen");
const setupBoardId = document.getElementById("setup-board-id");
const setupTitle = document.getElementById("setup-title");
const setupTargetCount = document.getElementById("setup-target-count");
const setupReward = document.getElementById("setup-reward");
const setupPin = document.getElementById("setup-pin");
const btnSetupSubmit = document.getElementById("btn-setup-submit");

// 공용 버튼 트리거
const btnShare = document.getElementById("btn-share");
const btnSettings = document.getElementById("btn-settings");

// ==========================================
// 4. 데이터베이스 / 로컬스토리지 통신 매핑 API
// ==========================================

// 보드 불러오기
async function apiGetBoard(boardId) {
    if (isLocalMode || !supabaseClient) {
        const localData = localStorage.getItem(`board_${boardId}`);
        if (localData) {
            return JSON.parse(localData);
        }
        if (boardId === "DEFAULT") {
            localStorage.setItem("board_DEFAULT", JSON.stringify(defaultBoardData));
            return defaultBoardData;
        }
        return null;
    } else {
        try {
            const { data, error } = await supabaseClient
                .from("praise_boards")
                .select("*")
                .eq("id", boardId)
                .maybeSingle();
            if (error) throw error;
            if (data) {
                // 로컬 캐시 업데이트
                localStorage.setItem(`board_${boardId}`, JSON.stringify(data));
                return data;
            }
            if (boardId === "DEFAULT") {
                await apiCreateBoard(defaultBoardData);
                return defaultBoardData;
            }
            return null;
        } catch (e) {
            console.error("보드 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            const cached = localStorage.getItem(`board_${boardId}`);
            if (cached) return JSON.parse(cached);
            if (boardId === "DEFAULT") return defaultBoardData;
            return null;
        }
    }
}

// 보드 생성 또는 수정
async function apiCreateBoard(board) {
    if (isLocalMode || !supabaseClient) {
        localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_boards")
                .upsert(board);
            if (error) throw error;
            localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
            return true;
        } catch (e) {
            console.error("보드 생성/수정 실패", e);
            return false;
        }
    }
}

// 부착된 스티커 목록 가져오기
async function apiGetStickers(boardId) {
    if (isLocalMode || !supabaseClient) {
        const localData = localStorage.getItem(`stickers_${boardId}`);
        return localData ? JSON.parse(localData) : [];
    } else {
        try {
            const { data, error } = await supabaseClient
                .from("praise_stickers")
                .select("*")
                .eq("board_id", boardId);
            if (error) throw error;
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(data));
            return data;
        } catch (e) {
            console.error("스티커 리스트 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            const cached = localStorage.getItem(`stickers_${boardId}`);
            return cached ? JSON.parse(cached) : [];
        }
    }
}

// 스티커 부착
async function apiAddSticker(boardId, index) {
    if (isLocalMode || !supabaseClient) {
        const current = await apiGetStickers(boardId);
        if (!current.some(s => s.sticker_index === index)) {
            current.push({ board_id: boardId, sticker_index: index });
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        }
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .insert({ board_id: boardId, sticker_index: index });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 부착 실패", e);
            return false;
        }
    }
}

// 스티커 떼기
async function apiRemoveSticker(boardId, index) {
    if (isLocalMode || !supabaseClient) {
        let current = await apiGetStickers(boardId);
        current = current.filter(s => s.sticker_index !== index);
        localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .delete()
                .eq("board_id", boardId)
                .eq("sticker_index", index);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 제거 실패", e);
            return false;
        }
    }
}

// ==========================================
// 5. 손그림 우주 스티커 SVG 드로잉 빌더
// ==========================================
function getShapeMarkup(index, stroke, fill, width) {
    const type = index % 5;
    
    // Vegetable colors
    let tomatoBody = "#E74C3C";
    let tomatoLeaf = "#2ECC71";
    let carrotBody = "#E67E22";
    let carrotLeaf = "#2ECC71";
    let eggplantBody = "#9B59B6";
    let eggplantLeaf = "#27AE60";
    let broccoliCrown = "#27AE60";
    let broccoliStem = "#A2D9CE";
    let cornCob = "#F1C40F";
    let cornLeaf = "#2ECC71";

    let borderStroke = stroke;

    if (fill === "white") {
        tomatoBody = "white";
        tomatoLeaf = "white";
        carrotBody = "white";
        carrotLeaf = "white";
        eggplantBody = "white";
        eggplantLeaf = "white";
        broccoliCrown = "white";
        broccoliStem = "white";
        cornCob = "white";
        cornLeaf = "white";
        borderStroke = "white";
    } else if (fill === "none") {
        tomatoBody = "none";
        tomatoLeaf = "none";
        carrotBody = "none";
        carrotLeaf = "none";
        eggplantBody = "none";
        eggplantLeaf = "none";
        broccoliCrown = "none";
        broccoliStem = "none";
        cornCob = "none";
        cornLeaf = "none";
    }

    if (type === 0) {
        // 1. Tomato
        return `
            <ellipse cx="50" cy="54" rx="22" ry="18" stroke="${borderStroke}" fill="${tomatoBody}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 50,36 C 45,36 43,30 40,32 C 45,34 48,36 50,36 C 52,36 55,34 60,32 C 57,30 55,36 50,36 Z" stroke="${borderStroke}" fill="${tomatoLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 50,36 C 47,38 41,36 38,40 C 43,40 47,38 50,36 Z" stroke="${borderStroke}" fill="${tomatoLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 50,36 C 53,38 59,36 62,40 C 57,40 53,38 50,36 Z" stroke="${borderStroke}" fill="${tomatoLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 50,36 Q 49,26 44,22" stroke="${borderStroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />
        `;
    } else if (type === 1) {
        // 2. Carrot
        const leafLines = `
            <path d="M 50,32 C 48,22 42,16 46,12 C 50,18 50,26 50,32 Z" stroke="${borderStroke}" fill="${carrotLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 50,32 C 42,24 36,20 41,15 C 46,20 48,26 50,32 Z" stroke="${borderStroke}" fill="${carrotLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 50,32 C 58,24 64,20 59,15 C 54,20 52,26 50,32 Z" stroke="${borderStroke}" fill="${carrotLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
        `;
        const body = `
            <path d="M 38,34 C 42,32 58,32 62,34 L 54,78 C 53,82 47,82 46,78 Z" stroke="${borderStroke}" fill="${carrotBody}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 43,44 H 51 M 44,54 H 55 M 46,64 H 53 M 48,72 H 51" stroke="${borderStroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />
        `;
        return leafLines + body;
    } else if (type === 2) {
        // 3. Eggplant
        return `
            <path d="M 42,34 C 46,34 50,36 53,40 C 60,48 68,60 62,74 C 57,84 41,84 34,74 C 28,64 34,48 42,34 Z" stroke="${borderStroke}" fill="${eggplantBody}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 42,34 C 38,34 35,30 33,35 C 38,37 40,36 42,34 C 44,36 47,37 52,35 C 50,30 46,34 42,34 Z" stroke="${borderStroke}" fill="${eggplantLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 42,34 Q 41,24 37,20" stroke="${borderStroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />
        `;
    } else if (type === 3) {
        // 4. Broccoli
        const stem = `<path d="M 43,48 L 45,78 C 45,81 55,81 55,78 L 57,48" stroke="${borderStroke}" fill="${broccoliStem}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;
        const crown = `
            <path d="M 38,48 C 30,48 26,38 34,32 C 32,20 46,16 52,24 C 58,16 72,20 70,32 C 78,38 74,48 66,48 Z" stroke="${borderStroke}" fill="${broccoliCrown}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 40,36 Q 44,34 48,38 M 52,30 Q 56,28 60,32 M 56,38 Q 60,36 64,40" stroke="${borderStroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />
        `;
        return stem + crown;
    } else {
        // 5. Corn
        const cob = `<path d="M 44,32 C 38,40 38,62 46,74 C 48,76 52,76 54,74 C 62,62 62,40 56,32 Z" stroke="${borderStroke}" fill="${cornCob}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;
        const kernels = `
            <path d="M 46,40 H 54 M 44,48 H 56 M 43,56 H 57 M 44,64 H 56 M 46,72 H 54 M 50,32 V 74" stroke="${borderStroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />
        `;
        const husks = `
            <path d="M 38,46 C 32,54 34,70 48,75 C 39,68 38,54 42,38" stroke="${borderStroke}" fill="${cornLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 62,46 C 68,54 66,70 52,75 C 61,68 62,54 58,38" stroke="${borderStroke}" fill="${cornLeaf}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />
        `;
        return cob + kernels + husks;
    }
}

function getCosmicStickerSvg(index, isSticker) {
    if (!isSticker) {
        return `
            <svg viewBox="0 0 100 100" class="sticker-svg" style="opacity: 0.22; filter: none;">
                ${getShapeMarkup(index, "#8C9A8E", "none", 3)}
            </svg>
        `;
    }
    return `
        <svg viewBox="0 0 100 100" class="sticker-svg">
            ${getShapeMarkup(index, "white", "white", 14)}
            ${getShapeMarkup(index, "#2C3E50", "colored", 4.5)}
        </svg>
    `;
}

// ==========================================
// 6. UI 업데이트 및 렌더링 로직
// ==========================================

// 현재 화면 리프레시
async function refreshApp() {
    // 1. 보드 정보 로드
    let board = await apiGetBoard(currentBoardId);
    if (!board) {
        // 보드가 존재하지 않음 -> 초기 설정 화면 노출
        loadingSpinner.classList.add("hidden");
        appContent.classList.add("hidden");
        welcomeScreen.classList.remove("hidden");
        
        // 설정 폼에 현재 보드 ID 자동 완성 (DEFAULT인 경우 무작위 코드 생성)
        if (currentBoardId === "DEFAULT") {
            const randId = "VEGE-" + Math.floor(1000 + Math.random() * 9000);
            setupBoardId.value = randId;
        } else {
            setupBoardId.value = currentBoardId;
        }
        return;
    }

    // 보드가 정상적으로 로드된 경우 설정창 숨기고 콘텐츠 노출
    welcomeScreen.classList.add("hidden");
    currentBoard = board;

    // 2. 스티커 정보 로드
    currentStickers = await apiGetStickers(currentBoardId);
    const activeIndices = new Set(currentStickers.map(s => s.sticker_index));

    // 3. 헤더 및 요약 카드 업데이트
    boardTitle.textContent = currentBoard.title;
    boardCodeDisplay.textContent = `보드 코드: ${currentBoard.id}`;

    const targetCount = currentBoard.target_count;
    const completedCount = currentStickers.length;
    progressCount.textContent = `${completedCount} / ${targetCount} 개`;

    const percentage = Math.min((completedCount / targetCount) * 100, 100);
    progressBarFill.style.width = `${percentage}%`;

    // 보상 배너 처리
    if (currentBoard.reward_text) {
        rewardText.textContent = `완료 보상: ${currentBoard.reward_text}`;
        rewardBanner.classList.remove("hidden");
    } else {
        rewardBanner.classList.add("hidden");
    }

    // 축하 배너 처리
    if (completedCount >= targetCount) {
        celebrationRewardDetail.textContent = `${currentBoard.reward_text}을(를) 획득할 시간이에요! 🎁`;
        celebrationBanner.classList.remove("hidden");
    } else {
        celebrationBanner.classList.add("hidden");
    }

    // 4. 스티커 판 격자 그리기
    stickerGrid.innerHTML = "";
    for (let i = 0; i < targetCount; i++) {
        const isActive = activeIndices.has(i);

        const slot = document.createElement("div");
        slot.className = `grid-slot ${isActive ? "active" : ""}`;
        slot.innerHTML = `
            ${getCosmicStickerSvg(i, isActive)}
            <span class="slot-number">${i + 1}</span>
        `;

        // 칸 클릭 핸들러
        slot.addEventListener("click", () => handleSlotClick(i, isActive));
        stickerGrid.appendChild(slot);
    }

    // 5. 모달 내의 필드 업데이트 (현재 설정 대입)
    shareCodeText.textContent = currentBoard.id;

    if (isEditorMode) {
        editTitle.value = currentBoard.title;
        editTargetCount.value = currentBoard.target_count;
        editReward.value = currentBoard.reward_text;
        editPin.value = currentBoard.editor_pin || "1234";
    }

    // 로딩 종료 및 컨텐츠 표출
    loadingSpinner.classList.add("hidden");
    appContent.classList.remove("hidden");
}

// 스티커 슬롯 클릭 제어
async function handleSlotClick(index, isActive) {
    if (!isEditorMode) {
        showToast("스티커 추가는 여자친구(편집자)만 가능해요! 🧸");
        return;
    }

    if (isActive) {
        // 이미 붙은 스티커 클릭 시: 떼어내기 다이얼로그 노출
        deleteTargetIndex = index;
        deleteConfirmText.textContent = `${index + 1}번째 칭찬 스티커를 정말 뗄까요?`;
        modalDelete.classList.remove("hidden");
    } else {
        // 빈칸 클릭 시 스티커 즉시 부착
        loadingSpinner.classList.remove("hidden");
        const success = await apiAddSticker(currentBoardId, index);
        if (success) {
            showToast(`${index + 1}번째 스티커 부착 완료! 💙`);
            await refreshApp();
        } else {
            showToast("스티커 부착 중 에러가 발생했습니다.");
            loadingSpinner.classList.add("hidden");
        }
    }
}

// ==========================================
// 7. 역할 모드 토글 (인증 및 로그아웃)
// ==========================================
function updateRoleUI() {
    if (isEditorMode) {
        roleBanner.className = "role-banner editor-mode";
        roleIcon.textContent = "edit";
        roleText.textContent = "여자친구 모드 (스티커 부착 가능)";
        btnToggleRole.textContent = "로그아웃";

        // 설정 모달 내 필드 활성화
        document.querySelectorAll(".editor-only-field").forEach(el => el.disabled = false);
        btnSettingsSave.classList.remove("hidden");
    } else {
        roleBanner.className = "role-banner reader-mode";
        roleIcon.textContent = "visibility";
        roleText.textContent = "남자친구 모드 (조회 전용)";
        btnToggleRole.textContent = "편집 전환";

        // 설정 모달 내 필드 비활성화
        document.querySelectorAll(".editor-only-field").forEach(el => el.disabled = true);
        btnSettingsSave.classList.add("hidden");
    }
}

// ==========================================
// 8. 다이얼로그 모달 상호작용 및 이벤트 리스너
// ==========================================

// 토스트 메시지 띄우기
let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.style.opacity = 1;

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 2500);
}

// PIN 번호 확인 처리
btnPinSubmit.addEventListener("click", () => {
    const pin = inputPin.value;
    const requiredPin = currentBoard.editor_pin || "1234";

    if (pin === requiredPin) {
        isEditorMode = true;
        inputPin.value = "";
        pinError.classList.add("hidden");
        modalPin.classList.add("hidden");
        updateRoleUI();
        refreshApp();
        showToast("여자친구 편집 권한이 승인되었습니다! 🌸");
    } else {
        pinError.classList.remove("hidden");
    }
});

btnPinCancel.addEventListener("click", () => {
    inputPin.value = "";
    pinError.classList.add("hidden");
    modalPin.classList.add("hidden");
});

// 역할 전환 버튼
btnToggleRole.addEventListener("click", () => {
    if (isEditorMode) {
        isEditorMode = false;
        updateRoleUI();
        refreshApp();
        showToast("조회 전용 모드로 복귀했습니다.");
    } else {
        modalPin.classList.remove("hidden");
        inputPin.focus();
    }
});

// 칭찬판 공유 코드 복사
btnCopyCode.addEventListener("click", () => {
    navigator.clipboard.writeText(currentBoard.id).then(() => {
        showToast("공유 코드가 클립보드에 복사되었습니다! 📋");
    }).catch(err => {
        showToast("코드 복사에 실패했습니다.");
    });
});

// 공유 다이얼로그 노출/숨김
btnShare.addEventListener("click", () => {
    modalShare.classList.remove("hidden");
    const shareLinkInput = document.getElementById("share-link-input");
    const shareLink = `${window.location.origin}${window.location.pathname}?board=${currentBoardId}`;
    shareLinkInput.value = shareLink;
});

btnShareClose.addEventListener("click", () => {
    modalShare.classList.add("hidden");
});

// 새로운 칭찬판 생성
btnCreateBoard.addEventListener("click", async () => {
    const code = inputCreateBoard.value.trim().toUpperCase();
    if (!code) {
        showToast("코드를 입력해 주세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    modalShare.classList.add("hidden");

    const existing = await apiGetBoard(code);
    if (existing) {
        showToast("이미 사용 중인 코드입니다. 다른 코드를 사용해 주세요.");
        loadingSpinner.classList.add("hidden");
        modalShare.classList.remove("hidden");
        return;
    }

    const newBoard = {
        id: code,
        title: "싱싱한 채소 칭찬판 🥕",
        target_count: 30,
        reward_text: "새로운 선물 지정하기",
        editor_pin: "1234"
    };

    const success = await apiCreateBoard(newBoard);
    if (success) {
        currentBoardId = code;
        localStorage.setItem("current_board_id", code);
        inputCreateBoard.value = "";
        isEditorMode = true; // 새로 만든 판은 즉시 편집자 권한 부여
        updateRoleUI();
        await refreshApp();
        showToast("새 칭찬판이 생성되었습니다. 자유롭게 수정해보세요!");
    } else {
        showToast("칭찬판 개설에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalShare.classList.remove("hidden");
    }
});

// 설정 다이얼로그 노출/숨김
btnSettings.addEventListener("click", () => {
    modalSettings.classList.remove("hidden");
});

btnSettingsClose.addEventListener("click", () => {
    modalSettings.classList.add("hidden");
});

// 칭찬판 코드 스위칭
btnSwitchBoard.addEventListener("click", async () => {
    const code = inputSwitchBoard.value.trim().toUpperCase();
    if (!code) {
        showToast("코드를 입력해 주세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    modalSettings.classList.add("hidden");

    const board = await apiGetBoard(code);
    if (board) {
        currentBoardId = code;
        localStorage.setItem("current_board_id", code);
        inputSwitchBoard.value = "";
        isEditorMode = false; // 새로운 보드로 이동할 때는 기본 뷰어 모드로 안전화
        updateRoleUI();
        await refreshApp();
        showToast(`칭찬판 '${board.title}'을 성공적으로 불러왔습니다!`);
    } else {
        showToast("존재하지 않는 칭찬판 공유 코드입니다.");
        loadingSpinner.classList.add("hidden");
        modalSettings.classList.remove("hidden");
    }
});

// 칭찬판 세부 설정 변경 및 저장
btnSettingsSave.addEventListener("click", async () => {
    if (!isEditorMode) return;

    const count = parseInt(editTargetCount.value);
    if (isNaN(count) || count < 1 || count > 100) {
        showToast("올바른 스티커 목표 개수(1~100)를 입력하세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    modalSettings.classList.add("hidden");

    const updated = {
        id: currentBoard.id,
        title: editTitle.value.trim() || currentBoard.title,
        target_count: count,
        reward_text: editReward.value.trim(),
        editor_pin: editPin.value.trim() || "1234"
    };

    const success = await apiCreateBoard(updated);
    if (success) {
        currentBoard = updated;
        await refreshApp();
        showToast("칭찬판 세부 설정이 정상 변경되었습니다. ✨");
    } else {
        showToast("설정 저장에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalSettings.classList.remove("hidden");
    }
});

// 스티커 제거 확인 처리
btnDeleteConfirm.addEventListener("click", async () => {
    if (deleteTargetIndex === null) return;

    loadingSpinner.classList.remove("hidden");
    modalDelete.classList.add("hidden");

    const success = await apiRemoveSticker(currentBoardId, deleteTargetIndex);
    if (success) {
        showToast(`${deleteTargetIndex + 1}번째 스티커를 제거했습니다.`);
        deleteTargetIndex = null;
        await refreshApp();
    } else {
        showToast("스티커 제거 실패");
        loadingSpinner.classList.add("hidden");
    }
});

btnDeleteCancel.addEventListener("click", () => {
    deleteTargetIndex = null;
    modalDelete.classList.add("hidden");
});

// ==========================================
// 9. 앱 초기 구동 및 실시간 데이터 싱크 폴링
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. URL 쿼리 파라미터에서 보드 ID가 넘어온 경우 자동 설정
    const urlParams = new URLSearchParams(window.location.search);
    const boardParam = urlParams.get("board");
    if (boardParam) {
        currentBoardId = boardParam.trim().toUpperCase();
        localStorage.setItem("current_board_id", currentBoardId);
    }

    updateRoleUI();
    refreshApp();

    // 2. 웰컴 스크린 칭찬판 최초 생성 처리
    btnSetupSubmit.addEventListener("click", async () => {
        const code = setupBoardId.value.trim().toUpperCase();
        const title = setupTitle.value.trim();
        const target = parseInt(setupTargetCount.value);
        const reward = setupReward.value.trim();
        const pin = setupPin.value.trim();

        if (!code) {
            showToast("공유 코드를 입력해 주세요.");
            return;
        }
        if (!title) {
            showToast("칭찬판 제목을 입력해 주세요.");
            return;
        }
        if (isNaN(target) || target < 1 || target > 100) {
            showToast("올바른 목표 개수(1~100)를 입력하세요.");
            return;
        }
        if (!pin) {
            showToast("비밀번호 PIN을 입력해 주세요.");
            return;
        }

        loadingSpinner.classList.remove("hidden");
        welcomeScreen.classList.add("hidden");

        const newBoard = {
            id: code,
            title: title,
            target_count: target,
            reward_text: reward,
            editor_pin: pin
        };

        const success = await apiCreateBoard(newBoard);
        if (success) {
            currentBoardId = code;
            localStorage.setItem("current_board_id", code);
            // 생성 시에는 자동으로 편집자 모드 승인
            isEditorMode = true;
            updateRoleUI();
            await refreshApp();
            showToast("칭찬판이 성공적으로 개설되었습니다! 🚀");
            
            // 브라우저 주소창 URL 업데이트
            const newUrl = `${window.location.origin}${window.location.pathname}?board=${code}`;
            window.history.replaceState({ path: newUrl }, "", newUrl);
        } else {
            showToast("칭찬판 개설에 실패했습니다.");
            welcomeScreen.classList.remove("hidden");
            loadingSpinner.classList.add("hidden");
        }
    });

    // 3. 초대 링크 복사 처리
    const btnCopyLink = document.getElementById("btn-copy-link");
    btnCopyLink.addEventListener("click", () => {
        const shareLinkInput = document.getElementById("share-link-input");
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            showToast("초대 링크가 복사되었습니다! 📋");
        }).catch(err => {
            showToast("링크 복사에 실패했습니다.");
        });
    });

    // 타 기기에서의 업데이트 감지를 위해 5초마다 자동 싱크 (폴링)
    setInterval(() => {
        // 사용자가 입력을 입력하거나 모달 창을 띄운 작업 중이 아닐 때만 렌더링 리프레시 진행해 간섭 차단
        const isModalOpen = !modalPin.classList.contains("hidden") ||
            !modalSettings.classList.contains("hidden") ||
            !modalDelete.classList.contains("hidden") ||
            !modalShare.classList.contains("hidden");

        if (!isModalOpen) {
            apiGetStickers(currentBoardId).then(stickers => {
                const currentActive = new Set(currentStickers.map(s => s.sticker_index));
                const newActive = new Set(stickers.map(s => s.sticker_index));

                // 스티커 구성원 변경 시에만 화면 부분 렌더링 리프레시 실행
                if (currentActive.size !== newActive.size || [...currentActive].some(x => !newActive.has(x))) {
                    refreshApp();
                }
            }).catch(err => console.error("백그라운드 스티커 싱크 실패", err));
        }
    }, 5000);
});
