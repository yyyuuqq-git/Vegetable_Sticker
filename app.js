// ==========================================
// 스티치 칭찬나라 JavaScript 핵심 기능 제어
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
    if (type === 0) {
        // Doodle Star
        return `<path d="M 50,12 C 51,12 58,34 59,36 C 60,38 84,38 85,40 C 86,42 67,54 68,56 C 69,58 74,80 72,82 C 70,84 51,70 49,70 C 47,70 28,84 26,82 C 24,80 29,58 30,56 C 31,54 12,42 13,40 C 14,38 38,38 39,36 C 40,34 47,12 50,12 Z" stroke="${stroke}" fill="${fill}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;
    } else if (type === 1) {
        // Doodle Moon
        return `<path d="M 64,22 C 45,22 28,36 28,54 C 28,72 45,86 64,86 C 46,81 40,59 51,41 C 56,33 59,27 64,22 Z" stroke="${stroke}" fill="${fill}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;
    } else if (type === 2) {
        // Doodle Saturn
        const backRing = `<path d="M 23,48 C 30,39 70,39 77,48" stroke="${stroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />`;
        const sphere = `<ellipse cx="50" cy="52" rx="22" ry="18" stroke="${stroke}" fill="${fill}" stroke-width="${width}" />`;
        const frontRing = `<path d="M 18,52 C 18,59 34,68 50,68 C 66,68 82,59 82,52" stroke="${stroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />`;
        return backRing + sphere + frontRing;
    } else if (type === 3) {
        // Doodle Sparkles
        const sparkle1 = `<path d="M 40,38 Q 40,54 24,54 Q 40,54 40,70 Q 40,54 56,54 Q 40,54 40,38 Z" stroke="${stroke}" fill="${fill}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;
        const sparkle2 = `<path d="M 68,18 Q 68,28 58,28 Q 68,28 68,38 Q 68,28 78,28 Q 68,28 68,18 Z" stroke="${stroke}" fill="${fill}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;
        return sparkle1 + sparkle2;
    } else {
        // Doodle Sun
        const sphere = `<circle cx="50" cy="50" r="18" stroke="${stroke}" fill="${fill}" stroke-width="${width}" />`;
        const spiral = `<path d="M 50,50 Q 46,45 50,42 Q 55,40 56,46 Q 57,53 48,54 Q 40,55 42,44 Q 44,36 54,36 Q 64,36 62,50 Q 60,60 46,58" stroke="${stroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />`;
        const rays = `<path d="M 50,22 L 50,13 M 50,78 L 50,87 M 22,50 L 13,50 M 78,50 L 87,50 M 30,30 L 23,23 M 70,70 L 77,77 M 30,70 L 23,77 M 70,30 L 77,23" stroke="${stroke}" fill="none" stroke-width="${width}" stroke-linecap="round" />`;
        return sphere + spiral + rays;
    }
}

function getCosmicStickerSvg(index, isSticker) {
    if (!isSticker) {
        return `
            <svg viewBox="0 0 100 100" class="sticker-svg" style="opacity: 0.22; filter: none;">
                ${getShapeMarkup(index, "#718096", "none", 3)}
            </svg>
        `;
    }
    return `
        <svg viewBox="0 0 100 100" class="sticker-svg">
            ${getShapeMarkup(index, "white", "white", 14)}
            ${getShapeMarkup(index, "#2D3748", "white", 4.5)}
        </svg>
    `;
}

// ==========================================
// 6. UI 업데이트 및 렌더링 로직
// ==========================================

// 현재 화면 리프레시
async function refreshApp() {
    // 1. 보드 정보 로드
    const board = await apiGetBoard(currentBoardId);
    if (!board) {
        showToast("존재하지 않는 공유 칭찬판입니다. 기본 보드로 이동합니다.");
        currentBoardId = "DEFAULT";
        localStorage.setItem("current_board_id", "DEFAULT");
        await refreshApp();
        return;
    }

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
        title: "우리의 새로운 칭찬판 💖",
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
    updateRoleUI();
    refreshApp();

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
