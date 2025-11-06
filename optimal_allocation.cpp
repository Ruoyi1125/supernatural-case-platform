#include <iostream>
#include <fstream>
#include <vector>
#include <set>
#include <map>
#include <algorithm>
#include <string>
#include <sstream>

using namespace std;

const int NUM_ENGINEERS = 336;
const int NUM_SERVERS = 1620;
const int MAX_SERVERS_PER_ENGINEER = 5;
const int NUM_DAYS = 22;
const int MAX_REST_DAYS = 410;

struct Solution {
    vector<vector<int>> allocation;
    vector<vector<bool>> daily_work;
    int total_rest_days;
    bool valid;
    
    Solution() : allocation(NUM_ENGINEERS), daily_work(NUM_ENGINEERS, vector<bool>(NUM_DAYS, false)), 
                 total_rest_days(0), valid(false) {}
};

class OptimalServerAllocationSolver {
private:
    vector<vector<int>> daily_alarms;
    
public:
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
            if (line.empty() || !isdigit(line[0])) continue;
            
            istringstream iss(line);
            int server;
            while (iss >> server) {
                daily_alarms[day].push_back(server);
            }
            day++;
        }
        
        file.close();
        
        cout << "Loaded alarm data for " << day << " days" << endl;
        for (int d = 0; d < day; d++) {
            cout << "Day " << d << ": " << daily_alarms[d].size() << " servers" << endl;
        }
        
        return true;
    }
    
    Solution solve() {
        Solution solution;
        solution.allocation.resize(NUM_ENGINEERS);
        solution.valid = true;
        
        cout << "\n=== Optimal Allocation Strategy ===" << endl;
        cout << "Target: 74 engineers work 20 days, 262 engineers work 21 days" << endl;
        cout << "Total target rest days: 410" << endl;
        
        // 构建服务器-天数映射
        map<int, vector<int>> server_days;
        for (int day = 0; day < NUM_DAYS; day++) {
            for (int server : daily_alarms[day]) {
                server_days[server].push_back(day);
            }
        }
        
        // 按服务器覆盖天数排序
        vector<pair<int, int>> servers_by_coverage;
        for (auto& [server, days] : server_days) {
            servers_by_coverage.push_back({days.size(), server});
        }
        sort(servers_by_coverage.rbegin(), servers_by_coverage.rend());
        
        vector<bool> server_assigned(NUM_SERVERS, false);
        
        // 直接分配策略
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            int target_work_days = (engineer < 74) ? 20 : 21;
            set<int> assigned_days;
            int servers_assigned = 0;
            
            // 优先分配覆盖前14天的服务器
            for (auto& [coverage, server] : servers_by_coverage) {
                if (server_assigned[server] || servers_assigned >= MAX_SERVERS_PER_ENGINEER) {
                    continue;
                }
                
                // 检查是否覆盖前14天
                bool covers_first_14 = false;
                for (int day : server_days[server]) {
                    if (day < 14) {
                        covers_first_14 = true;
                        break;
                    }
                }
                
                if (covers_first_14 && assigned_days.size() < target_work_days) {
                    solution.allocation[engineer].push_back(server);
                    server_assigned[server] = true;
                    servers_assigned++;
                    
                    for (int day : server_days[server]) {
                        assigned_days.insert(day);
                    }
                    
                    if (assigned_days.size() >= target_work_days) break;
                }
            }
            
            // 如果还没达到目标，继续分配其他服务器
            for (auto& [coverage, server] : servers_by_coverage) {
                if (server_assigned[server] || servers_assigned >= MAX_SERVERS_PER_ENGINEER) {
                    continue;
                }
                
                if (assigned_days.size() < target_work_days) {
                    solution.allocation[engineer].push_back(server);
                    server_assigned[server] = true;
                    servers_assigned++;
                    
                    for (int day : server_days[server]) {
                        assigned_days.insert(day);
                    }
                    
                    if (assigned_days.size() >= target_work_days) break;
                }
            }
            
            // 填充到5个服务器
            while (solution.allocation[engineer].size() < MAX_SERVERS_PER_ENGINEER) {
                solution.allocation[engineer].push_back(-1);
            }
            
            if (engineer % 50 == 0) {
                cout << "Engineer " << engineer << ": " << assigned_days.size() 
                     << " work days, " << servers_assigned << " servers" << endl;
            }
        }
        
        // 计算每日工作和休息天数
        calculateDailyWork(solution);
        
        return solution;
    }
    
private:
    void calculateDailyWork(Solution& solution) {
        solution.total_rest_days = 0;
        
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            fill(solution.daily_work[engineer].begin(), solution.daily_work[engineer].end(), false);
            
            for (int server : solution.allocation[engineer]) {
                if (server == -1) continue;
                
                for (int day = 0; day < NUM_DAYS; day++) {
                    for (int alarm_server : daily_alarms[day]) {
                        if (alarm_server == server) {
                            solution.daily_work[engineer][day] = true;
                            break;
                        }
                    }
                }
            }
            
            int work_days = 0;
            for (int day = 0; day < NUM_DAYS; day++) {
                if (solution.daily_work[engineer][day]) {
                    work_days++;
                }
            }
            solution.total_rest_days += (NUM_DAYS - work_days);
        }
        
        // 统计工作天数分布
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
        
        cout << "Total rest days: " << solution.total_rest_days << " / " << MAX_REST_DAYS << endl;
        
        // 检查前14天约束
        int engineers_with_first_14_work = 0;
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            bool has_first_14_work = false;
            for (int day = 0; day < 14; day++) {
                if (solution.daily_work[engineer][day]) {
                    has_first_14_work = true;
                    break;
                }
            }
            if (has_first_14_work) engineers_with_first_14_work++;
        }
        
        cout << "Engineers with first 14 days work: " << engineers_with_first_14_work << " / " << NUM_ENGINEERS << endl;
        
        if (solution.total_rest_days <= MAX_REST_DAYS && engineers_with_first_14_work == NUM_ENGINEERS) {
            cout << "*** ALL CONSTRAINTS SATISFIED! ***" << endl;
        } else {
            cout << "*** CONSTRAINT VIOLATIONS DETECTED ***" << endl;
            if (solution.total_rest_days > MAX_REST_DAYS) {
                cout << "  - Excess rest days: " << (solution.total_rest_days - MAX_REST_DAYS) << endl;
            }
            if (engineers_with_first_14_work < NUM_ENGINEERS) {
                cout << "  - Engineers missing first 14 days work: " << (NUM_ENGINEERS - engineers_with_first_14_work) << endl;
            }
        }
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
};

int main() {
    cout << "=== Optimal Server Fault Response Allocation Solver ===" << endl;
    cout << "Engineers: " << NUM_ENGINEERS << endl;
    cout << "Servers: " << NUM_SERVERS << endl;
    cout << "Max servers per engineer: " << MAX_SERVERS_PER_ENGINEER << endl;
    cout << "Days: " << NUM_DAYS << endl;
    cout << "Max total rest days: " << MAX_REST_DAYS << endl;
    cout << endl;
    
    OptimalServerAllocationSolver solver;
    
    if (!solver.loadAlarmData("alarm_list.txt")) {
        return 1;
    }
    
    cout << "\nSolving allocation problem..." << endl;
    Solution solution = solver.solve();
    
    if (solution.valid) {
        solver.saveSolution(solution, "optimal_allocation_solution.txt");
        cout << "\nSolution completed successfully!" << endl;
    } else {
        cout << "\nFailed to find a valid solution!" << endl;
        return 1;
    }
    
    return 0;
}