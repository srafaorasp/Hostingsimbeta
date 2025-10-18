import React from 'react';
import useGameStore from '../store/gameStore';

const BSOD = () => {
    const { crashError, rebootSystem } = useGameStore(state => ({
        crashError: state.state.crashError,
        rebootSystem: state.rebootSystem,
    }));

    return (
        <div className="fixed inset-0 bg-[#000080] text-white font-mono flex flex-col items-center justify-center z-[9999]">
            <div className="w-full max-w-4xl">
                <p className="text-6xl text-center mb-8">:(</p>
                <p className="text-lg">
                    Your DataCenter OS ran into a problem and needs to restart. We're just
                    collecting some error info, and then we'll restart for you.
                </p>
                
                <div className="mt-8 text-sm">
                    <p>For more information about this issue, you can refer to the error dump file that was automatically downloaded.</p>
                    <p className="mt-2">
                        If you call a support person, give them this info:
                    </p>
                    <p>Stop Code: KERNEL_DATA_INPAGE_ERROR</p>
                    <p>What failed: {crashError?.message || 'unknown_component.sys'}</p>
                </div>

                <div className="mt-12 text-center">
                    <button 
                        onClick={rebootSystem}
                        className="bg-white text-[#000080] font-bold py-2 px-6 border-2 border-white hover:bg-transparent hover:text-white transition-colors"
                    >
                        Reboot System
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BSOD;
