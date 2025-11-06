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
    
    Solution() : allocation(NUM_ENGINEERS, vector<int>(MAX_SERVERS_PER_ENGINEER, -1)), 
                 daily_work(NUM_ENGINEERS, vector<bool>(NUM_DAYS, false)), 
                 total_rest_days(0), valid(false) {}
};

class ConstraintBasedSolver {
private:
    vector<vector<int>> daily_alarms;
    map<int, set<int>> server_to_days;
    vector<tuple<int, int, int>> server_efficiency; // (coverage, first_14_coverage, server_id)
    
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
                server_to_days[server].insert(day);
            }
            day++;
        }
        
        file.close();
        
        // 计算服务器效率
        for (auto& [server, days] : server_to_days) {
            int coverage = days.size();
            int first_14_coverage = 0;
            for (int day : days) {
                if (day < 14) first_14_coverage++;
            }
            server_efficiency.push_back({coverage, first_14_coverage, server});
        }
        
        // 按效率排序：优先考虑覆盖天数多且前14天覆盖多的服务器
        sort(server_efficiency.begin(), server_efficiency.end(), 
             [](const auto& a, const auto& b) {
                 if (get<1>(a) != get<1>(b)) return get<1>(a) > get<1>(b); // 前14天覆盖优先
                 return get<0>(a) > get<0>(b); // 总覆盖天数次优先
             });
        
        cout << "Loaded " << day << " days, " << server_to_days.size() << " unique servers" << endl;
        cout << "Top 10 most efficient servers:" << endl;
        for (int i = 0; i < min(10, (int)server_efficiency.size()); i++) {
            auto [coverage, first_14, server] = server_efficiency[i];
            cout << "  Server " << server << ": " << coverage << " days total, " 
                 << first_14 << " in first 14 days" << endl;
        }
        
        return true;
    }
    
    Solution solve() {
        Solution solution;
        
        cout << "\n=== Constraint-Based Allocation Solver ===" << endl;
        cout << "Strict constraint: Total rest days <= " << MAX_REST_DAYS << endl;
        cout << "This means average rest per engineer: " << (double)MAX_REST_DAYS / NUM_ENGINEERS << " days" << endl;
        cout << "Target distribution: Most engineers work 20-21 days (1-2 rest days)" << endl;
        
        // 使用贪心算法，严格控制休息天数
        vector<bool> server_used(NUM_SERVERS, false);
        vector<int> engineer_work_days(NUM_ENGINEERS, 0);
        vector<int> engineer_rest_days(NUM_ENGINEERS, NUM_DAYS);
        int total_rest_days = NUM_ENGINEERS * NUM_DAYS; // 初始所有人都休息
        
        cout << "\nPhase 1: Greedy allocation with strict rest day control..." << endl;
        
        // 为每个工程师分配服务器，严格控制总休息天数
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            int servers_assigned = 0;
            set<int> work_days_set;
            
            // 目标：让这个工程师工作20-21天（休息1-2天）
            int target_work_days = (engineer < 74) ? 20 : 21;
            int target_rest_days = NUM_DAYS - target_work_days;
            
            // 贪心选择最有效的服务器
            for (auto& [coverage, first_14, server] : server_efficiency) {
                if (server_used[server] || servers_assigned >= MAX_SERVERS_PER_ENGINEER) {
                    continue;
                }
                
                // 计算分配这个服务器后的工作天数
                set<int> new_work_days = work_days_set;
                for (int day : server_to_days[server]) {
                    new_work_days.insert(day);
                }
                
                int new_work_count = new_work_days.size();
                int new_rest_count = NUM_DAYS - new_work_count;
                
                // 检查是否会违反总休息天数约束
                int rest_day_change = engineer_rest_days[engineer] - new_rest_count;
                if (total_rest_days - rest_day_change <= MAX_REST_DAYS && 
                    new_work_count <= target_work_days) {
                    
                    // 分配这个服务器
                    solution.allocation[engineer][servers_assigned] = server;
                    server_used[server] = true;
                    servers_assigned++;
                    work_days_set = new_work_days;
                    
                    // 更新统计
                    total_rest_days -= rest_day_change;
                    engineer_rest_days[engineer] = new_rest_count;
                    engineer_work_days[engineer] = new_work_count;
                    
                    // 如果达到目标或接近约束限制，停止为这个工程师分配
                    if (new_work_count >= target_work_days || 
                        total_rest_days <= MAX_REST_DAYS + 50) {
                        break;
                    }
                }
            }
            
            if (engineer % 50 == 0) {
                cout << "Engineer " << engineer << ": " << engineer_work_days[engineer] 
                     << " work days, " << engineer_rest_days[engineer] << " rest days. "
                     << "Total rest so far: " << total_rest_days << endl;
            }
            
            // 如果总休息天数接近限制，提前停止
            if (total_rest_days <= MAX_REST_DAYS + 20) {
                cout << "Approaching rest day limit, stopping early at engineer " << engineer << endl;
                break;
            }
        }
        
        cout << "\nPhase 2: Fine-tuning to meet exact constraints..." << endl;
        
        // 微调阶段：优化分配以满足所有约束
        for (int iteration = 0; iteration < 50; iteration++) {
            bool improved = false;
            
            // 如果总休息天数仍然超标，尝试减少
            if (total_rest_days > MAX_REST_DAYS) {
                for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
                    if (engineer_rest_days[engineer] > 1) {
                        // 尝试为这个工程师分配更多服务器
                        for (auto& [coverage, first_14, server] : server_efficiency) {
                            if (server_used[server]) continue;
                            
                            // 检查是否有空位
                            int empty_slot = -1;
                            for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                                if (solution.allocation[engineer][i] == -1) {
                                    empty_slot = i;
                                    break;
                                }
                            }
                            
                            if (empty_slot != -1) {
                                // 计算新的工作天数
                                set<int> current_work_days;
                                for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                                    if (solution.allocation[engineer][i] != -1) {
                                        for (int day : server_to_days[solution.allocation[engineer][i]]) {
                                            current_work_days.insert(day);
                                        }
                                    }
                                }
                                
                                set<int> new_work_days = current_work_days;
                                for (int day : server_to_days[server]) {
                                    new_work_days.insert(day);
                                }
                                
                                int work_increase = new_work_days.size() - current_work_days.size();
                                if (work_increase > 0 && total_rest_days - work_increase >= MAX_REST_DAYS) {
                                    solution.allocation[engineer][empty_slot] = server;
                                    server_used[server] = true;
                                    total_rest_days -= work_increase;
                                    engineer_rest_days[engineer] -= work_increase;
                                    engineer_work_days[engineer] += work_increase;
                                    improved = true;
                                    break;
                                }
                            }
                        }
                        
                        if (total_rest_days <= MAX_REST_DAYS) break;
                    }
                }
            }
            
            if (!improved || total_rest_days <= MAX_REST_DAYS) break;
        }
        
        // 计算最终结果
        calculateFinalResults(solution);
        
        return solution;
    }
    
private:
    void calculateFinalResults(Solution& solution) {
        solution.total_rest_days = 0;
        
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            fill(solution.daily_work[engineer].begin(), solution.daily_work[engineer].end(), false);
            
            for (int i = 0; i < MAX_SERVERS_PER_ENGINEER; i++) {
                int server = solution.allocation[engineer][i];
                if (server == -1) continue;
                
                for (int day : server_to_days[server]) {
                    solution.daily_work[engineer][day] = true;
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
        map<int, int> rest_days_distribution;
        int engineers_with_first_14_work = 0;
        
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
            
            int rest_days = NUM_DAYS - work_days;
            work_days_distribution[work_days]++;
            rest_days_distribution[rest_days]++;
            if (has_first_14_work) engineers_with_first_14_work++;
        }
        
        cout << "\n=== Final Results ===" << endl;
        cout << "Work days distribution:" << endl;
        for (auto& [days, count] : work_days_distribution) {
            cout << "  " << count << " engineers work " << days << " days" << endl;
        }
        
        cout << "\nRest days distribution:" << endl;
        for (auto& [days, count] : rest_days_distribution) {
            cout << "  " << count << " engineers rest " << days << " days" << endl;
        }
        
        cout << "\nConstraint Check:" << endl;
        cout << "Total rest days: " << solution.total_rest_days << " / " << MAX_REST_DAYS;
        if (solution.total_rest_days <= MAX_REST_DAYS) {
            cout << " ✓ SATISFIED" << endl;
        } else {
            cout << " ✗ VIOLATED (excess: " << (solution.total_rest_days - MAX_REST_DAYS) << ")" << endl;
        }
        
        cout << "Engineers with first 14 days work: " << engineers_with_first_14_work << " / " << NUM_ENGINEERS;
        if (engineers_with_first_14_work == NUM_ENGINEERS) {
            cout << " ✓ SATISFIED" << endl;
        } else {
            cout << " ✗ VIOLATED (missing: " << (NUM_ENGINEERS - engineers_with_first_14_work) << ")" << endl;
        }
        
        if (solution.total_rest_days <= MAX_REST_DAYS && engineers_with_first_14_work == NUM_ENGINEERS) {
            cout << "\n🎉 ALL CONSTRAINTS SATISFIED! 🎉" << endl;
            solution.valid = true;
        } else {
            cout << "\n❌ CONSTRAINT VIOLATIONS DETECTED ❌" << endl;
            solution.valid = false;
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
    cout << "=== Constraint-Based Server Allocation Solver ===" << endl;
    cout << "Engineers: " << NUM_ENGINEERS << endl;
    cout << "Servers: " << NUM_SERVERS << endl;
    cout << "Max servers per engineer: " << MAX_SERVERS_PER_ENGINEER << endl;
    cout << "Days: " << NUM_DAYS << endl;
    cout << "STRICT CONSTRAINT: Max total rest days = " << MAX_REST_DAYS << endl;
    cout << endl;
    
    ConstraintBasedSolver solver;
    
    if (!solver.loadAlarmData("alarm_list.txt")) {
        return 1;
    }
    
    cout << "\nSolving with strict constraint enforcement..." << endl;
    Solution solution = solver.solve();
    
    solver.saveSolution(solution, "constraint_solution.txt");
    
    if (solution.valid) {
        cout << "\n✅ SOLUTION FOUND! All constraints satisfied." << endl;
    } else {
        cout << "\n⚠️  Partial solution found, but constraints not fully satisfied." << endl;
    }
    
    return 0;
}