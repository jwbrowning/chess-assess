import React, {useState, useEffect} from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            grid: {
                display: false
            },
        },
        y: {
            grid: {
                display: false
            },
            min: 0,
            max: 1,
        }
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
};

export const data = {
    labels: ['0','1','2','3','4','5','6','7','8','9','10','11','12'],
    datasets: [
        {
            label: "Nepo",
            data: {
                '0': .5627,
            },
            borderColor: 'rgb(53, 142, 235)',
            backgroundColor: 'rgb(53, 142, 235, .5)',
        },
        {
            label: "Ding",
            data: {
                '0': .4373,
            },
            borderColor: 'rgb(255, 99, 70)',
            backgroundColor: 'rgb(255, 74, 70, .5)',
        },
    ],
}

export default function LineGraph(props) {



    return (
        <div className='line-graph'>
            <Line options={options} data={data} />
        </div>
    )
}