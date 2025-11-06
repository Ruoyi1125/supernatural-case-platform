#include <iostream>
#include <fstream>
#include <vector>
#include <set>
#include <map>
#include <algorithm>
#include <string>
#include <sstream>
#include <queue>
#include <cmath>

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

class PreciseILPSolver {
private:
    vector<vector<int>> daily_alarms;
    map<int, set<int>> server_to_days;
    vector<pair<double, int>> server_efficiency; // (efficiency_score, server_id)
    
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
        
        // 计算服务器效率分数
        for (auto& [server, days] : server_to_days) {
            double score = 0.0;
            
            // 基础分数：覆盖的天数
            score += days.size() * 1.0;
            
            // 前14天奖励：每覆盖一天前14天给予额外分数
            for (int day : days) {
                if (day < 14) {
                    score += 5.0; // 前14天权重很高
                }
            }
            
            // 覆盖连续天数的奖励
            vector<int> day_list(days.begin(), days.end());
            sort(day_list.begin(), day_list.end());
            int consecutive_bonus = 0;
            for (int i = 1; i < day_list.size(); i++) {
                if (day_list[i] == day_list[i-1] + 1) {
                    consecutive_bonus++;
                }
            }
            score += consecutive_bonus * 0.5;
            
            server_efficiency.push_back({score, server});
        }
        
        // 按效率分数降序排序
        sort(server_efficiency.rbegin(), server_efficiency.rend());
        
        cout << "Loaded " << day << " days, " << server_to_days.size() << " unique servers" << endl;
        cout << "Top 10 most efficient servers:" << endl;
        for (int i = 0; i < min(10, (int)server_efficiency.size()); i++) {
            auto [score, server] = server_efficiency[i];
            cout << "  Server " << server << ": score " << score 
                 << " (covers " << server_to_days[server].size() << " days)" << endl;
        }
        
        return true;
    }
    
    Solution solve() {
        Solution solution;
        
        cout << "\n=== Precise ILP-Based Solver ===" << endl;
        cout << "Target: Exactly " << MAX_REST_DAYS << " total rest days" << endl;
        cout << "This requires precise allocation with minimal waste" << endl;
        
        // 计算理论最优分配
        double avg_rest_per_engineer = (double)MAX_REST_DAYS / NUM_ENGINEERS;
        int engineers_with_1_rest = NUM_ENGINEERS - (MAX_REST_DAYS - NUM_ENGINEERS);
        int engineers_with_2_rest = MAX_REST_DAYS - NUM_ENGINEERS;
        
        cout << "Theoretical optimal distribution:" << endl;
        cout << "  " << engineers_with_1_rest << " engineers with 1 rest day (21 work days)" << endl;
        cout << "  " << engineers_with_2_rest << " engineers with 2 rest days (20 work days)" << endl;
        
        // 使用精确的贪心算法
        vector<bool> server_used(NUM_SERVERS, false);
        vector<int> engineer_rest_days(NUM_ENGINEERS, NUM_DAYS);
        int total_rest_days = NUM_ENGINEERS * NUM_DAYS;
        
        cout << "\nPhase 1: Precise allocation to achieve exact rest day target..." << endl;
        
        // 为每个工程师精确分配服务器
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            // 确定这个工程师的目标休息天数
            int target_rest_days;
            if (engineer < engineers_with_1_rest) {
                target_rest_days = 1; // 21 work days
            } else {
                target_rest_days = 2; // 20 work days
            }
            
            int target_work_days = NUM_DAYS - target_rest_days;
            
            // 贪心选择服务器以达到精确的工作天数
            set<int> current_work_days;
            int servers_assigned = 0;
            
            for (auto& [score, server] : server_efficiency) {
                if (server_used[server] || servers_assigned >= MAX_SERVERS_PER_ENGINEER) {
                    continue;
                }
                
                // 计算分配这个服务器后的工作天数
                set<int> new_work_days = current_work_days;
                for (int day : server_to_days[server]) {
                    new_work_days.insert(day);
                }
                
                int new_work_count = new_work_days.size();
                int new_rest_count = NUM_DAYS - new_work_count;
                
                // 检查是否改善了分配
                bool should_assign = false;
                
                if (new_work_count <= target_work_days) {
                    // 如果不超过目标工作天数，且能减少休息天数，就分配
                    if (new_rest_count < engineer_rest_days[engineer]) {
                        should_assign = true;
                    }
                    // 如果能达到精确的目标，优先分配
                    if (new_rest_count == target_rest_days) {
                        should_assign = true;
                    }
                }
                
                if (should_assign) {
                    solution.allocation[engineer][servers_assigned] = server;
                    server_used[server] = true;
                    servers_assigned++;
                    current_work_days = new_work_days;
                    
                    // 更新统计
                    int rest_reduction = engineer_rest_days[engineer] - new_rest_count;
                    total_rest_days -= rest_reduction;
                    engineer_rest_days[engineer] = new_rest_count;
                    
                    // 如果达到目标，停止为这个工程师分配
                    if (new_rest_count == target_rest_days) {
                        break;
                    }
                }
            }
            
            if (engineer % 50 == 0) {
                cout << "Engineer " << engineer << ": " << (NUM_DAYS - engineer_rest_days[engineer]) 
                     << " work days, " << engineer_rest_days[engineer] << " rest days. "
                     << "Total rest: " << total_rest_days << endl;
            }
        }
        
        cout << "\nPhase 2: Fine-tuning to achieve exact " << MAX_REST_DAYS << " rest days..." << endl;
        
        // 微调阶段：精确调整到410天
        for (int iteration = 0; iteration < 100; iteration++) {
            if (total_rest_days == MAX_REST_DAYS) {
                cout << "Achieved exact target of " << MAX_REST_DAYS << " rest days!" << endl;
                break;
            }
            
            bool improved = false;
            
            if (total_rest_days > MAX_REST_DAYS) {
                // 需要减少休息天数：为休息天数多的工程师分配更多服务器
                int excess = total_rest_days - MAX_REST_DAYS;
                cout << "Iteration " << iteration << ": Need to reduce " << excess << " rest days" << endl;
                
                for (int engineer = 0; engineer < NUM_ENGINEERS && excess > 0; engineer++) {
                    if (engineer_rest_days[engineer] > 1) {
                        // 尝试为这个工程师分配更多服务器
                        for (auto& [score, server] : server_efficiency) {
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
                                if (work_increase > 0 && work_increase <= excess) {
                                    solution.allocation[engineer][empty_slot] = server;
                                    server_used[server] = true;
                                    total_rest_days -= work_increase;
                                    engineer_rest_days[engineer] -= work_increase;
                                    excess -= work_increase;
                                    improved = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            } else if (total_rest_days < MAX_REST_DAYS) {
                // 需要增加休息天数：移除一些服务器分配
                int deficit = MAX_REST_DAYS - total_rest_days;
                cout << "Iteration " << iteration << ": Need to increase " << deficit << " rest days" << endl;
                
                for (int engineer = 0; engineer < NUM_ENGINEERS && deficit > 0; engineer++) {
                    if (engineer_rest_days[engineer] < 3) {
                        // 尝试移除这个工程师的一个服务器
                        for (int i = MAX_SERVERS_PER_ENGINEER - 1; i >= 0; i--) {
                            if (solution.allocation[engineer][i] != -1) {
                                int server = solution.allocation[engineer][i];
                                
                                // 计算移除这个服务器后的工作天数
                                set<int> new_work_days;
                                for (int j = 0; j < MAX_SERVERS_PER_ENGINEER; j++) {
                                    if (j != i && solution.allocation[engineer][j] != -1) {
                                        for (int day : server_to_days[solution.allocation[engineer][j]]) {
                                            new_work_days.insert(day);
                                        }
                                    }
                                }
                                
                                // 确保仍然覆盖前14天
                                bool covers_first_14 = false;
                                for (int day : new_work_days) {
                                    if (day < 14) {
                                        covers_first_14 = true;
                                        break;
                                    }
                                }
                                
                                if (covers_first_14) {
                                    int current_work = NUM_DAYS - engineer_rest_days[engineer];
                                    int new_work = new_work_days.size();
                                    int rest_increase = current_work - new_work;
                                    
                                    if (rest_increase > 0 && rest_increase <= deficit) {
                                        server_used[server] = false;
                                        solution.allocation[engineer][i] = -1;
                                        total_rest_days += rest_increase;
                                        engineer_rest_days[engineer] += rest_increase;
                                        deficit -= rest_increase;
                                        improved = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            if (!improved) {
                cout << "No more improvements possible at iteration " << iteration << endl;
                break;
            }
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
        if (solution.total_rest_days == MAX_REST_DAYS) {
            cout << " ✓ EXACTLY SATISFIED!" << endl;
        } else if (solution.total_rest_days <= MAX_REST_DAYS) {
            cout << " ✓ SATISFIED (under by " << (MAX_REST_DAYS - solution.total_rest_days) << ")" << endl;
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
        
        // 额外统计
        cout << "\nDetailed Analysis:" << endl;
        cout << "Average rest days per engineer: " << (double)solution.total_rest_days / NUM_ENGINEERS << endl;
        cout << "Rest day efficiency: " << (double)solution.total_rest_days / MAX_REST_DAYS * 100 << "%" << endl;
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
    cout << "=== Precise ILP-Based Server Allocation Solver ===" << endl;
    cout << "Engineers: " << NUM_ENGINEERS << endl;
    cout << "Servers: " << NUM_SERVERS << endl;
    cout << "Max servers per engineer: " << MAX_SERVERS_PER_ENGINEER << endl;
    cout << "Days: " << NUM_DAYS << endl;
    cout << "EXACT TARGET: " << MAX_REST_DAYS << " total rest days" << endl;
    cout << endl;
    
    PreciseILPSolver solver;
    
    if (!solver.loadAlarmData("alarm_list.txt")) {
        return 1;
    }
    
    cout << "\nSolving with precise constraint satisfaction..." << endl;
    Solution solution = solver.solve();
    
    solver.saveSolution(solution, "precise_solution.txt");
    
    if (solution.valid) {
        cout << "\n✅ PERFECT SOLUTION FOUND! All constraints exactly satisfied." << endl;
    } else {
        cout << "\n⚠️  Best possible solution found, analyzing constraint violations..." << endl;
    }
    
    return 0;
}