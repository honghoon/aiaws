<!-- components/v-chart.vue -->
<template>
  <Bar v-if="type=='bar'" :data="chartData" :options="chartOptions" class="max-h-[300px]" />
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue'
import { Bar } from 'vue-chartjs' 
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

// Chart.js 필수 요소 등록
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  data: Object
})

const type = ref("")

const chartData = ref({
  labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
  datasets: [
    {
      label: '2025년 매출 (백만원)',
      backgroundColor: '#42A5F5',
      data: [120, 132, 101, 134, 90, 230]
    },
    {
      label: '2024년 매출 (백만원)',
      backgroundColor: '#9CCC65',
      data: [100, 115, 98, 120, 85, 200]
    }
  ]
})

const chartOptions = ref({
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: '월별 매출 비교'
    }
  }
})

const processChart = (param)=>{
  if (param.chartType == 'bar'){
    type.value = "bar"
    console.log(param)
    chartOptions.value = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: param.title
        }
      }
    }
    
    let labels = []
    let datasets = [{data:[]}]
    let index = 1
    for(let item of param.data){
      labels.push(getNested(item,param.xField))
      datasets[0].backgroundColor = getColor(index)
      datasets[0].label = param.title
      datasets[0].data.push(item[param.yField])
      index += 1
    }

    chartData.value = {
      labels: labels,
      datasets: datasets
    }
  }

  console.log("완료")
}

function getColor(index) {
  const colors = [
    '#42A5F5', // 파랑
    '#66BB6A', // 초록
    '#FFA726', // 주황
    '#AB47BC', // 보라
    '#FF7043', // 연한 빨강
    '#26C6DA', // 청록
    '#EC407A', // 진한 핑크
    '#7E57C2', // 보라
    '#26A69A', // 민트
    '#D4E157', // 연한 연두
    '#FFCA28', // 노랑
    '#8D6E63', // 브라운
    '#78909C', // 그레이 블루
    '#EF5350', // 빨강
    '#BDBDBD', // 중간 회색
    '#5C6BC0', // 인디고
    '#9CCC65', // 라임
    '#FFA000', // 다크 오렌지
    '#90CAF9', // 밝은 파랑
    '#A1887F'  // 연한 브라운
  ]
  return colors[index % colors.length]
}

function getNested(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => acc?.[key], obj);
}

onMounted(() => {
  if (props.data) {
    processChart(props.data)
  }
})

</script>