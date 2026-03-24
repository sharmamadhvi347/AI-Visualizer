// script.js

// --- Global Setup ---
const pages = document.querySelectorAll('.page');
const cursor = document.querySelector('.custom-cursor');
const ambientParticles = document.getElementById('ambient-particles');

// Custom Cursor
document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});
const hoverSelectors = 'button, .topic-card, input[type="range"], .switch-label, .person';
const bindCursorHover = () => {
    document.querySelectorAll(hoverSelectors).forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
};
bindCursorHover();

// Navigation Transitions
function navigateTo(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if(pageId === 'page-tsp' && window.tspVis) {
        setTimeout(() => window.tspVis.resize(), 600);
    }
}

document.querySelectorAll('[data-target]').forEach(el => {
    el.addEventListener('click', (e) => {
        navigateTo(el.dataset.target);
    });
});

// Landing Page Interactions
const heroHeader = document.querySelector('.hero-header');
const pRiver = document.querySelector('.parallax-river');
document.querySelector('#page-landing').addEventListener('scroll', (e) => {
    const scrollY = e.target.scrollTop;
    if(heroHeader) heroHeader.style.transform = `translateY(${scrollY * 0.4}px)`;
});

document.querySelectorAll('.topic-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
});

// Particles
for(let i=0; i<30; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.width = Math.random() * 4 + 2 + 'px';
    p.style.height = p.style.width;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (Math.random() * 10 + 10) + 's';
    p.style.animationDelay = Math.random() * 5 + 's';
    ambientParticles.appendChild(p);
}

// --- Missionaries & Cannibals Logic ---
class MCVisualizer {
    constructor() {
        this.reset();
        this.dom = {
            leftBank: document.getElementById('left-bank'),
            rightBank: document.getElementById('right-bank'),
            boat: document.getElementById('boat'),
            boatSeats: document.getElementById('boat-seats'),
            scene: document.getElementById('mc-scene'),
            moves: document.getElementById('mc-moves'),
            leftState: document.getElementById('mc-left-state'),
            rightState: document.getElementById('mc-right-state'),
            boatState: document.getElementById('mc-boat-state'),
            terminal: document.getElementById('mc-terminal'),
            timeline: document.getElementById('mc-timeline'),
            btnCross: document.getElementById('btn-cross'),
            btnSolve: document.getElementById('btn-auto-solve'),
            btnStep: document.getElementById('btn-step-bfs'),
            pillsM: document.querySelectorAll('#select-m .pill'),
            pillsC: document.querySelectorAll('#select-c .pill'),
            speed: document.getElementById('mc-speed')
        };

        this.selectedM = 0; this.selectedC = 0;
        this.isAnimating = false;
        this.bfsPath = null; this.bfsIndex = 0;

        this.bindEvents();
        this.renderState();
        this.log("System initialized. State: 3M, 3C on left bank.");
    }
    
    reset() {
        this.state = { ml: 3, cl: 3, mr: 0, cr: 0, b: 0 };
        this.moves = 0;
        this.history = [];
    }

    bindEvents() {
        this.dom.pillsM.forEach(p => p.addEventListener('click', () => this.selectPassengers(p, 'm')));
        this.dom.pillsC.forEach(p => p.addEventListener('click', () => this.selectPassengers(p, 'c')));
        this.dom.btnCross.addEventListener('click', () => this.attemptCross());
        this.dom.btnSolve.addEventListener('click', () => this.autoSolve());
        this.dom.btnStep.addEventListener('click', () => this.stepBFS());
    }

    selectPassengers(target, type) {
        if(this.isAnimating) return;
        const val = parseInt(target.dataset.val);
        const pills = type === 'm' ? this.dom.pillsM : this.dom.pillsC;
        pills.forEach(p => p.classList.remove('active'));
        target.classList.add('active');
        if(type === 'm') this.selectedM = val;
        else this.selectedC = val;
    }

    log(msg, type="info") {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        this.dom.terminal.appendChild(div);
        
        // Typewriter effect
        let i = 0; div.textContent = "";
        const id = setInterval(() => {
            div.textContent += msg.charAt(i);
            i++;
            this.dom.terminal.scrollTop = this.dom.terminal.scrollHeight;
            if(i >= msg.length) clearInterval(id);
        }, 15);
    }

    renderState() {
        this.dom.leftBank.innerHTML = '';
        this.dom.rightBank.innerHTML = '';
        this.dom.boatSeats.innerHTML = '';

        for(let i=0; i<this.state.ml; i++) this.addPerson(this.dom.leftBank, 'missionary', 'M');
        for(let i=0; i<this.state.cl; i++) this.addPerson(this.dom.leftBank, 'cannibal', 'C');
        for(let i=0; i<this.state.mr; i++) this.addPerson(this.dom.rightBank, 'missionary', 'M');
        for(let i=0; i<this.state.cr; i++) this.addPerson(this.dom.rightBank, 'cannibal', 'C');

        bindCursorHover();

        this.dom.leftState.textContent = `${this.state.ml}M, ${this.state.cl}C`;
        this.dom.rightState.textContent = `${this.state.mr}M, ${this.state.cr}C`;
        this.dom.boatState.textContent = `0M, 0C`;
        this.dom.moves.textContent = this.moves;

        if(this.state.b === 0) {
            this.dom.boat.style.transform = 'translateX(0)';
            this.dom.boat.style.flexDirection = 'row';
        } else {
            this.dom.boat.style.transform = `translateX(calc(${this.dom.scene.offsetWidth * 0.4}px - 100%))`;
            this.dom.boat.style.flexDirection = 'row-reverse';
        }
    }

    addPerson(container, typeClass, label) {
        const p = document.createElement('div');
        p.className = `person ${typeClass}`;
        p.dataset.type = label;
        container.appendChild(p);
    }

    isValid(state) {
        if (state.ml < 0 || state.cl < 0 || state.mr < 0 || state.cr < 0) return false;
        if (state.ml > 0 && state.cl > state.ml) return false;
        if (state.mr > 0 && state.cr > state.mr) return false;
        return true;
    }

    attemptCross() {
        if(this.isAnimating) return;
        const m = this.selectedM;
        const c = this.selectedC;
        
        if (m === 0 && c === 0) { this.log("⚠️ Must select at least 1 passenger."); return; }
        if (m + c > 2) { this.log("⚠️ Boat holds max 2 passengers."); return; }

        let newState = { ...this.state };
        if (this.state.b === 0) {
            newState.ml -= m; newState.cl -= c;
            newState.mr += m; newState.cr += c;
            newState.b = 1;
        } else {
            newState.mr -= m; newState.cr -= c;
            newState.ml += m; newState.cl += c;
            newState.b = 0;
        }

        const currentPosStr = this.state.b === 0 ? "left" : "right";
        this.log(`Attempting to send ${m}M, ${c}C from ${currentPosStr}...`);

        if(newState.ml < 0 || newState.cl < 0 || newState.mr < 0 || newState.cr < 0) {
            this.log("❌ Invalid: Not enough people on this bank.");
            this.shakeScene(); return;
        }

        this.animateCross(m, c, newState);
    }

    animateCross(m, c, newState) {
        this.isAnimating = true;
        this.dom.btnCross.disabled = true;

        for(let i=0; i<m; i++) this.addPerson(this.dom.boatSeats, 'missionary', 'M');
        for(let i=0; i<c; i++) this.addPerson(this.dom.boatSeats, 'cannibal', 'C');
        
        const source = this.state.b === 0 ? this.dom.leftBank : this.dom.rightBank;
        let removedM = 0; let removedC = 0;
        [...source.children].forEach(el => {
            if(el.classList.contains('missionary') && removedM < m) { el.remove(); removedM++; }
            else if(el.classList.contains('cannibal') && removedC < c) { el.remove(); removedC++; }
        });

        this.dom.boatState.textContent = `${m}M, ${c}C`;
        const speedMultiplier = [2, 1.2, 0.6][this.dom.speed.value - 1];
        this.dom.boat.style.transitionDuration = `${speedMultiplier}s`;
        
        if(newState.b === 1) {
            this.dom.boat.style.transform = `translateX(calc(${this.dom.scene.offsetWidth * 0.4}px - 0px))`;
            this.dom.boat.style.flexDirection = 'row-reverse';
        } else {
            this.dom.boat.style.transform = `translateX(0)`;
            this.dom.boat.style.flexDirection = 'row';
        }

        setTimeout(() => {
            this.state = newState;
            this.moves++;
            this.renderState(); 
            this.dom.btnCross.disabled = false;
            this.isAnimating = false;
            this.selectedM = 0; this.selectedC = 0;
            this.dom.pillsM.forEach(p => p.classList.toggle('active', p.dataset.val === '0'));
            this.dom.pillsC.forEach(p => p.classList.toggle('active', p.dataset.val === '0'));

             if(!this.isValid(this.state)) {
                this.log(`❌ Invalid state reached! Missionaries outnumbered.`);
                this.shakeScene();
                this.history.push({m, c, valid: false, dir: newState.b});
                this.updateTimeline();
                document.getElementById('defeat-banner').classList.add('show');
                setTimeout(() => document.getElementById('defeat-banner').classList.remove('show'), 3000);
                this.reset();
                setTimeout(() => { this.renderState(); this.log("System reset."); }, 2000);
            } else {
                this.log(`✅ Valid state -> Left: ${this.state.ml}M,${this.state.cl}C`);
                this.history.push({m, c, valid: true, dir: newState.b});
                this.updateTimeline();
                if(this.state.mr === 3 && this.state.cr === 3) {
                    document.getElementById('victory-banner').classList.add('show');
                    this.confetti();
                    setTimeout(() => document.getElementById('victory-banner').classList.remove('show'), 4000);
                }
            }
        }, speedMultiplier * 1000 + 200);
    }

    shakeScene() {
        this.dom.scene.style.animation = 'none';
        this.dom.scene.offsetHeight;
        this.dom.scene.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
    }

    updateTimeline() {
        this.dom.timeline.innerHTML = '';
        this.history.forEach((h, i) => {
            const el = document.createElement('div');
            el.className = `timeline-pill ${h.valid ? 'good' : 'bad'}`;
            el.textContent = `${i+1}. ${h.dir===1? '→' : '←'} ${h.m}M, ${h.c}C`;
            this.dom.timeline.appendChild(el);
        });
        this.dom.timeline.scrollLeft = this.dom.timeline.scrollWidth;
    }

    confetti() {
        const colors = ['#D4622A', '#4A7C6F', '#7DB5D4', '#F0A868', '#6A9E7F'];
        for(let i=0; i<50; i++) {
            const p = document.createElement('div');
            p.style.position = 'fixed'; p.style.left = `50%`; p.style.top = `20px`;
            p.style.width = '8px'; p.style.height = '8px';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.zIndex = 2000; p.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            document.body.appendChild(p);
            
            let vx = (Math.random() - 0.5) * 10; let vy = (Math.random() - 1) * 10 - 5; let time = 0;
            const animateC = () => {
                time += 0.05; vy += 0.5;
                let currentY = parseFloat(p.style.top) + vy; let currentX = parseFloat(p.style.left) + vx;
                p.style.top = currentY + 'px'; p.style.left = currentX + 'px';
                p.style.transform = `rotate(${time * 100}deg)`;
                if(currentY < window.innerHeight) requestAnimationFrame(animateC); else p.remove();
            };
            requestAnimationFrame(animateC);
        }
    }

    autoSolve() {
        if(this.isAnimating) return;
        this.reset(); this.renderState();
        this.log("🤖 Starting Breadth-First Search...", "info");
        const path = this.runBFS();
        if(path) {
            this.log(`✅ BFS found optimal solution in ${path.length - 1} steps.`);
            this.bfsPath = path; this.bfsIndex = 1;
            this.dom.btnSolve.disabled = true; this.dom.btnCross.disabled = true; this.dom.btnStep.disabled = true;
            this.playNextBFS();
        }
    }

    stepBFS() {
        if(this.isAnimating) return;
        if(!this.bfsPath) {
            this.bfsPath = this.runBFS();
            this.bfsIndex = 1;
        }
        if(this.bfsIndex < this.bfsPath.length) this.playNextBFS();
    }

    playNextBFS() {
    if (this.bfsIndex >= this.bfsPath.length) {
        this.dom.btnSolve.disabled = false;
        this.dom.btnCross.disabled = false;
        this.dom.btnStep.disabled = false;
        return;
    }

    const prev = this.bfsPath[this.bfsIndex - 1];
    const next = this.bfsPath[this.bfsIndex];

    // Derive move directly from BFS path states
    let m, c;
    if (prev.b === 0) {
        // boat was on left, moving right
        m = prev.ml - next.ml;
        c = prev.cl - next.cl;
    } else {
        // boat was on right, moving left
        m = prev.mr - next.mr;
        c = prev.cr - next.cr;
    }

    this.bfsIndex++;
    this.log(`[BFS] Step ${this.bfsIndex - 1}: Moving ${m}M, ${c}C from ${prev.b === 0 ? 'left' : 'right'} → State: (${next.ml}M,${next.cl}C | ${next.mr}M,${next.cr}C)`);

    this.animateCross(m, c, next);

    if (this.dom.btnSolve.disabled && this.bfsIndex < this.bfsPath.length) {
        const speedMultiplier = [2, 1.2, 0.6][this.dom.speed.value - 1];
        setTimeout(() => {
            if (this.dom.btnSolve.disabled) this.playNextBFS();
        }, speedMultiplier * 1000 + 400);
    } else if (this.bfsIndex >= this.bfsPath.length) {
        this.dom.btnSolve.disabled = false;
        this.dom.btnCross.disabled = false;
        this.dom.btnStep.disabled = false;
    }
}

    runBFS() {
        let start = {ml:3, cl:3, mr:0, cr:0, b:0};
        let queue = [ {state: start, path: [start]} ];
        let visited = new Set();
        visited.add(JSON.stringify(start));

        while(queue.length > 0) {
            let curr = queue.shift();
            let s = curr.state;
            if(s.mr === 3 && s.cr === 3) return curr.path;
            
            let possibleMoves = [ {m:1, c:0}, {m:2, c:0}, {m:0, c:1}, {m:0, c:2}, {m:1, c:1} ];
            for(let move of possibleMoves) {
                let nextS = { ...s };
                if (s.b === 0) {
                    nextS.ml -= move.m; nextS.cl -= move.c; nextS.mr += move.m; nextS.cr += move.c; nextS.b = 1;
                } else {
                    nextS.mr -= move.m; nextS.cr -= move.c; nextS.ml += move.m; nextS.cl += move.c; nextS.b = 0;
                }
                if(this.isValid(nextS)) {
                    let str = JSON.stringify(nextS);
                    if(!visited.has(str)) {
                        visited.add(str);
                        queue.push({state: nextS, path: [...curr.path, nextS]});
                    }
                }
            }
        }
        return null;
    }
}
window.mcVis = new MCVisualizer();


// --- TSP Visualizer ---
class TSPVisualizer {
    constructor() {
        this.canvas = document.getElementById('tsp-canvas');
        this.ctx = this.canvas.getContext('2d', {alpha: false});
        this.cities = [];
        this.path = [];
        this.optPath = [];
        this.isAnimating = false;
        this.showingCompare = false;

        this.dom = {
            distance: document.getElementById('tsp-distance'),
            citiesCount: document.getElementById('tsp-cities-count'),
            steps: document.getElementById('tsp-steps'),
            terminal: document.getElementById('tsp-terminal'),
            btnRandom: document.getElementById('btn-add-random'),
            btnClear: document.getElementById('btn-clear-canvas'),
            btnSolve: document.getElementById('btn-solve-tsp'),
            btnOptimize: document.getElementById('btn-optimize-tsp'),
            shimmer: document.getElementById('tsp-shimmer'),
            speed: document.getElementById('tsp-speed'),
            toggleCompare: document.getElementById('toggle-compare'),
            compareContainer: document.getElementById('compare-toggle-container')
        };

        this.bindEvents();
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.render();
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.addCity(e));
        this.dom.btnRandom.addEventListener('click', () => this.addRandomCities());
        this.dom.btnClear.addEventListener('click', () => this.clearCanvas());
        this.dom.btnSolve.addEventListener('click', () => this.solveGreedy());
        this.dom.btnOptimize.addEventListener('click', () => this.optimize2Opt());
        this.dom.toggleCompare.addEventListener('change', (e) => {
            this.showingCompare = e.target.checked;
            this.render();
        });
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }

    log(msg) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        this.dom.terminal.appendChild(div);
        let i = 0; div.textContent = "";
        const id = setInterval(() => {
            div.textContent += msg.charAt(i); i++;
            this.dom.terminal.scrollTop = this.dom.terminal.scrollHeight;
            if(i >= msg.length) clearInterval(id);
        }, 15);
    }

    addCity(e) {
        if(this.isAnimating) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let label = String.fromCharCode(65 + (this.cities.length % 26));
        if(this.cities.length >= 26) label = String.fromCharCode(65 + Math.floor(this.cities.length/26) - 1) + label;

        this.cities.push({x, y, label, scale: 0});
        this.dom.citiesCount.textContent = this.cities.length;
        this.path = []; this.optPath = [];
        this.dom.btnOptimize.disabled = true; this.dom.compareContainer.style.display = 'none';
        this.showingCompare = false; this.dom.toggleCompare.checked = false;
        
        this.log(`Added City ${label} at (${Math.round(x)}, ${Math.round(y)})`);
        
        let s = 0;
        const anim = () => {
            s += 0.1;
            this.cities[this.cities.length-1].scale = Math.min(1, s);
            this.render();
            if(s < 1) requestAnimationFrame(anim);
            else this.cities[this.cities.length-1].scale = 1;
        };
        requestAnimationFrame(anim);
    }

    addRandomCities() {
        if(this.isAnimating) return;
        const count = Math.floor(Math.random() * 4) + 5;
        let added = 0;
        const interval = setInterval(() => {
            const padding = 50;
            const x = padding + Math.random() * (this.canvas.width - padding*2);
            const y = padding + Math.random() * (this.canvas.height - padding*2);
            this.addCity({clientX: x + this.canvas.getBoundingClientRect().left, clientY: y + this.canvas.getBoundingClientRect().top});
            added++;
            if(added >= count) clearInterval(interval);
        }, 150);
    }

    clearCanvas() {
        if(this.isAnimating) return;
        this.cities = []; this.path = []; this.optPath = [];
        this.dom.citiesCount.textContent = 0; this.dom.distance.textContent = '0px'; this.dom.steps.textContent = 0;
        this.dom.terminal.innerHTML = '<div class="log-entry">Canvas cleared. Waiting for cities...</div>';
        this.dom.btnOptimize.disabled = true; this.dom.compareContainer.style.display = 'none';
        this.render();
    }

    dist(c1, c2) { return Math.sqrt((c1.x - c2.x)**2 + (c1.y - c2.y)**2); }

    calculatePathDistance(pathArray) {
        let d = 0;
        for(let i=0; i<pathArray.length - 1; i++) {
            d += this.dist(this.cities[pathArray[i]], this.cities[pathArray[i+1]]);
        }
        if(pathArray.length === this.cities.length) {
            d += this.dist(this.cities[pathArray[pathArray.length-1]], this.cities[pathArray[0]]);
        }
        return d;
    }

    solveGreedy() {
        if(this.cities.length < 3 || this.isAnimating) return;
        this.log("▶ Starting Nearest Neighbor (Greedy)...");
        this.isAnimating = true;
        this.path = []; this.optPath = [];
        this.dom.btnOptimize.disabled = true; this.dom.compareContainer.style.display = 'none';
        this.showingCompare = false; this.dom.toggleCompare.checked = false;
        
        // Restore highlights if there are any
        this.dom.distance.classList.replace('highlight-teal', 'highlight-amber');
        this.dom.distance.style.color = '';

        let current = 0;
        let visited = new Set([0]);
        this.path.push(0);
        
        const speed = [800, 400, 100][this.dom.speed.value - 1];
        
        const step = () => {
            if(visited.size === this.cities.length) {
                this.isAnimating = false; this.render();
                const totalD = this.calculatePathDistance(this.path);
                this.dom.distance.textContent = Math.round(totalD) + 'px';
                this.log(`✅ Greedy Complete! Total Distance: ${Math.round(totalD)}px`);
                this.dom.btnOptimize.disabled = false;
                return;
            }

            let nearest = -1; let minDist = Infinity;
            for(let i=0; i<this.cities.length; i++) {
                if(!visited.has(i)) {
                    let d = this.dist(this.cities[current], this.cities[i]);
                    if(d < minDist) { minDist = d; nearest = i; }
                }
            }

            visited.add(nearest); this.path.push(nearest);
            const totalD = this.calculatePathDistance(this.path);
            this.dom.distance.textContent = Math.round(totalD) + 'px';
            this.dom.steps.textContent = visited.size;
            this.log(`[GREEDY] Visited ${this.cities[nearest].label} -> D: ${Math.round(minDist)}px`);
            
            current = nearest; this.render();
            setTimeout(step, speed);
        };
        setTimeout(step, speed);
    }

    optimize2Opt() {
        if(this.path.length < 3 || this.isAnimating) return;
        this.log("⚡ Starting 2-Opt Optimization...");
        this.dom.shimmer.classList.add('active');
        this.isAnimating = true;
        this.optPath = [...this.path];
        
        const initialDist = this.calculatePathDistance(this.optPath);
        
        setTimeout(() => {
            let improved = true; let iterations = 0;
            
            while(improved) {
                improved = false;
                for(let i = 0; i < this.optPath.length - 1; i++) {
                    for(let k = i + 2; k < this.optPath.length; k++) {
                        if (i === 0 && k === this.optPath.length - 1) continue;
                        
                        let c1 = this.cities[this.optPath[i]];
                        let c2 = this.cities[this.optPath[i + 1]];
                        let c3 = this.cities[this.optPath[k]];
                        let c4 = this.cities[this.optPath[(k + 1) % this.optPath.length]];
                        
                        let d1 = this.dist(c1, c2) + this.dist(c3, c4);
                        let d2 = this.dist(c1, c3) + this.dist(c2, c4);
                        
                        if(d2 < d1) {
                            let newPath = [...this.optPath];
                            let segment = newPath.splice(i + 1, k - i).reverse();
                            newPath.splice(i + 1, 0, ...segment);
                            this.optPath = newPath;
                            improved = true; iterations++;
                        }
                    }
                }
            }
            
            const newDist = this.calculatePathDistance(this.optPath);
            this.dom.shimmer.classList.remove('active');
            
            if(newDist < initialDist - 1) {
                this.log(`✅ 2-Opt Finished! Improved distance from ${Math.round(initialDist)} to ${Math.round(newDist)}px (${iterations} swaps)`);
                this.dom.compareContainer.style.display = 'block';
                this.dom.distance.textContent = Math.round(newDist) + 'px';
                this.dom.distance.classList.replace('highlight-amber', 'highlight-teal');
                this.dom.distance.style.color = '#4A7C6F';
            } else {
                this.log(`✅ Greedy was already optimal. No improvements found.`);
            }
            
            this.isAnimating = false; this.render();
        }, 500);
    }

    render() {
        this.ctx.fillStyle = '#1E1A16';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if(this.path.length > 1 && (this.showingCompare || this.optPath.length === 0)) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.cities[this.path[0]].x, this.cities[this.path[0]].y);
            for(let i=1; i<this.path.length; i++) {
                this.ctx.lineTo(this.cities[this.path[i]].x, this.cities[this.path[i]].y);
            }
            if(this.path.length === this.cities.length && !this.isAnimating) {
                this.ctx.lineTo(this.cities[this.path[0]].x, this.cities[this.path[0]].y);
            }
            this.ctx.strokeStyle = this.showingCompare ? 'rgba(240, 168, 104, 0.3)' : '#F0A868';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash(this.showingCompare ? [] : [5, 5]);
            
            if(!this.showingCompare) {
               let dashOffset = performance.now() / -20;
               this.ctx.lineDashOffset = dashOffset;
               if(!this.isAnimating) requestAnimationFrame(() => this.render());
            } else {
                this.ctx.setLineDash([]);
            }
            
            this.ctx.stroke(); this.ctx.setLineDash([]);
        }

        if(this.optPath.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.cities[this.optPath[0]].x, this.cities[this.optPath[0]].y);
            for(let i=1; i<this.optPath.length; i++) {
                this.ctx.lineTo(this.cities[this.optPath[i]].x, this.cities[this.optPath[i]].y);
            }
            this.ctx.lineTo(this.cities[this.optPath[0]].x, this.cities[this.optPath[0]].y);
            
            this.ctx.strokeStyle = '#4A7C6F'; this.ctx.lineWidth = 3;
            this.ctx.shadowColor = '#4A7C6F'; this.ctx.shadowBlur = 10;
            this.ctx.stroke(); this.ctx.shadowBlur = 0;
        }

        this.ctx.font = '12px JetBrains Mono';
        this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';

        this.cities.forEach((c, idx) => {
            let scale = c.scale || 1;
            let color = '#F0A868';
            if(this.path.includes(idx)) color = '#4A7C6F';
            if(this.optPath.length > 0) color = '#4A7C6F';

            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 8 * scale, 0, Math.PI*2);
            this.ctx.fillStyle = this.showingCompare ? '#1E1A16' : color;
            this.ctx.shadowColor = color; this.ctx.shadowBlur = 15 * scale;
            this.ctx.fill();
            
            this.ctx.lineWidth = 2 * scale; this.ctx.strokeStyle = color;
            this.ctx.stroke(); this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#F2EDE6';
            this.ctx.fillText(c.label, c.x, c.y - 18 * scale);
        });
    }
}
window.tspVis = new TSPVisualizer();
