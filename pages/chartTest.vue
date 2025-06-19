<!-- components/v-chart.vue -->
<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
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

const chartData = {
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
}

const chartOptions = {
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
}
</script>