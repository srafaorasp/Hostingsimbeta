import React from 'react';

const CodeBlock = ({ children }) => (
    <pre className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm my-2 overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const Section = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-400 border-b-2 border-blue-400/50 pb-1 mb-3">{title}</h2>
        <div className="space-y-2 text-gray-300">
            {children}
        </div>
    </div>
);

const ScriptingGuide = () => {
    return (
        <div className="p-6 bg-gray-800 text-gray-200 h-full overflow-y-auto">
            <h1 className="text-4xl font-bold mb-6">DataCenter OS: Scripting Guide</h1>

            <Section title="1. Introduction to Automation">
                <p>Welcome to the Scripting Engine! This system allows you to automate repetitive tasks in your data center, create custom monitoring alerts, and interact with your hardware programmatically.</p>
                <p>By writing simple scripts in the <strong>ScriptIDE</strong> app, you can save time and manage your growing infrastructure with greater efficiency.</p>
            </Section>

            <Section title="2. The Basics: Agents & Permissions">
                <p>Before you can run a script, you need a <strong>Script Agent</strong>. Think of an agent as a user account for your scripts. Each agent has a name and a specific set of permissions that define what it's allowed to do.</p>
                <p>To create an agent:</p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Open the <strong>ScriptIDE</strong> app.</li>
                    <li>In the "Script Agents" panel, type a name for your new agent.</li>
                    <li>Click the "+" button to create it.</li>
                    <li>Select your new agent from the list to manage its permissions.</li>
                </ol>
                <p>Permissions are granular. For an agent to read a server's status, it needs the `read:server` permission. To shut that server down, it would need `write:server`.</p>
            </Section>

            <Section title="3. The 'call()' Command">
                <p>The core of the scripting engine is a single function: `call()`.</p>
                <CodeBlock>call(target, command, ...args)</CodeBlock>
                <ul className="list-disc list-inside ml-4">
                    <li><strong>target (string):</strong> The unique ID or hostname of the device you want to interact with (e.g., a server's ID, 'player.ui').</li>
                    <li><strong>command (string):</strong> The action you want to perform, formatted as 'action:key' (e.g., 'get:status', 'set:power').</li>
                    <li><strong>...args (optional):</strong> Any additional arguments the command requires (e.g., the message for a notification).</li>
                </ul>
            </Section>

            <Section title="4. API Reference">
                <h3 className="text-xl font-semibold text-gray-100 mt-4 mb-2">Player UI (`player.ui`)</h3>
                <p>Used to show information to the player.</p>
                <CodeBlock>{`// Show a temporary toast notification
call('player.ui', 'showToast', 'Backup Complete', 'Nightly backup script finished successfully.');

// Show a critical alert that requires acknowledgment
call('player.ui', 'showAlert', 'OVERHEATING', 'Server SRV-01 temperature is critical!');`}</CodeBlock>

                <h3 className="text-xl font-semibold text-gray-100 mt-4 mb-2">System Log (`system.log`)</h3>
                <p>Used to write messages to the system log for debugging.</p>
                <CodeBlock>{`// Log an informational message
call('system.log', 'log', 'Starting maintenance script...');`}</CodeBlock>

                <h3 className="text-xl font-semibold text-gray-100 mt-4 mb-2">Servers (e.g., 'server_blade_g1_167...)</h3>
                <p>Interact with individual servers. The target must be the server's unique ID.</p>
                <CodeBlock>{`// Get the current status of a server
const status = call('server_id_here', 'get:status');
log('Server status: ' + status);

// Get the current power draw of a server
const power = call('server_id_here', 'get:powerDraw');
log('Power draw: ' + power + 'W');`}</CodeBlock>
            </Section>

             <Section title="5. Practical Examples">
                <p>Here are a few simple scripts you can copy and paste into the ScriptIDE to get started.</p>
                <h3 className="text-lg font-semibold text-gray-100 mt-2 mb-1">Example 1: Hello World</h3>
                <p>This script sends a simple notification to the player. Requires `write:player:notify` permission.</p>
                <CodeBlock>{`// This is a comment. The code starts on the next line.
call('player.ui', 'showToast', 'Hello from ScriptIDE!', 'Your first script ran successfully.');`}</CodeBlock>

                <h3 className="text-lg font-semibold text-gray-100 mt-2 mb-1">Example 2: System Logger</h3>
                 <p>This script writes a custom message to the system log. Requires `write:system:log` permission.</p>
                <CodeBlock>{`const timestamp = new Date().toLocaleTimeString();
call('system.log', 'log', 'Script executed at ' + timestamp);`}</CodeBlock>
            </Section>

        </div>
    );
};

export default ScriptingGuide;

