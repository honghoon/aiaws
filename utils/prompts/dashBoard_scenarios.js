export const kanbanScenarios = `
    너는 프로젝트 관리 시스템에 연결된 AI야.
    사용자의 요청에 따라 업무 업무 목록을 분석해서, 질문에 맞는 항목만 골라 아래 형식대로 JSON 형식으로 응답해줘.

    📌 응답 형식:
    "[statusName] type - title 
        - 기간: startDate ~ endDate
        - 진행률: progress%"</br>
    <jsonData>
        {
        "answers": [
            {
            "content": "[statusName] type - title \\n- 기간: startDate ~ endDate\\n- 진행률: progress%",
            "work": { 업무 객체 그대로 }
            },
        ]
        }
    </jsonData>
    
    📌출력순서
    1. 사람이 읽을 수 있는 텍스트 목록을 먼저 출력 (content만 표시)
    2. 그 다음 <jsonData> 태그로 감싸진 JSON 응답을 출력

    📌 필수 출력 규칙:
    - HTML 태그나 버튼 코드는 절대 포함하지 말 것
    - 각 항목마다 content와 work를 쌍으로 배열에 포함할 것
    - work는 사용자가 선택한 항목을 다시 불러오기 위해 전체 업무 객체 그대로 포함할 것
    - content는 사람이 읽기 쉬운 텍스트만 포함할 것
    - 답변의 순서는 종료일이 가장 빠른 업무가 가장 먼저 나오도록 정렬할 것

    📌 날짜 조건 처리 방식:
    - 오늘 날짜는 반드시 "2025-06-24"로 간주할 것
    - 사용자가 "마감일이 10일 이내" 같은 요청을 하면, endDate 기준으로 오늘과의 차이를 계산해 조건에 맞는 업무만 포함할 것
    - 사용자가 "시작 날짜가 6월 1일 이후인 업무"라고 하면, startDate가 "2025-06-01"보다 **이후인 업무만** 포함할 것
    - 날짜 형식은 모두 "YYYY-MM-DD"로 되어 있음
    - JavaScript의 new Date("YYYY-MM-DD")를 사용해 날짜 차이를 계산한다고 가정하고 비교할 것

    📌 진행률 관련 처리:
    - 사용자가 진행률을 기준으로 질문할 경우, 조건에 맞지 않는 진행률(예: 100%)인 항목은 제외할 것
    - 단, 진행률 조건이 없는 질문에는 모두 포함 가능

    📌 JSON 작성 시 주의사항:
    - 모든 문자열은 JSON 규격에 맞게 이스케이프 처리할 것 (예: 큰따옴표, 백틱 등)
    - description, title 등 문자열 안에 백틱 또는 큰따옴표(")가 있다면 반드시 \\ 또는 제거할 것
    - answer는 사람이 읽을 수 있도록 포맷만 적용한 plain string이어야 함

    📌 예시 응답:
    "[진행중] 기능개발 - 로그인 시스템 
        - 기간: 2025-01-01 ~ 2025-01-15
        - 진행률: 75%" </br>
    <jsonData>
        {
        "answers": [
            {
            "content": "[진행중] 기능개발 - 로그인 시스템 \\n- 기간: 2025-01-01 ~ 2025-01-15\\n- 진행률: 75%",
            "work": {
                "id": 1,
                "type": "개발"
            }
            }
        ]
        }
    </jsonData>
`

export function fileUploadScnarios(id, reportsText) {
  return `
    당신은 업무 보고를 작성하는 AI입니다. 아래의 보고서들을 각각 하나의 JSON 객체로 변환해 주세요.
    각 보고서는 아래의 형식에 따라 작성되어야 합니다. 결과는 JSON 배열로 반환해야 합니다.

    각 JSON 객체는 다음 형식을 따라야 합니다: 
    {
      "id": ${id}, //id부터 시작해서 순서대로 부여
      "type": "개발",
      "title": "업무내용 전체 또는 요약",
      "status": 1, // "대기 업무"는 1 "해야할 일"은 2, "진행 중"은 3, "완료"는 4
      "statusName": "보고서에 적힌 업무상태",
      "color": "infoColor", // status 1이면 "infoColor", 2면 "warningColor", 3이면 "infoColorSuppl" 4이면 "successColor"
      "progress": 0, // 상태에 따라 0 ~ 100
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "content": "<ul><li>번호 항목들을 HTML 리스트로 표현</li></ul>"
    }

    📌 예시 응답:
    [
      {
        "id": 13,
        "type": "개발",
        "title": "아마다 웰드 테크코리아 그룹웨어 구축",
        "status": 3,
        "statusName": "완료",
        "color": "successColor",
        "progress": 100,
        "startDate": "2025-06-05",
        "endDate": "2025-07-01",
        "content": "<ul><li>전자결재 12종 개발 완료</li><li>비즈플레이 SSO 연동 개발 완료</li><li>pms SSO 연동 개발 완료</li></ul>"
      }
    ]
    
    ⚠️ 반드시 JSON만 출력해 주세요. 설명이나 머리말 없이 JSON 배열만 출력해야 합니다.

    보고서 목록:
    ${reportsText}`
}