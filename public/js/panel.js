document.addEventListener('DOMContentLoaded', () => {
    // Nav Elements
    const navItems = document.querySelectorAll('.nav-item');
    const views = {
        'nav-overview': document.getElementById('view-overview'),
        'nav-servers': document.getElementById('view-servers'),
        'nav-discord': document.getElementById('view-discord'),
        'nav-admin': document.getElementById('view-admin')
    };
    const titleObj = document.getElementById('page-title');

    // State
    let userData = null;

    // View Routing
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.id;
            
            // Toggle active classes
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Hide all views, show targeted
            Object.values(views).forEach(v => v.classList.add('hidden'));
            if(views[targetId]) views[targetId].classList.remove('hidden');

            // Set Title
            titleObj.innerText = item.innerText;
            
            // If servers view is loaded, render
            if(targetId === 'nav-servers') renderServers();
        });
    });

    // Pair Modal Logic
    const pairBtn = document.getElementById('btn-pair-server');
    const enableFcmBtn = document.getElementById('btn-enable-fcm');
    const pairModal = document.getElementById('pairing-modal');
    const cancelPairBtn = document.getElementById('btn-cancel-pair');

    pairBtn.addEventListener('click', async () => {
        // Enlazar In-Game ya no debe generar /api/pair/init, 
        // porque el botón de arriba ("Vincular Steam") es el que debe hacer el init
        pairModal.classList.remove('hidden');
    });

    cancelPairBtn.addEventListener('click', () => {
        pairModal.classList.add('hidden');
    });

    enableFcmBtn.addEventListener('click', async () => {
        let authToken = document.getElementById('inp-auth-token').value.trim();
        
        // Smart Token Extraction: Si el usuario pega el JSON o el script de Facepunch
        if (authToken.includes('Token') || authToken.includes('{')) {
            try {
                // Intentar extraer de JSON dentro de un string (postMessage pattern)
                const tokenMatch = authToken.match(/"Token":\s*"([^"]+)"/);
                if (tokenMatch && tokenMatch[1]) {
                    authToken = tokenMatch[1];
                } else {
                    // Intentar extraer si pegó solo el JSON limpio
                    const parsed = JSON.parse(authToken.replace(/\\"/g, '"'));
                    if (parsed.Token) authToken = parsed.Token;
                }
            } catch (e) {
                console.warn("No se pudo parsear como JSON, intentando regex crudo...");
                const rawMatch = authToken.match(/ey[A-Za-z0-9._\-\/\\+=]+/);
                if (rawMatch) authToken = rawMatch[0];
            }
        }

        if (!authToken || authToken.length < 50) {
            alert("No parece un token válido. Por favor, pega el bloque de código que te dio Facepunch o el token que empieza por 'eyJ...'");
            return;
        }

        enableFcmBtn.innerHTML = "Generando Tokens FCM...";
        enableFcmBtn.disabled = true;
        
        try {
            const req = await fetch('/api/pair/init', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken })
            });
            if (req.status === 200) {
                enableFcmBtn.innerHTML = "FCM Activo. Listo.";
                enableFcmBtn.classList.replace('btn-outline', 'btn-primary');
                
                document.getElementById('kpi-fcm').innerText = "Activo";
                document.getElementById('kpi-fcm').classList.remove('warning');
                document.getElementById('kpi-fcm').classList.add('ok');

                pairBtn.disabled = false;
                alert("Cuenta vinculada a notificaciones de capa baja. Ahora puedes avanzar al Paso 2: 'Escanear In-Game'.");
            } else {
                throw new Error("Failed server interaction");
            }
        } catch (e) {
            enableFcmBtn.innerHTML = "Error. Reintentar";
            enableFcmBtn.disabled = false;
            console.error(e);
            alert("No se pudo contactar con los servidores de Rust+ (Google Cloud).");
        }
    });

    // Load Initial Data
    async function loadData() {
        try {
            const res = await fetch('/api/me');
            if(res.status === 401) {
                window.location.href = '/auth/steam';
                return;
            }
            userData = await res.json();
            
            // Populate Menu User
            document.getElementById('user-name').innerText = userData.user.displayName;
            if(userData.user.avatar) {
                const img = document.getElementById('user-avatar');
                img.src = userData.user.avatar;
                img.onload = () => img.classList.add('loaded');
            }

            // Overview Dashboard
            document.getElementById('kpi-servers').innerText = userData.servers ? userData.servers.length : 0;
            
            if(userData.user.isLinkedFCM) {
                document.getElementById('kpi-fcm').innerText = "Activo";
                document.getElementById('kpi-fcm').className = "kpi-value ok";
                enableFcmBtn.innerText = "FCM Configurado";
                enableFcmBtn.disabled = true;
                pairBtn.disabled = false;
            }

            if(userData.user.isAdmin) {
                document.getElementById('nav-admin').classList.remove('hidden');
                loadAdminData();
            }

            if(userData.guilds && userData.guilds.length > 0) {
                const g = userData.guilds[0];
                document.getElementById('inp-guild').value = g.guild_id || '';
                document.getElementById('inp-chat').value = g.chat_channel_id || '';
                document.getElementById('inp-alert').value = g.alert_channel_id || '';
            }

        } catch(e) {
            console.error("Failed to load user data:", e);
        }
    }

    // Discord Save
    document.getElementById('btn-save-discord').addEventListener('click', async () => {
        const guild_id = document.getElementById('inp-guild').value;
        const chat_channel_id = document.getElementById('inp-chat').value;
        const alert_channel_id = document.getElementById('inp-alert').value;
        const btn = document.getElementById('btn-save-discord');
        btn.innerText = "Guardando...";
        await fetch('/api/discord/guild/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ guild_id, chat_channel_id, alert_channel_id })
        });
        btn.innerText = "Guardado!";
        setTimeout(()=>btn.innerText="Guardar Configuración", 2000);
    });

    // Admin Data
    async function loadAdminData() {
        try {
            const res = await fetch('/api/admin/stats');
            if(res.status === 200) {
                const data = await res.json();
                document.getElementById('admin-ram').innerText = data.memory;
                document.getElementById('admin-ws').innerText = data.rustPlusSockets;
                document.getElementById('admin-users').innerText = data.registeredUsers;
                document.getElementById('admin-servers').innerText = data.registeredServers;
            }
        } catch(e) {
            console.error("Failed to load admin stats");
        }
    }
    
    document.getElementById('btn-refresh-admin').addEventListener('click', loadAdminData);

    // Render Server List Tab
    function renderServers() {
        const container = document.getElementById('servers-container');
        container.innerHTML = '';

        if(!userData || !userData.servers || userData.servers.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">No tienes servidores vinculados aún. Ve a Resumen para vincular uno.</div>';
            return;
        }

        userData.servers.forEach(server => {
            const div = document.createElement('div');
            div.className = 'server-item';
            div.innerHTML = `
                <div class="server-meta">
                    <h4>RUST+ Server</h4>
                    <p>IP: ${server.rust_ip}:${server.rust_port}</p>
                </div>
                <div class="server-actions">
                    <span class="status-badge">${server.is_active ? 'ON-LINE' : 'OFFLINE'}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Run startup
    loadData();

    // ===================================
    // KILFEED / SSE LOGIC
    // ===================================
    function initKillfeed() {
        const source = new EventSource('/api/events/combatlog');
        const killfeedList = document.getElementById('killfeed-list');
        const statusEl = document.getElementById('kf-status');

        source.onmessage = async function(event) {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'connected') {
                    if (statusEl) {
                        statusEl.innerHTML = `<span>[SYSTEM] ${data.msg}</span>`;
                        statusEl.classList.remove('connected');
                        statusEl.style.borderLeftColor = "#facc15";
                        setTimeout(() => statusEl.remove(), 4000);
                    }
                }

                if (data.type === 'kill') {
                    const payload = data.payload;
                    const div = document.createElement('div');
                    div.className = 'kill-entry';
                    div.innerHTML = `
                        <div>
                            <span class="kill-killer">${payload.killerName}</span>
                            <span style="color: #64748b; margin: 0 4px;">killed</span>
                            <span class="kill-target">${payload.targetName}</span>
                            <span style="color: #475569; font-size: 0.75rem; margin-left: 6px;">[${payload.weapon}]</span>
                        </div>
                        <span class="kill-time">${payload.timestamp}</span>
                    `;

                    killfeedList.appendChild(div);

                    // Maintain only 6 latest kills
                    if (killfeedList.children.length > 6) {
                        killfeedList.removeChild(killfeedList.firstElementChild);
                    }
                }
                if (data.type === 'server_paired') {
                    // Cierra el modal, muestra confeti/alerta y recarga la lista
                    pairModal.classList.add('hidden');
                    alert(`¡Éxito! Tu servidor ${data.serverIp}:${data.serverPort} se conectó dinámicamente.`);
                    
                    // Recargar los datos del panel para mostrar el server en UI
                    await loadData();
                    document.getElementById('nav-servers').click(); // Redirige a los servidores
                }

            } catch(e) { console.error("Error parsing SSE:", e); }
        };

        source.onerror = function() {
            console.error("Lost connection to SSE Combat Log");
            // source.close(); // Intenta reconectar solo
        };
    }
    
    // Iniciar killfeed siempre 
    initKillfeed();
});
