#include <iostream>
#include <fstream>
#include <vector>
#include <set>
#include <map>
#include <algorithm>
#include <string>
#include <sstream>
#include <random>
#include <chrono>
#include <queue>
#include <unordered_set>

using namespace std;

const int NUM_ENGINEERS = 336;
const int NUM_SERVERS = 1620;
const int MAX_SERVERS_PER_ENGINEER = 5;
const int NUM_DAYS = 22;
const int FIRST_14_DAYS = 14;
const int MAX_REST_DAYS = 410;
const int TOTAL_ENGINEER_DAYS = NUM_ENGINEERS * NUM_DAYS; // 7392
const int MIN_WORK_DAYS = TOTAL_ENGINEER_DAYS - MAX_REST_DAYS; // 6982

struct Solution {
    vector<vector<int>> allocation; // allocation[engineer][server_index] = server_id
    vector<vector<bool>> daily_work; // daily_work[engineer][day] = true if working
    int total_rest_days;
    bool valid;
    
    Solution() : allocation(NUM_ENGINEERS), daily_work(NUM_ENGINEERS, vector<bool>(NUM_DAYS, false)), 
                 total_rest_days(0), valid(false) {}
};

class ServerAllocationSolver {
private:
    vector<vector<int>> daily_alarms; // daily_alarms[day] = list of server IDs
    vector<int> server_to_engineer; // server_to_engineer[server_id] = engineer_id (-1 if unassigned)
    mt19937 rng;
    
public:
    ServerAllocationSolver() : server_to_engineer(NUM_SERVERS, -1), rng(chrono::steady_clock::now().time_since_epoch().count()) {}
    
    bool loadAlarmData(const string& filename) {
        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Error: Cannot open " << filename << endl;
            return false;
        }
        
        daily_alarms.resize(NUM_DAYS);
        string line;
        int day = 0;
        
        while (getline(file, line) && day < NUM_DAYS) {
            if (line.empty() || line[0] == '#') continue;
            
            istringstream iss(line);
            int server_id;
            while (iss >> server_id) {
                if (server_id >= 0 && server_id < NUM_SERVERS) {
                    daily_alarms[day].push_back(server_id);
                }
            }
            day++;
        }
        
        file.close();
        cout << "Loaded alarm data for " << day << " days" << endl;
        
        // Print statistics
        for (int d = 0; d < min(day, NUM_DAYS); d++) {
            cout << "Day " << d << ": " << daily_alarms[d].size() << " servers" << endl;
        }
        
        return day == NUM_DAYS;
    }
    
    Solution solve() {
        Solution best_solution;
        
        // Step 1: Target work days allocation for precise distribution
        cout << "Step 1: Target work days allocation..." << endl;
        Solution initial = optimalWorkDaysAllocation();
        
        if (!initial.valid) {
            cout << "Failed to find valid initial allocation" << endl;
            return best_solution;
        }
        
        best_solution = initial;
        cout << "Initial solution - Rest days: " << best_solution.total_rest_days << endl;
        
        // Step 2: Constraint propagation optimization if needed
        if (best_solution.total_rest_days > MAX_REST_DAYS) {
            cout << "Step 2: Constraint propagation optimization..." << endl;
            Solution optimized = constraintPropagationOptimization(best_solution);
            
            if (optimized.valid) {
                best_solution = optimized;
                cout << "Optimized solution - Rest days: " << best_solution.total_rest_days << endl;
            }
        } else {
            cout << "Target achieved! No further optimization needed." << endl;
        }
        
        return best_solution;
    }
    
private:
    Solution maxCoverageAllocation() {
        Solution solution;
        
        // Reset server assignments
        fill(server_to_engineer.begin(), server_to_engineer.end(), -1);
        
        cout << "=== Maximum Coverage Allocation Strategy ===" << endl;
        cout << "Target: Exactly " << MAX_REST_DAYS << " rest days across all engineers" << endl;
        cout << "Required work days: " << MIN_WORK_DAYS << " out of " << TOTAL_ENGINEER_DAYS << endl;
        
        // Step 1: Analyze server-day patterns
        map<int, vector<int>> server_days; // server -> days it appears
        
        for (int day = 0; day < NUM_DAYS; day++) {
            for (int server : daily_alarms[day]) {
                server_days[server].push_back(day);
            }
        }
        
        cout << "Total unique servers: " << server_days.size() << endl;
        
        // Step 2: Calculate target work days per engineer
        vector<int> engineer_target_work_days(NUM_ENGINEERS);
        int base_work_days = MIN_WORK_DAYS / NUM_ENGINEERS;
        int extra_work_days = MIN_WORK_DAYS % NUM_ENGINEERS;
        
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            engineer_target_work_days[e] = base_work_days + (e < extra_work_days ? 1 : 0);
        }
        
        cout << "Target work days per engineer: " << base_work_days << " to " << (base_work_days + 1) << endl;
        
        // Step 3: Two-phase allocation strategy
        vector<int> engineer_load(NUM_ENGINEERS, 0);
        vector<set<int>> engineer_work_days(NUM_ENGINEERS);
        vector<bool> server_assigned(NUM_SERVERS, false);
        
        // Phase 1: Ensure all engineers have first 14 days coverage
        cout << "Phase 1: Ensuring first 14 days coverage..." << endl;
        
        // Collect servers that appear in first 14 days
        vector<int> first_14_servers;
        for (auto& [server, days] : server_days) {
            for (int day : days) {
                if (day < FIRST_14_DAYS) {
                    first_14_servers.push_back(server);
                    break;
                }
            }
        }
        
        cout << "Servers available in first 14 days: " << first_14_servers.size() << endl;
        
        // Round-robin assignment of first 14 days servers
        int engineer_idx = 0;
        for (int server : first_14_servers) {
            if (server_assigned[server]) continue;
            
            // Find next engineer who needs first 14 days coverage and has capacity
            int attempts = 0;
            while (attempts < NUM_ENGINEERS) {
                if (engineer_load[engineer_idx] < MAX_SERVERS_PER_ENGINEER) {
                    // Check if this engineer already has first 14 days coverage
                    bool has_first_14 = false;
                    for (int day : engineer_work_days[engineer_idx]) {
                        if (day < FIRST_14_DAYS) {
                            has_first_14 = true;
                            break;
                        }
                    }
                    
                    if (!has_first_14) {
                        // Assign this server to this engineer
                        server_to_engineer[server] = engineer_idx;
                        solution.allocation[engineer_idx].push_back(server);
                        engineer_load[engineer_idx]++;
                        server_assigned[server] = true;
                        
                        // Update work days
                        for (int day : server_days[server]) {
                            engineer_work_days[engineer_idx].insert(day);
                        }
                        
                        engineer_idx = (engineer_idx + 1) % NUM_ENGINEERS;
                        break;
                    }
                }
                engineer_idx = (engineer_idx + 1) % NUM_ENGINEERS;
                attempts++;
            }
        }
        
        // Phase 2: Distribute remaining servers to maximize coverage
        cout << "Phase 2: Maximizing coverage with remaining servers..." << endl;
        
        // Sort remaining servers by coverage potential
        vector<pair<int, int>> server_priority;
        for (auto& [server, days] : server_days) {
            if (!server_assigned[server]) {
                int priority = days.size() * 100; // Base priority on number of days
                
                // Bonus for servers that appear in first 14 days
                for (int day : days) {
                    if (day < FIRST_14_DAYS) {
                        priority += 50;
                        break;
                    }
                }
                
                server_priority.push_back({priority, server});
            }
        }
        
        sort(server_priority.rbegin(), server_priority.rend());
        
        // Assign remaining servers using greedy approach
        for (auto& [priority, server] : server_priority) {
            if (server_assigned[server]) continue;
            
            int best_engineer = -1;
            int best_gain = -1;
            
            for (int e = 0; e < NUM_ENGINEERS; e++) {
                if (engineer_load[e] >= MAX_SERVERS_PER_ENGINEER) continue;
                
                // Calculate gain for this assignment
                int gain = 0;
                int new_work_days = 0;
                
                for (int day : server_days[server]) {
                    if (engineer_work_days[e].find(day) == engineer_work_days[e].end()) {
                        new_work_days++;
                    }
                }
                
                gain += new_work_days * 100;
                
                // Bonus for engineers who need more work days
                int current_work_days = engineer_work_days[e].size();
                int work_days_needed = engineer_target_work_days[e] - current_work_days;
                if (work_days_needed > 0) {
                    gain += work_days_needed * 50;
                }
                
                // Penalty for exceeding target
                if (current_work_days + new_work_days > engineer_target_work_days[e]) {
                    gain -= (current_work_days + new_work_days - engineer_target_work_days[e]) * 25;
                }
                
                if (gain > best_gain) {
                    best_gain = gain;
                    best_engineer = e;
                }
            }
            
            if (best_engineer != -1) {
                server_to_engineer[server] = best_engineer;
                solution.allocation[best_engineer].push_back(server);
                engineer_load[best_engineer]++;
                server_assigned[server] = true;
                
                for (int day : server_days[server]) {
                    engineer_work_days[best_engineer].insert(day);
                }
            }
        }
        
        // Pad allocations with -1
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            while (solution.allocation[e].size() < MAX_SERVERS_PER_ENGINEER) {
                solution.allocation[e].push_back(-1);
            }
        }
        
        // Calculate daily work and rest days
        calculateDailyWork(solution);
        
        return solution;
    }
    
    Solution mathematicalConstraintAllocation() {
        Solution solution;
        
        // Reset server assignments
        fill(server_to_engineer.begin(), server_to_engineer.end(), -1);
        
        cout << "=== Mathematical Constraint Allocation ===" << endl;
        cout << "Target: Exactly " << MAX_REST_DAYS << " rest days across all engineers" << endl;
        cout << "Required work days: " << MIN_WORK_DAYS << " out of " << TOTAL_ENGINEER_DAYS << endl;
        
        // Step 1: Analyze server-day patterns
        map<int, vector<int>> server_days;
        vector<int> day_server_count(NUM_DAYS, 0);
        
        for (int day = 0; day < NUM_DAYS; day++) {
            day_server_count[day] = daily_alarms[day].size();
            for (int server : daily_alarms[day]) {
                server_days[server].push_back(day);
            }
        }
        
        cout << "Total unique servers: " << server_days.size() << endl;
        
        // Step 2: Calculate exact work day targets
        int target_work_days_per_engineer = MIN_WORK_DAYS / NUM_ENGINEERS;
        int engineers_with_extra_day = MIN_WORK_DAYS % NUM_ENGINEERS;
        
        cout << "Target work days: " << target_work_days_per_engineer 
             << " (+" << engineers_with_extra_day << " engineers get +1)" << endl;
        
        // Step 3: Greedy allocation with strict mathematical constraints
        vector<int> engineer_load(NUM_ENGINEERS, 0);
        vector<set<int>> engineer_work_days(NUM_ENGINEERS);
        vector<bool> server_assigned(NUM_SERVERS, false);
        
        // Phase 1: Ensure first 14 days constraint
        cout << "Phase 1: Ensuring first 14 days coverage..." << endl;
        
        vector<int> first_14_servers;
        for (auto& [server, days] : server_days) {
            for (int day : days) {
                if (day < FIRST_14_DAYS) {
                    first_14_servers.push_back(server);
                    break;
                }
            }
        }
        
        // Round-robin assignment for first 14 days
        for (int i = 0; i < first_14_servers.size() && i < NUM_ENGINEERS; i++) {
            int server = first_14_servers[i];
            int engineer = i % NUM_ENGINEERS;
            
            if (engineer_load[engineer] < MAX_SERVERS_PER_ENGINEER) {
                server_to_engineer[server] = engineer;
                solution.allocation[engineer].push_back(server);
                engineer_load[engineer]++;
                server_assigned[server] = true;
                
                for (int day : server_days[server]) {
                    engineer_work_days[engineer].insert(day);
                }
            }
        }
        
        // Phase 2: Distribute remaining servers to meet exact work day targets
        cout << "Phase 2: Meeting exact work day targets..." << endl;
        
        // Sort engineers by current work day deficit
        vector<pair<int, int>> engineer_deficit; // {deficit, engineer_id}
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            int target = target_work_days_per_engineer + (e < engineers_with_extra_day ? 1 : 0);
            int current = engineer_work_days[e].size();
            int deficit = target - current;
            if (deficit > 0) {
                engineer_deficit.push_back({deficit, e});
            }
        }
        sort(engineer_deficit.rbegin(), engineer_deficit.rend());
        
        // Sort remaining servers by coverage potential
        vector<pair<int, int>> server_priority;
        for (auto& [server, days] : server_days) {
            if (!server_assigned[server]) {
                int priority = days.size() * 100;
                // Bonus for first 14 days
                for (int day : days) {
                    if (day < FIRST_14_DAYS) {
                        priority += 200;
                        break;
                    }
                }
                server_priority.push_back({priority, server});
            }
        }
        sort(server_priority.rbegin(), server_priority.rend());
        
        // Assign servers to engineers with highest deficit
        for (auto& [priority, server] : server_priority) {
            if (server_assigned[server]) continue;
            
            int best_engineer = -1;
            int best_gain = -1;
            
            // Prioritize engineers with work day deficit
            for (auto& [deficit, engineer] : engineer_deficit) {
                if (engineer_load[engineer] >= MAX_SERVERS_PER_ENGINEER) continue;
                
                int gain = 0;
                for (int day : server_days[server]) {
                    if (engineer_work_days[engineer].find(day) == engineer_work_days[engineer].end()) {
                        gain++;
                    }
                }
                
                if (gain > best_gain) {
                    best_gain = gain;
                    best_engineer = engineer;
                }
            }
            
            if (best_engineer != -1 && best_gain > 0) {
                server_to_engineer[server] = best_engineer;
                solution.allocation[best_engineer].push_back(server);
                engineer_load[best_engineer]++;
                server_assigned[server] = true;
                
                for (int day : server_days[server]) {
                    engineer_work_days[best_engineer].insert(day);
                }
                
                // Update deficit list
                engineer_deficit.clear();
                for (int e = 0; e < NUM_ENGINEERS; e++) {
                    int target = target_work_days_per_engineer + (e < engineers_with_extra_day ? 1 : 0);
                    int current = engineer_work_days[e].size();
                    int deficit = target - current;
                    if (deficit > 0) {
                        engineer_deficit.push_back({deficit, e});
                    }
                }
                sort(engineer_deficit.rbegin(), engineer_deficit.rend());
            }
        }
        
        // Phase 3: Fill remaining capacity
        cout << "Phase 3: Filling remaining capacity..." << endl;
        
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            while (engineer_load[e] < MAX_SERVERS_PER_ENGINEER) {
                int best_server = -1;
                int best_gain = 0;
                
                for (auto& [server, days] : server_days) {
                    if (!server_assigned[server]) {
                        int gain = 0;
                        for (int day : days) {
                            if (engineer_work_days[e].find(day) == engineer_work_days[e].end()) {
                                gain++;
                            }
                        }
                        if (gain > best_gain) {
                            best_gain = gain;
                            best_server = server;
                        }
                    }
                }
                
                if (best_server == -1) break;
                
                server_to_engineer[best_server] = e;
                solution.allocation[e].push_back(best_server);
                engineer_load[e]++;
                server_assigned[best_server] = true;
                
                for (int day : server_days[best_server]) {
                    engineer_work_days[e].insert(day);
                }
            }
        }
        
        // Pad allocations with -1
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            while (solution.allocation[e].size() < MAX_SERVERS_PER_ENGINEER) {
                solution.allocation[e].push_back(-1);
            }
        }
        
        // Calculate daily work and rest days
        calculateDailyWork(solution);
        
        return solution;
    }
    
    int calculateCoverageGain(int engineer, int server, const vector<set<int>>& engineer_work_days,
                             const map<int, vector<int>>& server_days, const vector<int>& engineer_target_work_days) {
        int gain = 0;
        int new_work_days = 0;
        bool provides_first_14 = false;
        
        // Count new work days this server would provide
        for (int day : server_days.at(server)) {
            if (engineer_work_days[engineer].find(day) == engineer_work_days[engineer].end()) {
                new_work_days++;
                if (day < FIRST_14_DAYS) {
                    provides_first_14 = true;
                }
            }
        }
        
        // Base gain from new work days
        gain += new_work_days * 100;
        
        // Bonus for first 14 days coverage
        if (provides_first_14) {
            bool has_first_14_work = false;
            for (int day : engineer_work_days[engineer]) {
                if (day < FIRST_14_DAYS) {
                    has_first_14_work = true;
                    break;
                }
            }
            if (!has_first_14_work) {
                gain += 1000; // Critical bonus for first 14 days constraint
            } else {
                gain += 200; // Smaller bonus for additional first 14 days coverage
            }
        }
        
        // Bonus for engineers who need more work days to reach target
        int current_work_days = engineer_work_days[engineer].size();
        int work_days_needed = engineer_target_work_days[engineer] - current_work_days;
        if (work_days_needed > 0) {
            gain += work_days_needed * 50;
        }
        
        // Penalty for exceeding target (to encourage even distribution)
        int potential_work_days = current_work_days + new_work_days;
        if (potential_work_days > engineer_target_work_days[engineer]) {
            gain -= (potential_work_days - engineer_target_work_days[engineer]) * 25;
        }
        
        return gain;
    }
    
    int findOptimalEngineerForConstraints(int server, const vector<int>& engineer_load,
                                         const vector<set<int>>& engineer_work_days,
                                         const vector<int>& engineer_target_work_days,
                                         const map<int, vector<int>>& server_days) {
        int best_engineer = -1;
        int best_score = -1;
        
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            if (engineer_load[e] >= MAX_SERVERS_PER_ENGINEER) continue;
            
            int score = 0;
            
            // Priority 1: Engineers who need more work days to reach target
            int current_work_days = engineer_work_days[e].size();
            int work_days_needed = engineer_target_work_days[e] - current_work_days;
            if (work_days_needed > 0) {
                score += work_days_needed * 1000;
            }
            
            // Priority 2: New work days this server would provide
            int new_work_days = 0;
            for (int day : server_days.at(server)) {
                if (engineer_work_days[e].find(day) == engineer_work_days[e].end()) {
                    new_work_days++;
                    if (day < FIRST_14_DAYS) {
                        score += 500; // Extra bonus for first 14 days
                    }
                }
            }
            score += new_work_days * 100;
            
            // Priority 3: Load balancing
            score += (MAX_SERVERS_PER_ENGINEER - engineer_load[e]) * 10;
            
            // Priority 4: First 14 days constraint
            bool has_first_14_work = false;
            for (int day : engineer_work_days[e]) {
                if (day < FIRST_14_DAYS) {
                    has_first_14_work = true;
                    break;
                }
            }
            
            if (!has_first_14_work) {
                for (int day : server_days.at(server)) {
                    if (day < FIRST_14_DAYS) {
                        score += 2000; // Critical for first 14 days constraint
                        break;
                    }
                }
            }
            
            if (score > best_score) {
                best_score = score;
                best_engineer = e;
            }
        }
        
        return best_engineer;
    }
    
    int findBestUnassignedServer(int engineer, const set<int>& engineer_work_days,
                                const map<int, vector<int>>& server_days) {
        int best_server = -1;
        int best_new_days = 0;
        
        for (auto& [server, days] : server_days) {
            if (server_to_engineer[server] != -1) continue; // Already assigned
            
            int new_work_days = 0;
            bool provides_first_14 = false;
            
            for (int day : days) {
                if (engineer_work_days.find(day) == engineer_work_days.end()) {
                    new_work_days++;
                    if (day < FIRST_14_DAYS) {
                        provides_first_14 = true;
                    }
                }
            }
            
            // Prioritize servers that provide new work days, especially in first 14 days
            int score = new_work_days;
            if (provides_first_14) score += 10;
            
            if (score > best_new_days) {
                best_new_days = score;
                best_server = server;
            }
        }
        
        return best_server;
    }
    
    int findBestEngineerForServer(int server, const vector<int>& engineer_load, 
                                  const vector<vector<int>>& engineer_work_days,
                                  const map<int, vector<int>>& server_days) {
        int best_engineer = -1;
        int best_score = -1;
        
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            if (engineer_load[e] >= MAX_SERVERS_PER_ENGINEER) continue;
            
            // Calculate score based on:
            // 1. Load balancing (prefer less loaded engineers)
            // 2. Work day coverage (prefer engineers who need more work days)
            // 3. First 14 days constraint (ensure coverage)
            
            int score = 0;
            
            // Load balancing component (higher score for less loaded)
            score += (MAX_SERVERS_PER_ENGINEER - engineer_load[e]) * 100;
            
            // Work day coverage component
            set<int> current_work_days(engineer_work_days[e].begin(), engineer_work_days[e].end());
            int new_work_days = 0;
            
            for (int day : server_days.at(server)) {
                if (current_work_days.find(day) == current_work_days.end()) {
                    new_work_days++;
                }
            }
            score += new_work_days * 50;
            
            // First 14 days constraint component
            bool has_first_14_work = false;
            for (int day : engineer_work_days[e]) {
                if (day < FIRST_14_DAYS) {
                    has_first_14_work = true;
                    break;
                }
            }
            
            if (!has_first_14_work) {
                // Check if this server provides first 14 days work
                for (int day : server_days.at(server)) {
                    if (day < FIRST_14_DAYS) {
                        score += 200; // High priority for first 14 days coverage
                        break;
                    }
                }
            }
            
            if (score > best_score) {
                best_score = score;
                best_engineer = e;
            }
        }
        
        return best_engineer;
    }
    
    void calculateDailyWork(Solution& solution) {
        solution.total_rest_days = 0;
        
        // Reset daily work
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            fill(solution.daily_work[e].begin(), solution.daily_work[e].end(), false);
        }
        
        // Mark work days based on server alarms
        for (int day = 0; day < NUM_DAYS; day++) {
            for (int server : daily_alarms[day]) {
                int engineer = server_to_engineer[server];
                if (engineer != -1) {
                    solution.daily_work[engineer][day] = true;
                }
            }
        }
        
        // Count rest days and validate constraints
        solution.valid = true;
        vector<int> engineer_rest_days(NUM_ENGINEERS, 0);
        vector<int> engineer_work_days(NUM_ENGINEERS, 0);
        int engineers_with_first_14_work = 0;
        
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            bool works_in_first_14 = false;
            
            // Check first 14 days constraint and count work/rest days
            for (int day = 0; day < NUM_DAYS; day++) {
                if (solution.daily_work[e][day]) {
                    engineer_work_days[e]++;
                    if (day < FIRST_14_DAYS) {
                        works_in_first_14 = true;
                    }
                } else {
                    engineer_rest_days[e]++;
                    solution.total_rest_days++;
                }
            }
            
            if (works_in_first_14) {
                engineers_with_first_14_work++;
            } else {
                solution.valid = false;
                cout << "Engineer " << e << " has no work in first 14 days" << endl;
            }
        }
        
        // Detailed constraint analysis
        cout << "=== Constraint Analysis ===" << endl;
        cout << "Total rest days: " << solution.total_rest_days << " / " << MAX_REST_DAYS << endl;
        cout << "Engineers with first 14 days work: " << engineers_with_first_14_work << " / " << NUM_ENGINEERS << endl;
        
        // Find engineers with most rest days (potential optimization targets)
        vector<pair<int, int>> engineer_rest_pairs;
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            engineer_rest_pairs.push_back({engineer_rest_days[e], e});
        }
        sort(engineer_rest_pairs.rbegin(), engineer_rest_pairs.rend());
        
        cout << "Top 5 engineers with most rest days:" << endl;
        for (int i = 0; i < min(5, (int)engineer_rest_pairs.size()); i++) {
            int rest_days = engineer_rest_pairs[i].first;
            int engineer = engineer_rest_pairs[i].second;
            cout << "  Engineer " << engineer << ": " << rest_days << " rest days, " 
                 << engineer_work_days[engineer] << " work days" << endl;
        }
        
        // Calculate constraint satisfaction
        bool first_14_satisfied = (engineers_with_first_14_work == NUM_ENGINEERS);
        bool rest_days_satisfied = (solution.total_rest_days <= MAX_REST_DAYS);
        
        cout << "First 14 days constraint: " << (first_14_satisfied ? "SATISFIED" : "VIOLATED") << endl;
        cout << "Rest days constraint: " << (rest_days_satisfied ? "SATISFIED" : "VIOLATED") << endl;
        
        if (rest_days_satisfied && first_14_satisfied) {
            cout << "*** ALL CONSTRAINTS SATISFIED! ***" << endl;
        } else {
            cout << "*** CONSTRAINT VIOLATIONS DETECTED ***" << endl;
            if (!rest_days_satisfied) {
                cout << "  - Excess rest days: " << (solution.total_rest_days - MAX_REST_DAYS) << endl;
            }
            if (!first_14_satisfied) {
                cout << "  - Engineers missing first 14 days work: " << (NUM_ENGINEERS - engineers_with_first_14_work) << endl;
            }
        }
        
        cout << "Solution validation - Valid: " << solution.valid 
             << ", Total rest days: " << solution.total_rest_days << endl;
    }
    
    Solution constraintPropagationOptimization(Solution solution) {
        cout << "=== Starting Aggressive Rest Day Reduction ===" << endl;
        cout << "Current rest days: " << solution.total_rest_days << " / Target: " << MAX_REST_DAYS << endl;
        cout << "Need to reduce " << (solution.total_rest_days - MAX_REST_DAYS) << " rest days" << endl;
        
        if (solution.total_rest_days <= MAX_REST_DAYS) {
            cout << "Already within constraint limits, skipping optimization" << endl;
            return solution;
        }
        
        // Step 1: Analyze current allocation efficiency
        map<int, vector<int>> server_days;
        for (int day = 0; day < NUM_DAYS; day++) {
            for (int server : daily_alarms[day]) {
                server_days[server].push_back(day);
            }
        }
        
        // Step 2: Identify engineers with excessive rest days
        vector<pair<int, int>> engineer_rest_days; // {rest_days, engineer_id}
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            int rest_days = 0;
            for (int day = 0; day < NUM_DAYS; day++) {
                if (!solution.daily_work[e][day]) rest_days++;
            }
            engineer_rest_days.push_back({rest_days, e});
        }
        sort(engineer_rest_days.rbegin(), engineer_rest_days.rend());
        
        cout << "Engineers with most rest days:" << endl;
        for (int i = 0; i < min(10, (int)engineer_rest_days.size()); i++) {
            cout << "  Engineer " << engineer_rest_days[i].second 
                 << ": " << engineer_rest_days[i].first << " rest days" << endl;
        }
        
        // Step 3: Aggressive reallocation strategy
        for (int iteration = 0; iteration < 50; iteration++) {
            Solution optimized = solution;
            bool improved = false;
            
            // Focus on engineers with most rest days
            for (int i = 0; i < min(50, (int)engineer_rest_days.size()); i++) {
                int engineer = engineer_rest_days[i].second;
                int current_rest = engineer_rest_days[i].first;
                
                if (current_rest <= 2) break; // Skip engineers already at target
                
                // Try to find better server assignments for this engineer
                if (aggressiveServerReallocation(optimized, engineer, server_days)) {
                    improved = true;
                }
                
                // Try swapping servers with engineers who have fewer rest days
                for (int j = engineer_rest_days.size() - 1; j > i; j--) {
                    int other_engineer = engineer_rest_days[j].second;
                    if (tryAggressiveServerSwap(optimized, engineer, other_engineer, server_days)) {
                        improved = true;
                    }
                }
            }
            
            calculateDailyWork(optimized);
            
            if (optimized.valid && optimized.total_rest_days < solution.total_rest_days) {
                solution = optimized;
                cout << "Iteration " << iteration << ": Rest days reduced to " << solution.total_rest_days << endl;
                
                // Update engineer rest days for next iteration
                engineer_rest_days.clear();
                for (int e = 0; e < NUM_ENGINEERS; e++) {
                    int rest_days = 0;
                    for (int day = 0; day < NUM_DAYS; day++) {
                        if (!solution.daily_work[e][day]) rest_days++;
                    }
                    engineer_rest_days.push_back({rest_days, e});
                }
                sort(engineer_rest_days.rbegin(), engineer_rest_days.rend());
                
                if (solution.total_rest_days <= MAX_REST_DAYS) {
                    cout << "TARGET ACHIEVED! Rest days: " << solution.total_rest_days << endl;
                    break;
                }
            }
            
            if (!improved) {
                cout << "No further improvement possible in iteration " << iteration << endl;
                break;
            }
        }
        
        cout << "Final rest days: " << solution.total_rest_days << " / " << MAX_REST_DAYS << endl;
        
        return solution;
    }
    
    bool aggressiveServerReallocation(Solution& solution, int engineer, const map<int, vector<int>>& server_days) {
        bool improved = false;
        
        // Find servers that could provide maximum work day coverage for this engineer
        vector<pair<int, int>> server_gains; // {gain, server_id}
        
        for (auto& [server, days] : server_days) {
            if (server_to_engineer[server] == engineer) continue; // Already assigned to this engineer
            
            int gain = 0;
            for (int day : days) {
                if (!solution.daily_work[engineer][day]) {
                    gain++;
                }
            }
            
            if (gain > 0) {
                server_gains.push_back({gain, server});
            }
        }
        
        sort(server_gains.rbegin(), server_gains.rend());
        
        // Try to reassign top servers to this engineer
        for (auto& [gain, server] : server_gains) {
            if (gain <= 1) break; // Only consider servers that provide significant gain
            
            int current_owner = server_to_engineer[server];
            if (current_owner == -1) continue;
            
            // Check if we can remove this server from current owner without violating first 14 days
            bool can_remove = true;
            
            // Check first 14 days constraint for current owner
            bool would_lose_first_14 = true;
            for (int day = 0; day < FIRST_14_DAYS; day++) {
                if (solution.daily_work[current_owner][day]) {
                    bool has_other_server_for_day = false;
                    for (int s : solution.allocation[current_owner]) {
                        if (s == server || s == -1) continue;
                        for (int server_day : server_days.at(s)) {
                            if (server_day == day) {
                                has_other_server_for_day = true;
                                break;
                            }
                        }
                        if (has_other_server_for_day) break;
                    }
                    if (has_other_server_for_day) {
                        would_lose_first_14 = false;
                        break;
                    }
                }
            }
            
            if (would_lose_first_14) {
                can_remove = false; // Would violate first 14 days constraint
            }
            
            if (can_remove) {
                // Check if target engineer has capacity
                int target_load = 0;
                for (int s : solution.allocation[engineer]) {
                    if (s != -1) target_load++;
                }
                
                if (target_load < MAX_SERVERS_PER_ENGINEER) {
                    // Make the reassignment
                    // Remove server from current owner
                    for (int& s : solution.allocation[current_owner]) {
                        if (s == server) {
                            s = -1;
                            break;
                        }
                    }
                    
                    // Add server to target engineer (find empty slot)
                    for (int& s : solution.allocation[engineer]) {
                        if (s == -1) {
                            s = server;
                            server_to_engineer[server] = engineer;
                            improved = true;
                            break;
                        }
                    }
                }
            }
        }
        
        return improved;
    }
    
    bool tryAggressiveServerSwap(Solution& solution, int engineer1, int engineer2, const map<int, vector<int>>& server_days) {
        // Try swapping servers between engineers to reduce total rest days
        
        for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
            for (int j = 0; j < MAX_SERVERS_PER_ENGINEER; j++) {
                int server1 = solution.allocation[engineer1][i];
                int server2 = solution.allocation[engineer2][j];
                
                if (server1 == -1 || server2 == -1) continue;
                
                // Calculate current work days for both engineers
                int work1_before = 0, work2_before = 0;
                for (int day = 0; day < NUM_DAYS; day++) {
                    if (solution.daily_work[engineer1][day]) work1_before++;
                    if (solution.daily_work[engineer2][day]) work2_before++;
                }
                
                // Simulate swap
                solution.allocation[engineer1][i] = server2;
                solution.allocation[engineer2][j] = server1;
                server_to_engineer[server1] = engineer2;
                server_to_engineer[server2] = engineer1;
                
                // Recalculate work days after swap
                vector<vector<bool>> temp_daily_work(NUM_ENGINEERS, vector<bool>(NUM_DAYS, false));
                
                for (int day = 0; day < NUM_DAYS; day++) {
                    for (int server : daily_alarms[day]) {
                        int eng = server_to_engineer[server];
                        if (eng != -1) {
                            temp_daily_work[eng][day] = true;
                        }
                    }
                }
                
                int work1_after = 0, work2_after = 0;
                for (int day = 0; day < NUM_DAYS; day++) {
                    if (temp_daily_work[engineer1][day]) work1_after++;
                    if (temp_daily_work[engineer2][day]) work2_after++;
                }
                
                // Check if swap improves total work days and maintains first 14 days constraint
                bool improves = (work1_after + work2_after) > (work1_before + work2_before);
                bool maintains_first_14 = true;
                
                for (int e : {engineer1, engineer2}) {
                    bool has_first_14 = false;
                    for (int day = 0; day < FIRST_14_DAYS; day++) {
                        if (temp_daily_work[e][day]) {
                            has_first_14 = true;
                            break;
                        }
                    }
                    if (!has_first_14) {
                        maintains_first_14 = false;
                        break;
                    }
                }
                
                if (improves && maintains_first_14) {
                    return true; // Keep the swap
                } else {
                    // Revert swap
                    solution.allocation[engineer1][i] = server1;
                    solution.allocation[engineer2][j] = server2;
                    server_to_engineer[server1] = engineer1;
                    server_to_engineer[server2] = engineer2;
                }
            }
        }
        
        return false;
    }
    
    bool tryServerSwapBetween(Solution& solution, int engineer1, int engineer2) {
        for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
            for (int j = 0; j < MAX_SERVERS_PER_ENGINEER; j++) {
                if (solution.allocation[engineer1][i] != -1 && solution.allocation[engineer2][j] != -1) {
                    int server1 = solution.allocation[engineer1][i];
                    int server2 = solution.allocation[engineer2][j];
                    
                    // Calculate potential improvement
                    int old_rest = solution.total_rest_days;
                    
                    // Perform swap
                    solution.allocation[engineer1][i] = server2;
                    solution.allocation[engineer2][j] = server1;
                    server_to_engineer[server1] = engineer2;
                    server_to_engineer[server2] = engineer1;
                    
                    calculateDailyWork(solution);
                    
                    if (solution.total_rest_days < old_rest && solution.valid) {
                        return true; // Improvement found
                    } else {
                        // Revert swap
                        solution.allocation[engineer1][i] = server1;
                        solution.allocation[engineer2][j] = server2;
                        server_to_engineer[server1] = engineer1;
                        server_to_engineer[server2] = engineer2;
                        solution.total_rest_days = old_rest;
                    }
                }
            }
        }
        return false;
    }
    
    bool tryServerRedistribution(Solution& solution) {
        // Find servers that could be redistributed for better coverage
        vector<int> all_servers;
        for (int s = 0; s < NUM_SERVERS; s++) {
            if (server_to_engineer[s] != -1) {
                all_servers.push_back(s);
            }
        }
        
        shuffle(all_servers.begin(), all_servers.end(), rng);
        
        for (int server : all_servers) {
            int current_engineer = server_to_engineer[server];
            int old_rest = solution.total_rest_days;
            
            // Try assigning to different engineer
            for (int new_engineer = 0; new_engineer < NUM_ENGINEERS; new_engineer++) {
                if (new_engineer == current_engineer) continue;
                
                // Check if new engineer has capacity
                int load = 0;
                for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                    if (solution.allocation[new_engineer][i] != -1) load++;
                }
                
                if (load >= MAX_SERVERS_PER_ENGINEER) continue;
                
                // Remove from current engineer
                for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                    if (solution.allocation[current_engineer][i] == server) {
                        solution.allocation[current_engineer][i] = -1;
                        break;
                    }
                }
                
                // Add to new engineer
                for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                    if (solution.allocation[new_engineer][i] == -1) {
                        solution.allocation[new_engineer][i] = server;
                        break;
                    }
                }
                
                server_to_engineer[server] = new_engineer;
                calculateDailyWork(solution);
                
                if (solution.total_rest_days < old_rest && solution.valid) {
                    return true; // Improvement found
                } else {
                    // Revert change
                    for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                        if (solution.allocation[new_engineer][i] == server) {
                            solution.allocation[new_engineer][i] = -1;
                            break;
                        }
                    }
                    for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                        if (solution.allocation[current_engineer][i] == -1) {
                            solution.allocation[current_engineer][i] = server;
                            break;
                        }
                    }
                    server_to_engineer[server] = current_engineer;
                    solution.total_rest_days = old_rest;
                }
            }
        }
        
        return false;
    }
    
    bool tryServerSwap(Solution& solution) {
        // Select two random engineers
        int eng1 = rng() % NUM_ENGINEERS;
        int eng2 = rng() % NUM_ENGINEERS;
        
        if (eng1 == eng2) return false;
        
        // Find valid servers to swap (not -1)
        vector<int> servers1, servers2;
        for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
            if (solution.allocation[eng1][i] != -1) {
                servers1.push_back(i);
            }
            if (solution.allocation[eng2][i] != -1) {
                servers2.push_back(i);
            }
        }
        
        if (servers1.empty() || servers2.empty()) return false;
        
        // Select random servers to swap
        int idx1 = servers1[rng() % servers1.size()];
        int idx2 = servers2[rng() % servers2.size()];
        
        int server1 = solution.allocation[eng1][idx1];
        int server2 = solution.allocation[eng2][idx2];
        
        // Perform swap
        solution.allocation[eng1][idx1] = server2;
        solution.allocation[eng2][idx2] = server1;
        
        // Update server_to_engineer mapping
        server_to_engineer[server1] = eng2;
        server_to_engineer[server2] = eng1;
        
        return true;
    }

    // 新的精确工作天数目标分配算法
    Solution optimalWorkDaysAllocation() {
        Solution solution;
        
        // Reset server assignments
        fill(server_to_engineer.begin(), server_to_engineer.end(), -1);
        
        cout << "\n=== Target Work Days Allocation Strategy ===" << endl;
        cout << "Target: 74 engineers work 20 days (2 rest), 262 engineers work 21 days (1 rest)" << endl;
        cout << "Total target rest days: 74*2 + 262*1 = " << (74*2 + 262*1) << endl;
        
        // 第一阶段：确保前14天覆盖
        cout << "\nPhase 1: Ensuring first 14 days coverage..." << endl;
        
        // 收集前14天的所有服务器
        set<int> first_14_servers;
        for (int day = 0; day < 14; day++) {
            for (int server : daily_alarms[day]) {
                first_14_servers.insert(server);
            }
        }
        
        cout << "Available servers in first 14 days: " << first_14_servers.size() << endl;
        
        // 为每个工程师分配前14天的服务器（确保不重复分配）
        vector<int> first_14_list(first_14_servers.begin(), first_14_servers.end());
        vector<int> engineer_load(NUM_ENGINEERS, 0);
        
        // 使用轮询方式分配，但确保每个服务器只分配一次
        int server_index = 0;
        for (int engineer = 0; engineer < NUM_ENGINEERS && server_index < first_14_list.size(); engineer++) {
            int server = first_14_list[server_index];
            solution.allocation[engineer].push_back(server);
            server_to_engineer[server] = engineer;
            engineer_load[engineer]++;
            server_index++;
        }
        
        cout << "Phase 1 completed: All engineers have first 14 days coverage" << endl;
        
        // 第二阶段：精确工作天数分配
        cout << "\nPhase 2: Precise work days allocation..." << endl;
        
        // 设定目标工作天数
        vector<int> target_work_days(NUM_ENGINEERS);
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            if (engineer < 74) {
                target_work_days[engineer] = 20;  // 前74个工程师工作20天
            } else {
                target_work_days[engineer] = 21;  // 其余262个工程师工作21天
            }
        }
        
        // 构建服务器-天数映射
        map<int, vector<int>> server_days;
        for (int day = 0; day < NUM_DAYS; day++) {
            for (int server : daily_alarms[day]) {
                server_days[server].push_back(day);
            }
        }
        
        // 收集所有可用服务器（按覆盖天数排序）
        vector<pair<int, int>> server_coverage;  // (server_id, coverage_days)
        for (auto& [server, days] : server_days) {
            if (server_to_engineer[server] == -1) {
                server_coverage.push_back({server, days.size()});
            }
        }
        
        // 按覆盖天数降序排序
        sort(server_coverage.begin(), server_coverage.end(), 
             [](const pair<int, int>& a, const pair<int, int>& b) {
                 return a.second > b.second;
             });
        
        cout << "Available servers for allocation: " << server_coverage.size() << endl;
        
        // 迭代分配服务器直到达到目标工作天数
        bool progress = true;
        int iteration = 0;
        while (progress && iteration < 1000) {
            progress = false;
            iteration++;
            
            // 计算当前工作天数
            vector<set<int>> engineer_work_days(NUM_ENGINEERS);
            for (int e = 0; e < NUM_ENGINEERS; e++) {
                for (int server : solution.allocation[e]) {
                    if (server != -1 && server_days.count(server)) {
                        for (int day : server_days[server]) {
                            engineer_work_days[e].insert(day);
                        }
                    }
                }
            }
            
            // 找到最需要更多工作天数的工程师
            vector<pair<int, int>> engineer_deficit;  // (deficit, engineer_id)
            for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
                int current_work = engineer_work_days[engineer].size();
                int deficit = target_work_days[engineer] - current_work;
                if (deficit > 0 && engineer_load[engineer] < MAX_SERVERS_PER_ENGINEER) {
                    engineer_deficit.push_back({deficit, engineer});
                }
            }
            
            // 按缺口降序排序
            sort(engineer_deficit.rbegin(), engineer_deficit.rend());
            
            // 为缺口最大的工程师分配最佳服务器
            for (auto& [deficit, engineer] : engineer_deficit) {
                if (engineer_load[engineer] >= MAX_SERVERS_PER_ENGINEER) {
                    continue;
                }
                
                int best_server = -1;
                int best_gain = 0;
                
                for (auto& [server, coverage] : server_coverage) {
                    if (server_to_engineer[server] != -1) continue;
                    
                    // 计算分配这个服务器会增加多少工作天数
                    int gain = 0;
                    for (int day : server_days[server]) {
                        if (engineer_work_days[engineer].find(day) == engineer_work_days[engineer].end()) {
                            gain++;
                        }
                    }
                    
                    if (gain > best_gain) {
                        best_gain = gain;
                        best_server = server;
                    }
                }
                
                if (best_server != -1 && best_gain > 0) {
                    solution.allocation[engineer].push_back(best_server);
                    server_to_engineer[best_server] = engineer;
                    engineer_load[engineer]++;
                    progress = true;
                    
                    if (iteration % 50 == 0) {
                        cout << "Iteration " << iteration << ": Assigned server " << best_server 
                             << " to engineer " << engineer << " (gain: " << best_gain << ")" << endl;
                    }
                    // 继续为其他工程师分配服务器，不要break
                }
            }
            
            if (iteration % 20 == 0) {
                // 显示进度
                int engineers_at_target = 0;
                for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
                    int current_work = engineer_work_days[engineer].size();
                    if (current_work >= target_work_days[engineer]) {
                        engineers_at_target++;
                    }
                }
                cout << "Progress: " << engineers_at_target << "/" << NUM_ENGINEERS 
                     << " engineers at target work days" << endl;
            }
        }
        
        cout << "Phase 2 completed after " << iteration << " iterations" << endl;
        
        // Pad allocations with -1
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            while (solution.allocation[e].size() < MAX_SERVERS_PER_ENGINEER) {
                solution.allocation[e].push_back(-1);
            }
        }
        
        // Calculate daily work and rest days
        calculateDailyWork(solution);
        
        // 显示工作天数分布
        map<int, int> work_days_distribution;
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            int work_days = 0;
            for (int day = 0; day < NUM_DAYS; day++) {
                if (solution.daily_work[engineer][day]) {
                    work_days++;
                }
            }
            work_days_distribution[work_days]++;
        }
        
        cout << "\nWork days distribution:" << endl;
        for (auto& [days, count] : work_days_distribution) {
            cout << "  " << count << " engineers work " << days << " days" << endl;
        }
        
        return solution;
    }
    
public:
    void saveSolution(const Solution& solution, const string& filename) {
        ofstream file(filename);
        if (!file.is_open()) {
            cerr << "Error: Cannot create " << filename << endl;
            return;
        }
        
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                file << solution.allocation[e][i];
                if (i < MAX_SERVERS_PER_ENGINEER - 1) file << " ";
            }
            file << endl;
        }
        
        file.close();
        cout << "Solution saved to " << filename << endl;
    }
    
    void printSolutionStats(const Solution& solution) {
        cout << "\n=== Solution Statistics ===" << endl;
        cout << "Valid: " << (solution.valid ? "Yes" : "No") << endl;
        cout << "Total rest days: " << solution.total_rest_days << " / " << MAX_REST_DAYS << endl;
        
        // Count engineers with work in first 14 days
        int engineers_with_work = 0;
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            bool has_work = false;
            for (int day = 0; day < FIRST_14_DAYS; day++) {
                if (solution.daily_work[e][day]) {
                    has_work = true;
                    break;
                }
            }
            if (has_work) engineers_with_work++;
        }
        
        cout << "Engineers with work in first 14 days: " << engineers_with_work << " / " << NUM_ENGINEERS << endl;
        
        // Server assignment statistics
        int assigned_servers = 0;
        for (int e = 0; e < NUM_ENGINEERS; e++) {
            for (int server : solution.allocation[e]) {
                if (server != -1) assigned_servers++;
            }
        }
        cout << "Assigned servers: " << assigned_servers << " / " << NUM_SERVERS << endl;
    }
};

int main() {
    cout << "=== Server Fault Response Allocation Solver ===" << endl;
    cout << "Engineers: " << NUM_ENGINEERS << endl;
    cout << "Servers: " << NUM_SERVERS << endl;
    cout << "Max servers per engineer: " << MAX_SERVERS_PER_ENGINEER << endl;
    cout << "Days: " << NUM_DAYS << endl;
    cout << "Max total rest days: " << MAX_REST_DAYS << endl;
    cout << endl;
    
    ServerAllocationSolver solver;
    
    // Load alarm data
    if (!solver.loadAlarmData("alarm_list.txt")) {
        cerr << "Failed to load alarm data" << endl;
        return 1;
    }
    
    // Solve the allocation problem
    cout << "\nSolving allocation problem..." << endl;
    Solution solution = solver.solve();
    
    if (!solution.valid) {
        cerr << "Failed to find valid solution" << endl;
        return 1;
    }
    
    // Print statistics
    solver.printSolutionStats(solution);
    
    // Save solution
    solver.saveSolution(solution, "allocation_solution.txt");
    
    cout << "\nSolution completed successfully!" << endl;
    return 0;
}