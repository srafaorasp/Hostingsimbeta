import React from 'react';

const CodeBlock = ({ children }) => (
    <pre className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
        <code>{children}</code>
    </pre>
);

const ScriptingGuide = () => {
    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-4 border-b border-gray-600 pb-2 text-blue-400">DataCenter OS Scripting Guide</h1>

                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-2">1. Introduction to Automation</h2>
                    <p className="text-gray-300">
                        Welcome to the ScriptIDE! This powerful tool allows you to write simple scripts to automate the management of your data center. By creating "Script Agents" and giving them commands, you can monitor hardware, respond to events, and receive custom notifications, freeing up your time to focus on growing your business.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-2">2. The Basics: Agents & Permissions</h2>
                    <p className="mb-2 text-gray-300">
                        A **Script Agent** is like a user account for your scripts. Before a script can do anything, it needs an agent with the correct permissions. This is a security measure to prevent scripts from accidentally causing damage.
                    </p>
                    <h3 className="text-xl font-bold mb-1">Creating an Agent:</h3>
                    <ol className="list-decimal list-inside text-gray-300 space-y-1">
                        <li>Open the `ScriptIDE` app from the desktop.</li>
                        <li>In the "Script Agents" panel, type a name for your new agent (e.g., "monitor_bot").</li>
                        <li>Click the "+" button to create it.</li>
                        <li>Select your new agent from the list to manage its permissions.</li>
                    </ol>
                </section>

                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-2">3. The `call()` Command</h2>
                    <p className="mb-2 text-gray-300">
                        The heart of the scripting system is the `call()` function. It's how your scripts interact with the game world. It always follows the same structure:
                    </p>
                    <CodeBlock>call(target, command, ...args)</CodeBlock>
                    <ul className="list-disc list-inside text-gray-300 mt-2">
                        <li><strong className="text-white">target:</strong> The unique ID or hostname of the device you want to interact with (e.g., a server's hostname).</li>
                        <li><strong className="text-white">command:</strong> What you want to do, usually in a "action:property" format (e.g., 'get:status').</li>
                        <li><strong className="text-white">...args:</strong> Optional extra information the command might need.</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-2">4. API Reference</h2>
                    <p className="text-gray-400 text-sm mb-3">Below is a list of all available targets and commands you can use in your scripts.</p>
                    
                    <div className="bg-gray-900 p-3 rounded-md">
                        <h3 className="text-xl font-bold text-green-400 mb-2">Servers (e.g., 'server_blade_g1')</h3>
                        <p className="text-xs font-mono mb-2">Target ID: Use the server's unique ID or hostname.</p>
                        <ul className="space-y-2 text-sm">
                            <li><CodeBlock>call('server-hostname', 'get:status')</CodeBlock> <span className="text-gray-400">// Requires: `read:server`. Returns the server's current status (e.g., "ONLINE", "OFFLINE_POWER").</span></li>
                            <li><CodeBlock>call('server-hostname', 'get:powerDraw')</CodeBlock> <span className="text-gray-400">// Requires: `read:server`. Returns the server's current power consumption in watts.</span></li>
                        </ul>
                    </div>

                     <div className="bg-gray-900 p-3 rounded-md mt-4">
                        <h3 className="text-xl font-bold text-purple-400 mb-2">Player UI ('player.ui')</h3>
                        <p className="text-xs font-mono mb-2">Target ID: Always 'player.ui'.</p>
                        <ul className="space-y-2 text-sm">
                            <li><CodeBlock>call('player.ui', 'showToast', 'Title', 'Your message here')</CodeBlock> <span className="text-gray-400">// Requires: `write:player:notify`. Shows a temporary pop-up notification.</span></li>
                            <li><CodeBlock>call('player.ui', 'showAlert', 'CRITICAL', 'Power Failure!')</CodeBlock> <span className="text-gray-400">// Requires: `write:player:alert`. Shows a full-screen alert that pauses the game.</span></li>
                        </ul>
                    </div>
                     <div className="bg-gray-900 p-3 rounded-md mt-4">
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">System Log ('system.log')</h3>
                        <p className="text-xs font-mono mb-2">Target ID: Always 'system.log'.</p>
                        <ul className="space-y-2 text-sm">
                            <li><CodeBlock>call('system.log', 'log', 'Server temperatures are nominal.')</CodeBlock> <span className="text-gray-400">// Requires: `write:system:log`. Writes a custom message to the SysLog app.</span></li>
                        </ul>
                    </div>
                </section>

                 <section>
                    <h2 className="text-2xl font-semibold mb-2">5. Practical Examples</h2>
                    <h3 className="text-lg font-bold mb-1">Example 1: Log a custom message</h3>
                    <p className="text-gray-300 mb-2">This script will write a simple message to the system log. Requires an agent with the `write:system:log` permission.</p>
                    <CodeBlock>
{`// A simple script to log a message
log("Starting custom script...");
call('system.log', 'log', 'This is a test message from my first script!');
log("Script finished.");`}
                    </CodeBlock>

                    <h3 className="text-lg font-bold mt-4 mb-1">Example 2: Send a notification</h3>
                    <p className="text-gray-300 mb-2">This script sends a pop-up toast notification to your screen. Requires an agent with the `write:player:notify` permission.</p>
                    <CodeBlock>
{`// Notify the player
call('player.ui', 'showToast', 'Script Reminder', 'Dont forget to check the power levels!');`}
                    </CodeBlock>
                </section>
            </div>
        </div>
    );
};

export default ScriptingGuide;

