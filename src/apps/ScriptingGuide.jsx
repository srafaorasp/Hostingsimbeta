import React from 'react';

const CodeBlock = ({ children }) => <pre className="bg-gray-900 p-2 rounded-md text-green-400 font-mono text-xs my-2 whitespace-pre-wrap">{children.trim()}</pre>;
const InlineCode = ({ children }) => <code className="bg-gray-700 px-1 rounded text-yellow-400 font-mono">{children}</code>;
const SectionHeader = ({ children }) => <h2 className="text-xl font-semibold text-white mt-6 border-b border-gray-600 pb-1 mb-2">{children}</h2>;
const SubHeader = ({ children }) => <h3 className="text-lg font-semibold text-white mt-4">{children}</h3>;
const CommandSignature = ({ children }) => <p className="font-semibold mt-4"><InlineCode>{children}</InlineCode></p>;


const ScriptingGuide = () => {
    return (
        <div className="p-4 bg-gray-800 text-gray-300 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold text-white mb-4">Automation & Scripting Guide</h1>

            <SectionHeader>1. Core Concepts</SectionHeader>
            <p>The scripting system allows you to automate tasks through a powerful but simple command-based language. Scripts are saved as files and run by Agents, which control their permissions.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>File System:</strong> All scripts are saved as files (e.g., <InlineCode>monitor.js</InlineCode>) in a simple, flat file system. You can manage these files in the <InlineCode>ScriptIDE</InlineCode> app.</li>
                <li><strong>Agents:</strong> An Agent is a user account for your scripts. Every script is assigned to an Agent, which determines what permissions the script has (e.g., can it reboot a server?).</li>
                <li><strong>Execution:</strong> Scripts can be run on a loop at a set interval or triggered on-demand from the Shell or another script.</li>
            </ul>

            <SectionHeader>2. Command Syntax</SectionHeader>
            <p>Every command follows the same structure: <InlineCode>{'<endpoint> <command> [...args] [destination]'}</InlineCode></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
                <li><InlineCode>endpoint</InlineCode>: The ID or hostname of the device/system to target.</li>
                <li><InlineCode>command</InlineCode>: The action to perform (e.g., <InlineCode>get:status</InlineCode>).</li>
                <li><InlineCode>...args</InlineCode>: Optional arguments. Use quotes for arguments with spaces.</li>
                <li><InlineCode>destination</InlineCode>: Optional. Where to send output: <InlineCode>log</InlineCode> (default), <InlineCode>toast</InlineCode>, or <InlineCode>alert</InlineCode>.</li>
            </ul>
             <p className="mt-2 text-sm text-gray-400">Note: All command outputs are automatically sent to the main <InlineCode>SysLog</InlineCode> for auditing.</p>

            <SectionHeader>3. Conditional Logic with `if`</SectionHeader>
            <p>You can make your scripts intelligent using <InlineCode>if/else/endif</InlineCode> blocks. This allows your automations to react to the state of the game.</p>
            <CodeBlock>{`# Check if a server is offline and alert the player.
if server-01 get:status == "OFFLINE"
  player alert "Server Down!" "server-01 is offline."
else
  player notify "System OK" "server-01 is online."
endif`}</CodeBlock>
            <p>The command in the <InlineCode>if</InlineCode> line is executed first. Its result is then compared against the value. Supported operators are <InlineCode>==</InlineCode>, <InlineCode>!=</InlineCode>, <InlineCode>&gt;</InlineCode>, <InlineCode>&lt;</InlineCode>.</p>

            <SectionHeader>4. Command Reference</SectionHeader>

            <div className="border-l-2 border-gray-600 pl-4 mt-2 space-y-3">
                <SubHeader>System & Player Endpoints</SubHeader>
                <div>
                    <CommandSignature>system list {'<type>'}</CommandSignature>
                    <p className="text-sm">Lists all items of a type. Valid types: <InlineCode>devices</InlineCode>, <InlineCode>servers</InlineCode>, <InlineCode>employees</InlineCode>, <InlineCode>tasks</InlineCode>, <InlineCode>files</InlineCode>.</p>
                </div>
                <div>
                    <CommandSignature>player notify "{'Title'}" "{'Message'}"</CommandSignature>
                    <p className="text-sm">Displays a temporary, non-critical toast notification.</p>
                </div>
                 <div>
                    <CommandSignature>player alert "{'Title'}" "{'Message'}"</CommandSignature>
                    <p className="text-sm">Displays a critical, modal alert that must be acknowledged.</p>
                </div>

                <SubHeader>Device Endpoints (<InlineCode>{'<hostname>'}</InlineCode> or <InlineCode>{'<id>'}</InlineCode>)</SubHeader>
                <div>
                    <CommandSignature>get:metrics</CommandSignature>
                    <p className="text-sm">Returns a JSON object of the device's current operational data.</p>
                </div>
                <div>
                    <CommandSignature>get:status</CommandSignature>
                    <p className="text-sm">Returns the device's current status string (e.g., "ONLINE").</p>
                </div>
                <div>
                    <CommandSignature>set:power {'<on|off>'}</CommandSignature>
                    <p className="text-sm">Creates a task to change the power state of a device.</p>
                </div>
                
                <SubHeader>Employee Endpoints (<InlineCode>{'"<name>"'}</InlineCode> or <InlineCode>{'<id>'}</InlineCode>)</SubHeader>
                 <div>
                    <CommandSignature>assign:task {'<task_id>'} {'<target_id>'}</CommandSignature>
                    <p className="text-sm">Assigns a task to an employee to be performed on a specific target device.</p>
                </div>
            </div>

             <SectionHeader>5. Shell-Only Commands</SectionHeader>
             <p>These commands can be run directly in the Shell application.</p>
             <div className="border-l-2 border-gray-600 pl-4 mt-2 space-y-3">
                <div>
                    <CommandSignature>ls</CommandSignature>
                    <p className="text-sm">Lists all files in the file system.</p>
                </div>
                <div>
                    <CommandSignature>cat {'<filepath>'}</CommandSignature>
                    <p className="text-sm">Displays the content of a script file.</p>
                </div>
                 <div>
                    <CommandSignature>clear</CommandSignature>
                    <p className="text-sm">Clears the shell's output history.</p>
                </div>
            </div>

        </div>
    );
};

export default ScriptingGuide;

