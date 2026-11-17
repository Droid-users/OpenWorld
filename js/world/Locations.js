// Data-driven country definitions for post-apocalyptic exploration
export const LOCATIONS = {
    india: {
        id: 'india',
        name: 'India',
        flag: '🇮🇳',
        area: 'BENGALURU OUTSKIRTS',
        subtitle: 'PLAYABLE STORY VERTICAL SLICE',
        seed: 31749,
        description: 'Past overgrown technology campuses and flooded road underpasses, a lone railway signal is still blinking in the monsoon rain. Nature is swallowing the silicon corridor.',
        terrain: 'Urban / Tropical / Foothills',
        danger: '★★★★☆',
        resources: '★★★☆☆',
        climate: 'Warm · Monsoon / Tropical Rain',
        baseTemp: 30,
        groundColor: 0x5a6d4e,
        foliageColor: 0x2c5235,
        fogColor: 0xa8b89d,
        skyDayColor: 0x889d8e,
        skySunsetColor: 0xb5825b,
        skyNightColor: 0x08110c,
        wallColors: [0x92967f, 0xaba785, 0x818c83],
        roofColor: 0x5a5e55,
        weatherTypes: ['Monsoon Rain', 'Heavy Rain', 'Cloudy', 'Clear', 'Dense Fog'],
        npc: {
            id: 'asha',
            name: 'Asha',
            title: 'Camp Engineer · The Banyan Collective',
            avatar: '🧕',
            community: 'The Banyan Collective',
            dialogue: {
                intro: "Peace on the road, traveler. You're riding light. If you're heading south toward the old Halt 07 railway station, keep your eyes on the waterline. The emergency receiver on the last freight train was left running 37 years ago.",
                questPrompt: "If you can reach Halt 07 and bring me the receiver unit, I can decode the dispatch logs and show you the road toward the coast.",
                questActive: "The station is roughly 450 meters south-east along the broken rail line. Watch out for wild boars in the high grass.",
                questComplete: "You found it! Listen to that static... 'All units relocate to sector 9'. Incredible work. Take this reinforced cargo rack and fresh water rations.",
                trade: "I can reinforce your bicycle frame or tune your climbing gears if you brought scrap metal from the tech ruins."
            }
        },
        quest: {
            id: 'india_quest_1',
            title: 'The Last Transmission',
            summary: 'Investigate Railway Halt 07 and recover the emergency train radio receiver for Asha.',
            targetPoi: 'halt_07',
            targetItem: 'radio_unit',
            rewardItem: 'kit',
            rewardScrap: 6,
            stages: [
                'Speak with Asha at the Banyan Collective camp.',
                'Ride down the railway tracks to Halt 07 station.',
                'Search the locomotive cab for the Station Receiver.',
                'Return the receiver to Asha at the camp.'
            ]
        },
        landmarks: [
            { id: 'banyan_camp', name: '🏕 The Banyan Collective (Camp)', x: 0, z: 0, type: 'camp' },
            { id: 'tech_park', name: '🏢 MindTree Cyber Hub (Ruins)', x: -140, z: -120, type: 'ruins' },
            { id: 'temple_tank', name: '🏛 Someshwara Temple & Well', x: 120, z: -100, type: 'water' },
            { id: 'halt_07', name: '🚂 Halt 07 Railway Station', x: 160, z: 170, type: 'station' },
            { id: 'radio_relay', name: '📡 Doordarshan Relay Mast', x: -180, z: 190, type: 'tower' }
        ],
        documents: [
            {
                id: 'doc_in_1',
                title: 'Disaster Protocol - Phase 4 Log',
                text: 'From: District Collectorate, Bengaluru. Date: Monsoon, Year 0. "All passenger transit suspended. Power grid frequency fluctuating worldwide. The satellite constellations are going dark one by one..."'
            },
            {
                id: 'doc_in_2',
                title: 'Stained Notebook by the Well',
                text: '"Water table remains potable thanks to the stone filtration channels. The bicycles are our only silent transport past the pack dogs."'
            }
        ],
        wildlifeType: 'boar'
    },

    usa: {
        id: 'usa',
        name: 'United States',
        flag: '🇺🇸',
        area: 'THE CASCADE CORRIDOR',
        subtitle: 'PACIFIC HIGHWAYS & MOUNTAINS',
        seed: 82415,
        description: 'A divided highway disappears between endless pine forests and abandoned roadside motels. Beyond the rusted grain silos, the Pacific Northwest mountains are quiet.',
        terrain: 'Highway / Pine Forest / Farmlands',
        danger: '★★★☆☆',
        resources: '★★★★☆',
        climate: 'Cool · Coastal Rain & Mountain Mist',
        baseTemp: 16,
        groundColor: 0x616a57,
        foliageColor: 0x223d29,
        fogColor: 0x9fa8a5,
        skyDayColor: 0x7e9499,
        skySunsetColor: 0xbf7854,
        skyNightColor: 0x050e12,
        wallColors: [0x8f8c82, 0x827365, 0x9b9a8f],
        roofColor: 0x484542,
        weatherTypes: ['Clear', 'Dense Fog', 'Rain', 'Cloudy'],
        npc: {
            id: 'eli',
            name: 'Eli',
            title: 'Highway Ranger · Milepost Union',
            avatar: '🧔‍♂️',
            community: 'Milepost Union',
            dialogue: {
                intro: "Howdy cyclist. Roads are clear up to the bridge, but Milepost 37 relay station has been broadcasting an automated SOS loop since last winter.",
                questPrompt: "I need someone fast on two wheels to check the depot bunker at Milepost 37 and retrieve the relay battery.",
                questActive: "Follow Route 101 north-west. You can't miss the red antenna tower above the tree line.",
                questComplete: "You brought the deep-cycle battery! This will keep our camp water filter running for months. Here's a set of off-road knobby tires.",
                trade: "Got plenty of spare bike chains and toolsets salvaged from the diner garage."
            }
        },
        quest: {
            id: 'usa_quest_1',
            title: 'Milepost 37 Relay',
            summary: 'Cycle up Route 101 to the Milepost 37 relay depot and retrieve the solar backup battery.',
            targetPoi: 'milepost_depot',
            targetItem: 'relay_battery',
            rewardItem: 'tool',
            rewardScrap: 8,
            stages: [
                'Meet Ranger Eli at the Milepost Union camp.',
                'Ride along the overgrown Highway 101 past the motel.',
                'Infiltrate the Milepost 37 relay depot.',
                'Return the battery to Eli.'
            ]
        },
        landmarks: [
            { id: 'milepost_camp', name: '🏕 Milepost Union (Camp)', x: 0, z: 0, type: 'camp' },
            { id: 'highway_motel', name: '🏨 Pine Ridge Motel & Diner', x: -160, z: -80, type: 'ruins' },
            { id: 'grain_silo', name: '🌾 Cascade Grain Silos', x: 130, z: -140, type: 'ruins' },
            { id: 'milepost_depot', name: '📡 Milepost 37 Relay Depot', x: -150, z: 180, type: 'tower' },
            { id: 'ranger_station', name: '🌲 Park Ranger Outpost', x: 170, z: 150, type: 'ruins' }
        ],
        documents: [
            {
                id: 'doc_us_1',
                title: 'Highway Patrol Dispatch Log',
                text: '"Final broadcast logged 18:40. Interstate grid gridlock confirmed from Seattle to Portland. Abandon vehicles and proceed on foot or non-motorized transport."'
            }
        ],
        wildlifeType: 'deer'
    },

    portugal: {
        id: 'portugal',
        name: 'Portugal',
        flag: '🇵🇹',
        area: 'THE ATLANTIC ROAD',
        subtitle: 'COASTAL CLIFFS & TRAM TRACKS',
        seed: 12903,
        description: 'Follow silent vintage tram tracks through a hillside stone town. The Atlantic waves break against the harbor ruins, where vines climb ancient terracotta terraces.',
        terrain: 'Coastal Hills / Cobblestone Town / Vineyards',
        danger: '★★☆☆☆',
        resources: '★★★☆☆',
        climate: 'Mild · Ocean Mist & Atlantic Breeze',
        baseTemp: 21,
        groundColor: 0x7a8360,
        foliageColor: 0x3d5b36,
        fogColor: 0xaec2bd,
        skyDayColor: 0x82a5b0,
        skySunsetColor: 0xcc8952,
        skyNightColor: 0x061014,
        wallColors: [0xbbb492, 0xc1b07d, 0x8fa89e, 0xb29079],
        roofColor: 0x935d3d,
        weatherTypes: ['Dense Fog', 'Clear', 'Cloudy', 'Rain'],
        npc: {
            id: 'ines',
            name: 'Inês',
            title: 'Harbor Keeper · Estação do Mar',
            avatar: '👩‍🦰',
            community: 'The Harbor Keepers',
            dialogue: {
                intro: "Bem-vindo. The ocean wind keeps the air sweet here, even after the fall. We maintain the old tram line for moving supplies uphill without fuel.",
                questPrompt: "The coastal lighthouse beacon went dark last week. There is a sealed nautical logbook in the signal house that holds the coastal survivor manifests.",
                questActive: "Climb the cobblestone switchbacks past the vineyard to the cliffside beacon.",
                questComplete: "Obrigada! The logbook shows survivor enclaves along the southern coast. Take this lightweight alloy frame upgrade.",
                trade: "I have clean olive oil for chain lubrication and coastal fish rations."
            }
        },
        quest: {
            id: 'pt_quest_1',
            title: 'The Ghost Fleet Log',
            summary: 'Ride up the tramway switchbacks to the cliff lighthouse and recover the harbor logbook.',
            targetPoi: 'lighthouse',
            targetItem: 'harbor_log',
            rewardItem: 'medkit',
            rewardScrap: 7,
            stages: [
                'Speak with Inês at the Harbor Camp.',
                'Follow the vintage Tram 28 tracks up the coastal terrace.',
                'Inspect the cliff lighthouse signal desk.',
                'Bring the nautical logbook back to Inês.'
            ]
        },
        landmarks: [
            { id: 'harbor_camp', name: '🏕 Harbor Keepers Camp', x: 0, z: 0, type: 'camp' },
            { id: 'tram_depot', name: '🚋 Tramway Car 28 Depot', x: 90, z: -110, type: 'ruins' },
            { id: 'vineyard', name: '🍇 Quinta das Vinhas Terrace', x: 160, z: 90, type: 'water' },
            { id: 'lighthouse', name: '🗼 Farol do Atlântico (Lighthouse)', x: -190, z: 160, type: 'tower' },
            { id: 'stone_plaza', name: '🏛 Praça Velha Ruins', x: -110, z: -140, type: 'ruins' }
        ],
        documents: [
            {
                id: 'doc_pt_1',
                title: 'Captain Ferrão’s Harbor Journal',
                text: '"For seventeen years after the cities fell, a single cargo sailboat arrived every third Thursday. Then it stopped. The sea remains our only open road."'
            }
        ],
        wildlifeType: 'bird'
    },

    spain: {
        id: 'spain',
        name: 'Spain',
        flag: '🇪🇸',
        area: 'THE SIERRA PASSAGE',
        subtitle: 'SUN-BLEACHED PLAZAS & DRY PLAINS',
        seed: 64182,
        description: 'Sun-bleached arches give way to dry plains and olive groves. A mountain viaduct casts a massive shadow across the old railway where all clocks stopped at 14:17.',
        terrain: 'Dry Plains / Sunlit Plaza / Mountain Roads',
        danger: '★★★★☆',
        resources: '★★☆☆☆',
        climate: 'Hot · Arid / Dust Storm / Heat Wave',
        baseTemp: 34,
        groundColor: 0x93885d,
        foliageColor: 0x5e683f,
        fogColor: 0xc2b38e,
        skyDayColor: 0x99947d,
        skySunsetColor: 0xd47743,
        skyNightColor: 0x120e0a,
        wallColors: [0xbead7f, 0xaf9d75, 0xbdb291],
        roofColor: 0x945f44,
        weatherTypes: ['Clear', 'Heat Wave', 'Dust Storm', 'Cloudy'],
        npc: {
            id: 'lucia',
            name: 'Lucía',
            title: 'Plaza Watcher · The Olive Road',
            avatar: '👩‍🌾',
            community: 'The Olive Road',
            dialogue: {
                intro: "Hola, viajero. Don't push your cycling speed during midday heat unless you have plenty of water in your bottles. The sun will drain you before the hill does.",
                questPrompt: "Every electric clock in the main station froze at 14:17 during the catastrophe. In the viaduct substation, the master clock generator is still sealed.",
                questActive: "Ride across the dry canyon road to the old viaduct substation.",
                questComplete: "Magnífico! The substation black box recorded the exact EMP pulse wavefront. Take this dynamo generator and spare water bottles.",
                trade: "I can install hydraulic disc brakes that won't overheat on steep mountain descents."
            }
        },
        quest: {
            id: 'es_quest_1',
            title: 'The Frozen Clock Substation',
            summary: 'Cycle across the Sierra canyon to the viaduct substation and retrieve the master clock flight recorder.',
            targetPoi: 'viaduct_substation',
            targetItem: 'clock_recorder',
            rewardItem: 'water',
            rewardScrap: 8,
            stages: [
                'Talk to Lucía in the Plaza settlement.',
                'Ride down the canyon road across the dry river bed.',
                'Reach the mountain viaduct electrical bunker.',
                'Deliver the black box recorder to Lucía.'
            ]
        },
        landmarks: [
            { id: 'olive_camp', name: '🏕 The Olive Plaza (Camp)', x: 0, z: 0, type: 'camp' },
            { id: 'viaduct_substation', name: '⚡ Viaduct Electrical Substation', x: -160, z: 150, type: 'tower' },
            { id: 'clock_plaza', name: '🕰 Plaza de las Catorce Horas', x: 110, z: -100, type: 'ruins' },
            { id: 'olive_mill', name: '🫒 Molino de Aceite (Old Mill)', x: -130, z: -130, type: 'ruins' },
            { id: 'canyon_well', name: '💧 Sierra Deep Aquifer Well', x: 150, z: 120, type: 'water' }
        ],
        documents: [
            {
                id: 'doc_es_1',
                title: 'Stationmaster Manuel’s Diary',
                text: '"14:17. The signals turned purple. All telecommunication relays died simultaneously across the continent. The quiet that followed was absolute."'
            }
        ],
        wildlifeType: 'wolf'
    }
};

export const ALL_ITEMS = {
    food: { id: 'food', name: 'Canned Rations', weight: 0.5, icon: '🥫', type: 'food', value: 35, desc: 'Preserved beans and meat. Restores 35 Hunger.' },
    fruit: { id: 'fruit', name: 'Dried Fruit Pack', weight: 0.2, icon: '🍎', type: 'food', value: 18, desc: 'Quick energy snack. Restores 18 Hunger & 10 Stamina.' },
    water: { id: 'water', name: 'Purified Water Bottle', weight: 1.0, icon: '💧', type: 'water', value: 45, desc: 'Clean water. Restores 45 Thirst.' },
    bandage: { id: 'bandage', name: 'Sterile Bandage', weight: 0.1, icon: '🩹', type: 'medical', value: 30, desc: 'Stops bleeding. Restores 30 Health.' },
    medkit: { id: 'medkit', name: 'Trauma First Aid Kit', weight: 0.8, icon: '🧰', type: 'medical', value: 70, desc: 'Complete trauma supplies. Restores 70 Health.' },
    kit: { id: 'kit', name: 'Bicycle Field Repair Kit', weight: 1.2, icon: '🔧', type: 'tool', value: 40, desc: 'Patches, hex keys, chain tool. Restores 40% Bike Durability.' },
    tool: { id: 'tool', name: 'Survival Multi-Tool', weight: 0.4, icon: '🔪', type: 'tool', desc: 'Essential for field crafting and salvage.' },
    scrap: { id: 'scrap', name: 'Salvaged Scrap Metal', weight: 0.3, icon: '🔩', type: 'crafting', desc: 'Used for bicycle frame, rack, and brake upgrades.' },
    battery: { id: 'battery', name: 'Lithium Battery Cell', weight: 0.2, icon: '🔋', type: 'crafting', desc: 'Powers lights, radio units, and electrical upgrades.' },
    rope: { id: 'rope', name: 'Braided Climbing Rope', weight: 0.5, icon: '🪢', type: 'crafting', desc: 'Useful for securing cargo racks and shelters.' },
    radio_unit: { id: 'radio_unit', name: 'Station Receiver Unit', weight: 1.5, icon: '📻', type: 'quest', desc: 'Recovered from Railway Halt 07 locomotive.' },
    relay_battery: { id: 'relay_battery', name: 'Deep-Cycle Relay Battery', weight: 2.5, icon: '⚡', type: 'quest', desc: 'Solar backup battery from Milepost 37.' },
    harbor_log: { id: 'harbor_log', name: 'Sealed Nautical Logbook', weight: 0.6, icon: '📜', type: 'quest', desc: 'Records seventeen years of survivor boat landings.' },
    clock_recorder: { id: 'clock_recorder', name: 'Master Substation Black Box', weight: 1.8, icon: '⏱', type: 'quest', desc: 'Logged the 14:17 collapse pulse data.' }
};
