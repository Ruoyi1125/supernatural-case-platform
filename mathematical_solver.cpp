#include <iostream>
#include <fstream>
#include <vector>
#include <set>
#include <map>
#include <algorithm>
#include <string>
#include <sstream>
#include <queue>

using namespace std;

const int NUM_ENGINEERS = 336;
const int NUM_SERVERS = 1620;
const int MAX_SERVERS_PER_ENGINEER = 5;
const int NUM_DAYS = 22;
const int MAX_REST_DAYS = 410;
const int TARGET_WORK_DAYS_74 = 20;  // 前74个工程师
const int TARGET_WORK_DAYS_262 = 21; // 后262个工程师

struct Solution {
    vector<vector<int>> allocation;
    vector<vector<bool>> daily_work;
    int total_rest_days;
    bool valid;
    
    Solution() : allocation(NUM_ENGINEERS), daily_work(NUM_ENGINEERS, vector<bool>(NUM_DAYS, false)), 
                 total_rest_days(0), valid(false) {}
};

class MathematicalServerAllocationSolver {
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
        
        cout << "\n=== Mathematical Optimization Algorithm ===" << endl;
        cout << "Target: 74 engineers work exactly 20 days, 262 engineers work exactly 21 days" << endl;
        cout << "Total target rest days: 74*2 + 262*1 = 410" << endl;
        cout << "Total target work days: 74*20 + 262*21 = 6982" << endl;
        
        // 构建服务器到天数的映射
        map<int, set<int>> server_to_days;
        for (int day = 0; day < NUM_DAYS; day++) {
            for (int server : daily_alarms[day]) {
                server_to_days[server].insert(day);
            }
        }
        
        // 创建服务器效率评分：优先选择覆盖天数多且包含前14天的服务器
        vector<tuple<double, int, int>> server_scores; // (score, coverage, server_id)
        for (auto& [server, days] : server_to_days) {
            double score = days.size();
            
            // 如果覆盖前14天，给予额外分数
            bool covers_first_14 = false;
            for (int day : days) {
                if (day < 14) {
                    covers_first_14 = true;
                    break;
                }
            }
            if (covers_first_14) {
                score += 10.0; // 前14天覆盖奖励
            }
            
            server_scores.push_back({score, days.size(), server});
        }
        
        // 按分数降序排序
        sort(server_scores.rbegin(), server_scores.rend());
        
        vector<bool> server_assigned(NUM_SERVERS, false);
        vector<set<int>> engineer_work_days(NUM_ENGINEERS);
        
        cout << "\nPhase 1: Precise allocation to meet exact work day targets..." << endl;
        
        // 精确分配算法
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            int target_days = (engineer < 74) ? TARGET_WORK_DAYS_74 : TARGET_WORK_DAYS_262;
            int servers_assigned = 0;
            
            // 优先分配能够最有效达到目标的服务器
            for (auto& [score, coverage, server] : server_scores) {
                if (server_assigned[server] || servers_assigned >= MAX_SERVERS_PER_ENGINEER) {
                    continue;
                }
                
                // 计算分配这个服务器后的工作天数
                set<int> new_work_days = engineer_work_days[engineer];
                for (int day : server_to_days[server]) {
                    new_work_days.insert(day);
                }
                
                // 如果分配这个服务器能让我们更接近目标，就分配它
                int current_days = engineer_work_days[engineer].size();
                int new_days = new_work_days.size();
                
                if (new_days <= target_days && new_days > current_days) {
                    solution.allocation[engineer].push_back(server);
                    server_assigned[server] = true;
                    servers_assigned++;
                    engineer_work_days[engineer] = new_work_days;
                    
                    // 如果达到目标天数，停止为这个工程师分配
                    if (new_days == target_days) {
                        break;
                    }
                }
            }
            
            // 填充到5个服务器
            while (solution.allocation[engineer].size() < MAX_SERVERS_PER_ENGINEER) {
                solution.allocation[engineer].push_back(-1);
            }
            
            if (engineer % 50 == 0) {
                cout << "Engineer " << engineer << ": " << engineer_work_days[engineer].size() 
                     << " work days (target: " << target_days << "), " 
                     << servers_assigned << " servers" << endl;
            }
        }
        
        cout << "\nPhase 2: Fine-tuning to achieve exact targets..." << endl;
        
        // 微调阶段：交换服务器以达到精确目标
        for (int iteration = 0; iteration < 100; iteration++) {
            bool improved = false;
            
            for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
                int target_days = (engineer < 74) ? TARGET_WORK_DAYS_74 : TARGET_WORK_DAYS_262;
                int current_days = engineer_work_days[engineer].size();
                
                if (current_days != target_days) {
                    // 尝试调整这个工程师的分配
                    if (current_days < target_days) {
                        // 需要增加工作天数：寻找未分配的服务器
                        for (auto& [score, coverage, server] : server_scores) {
                            if (!server_assigned[server]) {
                                // 检查是否有空位
                                int empty_slot = -1;
                                for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                                    if (solution.allocation[engineer][i] == -1) {
                                        empty_slot = i;
                                        break;
                                    }
                                }
                                
                                if (empty_slot != -1) {
                                    // 计算增加的工作天数
                                    set<int> new_work_days = engineer_work_days[engineer];
                                    for (int day : server_to_days[server]) {
                                        new_work_days.insert(day);
                                    }
                                    
                                    if (new_work_days.size() <= target_days) {
                                        solution.allocation[engineer][empty_slot] = server;
                                        server_assigned[server] = true;
                                        engineer_work_days[engineer] = new_work_days;
                                        improved = true;
                                        break;
                                    }
                                }
                            }
                        }
                    } else if (current_days > target_days) {
                        // 需要减少工作天数：移除一个服务器
                        for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                            int server = solution.allocation[engineer][i];
                            if (server != -1) {
                                // 尝试移除这个服务器
                                set<int> new_work_days;
                                for (int j = 0; j < MAX_SERVERS_PER_ENGINEER; j++) {
                                    if (j != i && solution.allocation[engineer][j] != -1) {
                                        for (int day : server_to_days[solution.allocation[engineer][j]]) {
                                            new_work_days.insert(day);
                                        }
                                    }
                                }
                                
                                if (new_work_days.size() >= target_days) {
                                    server_assigned[server] = false;
                                    solution.allocation[engineer][i] = -1;
                                    engineer_work_days[engineer] = new_work_days;
                                    improved = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            if (!improved) break;
        }
        
        // 计算最终结果
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
        
        // 统计结果
        map<int, int> work_days_distribution;
        int engineers_with_first_14_work = 0;
        int engineers_at_target = 0;
        
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            int work_days = 0;
            bool has_first_14_work = false;
            
            for (int day = 0; day < NUM_DAYS; day++) {
                if (solution.daily_work[engineer][day]) {
                    work_days++;
                    if (day < 14) {
                        has_first_14_work = true;
                    }
                }
            }
            
            work_days_distribution[work_days]++;
            if (has_first_14_work) engineers_with_first_14_work++;
            
            int target_days = (engineer < 74) ? TARGET_WORK_DAYS_74 : TARGET_WORK_DAYS_262;
            if (work_days == target_days) engineers_at_target++;
        }
        
        cout << "\n=== Final Results ===" << endl;
        cout << "Work days distribution:" << endl;
        for (auto& [days, count] : work_days_distribution) {
            cout << "  " << count << " engineers work " << days << " days" << endl;
        }
        
        cout << "Total rest days: " << solution.total_rest_days << " / " << MAX_REST_DAYS << endl;
        cout << "Engineers with first 14 days work: " << engineers_with_first_14_work << " / " << NUM_ENGINEERS << endl;
        cout << "Engineers at exact target: " << engineers_at_target << " / " << NUM_ENGINEERS << endl;
        
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
    cout << "=== Mathematical Server Allocation Solver ===" << endl;
    cout << "Engineers: " << NUM_ENGINEERS << endl;
    cout << "Servers: " << NUM_SERVERS << endl;
    cout << "Max servers per engineer: " << MAX_SERVERS_PER_ENGINEER << endl;
    cout << "Days: " << NUM_DAYS << endl;
    cout << "Max total rest days: " << MAX_REST_DAYS << endl;
    cout << endl;
    
    MathematicalServerAllocationSolver solver;
    
    if (!solver.loadAlarmData("alarm_list.txt")) {
        return 1;
    }
    
    cout << "\nSolving allocation problem..." << endl;
    Solution solution = solver.solve();
    
    if (solution.valid) {
        solver.saveSolution(solution, "mathematical_solution.txt");
        cout << "\nSolution completed successfully!" << endl;
    } else {
        cout << "\nFailed to find a valid solution!" << endl;
        return 1;
    }
    
    return 0;
}