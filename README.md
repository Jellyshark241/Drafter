# LOL MOCK BANPICK SIMULATOR

LCK 감성의 프리미엄 UI로 제작한 LoL 밴픽 시뮬레이터입니다.  
팀별 밴/픽 진행, 세트 스코어 추적, 스왑 페이즈, 타이머/무제한 모드를 통해 실전형 밴픽 전략을 빠르게 검증할 수 있습니다.

## Highlights

- LCK 스타일 다크/네온 UI와 글래스모피즘 인터랙션
- Fearless 모드 지원 (`HARD`, `SOFT`, `TOURNAMENT`)
- 초성 검색 기반 챔피언 필터링
- 밴픽 완료 후 같은 팀 내 순차 클릭 스왑 페이즈
- 세트/시리즈 진행 관리 (`BO3`, `BO5`) 및 시리즈 종료 모달
- 시간 제한 ON/OFF + 무제한 모드 인피니티 루프 UI

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Zustand

## Getting Started

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## Production Build

```bash
npm run build
npm run start
```

## Deploy (Vercel)

1. Vercel에 레포지토리 연결
2. Framework Preset: Next.js
3. Build Command: `npm run build`
4. Output: Next.js 기본값 사용

## Privacy & Terms

- 개인정보 처리방침 / 이용약관 모달 내 고지 문구 포함
- Riot Games 비공식 팬 프로젝트 고지 포함

## Disclaimer

This project is not affiliated with or endorsed by Riot Games, Inc.  
League of Legends and all related assets are trademarks or registered trademarks of Riot Games, Inc.
