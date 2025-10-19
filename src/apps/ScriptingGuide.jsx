import React from 'react';

const CodeBlock = ({ children }) => <pre className="bg-gray-900 p-2 rounded-md text-green-400 font-mono text-xs my-2 whitespace-pre-wrap">{children.trim()}</pre>;
const InlineCode = ({ children }) => <code className="bg-gray-700 px-1 rounded text-yellow-400 font-mono">{children}</code>;

const ScriptingGuide = () => {
    return (
        <div className="p-4 bg-gray-800 text-gray-300 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold text-white mb-4">Automation & Scripting Guide</h1>

            <h2 className="text-xl font-semibold text-white mt-6 border-b border-gray-600 pb-1 mb-2">1. Core Concepts</h2>
            <p>The scripting system allows you to automate tasks through persistent, looping scripts. It's built on a few key ideas:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Agents:</strong> An Agent is a user account for your scripts. Every script runs as an Agent, which determines what permissions the script has.</li>
                <li><strong>Scripts:</strong> A Script is a named block of commands. By default, scripts run on a loop at an interval you define.</li>
                <li><strong>Commands:</strong> Each line in a script is a simple command that targets an endpoint (like a server or the system) and tells it to do something.</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-6 border-b border-gray-600 pb-1 mb-2">2. The ScriptIDE App</h2>
            <p>The <InlineCode>ScriptIDE</InlineCode> is your central hub for all automation. It allows you to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Create and delete Agents and manage their permissions.</li>
                <li>Create, name, and delete Scripts assigned to an Agent.</li>
                <li>Write multi-line scripts in the editor.</li>
                <li>Control each script's execution (Run/Pause) and set its loop interval in seconds.</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-6 border-b border-gray-600 pb-1 mb-2">3. Execution Control</h2>
            <h3 className="text-lg font-semibold text-white mt-4">Looping (Default)</h3>
            <p>By default, any script set to "Run" will execute its entire block of commands every time its interval elapses.</p>
            
            <h3 className="text-lg font-semibold text-white mt-4">Run Once</h3>
            <p>To make a script run only one time and then stop, add <InlineCode>RunOnce</InlineCode> as the very first line. This is useful for setup tasks.</p>
            <CodeBlock>{`RunOnce
player notify "Setup" "Initial configuration complete."`}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mt-4">Ending a Script Early</h3>
            <p>You can stop the current execution of a script block using the <InlineCode>end</InlineCode> command. This is useful for conditional logic.</p>
            <CodeBlock>{`# This script will log the status but never send the alert.
server-01 get:status
end
player alert "CRITICAL" "This will not run."`}</CodeBlock>

            <h2 className="text-xl font-semibold text-white mt-6 border-b border-gray-600 pb-1 mb-2">4. Command Syntax</h2>
            <p>Every command follows the same structure: <InlineCode>{`<endpoint> <command> <...args> <destination>`}</InlineCode></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
                <li><InlineCode>endpoint</InlineCode>: The ID or hostname of the device/system to target.</li>
                <li><InlineCode>command</InlineCode>: The action to perform (e.g., <InlineCode>get:status</InlineCode>).</li>
                <li><InlineCode>...args</InlineCode>: Optional arguments. Use quotes for arguments with spaces.</li>
                <li><InlineCode>destination</InlineCode>: Optional. Where to send output: <InlineCode>log</InlineCode> (default), <InlineCode>toast</InlineCode>, or <InlineCode>alert</InlineCode>.</li>
            </ul>
             <p className="mt-2 text-sm text-gray-400">Note: All command outputs are automatically sent to the main <InlineCode>SysLog</InlineCode> for auditing, regardless of their destination.</p>
            
            <h2 className="text-xl font-semibold text-white mt-6 border-b border-gray-600 pb-1 mb-2">5. Calling Other Scripts</h2>
            <p>The <InlineCode>call {'<target>'}</InlineCode> command lets you trigger other scripts or agents on demand. This is a one-time execution.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
                <li>If the target is a script name, it runs that script.</li>
                <li>If the target is an agent name, it runs ALL scripts owned by that agent (if the agent is marked "callable").</li>
            </ul>
            <CodeBlock>{`# This script, when run, will trigger a different script
call MyOtherScript`}</CodeBlock>
            <p className="text-sm text-gray-400">To prevent infinite loops, a script cannot call another script that is already in the current chain of calls.</p>
            
            <h2 className="text-xl font-semibold text-white mt-6 border-b border-gray-600 pb-1 mb-2">6. Command Reference</h2>

            {/* --- System Endpoint --- */}
            <h3 className="text-lg font-semibold text-white mt-4">Endpoint: <InlineCode>system</InlineCode></h3>
            <div className="border-l-2 border-gray-600 pl-4 mt-2 space-y-3">
                <div>
                    <p className="font-semibold">Command: <InlineCode>list {'<type>'}</InlineCode></p>
                    <p className="text-sm">Lists all available items of a specific type. Valid types are: <InlineCode>devices</InlineCode>, <InlineCode>servers</InlineCode>, <InlineCode>switches</InlineCode>, <InlineCode>routers</InlineCode>, <InlineCode>power</InlineCode>, <InlineCode>cooling</InlineCode>, <InlineCode>employees</InlineCode>, <InlineCode>tasks</InlineCode>.</p>
                    <CodeBlock>system list servers toast</CodeBlock>
                </div>
                <div>
                    <p className="font-semibold">Command: <InlineCode>help</InlineCode></p>
                    <p className="text-sm">Provides general help information.</p>
                    <CodeBlock>system help</CodeBlock>
                </div>
            </div>

            {/* --- Device Endpoints --- */}
            <h3 className="text-lg font-semibold text-white mt-4">Endpoint: Device (<InlineCode>{'<hostname>'}</InlineCode> or <InlineCode>{'<id>'}</InlineCode>)</h3>
            <div className="border-l-2 border-gray-600 pl-4 mt-2 space-y-3">
                <div>
                    <p className="font-semibold">Command: <InlineCode>get:metrics</InlineCode></p>
                    <p className="text-sm">Returns a JSON object of the device's current operational data (status, power draw, etc.).</p>
                    <CodeBlock>web-server-01 get:metrics alert</CodeBlock>
                </div>
                <div>
                    <p className="font-semibold">Command: <InlineCode>get:status</InlineCode></p>
                    <p className="text-sm">Returns a simple string of the device's current status (e.g., "ONLINE", "OFFLINE_POWER").</p>
                    <CodeBlock>switch-01 get:status</CodeBlock>
                </div>
                <div>
                    <p className="font-semibold">Command: <InlineCode>set:power {'<on|off>'}</InlineCode></p>
                    <p className="text-sm">Creates a task to change the power state of a device.</p>
                    <CodeBlock>web-server-01 set:power off</CodeBlock>
                </div>
            </div>
            
            {/* --- Employee Endpoints --- */}
            <h3 className="text-lg font-semibold text-white mt-4">Endpoint: Employee (<InlineCode>{'"<name>"'}</InlineCode> or <InlineCode>{'<id>'}</InlineCode>)</h3>
             <div className="border-l-2 border-gray-600 pl-4 mt-2 space-y-3">
                <div>
                    <p className="font-semibold">Command: <InlineCode>assign:task {'<task_id>'} {'<target_id>'}</InlineCode></p>
                    <p className="text-sm">Assigns a specific task to an idle employee. The target ID is the device the task should be performed on.</p>
                    <CodeBlock>"Alex Chen" assign:task repair_hardware web-server-01</CodeBlock>
                </div>
            </div>

            {/* --- Player UI Endpoints --- */}
            <h3 className="text-lg font-semibold text-white mt-4">Endpoint: <InlineCode>player</InlineCode></h3>
             <div className="border-l-2 border-gray-600 pl-4 mt-2 space-y-3">
                <div>
                    <p className="font-semibold">Command: <InlineCode>notify "{'Title'}" "{'Message'}"</InlineCode></p>
                    <p className="text-sm">Displays a temporary, non-critical toast notification.</p>
                    <CodeBlock>player notify "Automation" "Script finished successfully."</CodeBlock>
                </div>
                 <div>
                    <p className="font-semibold">Command: <InlineCode>alert "{'Title'}" "{'Message'}"</InlineCode></p>
                    <p className="text-sm">Displays a critical, modal alert that the player must acknowledge.</p>
                    <CodeBlock>player alert "OVERHEAT WARNING" "Server-03 has exceeded thermal limits."</CodeBlock>
                </div>
            </div>

        </div>
    );
};

export default ScriptingGuide;

