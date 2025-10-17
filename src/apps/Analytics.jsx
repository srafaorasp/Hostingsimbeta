import React from 'react';
import useGameStore from '../store/gameStore';
import { shallow } from 'zustand/shallow';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Analytics = () => {
    const cashHistory = useGameStore(s => s.state.finances.cashHistory, shallow);

    const formatXAxis = (tickItem) => {
        return new Date(tickItem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const formatYAxis = (tickItem) => {
        return `$${(tickItem / 1000).toFixed(0)}k`;
    }

    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">Analytics</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <LineChart data={cashHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis 
                                    dataKey="time" 
                                    tickFormatter={formatXAxis}
                                    stroke="#a0aec0"
                                />
                                <YAxis 
                                    tickFormatter={formatYAxis}
                                    stroke="#a0aec0"
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                    formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="cash" stroke="#3b82f6" strokeWidth={2} dot={false} name="Cash"/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Analytics;
