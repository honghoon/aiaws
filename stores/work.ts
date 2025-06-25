import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkStore = defineStore('work', () => {
const works = ref([
  {
    id: 1,
    type: "개발",
    title:
      "분석 설계 안녕하세요. 안녕하세요. 제목입니다. .. 으흐흐흐 하나 둘 셋 넷 다섯.. 여섯 . 으흐흐흐 하나 둘 셋 넷 다섯.. 여섯 . 으흐흐흐 하나 둘 셋 넷 다섯.. 여섯 ",
    status: 1,      
    statusName: "대기 업무",    
    color: "infoColor",
    progress: 0,
    startDate: "2025-07-01",
    endDate: "2025-07-15",
    content: `<ul>
      <li>분석 설계 문서를 작성하였습니다.</li>
      <li>주요 기능에 대한 <b>요구사항</b>을 정리했습니다.</li>
      <li><span style="color:#f43f5e;">추가 검토가 필요합니다.</span></li>
    </ul>`,
  },
  {
    id: 2,
    type: "기획",
    title: "신규 서비스 기획 회의",
    status: 3,
    statusName: "진행 중",
    color: "infoColorSuppl",
    progress: 20,
    startDate: "2025-07-02",
    endDate: "2025-07-03",
    content: `<p>신규 서비스 런칭을 위한 <b>기획 회의</b>를 진행하였습니다.</p>
      <p><u>참석자</u>: 홍길동, 김철수, 이영희</p>
      <ol>
        <li>서비스 타겟</li>
        <li>일정</li>
        <li>예산</li>
      </ol>`,
  },
  {
    id: 3,
    type: "테스트",
    title: "기능 테스트 및 버그 리포트",
    status: 4,
    statusName: "완료",    
    color: "successColor",
    progress: 100,
    startDate: "2025-07-03",
    endDate: "2025-08-03",
    content: `<p>주요 기능에 대한 <b>테스트</b>를 완료하였고, 발견된 버그는 <span style="color:#3b82f6;">이슈 트래커</span>에 등록하였습니다.</p>
      <p>총 <b>3건</b>의 버그가 발견되었습니다.</p>`,
  },
  {
    id: 4,
    type: "운영",
    title: "서버 점검 및 유지보수",
    status: 1,
    statusName: "대기 업무",
    color: "infoColor",
    progress: 0,
    startDate: "2025-07-04",
    endDate: "2025-09-04",
    content: `<ul>
      <li>정기 서버 점검을 위해 <b>시스템 백업</b>을 진행하였습니다.</li>
      <li>점검 결과 <span style="color:#22c55e;">이상 없음</span>.</li>
    </ul>`,
  },
  {
    id: 5,
    type: "개발",
    title: "API 연동 개발",
    status: 3,
    statusName: "진행 중",    
    color: "infoColorSuppl",
    progress: 70,
    startDate: "2025-07-05",
    endDate: "2025-09-05",
    content: `<p>외부 시스템과의 <b>API 연동 개발</b>을 시작하였습니다.</p>
      <p>현재 <u>인증 방식</u> 협의 중입니다.</p>`,
  },
  {
    id: 6,
    type: "기획",
    title: "UI/UX 개선안 작성",
    status: 4,
    statusName: "완료",    
    color: "successColor",
    progress: 100,
    startDate: "2025-07-06",
    endDate: "2025-07-10",
    content: `<p>사용자 피드백을 반영하여 <b>UI/UX 개선안</b>을 작성하였습니다.</p>
      <p>디자인팀과 <span style="color:#a21caf;">공유 예정</span>.</p>`,
  },
  {
    id: 7,
    type: "테스트",
    title: "성능 테스트",
    status: 3,
    statusName: "진행 중",    
    color: "infoColorSuppl",
    progress: 80,
    startDate: "2025-07-07",
    endDate: "2025-07-07",
    content: `<p>시스템 <b>부하 테스트</b>를 진행 중입니다.</p>
      <p>초기 결과는 <span style="color:#22d3ee;">양호</span>하나 추가 테스트 필요.</p>`,
  },
  {
    id: 8,
    type: "운영",
    title: "로그 모니터링",
    status: 4,
    statusName: "완료",    
    color: "successColor",
    progress: 100,
    startDate: "2025-07-08",
    endDate: "2025-08-08",
    content: `<ul>
      <li>로그 모니터링 시스템을 점검하였으며,</li>
      <li><b>이상 징후</b>는 발견되지 않았습니다.</li>
    </ul>`,
  },
  {
    id: 9,
    type: "개발",
    title: "코드 리뷰",
    status: 1,
    statusName: "대기 업무",    
    color: "infoColor",
    progress: 0,
    startDate: "2025-07-09",
    endDate: "2025-10-09",
    content: `<p>신규 기능에 대한 <b>코드 리뷰</b>가 예정되어 있습니다.</p>
      <p>참석자: <span style="color:#f59e42;">개발팀 전원</span></p>`,
  },
  {
    id: 10,
    type: "기획",
    title: "시장 조사 결과 공유",
    status: 4,
    statusName: "완료",    
    color: "successColor",
    progress: 100,
    startDate: "2025-07-10",
    endDate: "2025-09-10",
    content: `<p>시장 조사 결과를 팀원들과 <b>공유</b>하였습니다.</p>
      <ul>
        <li>주요 경쟁사 분석</li>
        <li>트렌드 정리</li>
      </ul>`,
  },
  {
    id: 11,
    type: "기획",
    title: "그룹웨어 시장 조사 결과 공유의 제목이 어어엄청 길면 어떻게 될까?",
    status: 2,
    statusName: "해야 할 일",    
    color: "warningColor",
    progress: 20,
    startDate: "2025-07-10",    
    endDate: "2025-10-11",
    content: `<p>그룹웨어 결과를 팀원들과 <b>공유</b>하였습니다.</p>
      <ul>
        <li>주요 경쟁사 분석</li>
        <li>트렌드 정리</li>
      </ul>`,
  },  
  {
    id: 12,
    type: "기획",
    title: "시장 조사 결과 공유",
    status: 2,
    statusName: "해야 할 일",    
    color: "warningColor",
    progress: 30,
    startDate: "2025-07-10",
    endDate: "2025-07-12",
    content: `<p>시장 조사 결과를 팀원들과 <b>공유</b>하였습니다.</p>
      <ul>
        <li>주요 경쟁사 분석</li>
        <li>트렌드 정리</li>
      </ul>`,
  },    
]);

  return {
    works
  }
})