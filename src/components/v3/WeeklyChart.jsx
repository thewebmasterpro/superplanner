import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { useMemo } from 'react';
import { format, subDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function WeeklyChart({ tasks = [] }) {
    const chartData = useMemo(() => {
        // Generate last 7 days labels
        const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

        // Calculate completed tasks per day
        const dataPoints = days.map(day => {
            return tasks.filter(t =>
                t.status === 'done' &&
                t.completed_at &&
                isSameDay(new Date(t.completed_at), day)
            ).length;
        });

        return {
            labels: days.map(day => format(day, 'EEE', { locale: fr })),
            datasets: [
                {
                    label: 'Tâches complétées',
                    data: dataPoints,
                    fill: true,
                    borderColor: 'var(--color-primary)', // Primary color from DaisyUI/Tailwind
                    backgroundColor: 'color-mix(in oklch, var(--color-primary) 20%, transparent)',
                    tension: 0.4,
                    pointBackgroundColor: 'var(--color-primary)',
                },
            ],
        };
    }, [tasks]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: 'color-mix(in oklch, var(--color-base-content) 60%, transparent)'
                }
            },
            y: {
                min: 0,
                ticks: {
                    stepSize: 1,
                    color: 'color-mix(in oklch, var(--color-base-content) 60%, transparent)'
                },
                grid: {
                    color: 'color-mix(in oklch, var(--color-base-content) 10%, transparent)',
                }
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div className="w-full h-[250px]">
            <Line data={chartData} options={options} />
        </div>
    );
}
