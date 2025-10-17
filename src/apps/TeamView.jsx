import React from 'react';
import useGameStore from '/src/store/gameStore.js';
import { CANDIDATES } from '/src/data.js';

const TeamView = () => {
    const hireEmployee = useGameStore(state => state.hireEmployee);
    const spendCash = useGameStore(state => state.spendCash);
    // --- THE FIX: Select from the nested 'state' object ---
    const employees = useGameStore(state => state.state.employees);
    const hiredIds = new Set(employees.map(e => e.id));

    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">TeamView</h2>
            <div className="bg-gray-900 p-3 rounded-md mb-6">
                <h3 className="font-bold text-lg mb-2">Available Candidates</h3>
                <table className="w-full text-sm text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Skill</th>
                            <th className="p-2">Hiring Cost (Monthly)</th>
                            <th className="p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CANDIDATES.map(c => (
                            <tr key={c.id} className="border-b border-gray-700 last:border-b-0">
                                <td className="p-2">{c.name}</td>
                                <td className="p-2">{c.skill}</td>
                                <td className="p-2">${(c.salary / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="p-2">
                                    <button onClick={() => { spendCash(c.salary / 12); hireEmployee(c); }} disabled={hiredIds.has(c.id)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        {hiredIds.has(c.id) ? 'Hired' : 'Hire'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-gray-900 p-3 rounded-md">
                <h3 className="font-bold text-lg mb-2">My Team</h3>
                {employees.length === 0 ? <p className="text-gray-500">No employees.</p> : (
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Skill</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(e => (
                                <tr key={e.id} className="border-b border-gray-700 last:border-b-0">
                                    <td className="p-2">{e.name}</td>
                                    <td className="p-2">{e.skill}</td>
                                    <td className="p-2">{e.status}</td>
                                    <td className="p-2">{e.location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TeamView;
