import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG } from '/src/data.js';

// Helper function to update scene objects
const updateSceneObjects = (scene, layout, emps, staged, geometries, materials, statusLightsRef) => {
    const hardwareGroup = scene.getObjectByName('hardwareGroup');
    const employeeGroup = scene.getObjectByName('employeeGroup');
    
    if (!hardwareGroup || !employeeGroup) return;
    
    statusLightsRef.current = []; // Reset status lights array

    // Clear existing objects
    while (hardwareGroup.children.length > 0) hardwareGroup.remove(hardwareGroup.children[0]);
    while (employeeGroup.children.length > 0) employeeGroup.remove(employeeGroup.children[0]);

    let pdu_idx = 0;
    let crac_idx = 0;

    // Re-draw hardware from layout
    Object.keys(layout).forEach((slotId) => {
        const itemData = layout[slotId];
        if (itemData.type === 'RACK') {
            const rackIdx = parseInt(slotId.substring(1)) - 1;
            const xPos = (rackIdx % 8) * 1.8 - 7;
            const zPos = Math.floor(rackIdx / 8) * 2 - 4;
            const rackMesh = new THREE.Mesh(geometries.RACK, materials.RACK);
            rackMesh.position.set(xPos, 1.1, zPos);
            rackMesh.castShadow = true;
            hardwareGroup.add(rackMesh);

            let yOffset = 2.1;
            itemData.contents.forEach(item => {
                const itemGeo = geometries[item.type];
                const matName = `SERVER_${item.status}`;
                const mat = materials[matName] || materials.SERVER_INSTALLED;
                if (itemGeo && mat) {
                    const itemMesh = new THREE.Mesh(itemGeo, mat);
                    itemMesh.position.set(xPos, yOffset, zPos);
                    hardwareGroup.add(itemMesh);

                    const lightGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
                    const lightMatName = `STATUS_LIGHT_${item.status}`;
                    const lightMat = materials[lightMatName] ? materials[lightMatName].clone() : materials.STATUS_LIGHT_OFF;
                    const lightMesh = new THREE.Mesh(lightGeo, lightMat);
                    lightMesh.position.set(xPos - 0.4, yOffset, zPos + 0.36);
                    hardwareGroup.add(lightMesh);
                    if (item.status === 'NETWORKED' || item.status === 'ONLINE' || item.status.startsWith('OFFLINE')) {
                        statusLightsRef.current.push(lightMesh);
                    }
                    yOffset -= (itemGeo.parameters.height + 0.05);
                }
            });
        } else if (itemData.type === 'PDU') {
            const pduMesh = new THREE.Mesh(geometries.PDU, materials.PDU);
            pduMesh.position.set(10, 1, pdu_idx++ * 1.0 - 5);
            hardwareGroup.add(pduMesh);
        } else if (itemData.type === 'CRAC') {
            const cracMesh = new THREE.Mesh(geometries.CRAC, materials.CRAC);
            cracMesh.position.set(-10, 1.25, crac_idx++ * 2.0 - 5);
            hardwareGroup.add(cracMesh);
        }
    });

    // Re-draw staged hardware
    staged.forEach((item, index) => {
        const itemDetails = HARDWARE_CATALOG.find(h => h.id === item.type);
        if (!itemDetails) return;
        const itemGeo = geometries[itemDetails.type];
        if (itemGeo) {
            const itemMesh = new THREE.Mesh(itemGeo, materials.SERVER_INSTALLED);
            itemMesh.position.set(13 + (index * 1.2), 1, 0);
            hardwareGroup.add(itemMesh);
        }
    });

    // Re-draw employees
    emps.forEach(emp => {
        const empMat = emp.skill === 'Hardware Technician' ? materials.EMPLOYEE_HW : materials.EMPLOYEE_NET;
        const empMesh = new THREE.Mesh(geometries.EMPLOYEE, empMat);
        if (emp.location === 'Break Room') empMesh.position.set(-14 + Math.random(), 0.8, Math.random());
        else if (emp.location === 'Tech Room') empMesh.position.set(14 + Math.random(), 0.8, Math.random());
        else empMesh.position.set(0, 0.8, 0);
        empMesh.castShadow = true;
        employeeGroup.add(empMesh);
    });
};

const SiteView = () => {
    const mountRef = useRef(null);
    const statusLightsRef = useRef([]);
    const [activeCamera, setActiveCamera] = useState(0);
    const cameraSetups = [
        { name: 'Main Overview', pos: new THREE.Vector3(0, 15, 18), lookAt: new THREE.Vector3(0, 0, 0) },
        { name: 'Aisle 1', pos: new THREE.Vector3(-6, 4, 8), lookAt: new THREE.Vector3(-6, 1, -5) },
        { name: 'Tech Room', pos: new THREE.Vector3(14, 6, 14), lookAt: new THREE.Vector3(14, 1, 0) },
        { name: 'Break Room', pos: new THREE.Vector3(-14, 6, 14), lookAt: new THREE.Vector3(-14, 1, 0) },
    ];

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        // --- ONE-TIME SETUP ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a202c);
        const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.shadowMap.enabled = true;
        currentMount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 5);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        scene.add(dirLight);

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x4a5568 }));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        const hardwareGroup = new THREE.Group();
        hardwareGroup.name = 'hardwareGroup';
        scene.add(hardwareGroup);

        const employeeGroup = new THREE.Group();
        employeeGroup.name = 'employeeGroup';
        scene.add(employeeGroup);

        const geometries = { 'RACK': new THREE.BoxGeometry(1, 2.2, 0.8), 'SERVER': new THREE.BoxGeometry(0.9, 0.1, 0.7), 'NETWORKING': new THREE.BoxGeometry(0.9, 0.1, 0.7), 'PDU': new THREE.BoxGeometry(0.2, 2.0, 0.2), 'CRAC': new THREE.BoxGeometry(1.5, 2.5, 1.5), 'EMPLOYEE': new THREE.CapsuleGeometry(0.2, 1.3), 'TECH_BENCH': new THREE.BoxGeometry(4, 0.9, 1.5), 'BREAK_TABLE': new THREE.BoxGeometry(1.5, 0.7, 1.5) };
        const materials = { 
            'RACK': new THREE.MeshStandardMaterial({ color: 0x4a5568 }), 
            'SERVER_INSTALLED': new THREE.MeshStandardMaterial({ color: 0x718096 }), 
            'SERVER_ONLINE': new THREE.MeshStandardMaterial({ color: 0x48bb78 }), 
            'SERVER_NETWORKED': new THREE.MeshStandardMaterial({ color: 0x3498db }), 
            'SERVER_OFFLINE_FAILED': new THREE.MeshStandardMaterial({ color: 0xe53e3e }), 
            'SERVER_OFFLINE_POWER': new THREE.MeshStandardMaterial({ color: 0xf6ad55 }), 
            'SERVER_OFFLINE_HEAT': new THREE.MeshStandardMaterial({ color: 0xf6ad55 }), 
            'NETWORKING': new THREE.MeshStandardMaterial({ color: 0x4299e1 }), 
            'PDU': new THREE.MeshStandardMaterial({ color: 0x2d3748 }), 
            'CRAC': new THREE.MeshStandardMaterial({ color: 0x90cdf4 }), 
            'EMPLOYEE_HW': new THREE.MeshStandardMaterial({ color: 0xe67e22 }), 
            'EMPLOYEE_NET': new THREE.MeshStandardMaterial({ color: 0x3498db }),
            'STATUS_LIGHT_OFF': new THREE.MeshStandardMaterial({ color: 0x2d3748 }), 
            'STATUS_LIGHT_ONLINE': new THREE.MeshStandardMaterial({ color: 0x38a169, emissive: new THREE.Color(0x38a169) }), 
            'STATUS_LIGHT_NETWORKED': new THREE.MeshStandardMaterial({ color: 0x3498db, emissive: new THREE.Color(0x3498db) }), 
            'STATUS_LIGHT_OFFLINE_FAILED': new THREE.MeshStandardMaterial({ color: 0xc53030, emissive: new THREE.Color(0xc53030) }), 
            'STATUS_LIGHT_OFFLINE_POWER': new THREE.MeshStandardMaterial({ color: 0xdd6b20, emissive: new THREE.Color(0xdd6b20) }), 
            'STATUS_LIGHT_OFFLINE_HEAT': new THREE.MeshStandardMaterial({ color: 0xdd6b20, emissive: new THREE.Color(0xdd6b20) }) 
        };
        const furnitureMaterial = new THREE.MeshStandardMaterial({ color: 0x718096 });
        const techBench = new THREE.Mesh(geometries.TECH_BENCH, furnitureMaterial);
        techBench.position.set(14, 0.45, 0);
        techBench.castShadow = true;
        scene.add(techBench);
        const breakTable = new THREE.Mesh(geometries.BREAK_TABLE, furnitureMaterial);
        breakTable.position.set(-14, 0.35, 0);
        breakTable.castShadow = true;
        scene.add(breakTable);

        // --- ANIMATION LOOP ---
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const setup = cameraSetups[activeCamera];
            camera.position.lerp(setup.pos, 0.05);
            camera.lookAt(setup.lookAt);
            statusLightsRef.current.forEach(light => {
                if (light.material.emissive) {
                    light.material.emissiveIntensity = (Math.sin(clock.getElapsedTime() * 5) + 1) / 2 * 0.5 + 0.5;
                }
            });
            renderer.render(scene, camera);
        };
        animate();

        // --- SUBSCRIPTION to Game State ---
        const unsubscribe = useGameStore.subscribe(
            (state) => {
                // This function runs every time the game state changes
                updateSceneObjects(scene, state.dataCenterLayout, state.employees, state.stagedHardware, geometries, materials, statusLightsRef);
            }
        );

        // Initial scene update
        const initialState = useGameStore.getState();
        updateSceneObjects(scene, initialState.dataCenterLayout, initialState.employees, initialState.stagedHardware, geometries, materials, statusLightsRef);
        
        // --- EVENT LISTENERS & CLEANUP ---
        const handleResize = () => {
            if (currentMount) {
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            unsubscribe(); // Unsubscribe from the store to prevent memory leaks
            window.removeEventListener('resize', handleResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [activeCamera]); // Re-run effect only if activeCamera changes

    return (
        <div className="w-full h-full bg-black relative">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 flex gap-2">
                {cameraSetups.map((setup, index) => (
                    <button key={setup.name} onClick={() => setActiveCamera(index)} className={`px-3 py-1 text-xs rounded ${activeCamera === index ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        {setup.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SiteView;

