-- 스티치 칭찬판 테이블 스키마 (Supabase SQL)

-- 1. 칭찬 스티커 판 테이블 (praise_boards)
CREATE TABLE IF NOT EXISTS public.praise_boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 30,
    reward_text TEXT,
    editor_pin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 붙여진 스티커 테이블 (praise_stickers)
CREATE TABLE IF NOT EXISTS public.praise_stickers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    board_id TEXT REFERENCES public.praise_boards(id) ON DELETE CASCADE NOT NULL,
    sticker_index INTEGER NOT NULL,
    memo TEXT, -- 칭찬 메모 내용
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(board_id, sticker_index)
);

-- 기존 테이블에 memo 컬럼 추가가 필요한 경우 실행할 쿼리:
-- ALTER TABLE public.praise_stickers ADD COLUMN IF NOT EXISTS memo TEXT;

-- 기존 테이블에 updated_at 컬럼 추가가 필요한 경우 실행할 쿼리:
-- 1단계: 컬럼 추가 (기본값 설정)
-- ALTER TABLE public.praise_stickers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
-- 2단계: 기존 데이터의 수정 일시를 최초 작성 일시로 일치시키기
-- UPDATE public.praise_stickers SET updated_at = created_at WHERE updated_at IS NULL;
-- 3단계: NOT NULL 제약 조건 설정
-- ALTER TABLE public.praise_stickers ALTER COLUMN updated_at SET NOT NULL;

