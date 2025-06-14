![header](https://capsule-render.vercel.app/api?type=waving&height=300&color=gradient&text=auyul-bot%20project&textBg=false)

## 아율봇 (auyul-bot, 가칭) vPre-Dev

<img src="./auyul-profile.png" width="30%" height="30%" />

아율봇은 discord.js 라이브러리를 활용하여 제작 되었습니다.

Youtube music을 활용하여 디스코드 통화방 내에서 음악을 재생해주는 기능을 수행합니다.

(2024년 하반기 개발 예정)

## 유튜브 음악 재생봇 주요 기능

- 손쉬운 음악검색 (자동완성)
- 손쉬운 플레이 리스트 기능
  - 음악간 빠른 이동, 유튜브 플리 불러오기
- 외부 웹사이트로 연결되는 재생 리모컨☆
  - 이 기능은 개인적으로 혁신적이라 생각중: 기대해주세요

## 사용법

<!--
### [서버에 아율봇 초대하기]()

위 링크를 통해 디스코드 서버에 아율봇을 추가 할 수 있습니다.
-->

아율봇은 디스코드 표준 개발 문서에 따라 slash command를 지원하고 있습니다.

### 명령어

```
/채널설정 [채널명]
```

- 음악 재생 명령어를 사용할 채팅 채널을 설정합니다.

```
/채널해제
```

- 음악재생 명령어 채팅 채널을 제거합니다.

```
/리모컨
```

- 조작이 손쉬운 리모컨 웹 페이지 링크를 불러옵니다.

```
/들어와
```

- 아율봇을 통화방에 입장시킵니다.

```
/나가
```

- 아율봇을 통화방에서 내보냅니다.

```
/음소거
```

- 아율봇이 채팅채널에 어떠한 메세지도 보내지 않습니다. 명령어에 대한 응답은 개인 사용자에게만 보여집니다.

```
/음소거해제
```

- 음소거 기능을 해제합니다.

```
/볼륨 [음량]
```

- 볼륨을 조절합니다.

```
기타 명령어
- 재생
- 일시정지
- 이전곡
- 다음곡
- 정지
- 목록
- 제거
- 섞기
- 반복
- 반복해제
```

### 기타 설명

- 통화방에 연결 된 상태에서 30분 이상 아율봇과 상호작용이 없다면 자동으로 통화방을 나갑니다.
- 통화방 밖에 있는 사용자들의 명령은 실행해주지 않습니다.
- 명령어 채널과 음소거 설정을 위해 각 서버의 Guild ID를, `<!-- [] 설정이나 [] 설정과 같은 -->`사용자 개개인의 맞춤 설정을 위해 사용자 ID를 수집, 보관 할 수 있습니다. 개인정보 보호에 관한 내용에 대한 문의는 [kevin1113dev@gmail.com]를 통해주세요.
- 본 프로젝트는 1인 개발 프로젝트 입니다. 협업 관련 문의는 [kevin1113dev@gmail.com]으로 연락 바랍니다.

## 업데이트 로그

## To do:

- 프로젝트 기본 기능 (DB, 음성채널 접속, 기본 명령어 등)
- 기본 음악 조작 기능(재생, 정지, 일시정지, 이전곡, 다음곡) 추가
- 플레이리스트 편집(불러오기, 내보내기, 추가하기, 삭제하기, 순서 바꾸기) 기능 추가
- 리모컨 기능 추가 (외부 웹페이지, React?, +신디사이저)
- 실시간 재생 바 추가 (디스코드 API Limit 정책에 따라 달라질 수 있음)
- help 명령어 추가
- 음악 검색 기능 추가 (+자동완성)
