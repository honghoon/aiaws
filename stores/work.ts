import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkStore = defineStore('work', () => {
  let works = ref([
    {
      id: 1,
      type: "개발",
      title: "분석 설계 문서 작성 및 요구사항 정의 완료",
      status: 1,
      statusName: "대기 업무",    
      color: "infoColor",
      progress: 0,
      users:["나웅진", "김지민"],
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      content: `<ul>
        <li>전체 시스템 아키텍처 분석 및 설계 방향성 수립</li>
        <li>주요 기능별 요구사항 상세 정의서 작성</li>
        <li>비즈니스 로직 검토 및 추가 요구사항 수집 예정</li>
        <li><span style="color:#f43f5e;">보안 관련 추가 검토 필요</span></li>
      </ul>`,
    },
    {
      id: 2,
      type: "기획",
      title: "신규 서비스 기획 및 로드맵 수립 회의 진행",
      status: 3,
      users:["나웅진"],
      statusName: "진행 중",
      color: "infoColorSuppl",
      progress: 20,
      startDate: "2025-06-02",
      endDate: "2025-07-10",
      content: `<p>신규 서비스 출시를 위한 시장 조사 결과 공유 및 분석</p>
        <p><u>참석자</u>: 홍길동, 김철수, 이영희</p>
        <ol>
          <li>목표 고객층 및 사용자 페르소나 정의</li>
          <li>서비스 기능 우선순위 결정 및 일정 조율</li>
          <li>예산 및 리소스 할당 계획 수립</li>
        </ol>`,
    },
    {
      id: 3,
      type: "테스트",
      title: "기능 테스트 및 버그 리포트 작성",
      status: 4,
      statusName: "완료",    
      users:["김수빈"],
      color: "successColor",
      progress: 100,
      startDate: "2025-06-01",
      endDate: "2025-07-01",
      content: `<p>모든 주요 기능에 대해 통합 테스트 및 회귀 테스트 완료</p>
        <p>발견된 버그 총 3건을 이슈 트래킹 시스템에 등록 및 담당자 지정</p>
        <ul>
          <li>로그인 오류 수정</li>
          <li>데이터 동기화 지연 문제 해결</li>
          <li>UI 버튼 동작 불일치 수정</li>
        </ul>`,
    },
    {
      id: 4,
      type: "운영",
      title: "서버 점검 및 유지보수 작업 진행",
      status: 1,
      statusName: "대기 업무",
      users:["김영희"],
      color: "infoColor",
      progress: 0,
      startDate: "2025-06-01",
      endDate: "2025-07-20",
      content: `<ul>
        <li>정기 서버 점검 및 백업 작업 계획 수립</li>
        <li>서버 부하 및 네트워크 상태 모니터링 강화</li>
        <li><span style="color:#22c55e;">문제 발생 시 즉각 대응 체계 준비</span></li>
      </ul>`,
    },
    {
      id: 5,
      type: "개발",
      title: "외부 API 연동 개발 및 인증 프로세스 구현",
      status: 3,
      statusName: "진행 중",    
      users:["김수빈", "나웅진"],
      color: "infoColorSuppl",
      progress: 70,
      startDate: "2025-06-05",
      endDate: "2025-07-01",
      content: `<p>외부 서비스와의 데이터 송수신 API 개발 중</p>
        <p>OAuth 2.0 인증 방식 도입 및 토큰 관리 기능 구현 진행</p>
        <p>API 문서 작성 및 테스트 케이스 작성 예정</p>`,
    },
    {
      id: 6,
      type: "기획",
      title: "UI/UX 개선안 작성 및 디자인 협업 진행",
      status: 4,
      statusName: "완료",    
      users:["김수빈", "나웅진"],
      color: "successColor",
      progress: 100,
      startDate: "2025-05-01",
      endDate: "2025-06-10",
      content: `<p>사용자 피드백 기반으로 UI 흐름 및 인터랙션 개선안 작성</p>
        <p>디자인팀과 협의하여 최종 시안 확정 및 프로토타입 제작</p>
        <p>향후 사용자 테스트 일정 조율</p>`,
    },
    {
      id: 7,
      type: "테스트",
      title: "시스템 부하 성능 테스트 진행 중",
      status: 3,
      statusName: "진행 중",    
      users:["김영희"],
      color: "infoColorSuppl",
      progress: 80,
      startDate: "2025-07-01",
      endDate: "2025-07-10",
      content: `<p>초기 부하 테스트 결과 정상 범위 내 성능 확인</p>
        <p>추가 스트레스 테스트 계획 수립 및 실행 예정</p>
        <p>성능 모니터링 로그 분석 및 최적화 방안 검토</p>`,
    },
    {
      id: 8,
      type: "운영",
      title: "로그 모니터링 및 이상 징후 점검 완료",
      status: 4,
      statusName: "완료",    
      users:["나웅진"],
      color: "successColor",
      progress: 100,
      startDate: "2025-04-01",
      endDate: "2025-05-10",
      content: `<ul>
        <li>시스템 로그 정기 점검 및 이상 징후 탐지</li>
        <li><b>비정상 접근 시도 없음</b> 확인 완료</li>
        <li>로그 보관 정책 검토 및 백업 강화 방안 제안</li>
      </ul>`,
    },
    {
      id: 9,
      type: "개발",
      title: "신규 기능 코드 리뷰 진행 예정",
      status: 1,
      statusName: "대기 업무",    
      users:["나웅진", "김지민", "김수빈", "김영희"],
      color: "infoColor",
      progress: 0,
      startDate: "2025-07-09",
      endDate: "2025-10-09",
      content: `<p>최근 개발된 신규 기능에 대해 동료들과 코드 리뷰 예정</p>
        <p>코딩 표준 준수 여부, 버그 가능성, 성능 최적화 점검 포함</p>
        <p>리뷰 결과에 따른 개선 작업 계획 수립</p>`,
    },
    {
      id: 10,
      type: "기획",
      title: "시장 조사 결과 분석 및 공유 완료",
      status: 4,
      statusName: "완료",    
      users:["나웅진", "김지민", "김수빈"],
      color: "successColor",
      progress: 100,
      startDate: "2025-06-01",
      endDate: "2025-07-02",
      content: `<p>주요 경쟁사 분석 및 시장 트렌드 정리</p>
        <ul>
          <li>사용자 니즈 변화 및 요구사항 반영 방향성 제시</li>
          <li>시장 점유율 확대 전략 수립</li>
        </ul>`,
    },
    {
      id: 11,
      type: "기획",
      title: "그룹웨어 시장 조사 및 경쟁사 분석 심층 리뷰",
      status: 2,
      statusName: "해야 할 일",    
      users:["나웅진", "김수빈"],
      color: "warningColor",
      progress: 20,
      startDate: "2025-07-10",    
      endDate: "2025-10-11",
      content: `<p>국내외 그룹웨어 시장 동향 분석 및 주요 경쟁사 현황 점검</p>
        <ul>
          <li>기능별 차별점 및 경쟁력 강화 방안 도출</li>
          <li>신규 기능 제안 및 개발 로드맵 반영 계획</li>
        </ul>`,
    },  
    {
      id: 12,
      type: "기획",
      title: "신규 서비스 출시 전 최종 시장 점검 및 전략 수정",
      status: 2,
      statusName: "해야 할 일",    
      users:["나웅진", "김수빈"],
      color: "warningColor",
      progress: 30,
      startDate: "2025-07-01",
      endDate: "2025-07-12",
      content: `<p>서비스 출시 전 마지막 사용자 피드백 수집 및 분석</p>
        <ul>
          <li>마케팅 전략 및 홍보 채널 점검</li> 
          <li>시장 반응에 따른 가격 정책 조정 검토</li>
        </ul>`,
    },    
  ])

  return {
    works
  }
})
