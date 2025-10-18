import React from 'react';
import useGameStore from '../store/gameStore.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Analytics = () => {
    // --- FIX: Use granular selectors for each piece of reactive state ---
    const cashHistory = useGameStore(s => s.state.finances.cashHistory);
    const powerHistory = useGameStore(s => s.state.history.powerHistory);
    const tempHistory = useGameStore(s => s.state.history.tempHistory);

    const formatXAxis = (tickItem) => new Date(tickItem).toLocaleTimeString();
    const formatCashTooltip = (value) => `$${value.toLocaleString()}`;
    const formatPowerTooltip = (value) => `${value.toLocaleString()} W`;
    const formatTempTooltip = (value) => `${value.toFixed(1)}°C`;


    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-700 text-white">
                    <CardHeader>
                        <CardTitle>Cash Flow (Last 200 Ticks)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={cashHistory} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis dataKey="time" tickFormatter={formatXAxis} stroke="#a0aec0" />
                                <YAxis stroke="#a0aec0" tickFormatter={val => `$${(val/1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}
                                    formatter={formatCashTooltip}
                                />
                                <Area type="monotone" dataKey="cash" stroke="#48bb78" fill="#48bb78" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                 <Card className="bg-gray-900 border-gray-700 text-white">
                    <CardHeader>
                        <CardTitle>Power Load (Last 200 Ticks)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={powerHistory} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis dataKey="time" tickFormatter={formatXAxis} stroke="#a0aec0" />
                                <YAxis stroke="#a0aec0" tickFormatter={val => `${(val/1000).toFixed(1)} kW`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}
                                    formatter={formatPowerTooltip}
                                />
                                <Area type="monotone" dataKey="load" stroke="#f6e05e" fill="#f6e05e" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                 <Card className="bg-gray-900 border-gray-700 text-white">
                    <CardHeader>
                        <CardTitle>Server Room Temp (Last 200 Ticks)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                             <AreaChart data={tempHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis dataKey="time" tickFormatter={formatXAxis} stroke="#a0aec0" />
                                <YAxis stroke="#a0aec0" domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={val => `${val.toFixed(0)}°C`}/>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}
                                    formatter={formatTempTooltip}
                                />
                                <Area type="monotone" dataKey="temp" stroke="#f56565" fill="#f56565" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;

