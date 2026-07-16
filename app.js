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
let currentBoardId = localStorage.getItem("current_board_id") || "TEST-COSMIC-BOARD";
let currentBoard = null;
let currentStickers = [];
let isEditorMode = localStorage.getItem(`is_editor_${currentBoardId}`) === "true";
let deleteTargetIndex = null;
let memoTargetIndex = null;
let editTargetIndex = null;

// 기본 보드 정보가 설정되지 않은 경우 신규 생성을 유도합니다.

// 3. HTML DOM 요소
const loadingSpinner = document.getElementById("loading-spinner");
const appContent = document.querySelector(".app-content");
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

// 사이드바 관련 요소 추가
const btnMenu = document.getElementById("btn-menu");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnSidebarClose = document.getElementById("btn-sidebar-close");
const boardListContainer = document.getElementById("board-list");
const btnAddBoardSidebar = document.getElementById("btn-add-board-sidebar");
const inputCreateBoardTitle = document.getElementById("input-create-board-title");

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
const editReaderName = document.getElementById("edit-reader-name");
const editEditorName = document.getElementById("edit-editor-name");
const btnSettingsClose = document.getElementById("btn-settings-close");
const btnSettingsSave = document.getElementById("btn-settings-save");

// 칭찬판 정보 수정 모달 요소 (길게 누르기 연동)
const modalBoardEdit = document.getElementById("modal-board-edit");
const editBoardTitle = document.getElementById("edit-board-title");
const editBoardTargetCount = document.getElementById("edit-board-target-count");
const editBoardReward = document.getElementById("edit-board-reward");
const btnBoardEditClose = document.getElementById("btn-board-edit-close");
const btnBoardEditSave = document.getElementById("btn-board-edit-save");

let editTargetBoard = null;

const modalDelete = document.getElementById("modal-delete");
const deleteConfirmText = document.getElementById("delete-confirm-text");
const btnDeleteCancel = document.getElementById("btn-delete-cancel");
const btnDeleteConfirm = document.getElementById("btn-delete-confirm");

const modalShare = document.getElementById("modal-share");
const btnCreateBoard = document.getElementById("btn-create-board");
const btnShareClose = document.getElementById("btn-share-close");

const welcomeScreen = document.getElementById("welcome-screen");
const setupBoardId = document.getElementById("setup-board-id");
const setupTitle = document.getElementById("setup-title");
const setupTargetCount = document.getElementById("setup-target-count");
const setupReward = document.getElementById("setup-reward");
const setupPin = document.getElementById("setup-pin");
const btnSetupSubmit = document.getElementById("btn-setup-submit");

const modalMemoInput = document.getElementById("modal-memo-input");
const inputStickerMemo = document.getElementById("input-sticker-memo");
const btnMemoCancel = document.getElementById("btn-memo-cancel");
const btnMemoSubmit = document.getElementById("btn-memo-submit");

const modalMemoView = document.getElementById("modal-memo-view");
const viewStickerMemoText = document.getElementById("view-sticker-memo-text");
const viewStickerCreatedAt = document.getElementById("view-sticker-created-at");
const viewStickerUpdatedAt = document.getElementById("view-sticker-updated-at");
const btnMemoViewClose = document.getElementById("btn-memo-view-close");

const memoEditArea = document.getElementById("memo-edit-area");
const inputEditStickerMemo = document.getElementById("input-edit-sticker-memo");
const btnMemoDelete = document.getElementById("btn-memo-delete");
const btnMemoEditStart = document.getElementById("btn-memo-edit-start");
const btnMemoEditCancel = document.getElementById("btn-memo-edit-cancel");
const btnMemoEditSave = document.getElementById("btn-memo-edit-save");

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
                // 기존 캐시된 데이터와 병합하여 로컬 전용 설정(역할 이름 등) 보존
                const cached = localStorage.getItem(`board_${boardId}`);
                let mergedData = { ...data };
                if (cached) {
                    const cachedObj = JSON.parse(cached);
                    mergedData.reader_role_name = data.reader_role_name || cachedObj.reader_role_name;
                    mergedData.editor_role_name = data.editor_role_name || cachedObj.editor_role_name;
                }
                localStorage.setItem(`board_${boardId}`, JSON.stringify(mergedData));
                return mergedData;
            }
            return null;
        } catch (e) {
            console.error("보드 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            const cached = localStorage.getItem(`board_${boardId}`);
            if (cached) return JSON.parse(cached);
            return null;
        }
    }
}

// 보드 생성 또는 수정
async function apiCreateBoard(board) {
    // 로컬 캐시에는 전체 board 객체를 항상 저장 (역할명 등 로컬 전용 필드 포함)
    localStorage.setItem(`board_${board.id}`, JSON.stringify(board));

    if (isLocalMode || !supabaseClient) {
        return { success: true };
    } else {
        try {
            // Supabase praise_boards 스키마에 존재하는 컬럼만 추출하여 전송
            const dbBoard = {
                id: board.id,
                title: board.title,
                target_count: board.target_count,
                reward_text: board.reward_text,
                editor_pin: board.editor_pin || "1234"
            };
            // created_at이 있으면 포함
            if (board.created_at) {
                dbBoard.created_at = board.created_at;
            }

            console.log("Supabase upsert 요청 데이터:", dbBoard);
            const { error } = await supabaseClient
                .from("praise_boards")
                .upsert(dbBoard);

            if (error) {
                const errMsg = `[${error.code || 'unknown'}] ${error.message || JSON.stringify(error)}`;
                console.error("Supabase 칭찬판 저장 실패:", errMsg, error);
                return { success: false, error: errMsg };
            }
            console.log("Supabase 칭찬판 저장 성공");
            return { success: true };
        } catch (e) {
            const errMsg = e.message || String(e);
            console.error("보드 생성/수정 중 예외 발생:", errMsg, e);
            return { success: false, error: errMsg };
        }
    }
}

// 보드 및 스티커 데이터베이스/로컬 캐시 완전 삭제
async function apiDeleteBoard(boardId) {
    // 1. 로컬 캐시 삭제
    localStorage.removeItem(`board_${boardId}`);
    localStorage.removeItem(`stickers_${boardId}`);
    localStorage.removeItem(`is_editor_${boardId}`);

    if (isLocalMode || !supabaseClient) {
        return true;
    } else {
        try {
            // 2. Supabase DB 삭제 (ON DELETE CASCADE로 인해 스티커 데이터도 함께 삭제됨)
            const { error } = await supabaseClient
                .from("praise_boards")
                .delete()
                .eq("id", boardId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("보드 삭제 실패", e);
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
async function apiAddSticker(boardId, index, memo) {
    const nowISO = new Date().toISOString();
    if (isLocalMode || !supabaseClient) {
        const current = await apiGetStickers(boardId);
        if (!current.some(s => s.sticker_index === index)) {
            current.push({ 
                board_id: boardId, 
                sticker_index: index, 
                memo: memo,
                created_at: nowISO,
                updated_at: nowISO
            });
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        }
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .insert({ 
                    board_id: boardId, 
                    sticker_index: index, 
                    memo: memo,
                    created_at: nowISO,
                    updated_at: nowISO
                });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 부착 실패", e);
            return false;
        }
    }
}

// 스티커 메모 수정
async function apiUpdateStickerMemo(boardId, index, memo) {
    const nowISO = new Date().toISOString();
    if (isLocalMode || !supabaseClient) {
        const current = await apiGetStickers(boardId);
        const sticker = current.find(s => s.sticker_index === index);
        if (sticker) {
            sticker.memo = memo;
            sticker.updated_at = nowISO;
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        }
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .update({ 
                    memo: memo, 
                    updated_at: nowISO 
                })
                .eq("board_id", boardId)
                .eq("sticker_index", index);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 메모 수정 실패", e);
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
// 5.5 등록된 보드 목록 관리 및 사이드바 렌더링
// ==========================================

// 모든 스티커판 목록 조회 (서버 전체 탐색용 - 프라이버시 보호를 위해 TEST- 접두사 보드만 조회)
async function apiGetAllBoards() {
    if (isLocalMode || !supabaseClient) {
        // 로컬스토리지 전체 키 순회
        const boards = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("board_")) {
                try {
                    const board = JSON.parse(localStorage.getItem(key));
                    if (board.id.startsWith("TEST-")) {
                        boards.push(board);
                    }
                } catch(e){}
            }
        }
        return boards;
    } else {
        try {
            // Supabase에서 TEST- 로 시작하는 보드만 필터링하여 가져옵니다.
            const { data, error } = await supabaseClient
                .from("praise_boards")
                .select("*")
                .like("id", "TEST-%")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error("전체 보드 조회 실패", e);
            // 로컬 캐시라도 필터링하여 리턴
            const boards = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith("board_")) {
                    try {
                        const board = JSON.parse(localStorage.getItem(key));
                        if (board.id.startsWith("TEST-")) {
                            boards.push(board);
                        }
                    } catch(e){}
                }
            }
            return boards;
        }
    }
}

// 보드 이름 수정 API
async function apiUpdateBoardTitle(boardId, newTitle) {
    let board = await apiGetBoard(boardId);
    if (!board) return false;
    
    board.title = newTitle;
    const result = await apiCreateBoard(board);
    if (result.success) {
        addRegisteredBoard(boardId, newTitle);
        return true;
    }
    console.error("보드 이름 수정 실패:", result.error);
    return false;
}

// 보드 아이템 롱프레스 핸들러 - 칭찬판 상세 수정 모달 오픈
async function handleBoardItemLongPress(board) {
    editTargetBoard = board;
    const hasPermission = localStorage.getItem(`is_editor_${board.id}`) === "true";

    if (hasPermission) {
        // 모든 입력 필드 활성화
        if (editBoardTitle) editBoardTitle.disabled = false;
        if (editBoardTargetCount) editBoardTargetCount.disabled = false;
        if (editBoardReward) editBoardReward.disabled = false;
        if (btnBoardEditSave) btnBoardEditSave.classList.remove("hidden");
    } else {
        // 읽기 전용으로 비활성화
        if (editBoardTitle) editBoardTitle.disabled = true;
        if (editBoardTargetCount) editBoardTargetCount.disabled = true;
        if (editBoardReward) editBoardReward.disabled = true;
        if (btnBoardEditSave) btnBoardEditSave.classList.add("hidden");
    }

    // 폼 값 세팅
    if (editBoardTitle) editBoardTitle.value = board.title;
    if (editBoardTargetCount) editBoardTargetCount.value = board.target_count || 30;
    if (editBoardReward) editBoardReward.value = board.reward_text || "";

    // 팝업 모달창 오픈
    if (modalBoardEdit) {
        modalBoardEdit.classList.remove("hidden");
    }
}

// 등록된 보드 목록 관리 헬퍼 함수들
function getRegisteredBoards() {
    const list = localStorage.getItem("registered_boards");
    return list ? JSON.parse(list) : [];
}

function addRegisteredBoard(boardId, title) {
    let list = getRegisteredBoards();
    const existingIndex = list.findIndex(b => b.id === boardId);
    if (existingIndex !== -1) {
        list[existingIndex].title = title;
    } else {
        list.push({ id: boardId, title: title });
    }
    localStorage.setItem("registered_boards", JSON.stringify(list));
}

function removeRegisteredBoard(boardId) {
    let list = getRegisteredBoards();
    list = list.filter(b => b.id !== boardId);
    localStorage.setItem("registered_boards", JSON.stringify(list));
    
    if (currentBoardId === boardId) {
        if (list.length > 0) {
            currentBoardId = list[0].id;
        } else {
            currentBoardId = "DEFAULT";
        }
        localStorage.setItem("current_board_id", currentBoardId);
    }
}

// 사이드바 내부 보드 목록 동적 렌더링
async function renderBoardList() {
    if (!boardListContainer) return;
    boardListContainer.innerHTML = "";
    
    // 1. 현재 내 로컬 기기 목록(직접 생성/불러온 보드) 가져오기
    let localList = getRegisteredBoards();
    
    // 2. 단일 리스트로 깔끔하게 렌더링
    if (localList.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.style.fontSize = "11px";
        emptyMsg.style.color = "var(--text-muted)";
        emptyMsg.style.textAlign = "center";
        emptyMsg.style.padding = "10px 0";
        emptyMsg.textContent = "등록된 스티커판이 없습니다. 🧸";
        boardListContainer.appendChild(emptyMsg);
    } else {
        localList.forEach(board => {
            const item = createBoardItemDOM(board, true);
            boardListContainer.appendChild(item);
        });
    }
}

// 보드 아이템 DOM 요소 생성 헬퍼
function createBoardItemDOM(board, isLocal) {
    const isActive = board.id === currentBoardId;
    const item = document.createElement("div");
    item.className = `board-item ${isActive ? "active" : ""}`;
    
    // 나의 칭찬판 목록인 경우 삭제(휴지통) 아이콘 노출 (클릭 시 권한 검증)
    const deleteButtonHtml = isLocal ? `
        <button class="btn-delete-board" title="삭제">
            <span class="material-icons" style="font-size: 16px;">delete</span>
        </button>
    ` : '';

    item.innerHTML = `
        <div class="board-item-info">
            <span class="board-item-title">${board.title}</span>
            <span class="board-item-code">코드: ${board.id}</span>
        </div>
        ${deleteButtonHtml}
    `;

    // 1. 클릭 시 전환 이벤트
    item.addEventListener("click", async () => {
        if (isActive) return;
        
        loadingSpinner.classList.remove("hidden");
        sidebar.classList.remove("open");
        sidebarOverlay.classList.add("hidden");
        
        currentBoardId = board.id;
        localStorage.setItem("current_board_id", currentBoardId);
        isEditorMode = localStorage.getItem(`is_editor_${board.id}`) === "true"; // 해당 보드의 기존 인증 상태 복원
        updateRoleUI();
        await refreshApp();
        
        const newUrl = `${window.location.origin}${window.location.pathname}?board=${board.id}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
    });

    // 2. 롱프레스 감지 이벤트 (모바일 및 데스크톱)
    let pressTimer = null;
    let isLongPress = false;

    const startPress = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            handleBoardItemLongPress(board);
        }, 700);
    };

    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    const endPress = (e) => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        if (isLongPress) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    item.addEventListener("mousedown", startPress);
    item.addEventListener("mouseup", endPress);
    item.addEventListener("mouseleave", cancelPress);

    item.addEventListener("touchstart", startPress, { passive: true });
    item.addEventListener("touchend", endPress, { passive: false });
    item.addEventListener("touchcancel", cancelPress, { passive: true });
    item.addEventListener("touchmove", cancelPress, { passive: true });

    // 3. 삭제 버튼 클릭 (완전 삭제)
    if (isLocal) {
        const btnDelete = item.querySelector(".btn-delete-board");
        if (btnDelete) {
            btnDelete.addEventListener("click", async (e) => {
                e.stopPropagation();
                
                // 해당 보드의 편집 권한(여자친구 PIN) 확인
                const hasPermission = localStorage.getItem(`is_editor_${board.id}`) === "true";
                if (!hasPermission) {
                    const pin = prompt(`'${board.title}' 판을 삭제하시겠습니까?\n이 작업을 완료하려면 편집용 비밀번호 PIN을 입력하세요:`);
                    if (pin === null) return; // 취소
                    
                    const requiredPin = board.editor_pin || "1234";
                    if (pin !== requiredPin) {
                        alert("비밀번호가 올바르지 않습니다.");
                        return;
                    }
                } else {
                    if (!confirm(`'${board.title}' 판을 삭제하시겠습니까?\n(실제 데이터와 등록된 스티커 목록이 모두 영구적으로 삭제됩니다.)`)) {
                        return;
                    }
                }
                
                loadingSpinner.classList.remove("hidden");
                const wasActive = board.id === currentBoardId;
                
                // 실제 데이터 삭제 API 호출
                await apiDeleteBoard(board.id);
                
                // 로컬 기기 리스트에서 제외
                removeRegisteredBoard(board.id);
                
                if (wasActive) {
                    const remaining = getRegisteredBoards();
                    if (remaining.length > 0) {
                        currentBoardId = remaining[0].id;
                        currentBoard = remaining[0];
                        localStorage.setItem("current_board_id", currentBoardId);
                        isEditorMode = localStorage.getItem(`is_editor_${currentBoardId}`) === "true";
                        updateRoleUI();
                        
                        // URL 갱신
                        const newUrl = `${window.location.origin}${window.location.pathname}?board=${currentBoardId}`;
                        window.history.replaceState({ path: newUrl }, "", newUrl);
                        
                        sidebar.classList.remove("open");
                        sidebarOverlay.classList.add("hidden");
                        await refreshApp();
                    } else {
                        // 모든 보드가 지워진 경우 초기 화면으로
                        currentBoardId = "";
                        currentBoard = null;
                        localStorage.removeItem("current_board_id");
                        isEditorMode = false;
                        updateRoleUI();
                        
                        // URL 갱신 (쿼리 파라미터 비우기)
                        const newUrl = `${window.location.origin}${window.location.pathname}`;
                        window.history.replaceState({ path: newUrl }, "", newUrl);
                        
                        welcomeScreen.classList.remove("hidden");
                        appContent.classList.add("hidden");
                        sidebar.classList.remove("open");
                        sidebarOverlay.classList.add("hidden");
                        loadingSpinner.classList.add("hidden");
                    }
                } else {
                    renderBoardList();
                    loadingSpinner.classList.add("hidden");
                }
                showToast("스티커판이 완전히 삭제되었습니다.");
            });
        }
    }

    return item;
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
        
        // 설정 폼에 현재 보드 ID 자동 완성 및 테스트값 미리 채우기
        if (currentBoardId === "DEFAULT" || currentBoardId.startsWith("TEST-")) {
            setupBoardId.value = currentBoardId === "DEFAULT" ? "TEST-COSMIC-BOARD" : currentBoardId;
            setupTitle.value = "채소가게 칭찬판 💖";
            setupTargetCount.value = "30";
            setupReward.value = "맛있는 디저트 데이트! 🍦";
            setupPin.value = "1234";
        } else {
            setupBoardId.value = currentBoardId;
        }
        return;
    }

    // 보드가 정상적으로 로드된 경우 설정창 숨기고 콘텐츠 노출
    welcomeScreen.classList.add("hidden");
    currentBoard = board;

    // 로컬 보드 목록 관리 및 갱신
    addRegisteredBoard(board.id, board.title);
    renderBoardList();

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

        // 칸 클릭 및 롱프레스 핸들러 바인딩 (모바일 터치 & 데스크톱 마우스 대응)
        let pressTimer = null;
        let preventClick = false;

        const startPress = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;
            preventClick = false;
            pressTimer = setTimeout(() => {
                preventClick = true;
                handleSlotLongPress(i, isActive);
            }, 600); // 600ms 롱프레스 임계값
        };

        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        const endPress = (e) => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        // 데스크톱 마우스 이벤트
        slot.addEventListener("mousedown", startPress);
        slot.addEventListener("mouseup", endPress);
        slot.addEventListener("mouseleave", cancelPress);

        // 모바일 터치 이벤트
        slot.addEventListener("touchstart", startPress, { passive: true });
        slot.addEventListener("touchend", endPress, { passive: true });
        slot.addEventListener("touchcancel", cancelPress, { passive: true });
        slot.addEventListener("touchmove", cancelPress, { passive: true });

        // 클릭 이벤트 (짧은 터치 / 클릭)
        slot.addEventListener("click", (e) => {
            if (preventClick) {
                e.preventDefault();
                preventClick = false;
                return;
            }
            handleSlotClick(i, isActive);
        });

        stickerGrid.appendChild(slot);
    }

    // 5. 모달 내의 필드 업데이트 (현재 설정 대입)
    if (editTitle) editTitle.value = currentBoard.title || "";
    if (editTargetCount) editTargetCount.value = currentBoard.target_count || 30;
    if (editReward) editReward.value = currentBoard.reward_text || "";
    if (editReaderName) editReaderName.value = currentBoard.reader_role_name || "남자친구 모드 (조회 전용)";
    if (editEditorName) editEditorName.value = currentBoard.editor_role_name || "여자친구 모드 (부착 가능)";
    if (editPin) editPin.value = currentBoard.editor_pin || "";

    // 로딩 종료 및 컨텐츠 표출
    loadingSpinner.classList.add("hidden");
    appContent.classList.remove("hidden");
}

// 날짜 포맷 함수
function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}년 ${month}월 ${date}일 ${hours}:${minutes}`;
}

// 스티커 슬롯 클릭 제어 (짧은 클릭: 메모 작성 또는 조회)
async function handleSlotClick(index, isActive) {
    if (isActive) {
        // 이미 붙은 스티커 클릭 시: 메모 모달창 노출
        editTargetIndex = index;
        deleteTargetIndex = index; // 삭제 대상 인덱스로 지정해둠
        const sticker = currentStickers.find(s => s.sticker_index === index);
        const memoText = sticker && sticker.memo ? sticker.memo : "등록된 칭찬 메모가 없습니다. 🧸";
        const createdDate = sticker && sticker.created_at ? formatDate(sticker.created_at) : "";
        const updatedDate = sticker && sticker.updated_at ? formatDate(sticker.updated_at) : "";

        // 최초 생성 시간과 최근 수정 시간의 차이가 5초 이상인 경우에만 실제 수정된 것으로 간주
        const createdTime = sticker && sticker.created_at ? new Date(sticker.created_at).getTime() : 0;
        const updatedTime = sticker && sticker.updated_at ? new Date(sticker.updated_at).getTime() : 0;
        const isModified = createdTime && updatedTime && Math.abs(updatedTime - createdTime) > 5000;

        console.log("Sticker click debug details:", {
            sticker,
            createdTime,
            updatedTime,
            timeDiffMs: Math.abs(updatedTime - createdTime),
            isModified,
            createdDate,
            updatedDate
        });

        viewStickerMemoText.textContent = memoText;
        viewStickerCreatedAt.textContent = createdDate ? `최초 작성: ${createdDate}` : "";
        
        if (updatedDate && isModified) {
            viewStickerUpdatedAt.textContent = `최근 수정: ${updatedDate}`;
            viewStickerUpdatedAt.classList.remove("hidden");
        } else {
            viewStickerUpdatedAt.textContent = "";
            viewStickerUpdatedAt.classList.add("hidden");
        }

        // 수정/저장 관련 UI 초기화
        document.querySelector("#modal-memo-view .memo-view-content").classList.remove("hidden");
        memoEditArea.classList.add("hidden");
        btnMemoEditCancel.classList.add("hidden");
        btnMemoEditSave.classList.add("hidden");
        btnMemoViewClose.classList.remove("hidden");

        if (isEditorMode) {
            btnMemoEditStart.classList.remove("hidden");
            btnMemoDelete.classList.remove("hidden");
        } else {
            btnMemoEditStart.classList.add("hidden");
            btnMemoDelete.classList.add("hidden");
        }

        modalMemoView.classList.remove("hidden");
    } else {
        // 빈칸 클릭 시: 편집자만 메모 작성 모달 노출 후 부착
        if (!isEditorMode) {
            showToast("스티커 추가는 여자친구(편집자)만 가능해요! 🧸");
            return;
        }
        memoTargetIndex = index;
        inputStickerMemo.value = "";
        modalMemoInput.classList.remove("hidden");
        inputStickerMemo.focus();
    }
}

// 스티커 슬롯 롱프레스 제어 (길게 누르기: 스티커 떼기)
async function handleSlotLongPress(index, isActive) {
    if (!isActive) return; // 빈칸은 롱프레스 무시

    if (!isEditorMode) {
        showToast("스티커 제거는 여자친구(편집자)만 가능해요! 🧸");
        return;
    }

    deleteTargetIndex = index;
    deleteConfirmText.textContent = `스티커를 떼겠습니까?`;
    modalDelete.classList.remove("hidden");
}

// ==========================================
// 7. 역할 모드 토글 (인증 및 로그아웃)
// ==========================================
function updateRoleUI() {
    if (isEditorMode) {
        if (btnToggleRole) btnToggleRole.className = "sidebar-role-btn editor-mode";
        if (roleIcon) roleIcon.textContent = "edit";
        if (roleText) roleText.textContent = (currentBoard && currentBoard.editor_role_name) || "여자친구 모드 (부착 가능)";

        // 설정 모달 내 필드 활성화
        document.querySelectorAll(".editor-only-field").forEach(el => el.disabled = false);
        btnSettingsSave.classList.remove("hidden");
    } else {
        if (btnToggleRole) btnToggleRole.className = "sidebar-role-btn reader-mode";
        if (roleIcon) roleIcon.textContent = "visibility";
        if (roleText) roleText.textContent = (currentBoard && currentBoard.reader_role_name) || "남자친구 모드 (조회 전용)";

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
    const requiredPin = currentBoard.editor_pin || "";

    if (pin === requiredPin) {
        isEditorMode = true;
        localStorage.setItem(`is_editor_${currentBoardId}`, "true"); // 로컬스토리지에 인증 승인 기록
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
        localStorage.removeItem(`is_editor_${currentBoardId}`); // 로그아웃 시 인증 승인 기록 삭제
        updateRoleUI();
        refreshApp();
        showToast("조회 전용 모드로 복귀했습니다.");
    } else {
        modalPin.classList.remove("hidden");
        inputPin.focus();
    }
});

// 새 칭찬판 만들기 다이얼로그 노출
btnShare.addEventListener("click", () => {
    modalShare.classList.remove("hidden");
    inputCreateBoardTitle.value = "";
    inputCreateBoardTitle.focus();
});

btnShareClose.addEventListener("click", () => {
    modalShare.classList.add("hidden");
});

// 새로운 칭찬판 생성 (백그라운드에서 난수 코드 자동 생성 및 대조)
btnCreateBoard.addEventListener("click", async () => {
    const titleVal = inputCreateBoardTitle.value.trim();
    const finalTitle = titleVal || "우리의 새로운 칭찬판 💖";

    loadingSpinner.classList.remove("hidden");
    modalShare.classList.add("hidden");

    // 고유한 난수 코드 생성 (예: TEST-BOARD-4829)
    let finalCode = "";
    while (true) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const tempCode = `TEST-BOARD-${randNum}`;
        const existing = await apiGetBoard(tempCode);
        if (!existing) {
            finalCode = tempCode;
            break;
        }
    }

    const newBoard = {
        id: finalCode,
        title: finalTitle,
        target_count: 30,
        reward_text: "새로운 선물 지정하기",
        editor_pin: currentBoard ? currentBoard.editor_pin : "1234"
    };

    const result = await apiCreateBoard(newBoard);
    if (result.success) {
        currentBoardId = finalCode;
        localStorage.setItem("current_board_id", finalCode);
        localStorage.setItem(`is_editor_${finalCode}`, "true");
        inputCreateBoardTitle.value = "";
        isEditorMode = true;
        updateRoleUI();
        await refreshApp();
        
        showToast("새 칭찬판이 생성되었습니다! 🚀");
    } else {
        showToast(`칭찬판 개설 실패: ${result.error}`);
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

// 칭찬판 세부 설정 변경 및 저장 (보안 및 라벨 전용)
btnSettingsSave.addEventListener("click", async () => {
    if (!isEditorMode) return;

    const count = parseInt(editTargetCount.value);
    if (isNaN(count) || count < 1 || count > 100) {
        showToast("올바른 목표 개수(1~100)를 입력하세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    modalSettings.classList.add("hidden");

    const updated = {
        ...currentBoard,
        title: editTitle.value.trim() || currentBoard.title,
        target_count: count,
        reward_text: editReward.value.trim(),
        editor_pin: editPin.value.trim() || currentBoard.editor_pin,
        reader_role_name: editReaderName.value.trim() || "남자친구 모드 (조회 전용)",
        editor_role_name: editEditorName.value.trim() || "여자친구 모드 (부착 가능)"
    };

    const result = await apiCreateBoard(updated);
    // 로컬 캐시에는 apiCreateBoard 내부에서 이미 저장됨 → 로컬 상태는 항상 갱신
    addRegisteredBoard(currentBoard.id, updated.title);
    currentBoard = updated;
    await refreshApp();

    if (result.success) {
        showToast("칭찬판 세부 설정이 정상 변경되었습니다. ✨");
    } else {
        showToast(`⚠️ 서버 저장 실패: ${result.error}`);
    }
});

// 칭찬판 정보 수정 저장 처리 (길게 누르기 모달)
btnBoardEditSave.addEventListener("click", async () => {
    if (!editTargetBoard) return;
    const hasPermission = localStorage.getItem(`is_editor_${editTargetBoard.id}`) === "true";
    if (!hasPermission) return;

    const count = parseInt(editBoardTargetCount.value);
    if (isNaN(count) || count < 1 || count > 100) {
        showToast("올바른 목표 개수(1~100)를 입력하세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    if (modalBoardEdit) modalBoardEdit.classList.add("hidden");

    const updatedBoard = {
        ...editTargetBoard,
        title: editBoardTitle.value.trim() || editTargetBoard.title,
        target_count: count,
        reward_text: editBoardReward.value.trim()
    };

    const result = await apiCreateBoard(updatedBoard);
    // 로컬 캐시에는 apiCreateBoard 내부에서 이미 저장됨 → 로컬 상태는 항상 갱신
    addRegisteredBoard(editTargetBoard.id, updatedBoard.title);

    if (editTargetBoard.id === currentBoardId) {
        currentBoard = updatedBoard;
        await refreshApp();
    } else {
        renderBoardList();
        loadingSpinner.classList.add("hidden");
    }

    if (result.success) {
        showToast("칭찬판이 성공적으로 수정되었습니다! ✨");
    } else {
        showToast(`⚠️ 서버 저장 실패: ${result.error}`);
    }
    editTargetBoard = null;
});

btnBoardEditClose.addEventListener("click", () => {
    editTargetBoard = null;
    if (modalBoardEdit) modalBoardEdit.classList.add("hidden");
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

// 칭찬 메모 입력 모달 이벤트 리스너
btnMemoSubmit.addEventListener("click", async () => {
    if (memoTargetIndex === null) return;
    const memoText = inputStickerMemo.value.trim();

    loadingSpinner.classList.remove("hidden");
    modalMemoInput.classList.add("hidden");

    const success = await apiAddSticker(currentBoardId, memoTargetIndex, memoText);
    if (success) {
        showToast(`${memoTargetIndex + 1}번째 스티커 부착 완료! 💙`);
        memoTargetIndex = null;
        await refreshApp();
    } else {
        showToast("스티커 부착 중 에러가 발생했습니다.");
        loadingSpinner.classList.add("hidden");
    }
});

btnMemoCancel.addEventListener("click", () => {
    memoTargetIndex = null;
    modalMemoInput.classList.add("hidden");
});

// 칭찬 메모 확인 모달 이벤트 리스너
btnMemoViewClose.addEventListener("click", () => {
    editTargetIndex = null;
    modalMemoView.classList.add("hidden");
});

// 메모 수정 시작
btnMemoEditStart.addEventListener("click", () => {
    if (editTargetIndex === null) return;
    const sticker = currentStickers.find(s => s.sticker_index === editTargetIndex);
    inputEditStickerMemo.value = sticker && sticker.memo ? sticker.memo : "";
    
    // UI 전환
    document.querySelector("#modal-memo-view .memo-view-content").classList.add("hidden");
    memoEditArea.classList.remove("hidden");
    
    btnMemoEditStart.classList.add("hidden");
    btnMemoDelete.classList.add("hidden");
    btnMemoViewClose.classList.add("hidden");
    btnMemoEditCancel.classList.remove("hidden");
    btnMemoEditSave.classList.remove("hidden");
    
    inputEditStickerMemo.focus();
});

// 메모 수정 취소
btnMemoEditCancel.addEventListener("click", () => {
    document.querySelector("#modal-memo-view .memo-view-content").classList.remove("hidden");
    memoEditArea.classList.add("hidden");
    
    btnMemoEditStart.classList.remove("hidden");
    btnMemoDelete.classList.remove("hidden");
    btnMemoViewClose.classList.remove("hidden");
    btnMemoEditCancel.classList.add("hidden");
    btnMemoEditSave.classList.add("hidden");
});

// 메모 수정 저장
btnMemoEditSave.addEventListener("click", async () => {
    if (editTargetIndex === null) return;
    const newMemoText = inputEditStickerMemo.value.trim();
    
    loadingSpinner.classList.remove("hidden");
    modalMemoView.classList.add("hidden");
    
    const success = await apiUpdateStickerMemo(currentBoardId, editTargetIndex, newMemoText);
    if (success) {
        showToast("칭찬 메모가 수정되었습니다. ✨");
        editTargetIndex = null;
        await refreshApp();
    } else {
        showToast("메모 수정에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalMemoView.classList.remove("hidden");
    }
});

// 메모 보기 창에서 삭제 버튼 클릭 시 제거 모달로 전환
btnMemoDelete.addEventListener("click", () => {
    if (editTargetIndex === null) return;
    deleteTargetIndex = editTargetIndex;
    modalMemoView.classList.add("hidden");
    deleteConfirmText.textContent = `${deleteTargetIndex + 1}번째 스티커를 제거하시겠습니까?`;
    modalDelete.classList.remove("hidden");
});

// ==========================================
// 9. 앱 초기 구동 및 실시간 데이터 싱크 폴링
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. 기존 데모/더미 데이터 로컬스토리지 캐시 정리
    localStorage.removeItem("board_DEFAULT");
    localStorage.removeItem("stickers_DEFAULT");

    // [소독 패치] 모바일 기기 로컬스토리지 내 자동 누적된 타인의 테스트 칭찬판 찌꺼기 정리
    try {
        const boards = JSON.parse(localStorage.getItem("registered_boards") || "[]");
        if (boards.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const activeParamId = (urlParams.get("board") || "").trim().toUpperCase();
            
            const cleaned = boards.filter(b => {
                const isCurrent = b.id === currentBoardId || b.id === activeParamId;
                const hasPermission = localStorage.getItem(`is_editor_${b.id}`) === "true";
                const isNotTestBoard = !b.id.startsWith("TEST-"); // 내 개설판(BON_WOOK 등) 보존
                
                return isCurrent || hasPermission || isNotTestBoard;
            });
            
            if (cleaned.length !== boards.length) {
                localStorage.setItem("registered_boards", JSON.stringify(cleaned));
            }
        }
    } catch (e) {
        console.error("로컬 스토리지 칭찬판 리스트 소독 중 오류:", e);
    }

    // 2. URL 쿼리 파라미터에서 보드 ID가 넘어온 경우 자동 설정
    const urlParams = new URLSearchParams(window.location.search);
    const boardParam = urlParams.get("board");
    if (boardParam) {
        currentBoardId = boardParam.trim().toUpperCase();
        localStorage.setItem("current_board_id", currentBoardId);
    }

    updateRoleUI();
    refreshApp();

    // 사이드바 토글 및 기능 바인딩
    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            sidebar.classList.add("open");
            sidebarOverlay.classList.remove("hidden");
            renderBoardList(); // 열릴 때 최신 목록 렌더링
        });
    }

    if (btnSidebarClose) {
        btnSidebarClose.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
        });
    }
    
    if (btnAddBoardSidebar) {
        btnAddBoardSidebar.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
            
            // 공유/생성 모달을 열고 새 보드 생성 인풋에 포커싱
            modalShare.classList.remove("hidden");
            inputCreateBoard.value = "";
            inputCreateBoardTitle.value = "";
            inputCreateBoardTitle.focus();
        });
    }

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
        if (!code.startsWith("TEST-")) {
            showToast("보안을 위해 테스트용 보드(TEST-로 시작)만 새로 생성하거나 덮어쓸 수 있습니다.");
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

        const result = await apiCreateBoard(newBoard);
        if (result.success) {
            currentBoardId = code;
            localStorage.setItem("current_board_id", code);
            localStorage.setItem(`is_editor_${code}`, "true");
            isEditorMode = true;
            updateRoleUI();
            await refreshApp();
            showToast("칭찬판이 성공적으로 개설되었습니다! 🚀");
            
            const newUrl = `${window.location.origin}${window.location.pathname}?board=${code}`;
            window.history.replaceState({ path: newUrl }, "", newUrl);
        } else {
            showToast(`칭찬판 개설 실패: ${result.error}`);
            welcomeScreen.classList.remove("hidden");
            loadingSpinner.classList.add("hidden");
        }
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
