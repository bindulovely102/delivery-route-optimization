
// ======================================
// DELIVERY ROUTE OPTIMIZATION - TSP
// ======================================

// 0 = Warehouse
// 1 = Customer 1
// 2 = Customer 2
// 3 = Customer 3
// 4 = Customer 4

const distance = [
    [0, 10, 15, 20, 25],
    [10, 0, 35, 25, 30],
    [15, 35, 0, 30, 20],
    [20, 25, 30, 0, 15],
    [25, 30, 20, 15, 0]
];

const n = distance.length;
const customers = [1, 2, 3, 4];

function locationName(i) {
    return i === 0 ? "Warehouse" : "Customer " + i;
}

// ======================================
// 1. BRUTE FORCE ALGORITHM
// ======================================

function bruteForce() {

    let minDistance = Infinity;
    let bestRoute = [];
    let count = 0;

    function generate(arr, route) {

        if (arr.length === 0) {

            let total = 0;
            let current = 0;

            for (let customer of route) {
                total += distance[current][customer];
                current = customer;
            }

            total += distance[current][0];
            count++;

            if (total < minDistance) {
                minDistance = total;
                bestRoute = [0, ...route, 0];
            }

            return;
        }

        for (let i = 0; i < arr.length; i++) {

            let next = arr[i];

            let remaining = arr.filter(
                (_, index) => index !== i
            );

            generate(remaining, [...route, next]);
        }
    }

    generate(customers, []);

    return {
        name: "Brute Force Algorithm",
        route: bestRoute,
        cost: minDistance,
        details: "Possible routes checked: " + count
    };
}

// ======================================
// 2. DYNAMIC PROGRAMMING - HELD KARP
// ======================================

function dynamicProgramming() {

    const m = customers.length;
    const fullMask = (1 << m) - 1;

    let memo = new Map();
    let choice = new Map();

    function tsp(mask, current) {

        let key = mask + "-" + current;

        if (memo.has(key)) {
            return memo.get(key);
        }

        if (mask === fullMask) {
            return distance[current][0];
        }

        let minCost = Infinity;
        let bestNext = -1;

        for (let i = 0; i < m; i++) {

            let bit = 1 << i;

            if ((mask & bit) === 0) {

                let next = customers[i];

                let cost =
                    distance[current][next] +
                    tsp(mask | bit, next);

                if (cost < minCost) {
                    minCost = cost;
                    bestNext = next;
                }
            }
        }

        memo.set(key, minCost);
        choice.set(key, bestNext);

        return minCost;
    }

    let minDistance = tsp(0, 0);

    // Reconstruct optimal route

    let route = [0];
    let mask = 0;
    let current = 0;

    while (mask !== fullMask) {

        let next = choice.get(mask + "-" + current);

        route.push(next);

        mask |= 1 << (next - 1);

        current = next;
    }

    route.push(0);

    return {
        name: "Dynamic Programming (Held-Karp)",
        route: route,
        cost: minDistance,
        details: "Memoized states: " + memo.size
    };
}

// ======================================
// 3. GREEDY - NEAREST NEIGHBOUR
// ======================================

function greedy() {

    let visited = new Array(n).fill(false);

    let route = [0];
    let current = 0;
    let totalDistance = 0;

    visited[0] = true;

    while (route.length < n) {

        let nearest = -1;
        let minCost = Infinity;

        for (let i = 1; i < n; i++) {

            if (!visited[i] &&
                distance[current][i] < minCost) {

                minCost = distance[current][i];
                nearest = i;
            }
        }

        totalDistance += minCost;

        current = nearest;
        visited[current] = true;

        route.push(current);
    }

    totalDistance += distance[current][0];

    route.push(0);

    return {
        name: "Greedy Algorithm",
        route: route,
        cost: totalDistance,
        details: "Selects nearest unvisited customer."
    };
}

// ======================================
// 4. DIJKSTRA ALGORITHM
// ======================================

function dijkstra(source) {

    let dist = new Array(n).fill(Infinity);

    let visited = new Array(n).fill(false);

    let previous = new Array(n).fill(-1);

    dist[source] = 0;

    for (let count = 0; count < n; count++) {

        let u = -1;

        for (let i = 0; i < n; i++) {

            if (!visited[i] &&
                (u === -1 || dist[i] < dist[u])) {

                u = i;
            }
        }

        if (u === -1 || dist[u] === Infinity) {
            break;
        }

        visited[u] = true;

        for (let v = 0; v < n; v++) {

            if (!visited[v] &&
                distance[u][v] > 0 &&
                dist[u] + distance[u][v] < dist[v]) {

                dist[v] = dist[u] + distance[u][v];

                previous[v] = u;
            }
        }
    }

    return {
        dist: dist,
        previous: previous
    };
}

// ======================================
// RECONSTRUCT DIJKSTRA PATH
// ======================================

function getPath(previous, target) {

    let path = [];
    let current = target;

    while (current !== -1) {

        path.unshift(current);
        current = previous[current];
    }

    return path;
}

// ======================================
// DIJKSTRA-BASED DELIVERY TOUR
// ======================================

function dijkstraTSP() {

    let visitedCustomers = new Set();

    let route = [0];
    let current = 0;
    let totalDistance = 0;

    while (visitedCustomers.size < customers.length) {

        let result = dijkstra(current);

        let nearest = -1;
        let minCost = Infinity;

        for (let customer of customers) {

            if (!visitedCustomers.has(customer) &&
                result.dist[customer] < minCost) {

                minCost = result.dist[customer];
                nearest = customer;
            }
        }

        if (nearest === -1) break;

        let path = getPath(result.previous, nearest);

        for (let i = 1; i < path.length; i++) {
            route.push(path[i]);
        }

        totalDistance += minCost;

        visitedCustomers.add(nearest);
        current = nearest;
    }

    // Return to warehouse

    let result = dijkstra(current);

    let returnPath = getPath(result.previous, 0);

    for (let i = 1; i < returnPath.length; i++) {
        route.push(returnPath[i]);
    }

    totalDistance += result.dist[0];

    return {
        name: "Dijkstra-Based Delivery Tour",
        route: route,
        cost: totalDistance,
        details: "Uses shortest paths to select unvisited customers."
    };
}

// ======================================
// ALGORITHM SOURCE CODES
// ======================================

const algorithmCodes = {

    brute: `
// BRUTE FORCE

function generate(arr, route) {

    if (arr.length === 0) {

        let total = 0;
        let current = 0;

        for (let customer of route) {
            total += distance[current][customer];
            current = customer;
        }

        total += distance[current][0];

        if (total < minDistance) {
            minDistance = total;
            bestRoute = [0, ...route, 0];
        }

        return;
    }

    for (let i = 0; i < arr.length; i++) {

        let next = arr[i];

        let remaining = arr.filter(
            (_, index) => index !== i
        );

        generate(remaining, [...route, next]);
    }
}
`,

    dynamic: `
// DYNAMIC PROGRAMMING

function tsp(mask, current) {

    let key = mask + "-" + current;

    if (memo.has(key)) {
        return memo.get(key);
    }

    if (mask === fullMask) {
        return distance[current][0];
    }

    let minCost = Infinity;

    for (let i = 0; i < customers.length; i++) {

        let bit = 1 << i;

        if ((mask & bit) === 0) {

            let next = customers[i];

            let cost =
                distance[current][next] +
                tsp(mask | bit, next);

            minCost = Math.min(minCost, cost);
        }
    }

    memo.set(key, minCost);

    return minCost;
}
`,

    greedy: `
// GREEDY ALGORITHM

function greedy() {

    let visited = Array(n).fill(false);

    let current = 0;
    let route = [0];
    let totalDistance = 0;

    visited[0] = true;

    while (route.length < n) {

        let nearest = -1;
        let minCost = Infinity;

        for (let i = 1; i < n; i++) {

            if (!visited[i] &&
                distance[current][i] < minCost) {

                minCost = distance[current][i];
                nearest = i;
            }
        }

        totalDistance += minCost;

        current = nearest;
        visited[current] = true;

        route.push(current);
    }

    totalDistance += distance[current][0];

    route.push(0);

    return route;
}
`,

    dijkstra: `
// DIJKSTRA ALGORITHM

function dijkstra(source) {

    let dist = Array(n).fill(Infinity);

    let visited = Array(n).fill(false);

    let previous = Array(n).fill(-1);

    dist[source] = 0;

    for (let count = 0; count < n; count++) {

        let u = -1;

        for (let i = 0; i < n; i++) {

            if (!visited[i] &&
                (u === -1 || dist[i] < dist[u])) {

                u = i;
            }
        }

        if (u === -1 || dist[u] === Infinity) break;

        visited[u] = true;

        for (let v = 0; v < n; v++) {

            if (!visited[v] &&
                distance[u][v] > 0 &&
                dist[u] + distance[u][v] < dist[v]) {

                dist[v] = dist[u] + distance[u][v];

                previous[v] = u;
            }
        }
    }

    return { dist, previous };
}
`
};

// ======================================
// DISPLAY RESULT
// ======================================

function displayResult(result) {

    let routeText = result.route
        .map(locationName)
        .join(" → ");

    document.getElementById("results").innerHTML += `

        <div class="result-card">

            <h3>${result.name}</h3>

            <p class="route">
                Route: ${routeText}
            </p>

            <p class="distance">
                Total Distance: ${result.cost} KM
            </p>

            <p>${result.details}</p>

        </div>
    `;
}

// ======================================
// DISPLAY SOURCE CODE
// ======================================

function showCode(type) {

    const titles = {

        brute: "Brute Force Source Code",

        dynamic: "Dynamic Programming Source Code",

        greedy: "Greedy Source Code",

        dijkstra: "Dijkstra Source Code"
    };

    document.getElementById("codeTitle").innerText =
        titles[type];

    document.getElementById("codeDisplay").textContent =
        algorithmCodes[type];
}

// ======================================
// RUN ONE ALGORITHM
// ======================================

function runAlgorithm(type) {

    let result;

    if (type === "brute") {
        result = bruteForce();
    }

    else if (type === "dynamic") {
        result = dynamicProgramming();
    }

    else if (type === "greedy") {
        result = greedy();
    }

    else if (type === "dijkstra") {
        result = dijkstraTSP();
    }

    document.getElementById("results").innerHTML = "";

    displayResult(result);

    showCode(type);
}

// ======================================
// RUN ALL FOUR ALGORITHMS
// ======================================

function runAll() {

    document.getElementById("results").innerHTML = "";

    let results = [
        bruteForce(),
        dynamicProgramming(),
        greedy(),
        dijkstraTSP()
    ];

    results.forEach(displayResult);

    let allCodes = "";

    for (let key in algorithmCodes) {

        allCodes +=
            "\\n\\n========== " +
            key.toUpperCase() +
            " ALGORITHM ==========\\n";

        allCodes += algorithmCodes[key];
    }

    document.getElementById("codeTitle").innerText =
        "All Four Algorithm Source Codes";

    document.getElementById("codeDisplay").textContent =
        allCodes;
}
