import { create } from "zustand";
import {
  APPS_CONFIG,
  ACHIEVEMENT_DEFINITIONS,
  CLIENT_CONTRACTS,
  HARDWARE_CATALOG,
  ISP_PLANS,
  TEAM_MEMBERS,
  DAEMON_DEFINITIONS,
  TASK_DEFINITIONS,
  SITE_TEMPLATES,
  initialScripts,
  initialTutorials,
} from "../data";
import { TUTORIAL_TRIGGERS } from "../game/constants";
import { scriptingEngine } from '../game/scriptingEngine';

// Utility to generate unique IDs
const uuid = () => Math.random().toString(36).substring(2, 9);

// Define the initial state for reuse when starting a new game
const getInitialState = () => ({
  cash: 1000,
  time: new Date(),
  gameSpeed: 1,
  power: { usage: 0, capacity: 100, history: [] },
  environment: { temperature: 20, history: [] },
  servers: [{ id: 'srv-starter', type: 'basic-server', ip: '192.168.1.10', daemons: [], tasks: [], online: true, cpu: 1, ram: 2, storage: 16  }],
  sites: [],
  team: [],
  daemons: [],
  tasks: [],
  contracts: CLIENT_CONTRACTS,
  ispPlan: null,
  windows: {},
  openWindows: [],
  focusedWindow: null,
  toast: null,
  tutorial: {
    active: true,
    currentTutorialId: "001_welcome",
    currentStepIndex: 0,
  },
  tutorials: initialTutorials,
  achievements: Object.values(ACHIEVEMENT_DEFINITIONS).map((def) => ({
    ...def,
    unlocked: false,
  })),
  scripts: initialScripts,
  syslog: [{ timestamp: new Date(), source: "System", message: "System initialized." }],
  cashHistory: [],
});


const useGameStore = create((set, get) => ({
  // Core State
  loggedIn: false,
  ...getInitialState(),
  
  // #############################################################################
  // ACTIONS
  // #############################################################################

  // Core Actions
  // ============================================================================
   newGame: () => {
    set({ loggedIn: true, ...getInitialState() });
    get().log('Player', 'Started a new game.');
    get().checkTutorialTrigger({ type: TUTORIAL_TRIGGERS.LOGIN });
  },

  login: () => {
    // Login should eventually load a saved state. For now, it just continues.
    get().log('Player', 'Logged into the system.');
    set({ loggedIn: true });
    get().checkTutorialTrigger({ type: TUTORIAL_TRIGGERS.LOGIN });
  },
  logout: () => set({ loggedIn: false }),

  addCash: (amount, source = "Unknown") => {
    set((state) => ({ cash: state.cash + amount }));
    get().log('Finance', `Received $${amount.toFixed(2)} from ${source}.`);
  },
  removeCash: (amount, source = "Unknown") => {
     if (get().cash < amount) return false;
    set((state) => ({ cash: state.cash - amount }));
    get().log('Finance', `Spent $${amount.toFixed(2)} on ${source}.`);
    return true;
  },

  log: (source, message) => {
    set((state) => ({
      syslog: [{ timestamp: new Date(), source, message }, ...state.syslog].slice(0, 100),
    }));
  },

  setGameSpeed: (speed) => set({ gameSpeed: speed }),

  // Hardware Actions
  // ============================================================================
  addServer: (type) => {
    const { removeCash } = get();
    const serverInfo = HARDWARE_CATALOG.servers[type];
    if (!serverInfo) {
      get().log('System', `ERROR: Unknown server type "${type}".`);
      return;
    }

    if (removeCash(serverInfo.cost, `Purchase of ${serverInfo.name}`)) {
      const newServer = {
        id: `srv-${uuid()}`,
        type: type,
        ip: `192.168.1.${11 + get().servers.length}`,
        daemons: [],
        tasks: [],
        online: true,
        ...serverInfo.specs,
      };
      set((state) => ({ servers: [...state.servers, newServer] }));
      get().log('Hardware', `New server ${newServer.id} (${serverInfo.name}) installed.`);
      get().unlockAchievement('first_server');
    }
  },

  // ISP Actions
  // ============================================================================
  setIspPlan: (planId) => {
    const plan = ISP_PLANS[planId];
    if (plan && get().removeCash(plan.cost, `ISP Plan: ${plan.name}`)) {
      set({ ispPlan: planId });
      get().log('Network', `Subscribed to ${plan.name} ISP plan.`);
       get().unlockAchievement('internet_access');
    }
  },

  // Team Actions
  // ============================================================================
  hireTeamMember: (memberId) => {
    const member = TEAM_MEMBERS[memberId];
    if (member && !get().team.find(m => m.id === memberId)) {
      if (get().removeCash(member.hiringCost, `Hiring bonus for ${member.name}`)) {
        set(state => ({ team: [...state.team, { ...member, assignedTask: null }] }));
        get().log('Team', `Hired ${member.name}.`);
        get().unlockAchievement('first_hire');
      }
    }
  },
  
  fireTeamMember: (memberId) => {
    set(state => ({ team: state.team.filter(m => m.id !== memberId) }));
    const member = TEAM_MEMBERS[memberId];
    get().log('Team', `Fired ${member.name}.`);
  },

  // Site Actions
  // ============================================================================
  createSite: (templateId, serverId, domain) => {
    const template = SITE_TEMPLATES[templateId];
    const server = get().servers.find(s => s.id === serverId);

    if (!template || !server) {
      get().log('System', 'ERROR: Invalid template or server for site creation.');
      return;
    }

    if (get().removeCash(template.cost, `Setup of ${domain}`)) {
      const newSite = {
        id: `site-${uuid()}`,
        domain,
        templateId,
        serverId,
        uptime: 100,
        visitors: 0,
        revenue: 0,
      };
      set(state => ({ sites: [...state.sites, newSite] }));
      get().log('Sites', `New site "${domain}" launched on server ${serverId}.`);
       get().unlockAchievement('first_site');
    }
  },
  
  deleteSite: (siteId) => {
     set(state => ({ sites: state.sites.filter(s => s.id !== siteId) }));
     get().log('Sites', `Site ${siteId} has been deleted.`);
  },

  // Daemon Actions
  // ============================================================================
  installDaemon: (daemonId, serverId, scriptId) => {
     const daemonDef = DAEMON_DEFINITIONS[daemonId];
     const server = get().servers.find(s => s.id === serverId);

     if (!daemonDef || !server) {
       get().log('System', 'ERROR: Invalid daemon or server for installation.');
       return;
     }
     
     if (get().removeCash(daemonDef.cost, `Installation of ${daemonDef.name}`)) {
       const newDaemon = {
         id: `dmn-${uuid()}`,
         daemonId,
         serverId,
         scriptId,
         status: 'running',
         logs: [`Daemon ${daemonDef.name} initialized.`]
       };
       set(state => ({ daemons: [...state.daemons, newDaemon] }));
       get().log('Daemons', `${daemonDef.name} installed on ${server.id}.`);
       get().unlockAchievement('first_daemon');
     }
  },

  uninstallDaemon: (instanceId) => {
    const daemonInstance = get().daemons.find(d => d.id === instanceId);
    if(daemonInstance) {
      const daemonDef = DAEMON_DEFINITIONS[daemonInstance.daemonId];
      get().log('Daemons', `${daemonDef.name} on ${daemonInstance.serverId} uninstalled.`);
      set(state => ({ daemons: state.daemons.filter(d => d.id !== instanceId) }));
    }
  },

  // Task Runner Actions
  // ============================================================================
  scheduleTask: (taskId, serverId) => {
    const taskDef = TASK_DEFINITIONS[taskId];
    const server = get().servers.find(s => s.id === serverId);

    if (!taskDef || !server) {
      get().log('System', 'ERROR: Invalid task or server for scheduling.');
      return;
    }

    if(get().removeCash(taskDef.cost, `Scheduling ${taskDef.name}`)) {
        const newTask = {
            id: `task-${uuid()}`,
            taskId,
            serverId,
            status: 'queued',
            progress: 0,
            createdAt: get().time.getTime(),
        };
        set(state => ({ tasks: [...state.tasks, newTask] }));
        get().log('Tasks', `Scheduled task "${taskDef.name}" on ${server.id}.`);
        get().unlockAchievement('first_task');
    }
  },

  // Scripting Actions
  // ============================================================================
  saveScript: (id, code) => {
    set(state => ({
      scripts: state.scripts.map(s => s.id === id ? { ...s, code } : s),
    }));
    get().log('ScriptIDE', `Saved script "${id}".`);
     get().checkTutorialTrigger({ type: TUTORIAL_TRIGGERS.SAVE_SCRIPT, target: id });
  },

  createScript: (name) => {
    const newScript = {
      id: `script-${uuid()}`,
      name,
      code: `// New script: ${name}\n\nlog("Hello from ${name}!");\n`
    };
    set(state => ({ scripts: [...state.scripts, newScript] }));
    get().log('ScriptIDE', `Created new script "${name}".`);
  },

  // Window Management
  // ============================================================================
  openWindow: (appId) => {
    get().log('Player', `Opened app "${APPS_CONFIG[appId]?.name}".`);
    set((state) => {
      const newWindows = { ...state.windows };
      if (!newWindows[appId]) {
        newWindows[appId] = {
          minimized: false,
          position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
          zIndex: Math.max(0, ...Object.values(state.windows).map(w => w.zIndex || 0)) + 1,
        };
      } else {
        newWindows[appId].minimized = false;
        newWindows[appId].zIndex = Math.max(0, ...Object.values(state.windows).map(w => w.zIndex || 0)) + 1;
      }

      const openWindows = state.openWindows.includes(appId)
        ? state.openWindows
        : [...state.openWindows, appId];
        
      get().checkTutorialTrigger({ type: TUTORIAL_TRIGGERS.OPEN_APP, target: appId });
      return { windows: newWindows, openWindows, focusedWindow: appId };
    });
  },

  closeWindow: (appId) => {
    get().log('Player', `Closed app "${APPS_CONFIG[appId]?.name}".`);
    set((state) => {
      const newOpenWindows = state.openWindows.filter((id) => id !== appId);
      // We don't delete the state, just mark it as not open
      return { openWindows: newOpenWindows, focusedWindow: null };
    });
  },

  focusWindow: (appId) => {
    set((state) => {
      const newWindows = { ...state.windows };
      const maxZIndex = Math.max(0, ...Object.values(newWindows).map(w => w.zIndex || 0));
      if (newWindows[appId] && newWindows[appId].zIndex !== maxZIndex) {
        newWindows[appId].zIndex = maxZIndex + 1;
      }
      return { windows: newWindows, focusedWindow: appId };
    });
  },
  
  updateWindowPosition: (appId, position) => {
     set(state => {
       const newWindows = { ...state.windows };
       if (newWindows[appId]) {
         newWindows[appId] = { ...newWindows[appId], position };
       }
       return { windows: newWindows };
     });
  },

  toggleMinimizeWindow: (appId) => {
    set(state => {
      const newWindows = { ...state.windows };
      if (newWindows[appId]) {
        newWindows[appId].minimized = !newWindows[appId].minimized;
      }
      return { windows: newWindows };
    });
  },

  showToast: (message, type = 'info') => {
    set({ toast: { message, type, id: Date.now() } });
  },

  // Tutorial Actions
  // ============================================================================
  advanceTutorial: () => {
     set((state) => {
      const currentTutorial = state.tutorials[state.tutorial.currentTutorialId];
      if (!currentTutorial) return {};
      
      const nextStepIndex = state.tutorial.currentStepIndex + 1;
      
      if (nextStepIndex >= currentTutorial.steps.length) {
        // Tutorial finished
        const newTutorials = { ...state.tutorials, [state.tutorial.currentTutorialId]: { ...currentTutorial, completed: true } };
        get().log('System', `Tutorial "${currentTutorial.title}" completed.`);
        return { tutorial: { ...state.tutorial, currentTutorialId: null, currentStepIndex: 0, active: false }, tutorials: newTutorials };
      }
      
      return { tutorial: { ...state.tutorial, currentStepIndex: nextStepIndex } };
    });
  },
  
   checkTutorialTrigger: (trigger) => {
    const { tutorial, tutorials } = get();
    if (!tutorial.active || !tutorial.currentTutorialId) return;

    const currentTutorial = tutorials[tutorial.currentTutorialId];
    if (!currentTutorial || currentTutorial.completed) return;

    const currentStep = currentTutorial.steps[tutorial.currentStepIndex];
    if (!currentStep) return;

    if (currentStep.trigger.type === trigger.type && (!currentStep.trigger.target || currentStep.trigger.target === trigger.target)) {
      get().advanceTutorial();
    }
  },

  // Game Logic Actions
  // ============================================================================
  unlockAchievement: (id) => {
    const { achievements, showToast } = get();
    // Use the object key for lookup
    const achievementDef = ACHIEVEMENT_DEFINITIONS[id];
    // Find the achievement in the state array
    const achievementState = achievements.find(a => a.id === id);

    if (achievementDef && achievementState && !achievementState.unlocked) {
      set(state => ({
        achievements: state.achievements.map(a => a.id === id ? { ...a, unlocked: true } : a)
      }));
      showToast(`Achievement Unlocked: ${achievementDef.name}`, 'success');
      get().log('System', `Achievement Unlocked: ${achievementDef.name}`);
    }
  },

  // Game Tick Update
  // ============================================================================
  update: (deltaTime) => {
    const {
      gameSpeed,
      power,
      environment,
      servers,
      sites,
      team,
      daemons,
      tasks,
      scripts,
      addCash,
      unlockAchievement
    } = get();
    const effectiveDeltaTime = deltaTime * gameSpeed;
    
    // 1. Update Time
    const newTime = new Date(get().time.getTime() + effectiveDeltaTime * 1000);

    // 2. Update Resources (Power & Environment)
    let totalPowerUsage = 0;
    servers.forEach(server => {
      if (server.online) {
        const serverDef = HARDWARE_CATALOG.servers[server.type];
        totalPowerUsage += serverDef.power;
      }
    });
    // Add more power calculations for other components...

    const newPower = {
      ...power,
      usage: totalPowerUsage,
      history: [...power.history, { time: newTime, value: totalPowerUsage }].slice(-100)
    };
    
    // Simulate temperature fluctuations
    const newTemperature = environment.temperature + (Math.random() - 0.5) * 0.1;
    const newEnvironment = {
      ...environment,
      temperature: newTemperature,
      history: [...environment.history, {time: newTime, value: newTemperature}].slice(-100)
    };

    // 3. Update Team Members (Salaries)
    let totalSalaries = 0;
    team.forEach(member => {
      totalSalaries += member.salary;
    });
    const salaryCost = (totalSalaries / (3600 * 24 * 30)) * effectiveDeltaTime; // Monthly salary per second
    if (salaryCost > 0) {
      get().removeCash(salaryCost, 'Team Salaries');
    }

    // 4. Update Sites (Revenue)
    let totalRevenue = 0;
    const updatedSites = sites.map(site => {
        // Simplified revenue logic
        const siteRevenue = (Math.random() * 0.1) * effectiveDeltaTime;
        totalRevenue += siteRevenue;
        return { ...site, revenue: site.revenue + siteRevenue, visitors: site.visitors + Math.floor(Math.random() * 5) };
    });
     if (totalRevenue > 0) {
      addCash(totalRevenue, 'Site Revenue');
    }

    // 5. Update Daemons (Execute Scripts)
    daemons.forEach(daemon => {
      if (daemon.status === 'running' && daemon.scriptId) {
        const script = scripts.find(s => s.id === daemon.scriptId);
        if (script) {
          try {
             // Execute script in a sandboxed environment
             scriptingEngine(script.code, get());
          } catch(e) {
            get().log('ScriptEngine', `ERROR in daemon ${daemon.id}: ${e.message}`);
            // Optionally change daemon status to 'error'
          }
        }
      }
    });

    // 6. Update Tasks (Progress)
    const updatedTasks = tasks.map(task => {
        if(task.status === 'running') {
            const taskDef = TASK_DEFINITIONS[task.taskId];
            const progressIncrease = (100 / taskDef.duration) * effectiveDeltaTime;
            const newProgress = task.progress + progressIncrease;
            if (newProgress >= 100) {
                // Task complete
                get().log('Tasks', `Task "${taskDef.name}" completed.`);
                // TODO: Apply task completion effect
                return { ...task, status: 'completed', progress: 100 };
            }
            return { ...task, progress: newProgress };
        } else if (task.status === 'queued') {
            // Simple logic: just start the first queued task
            // A real implementation would check server resources
            return { ...task, status: 'running' };
        }
        return task;
    }).filter(task => task.status !== 'completed'); // Remove completed tasks


    // 7. Check for Achievements
    const { cash } = get();
    if(cash >= 10000) unlockAchievement('cash_10k');
    if(cash >= 100000) unlockAchievement('cash_100k');
    if(servers.length >= 5) unlockAchievement('server_farm');
    if(sites.length >= 5) unlockAchievement('web_empire');


    // 8. Update State
    set({
      time: newTime,
      power: newPower,
      environment: newEnvironment,
      sites: updatedSites,
      tasks: updatedTasks,
      cashHistory: [...get().cashHistory, { time: newTime, value: get().cash }].slice(-100),
    });
  },
}));

export default useGameStore;


