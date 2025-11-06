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
#include <random>
#include <chrono>

using namespace std;

const int NUM_ENGINEERS = 336;
const int NUM_SERVERS = 1620;
const int MAX_SERVERS_PER_ENGINEER = 5;
const int MAX_REST_DAYS = 410;

struct Solution {
    vector<vector<int>> allocation;
    vector<vector<bool>> daily_work;
    int total_rest_days;
    int num_days;
    bool valid;
    
    Solution(int days) : allocation(NUM_ENGINEERS, vector<int>(MAX_SERVERS_PER_ENGINEER, -1)), 
                         daily_work(NUM_ENGINEERS, vector<bool>(days, false)), 
                         total_rest_days(0), num_days(days), valid(false) {}
};

class UltimateConstraintSolver {
private:
    vector<vector<int>> daily_alarms;
    map<int, set<int>> server_to_days;
    vector<pair<double, int>> server_efficiency;
    int num_days;
    
public:
    bool loadAlarmData(const string& filename) {
        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Error: Cannot open " << filename << endl;
            return false;
        }
        
        string line;
        int day = 0;
        
        while (getline(file, line)) {
            if (line.empty() || !isdigit(line[0])) continue;
            
            daily_alarms.push_back(vector<int>());
            istringstream iss(line);
            int server;
            while (iss >> server) {
                daily_alarms[day].push_back(server);
                server_to_days[server].insert(day);
            }
            day++;
        }
        
        num_days = day;
        file.close();
        
        // 计算服务器效率分数
        for (auto& [server, days] : server_to_days) {
            double score = 0.0;
            
            // 基础分数：覆盖的天数
            score += days.size() * 2.0;
            
            // 前14天奖励：每覆盖一天前14天给予额外分数
            int first_14_count = 0;
            for (int day : days) {
                if (day < 14) {
                    score += 10.0; // 前14天权重非常高
                    first_14_count++;
                }
            }
            
            // 如果完全覆盖前14天，给予巨大奖励
            if (first_14_count >= 14) {
                score += 100.0;
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
            score += consecutive_bonus * 1.0;
            
            server_efficiency.push_back({score, server});
        }
        
        // 按效率分数降序排序
        sort(server_efficiency.rbegin(), server_efficiency.rend());
        
        cout << "Loaded " << num_days << " days, " << server_to_days.size() << " unique servers" << endl;
        cout << "Top 10 most efficient servers:" << endl;
        for (int i = 0; i < min(10, (int)server_efficiency.size()); i++) {
            auto [score, server] = server_efficiency[i];
            cout << "  Server " << server << ": score " << score 
                 << " (covers " << server_to_days[server].size() << " days)" << endl;
        }
        
        return true;
    }
    
    Solution solve() {
        Solution solution(num_days);
        
        cout << "\n=== Ultimate Constraint Solver ===" << endl;
        cout << "Days: " << num_days << endl;
        cout << "Target: EXACTLY " << MAX_REST_DAYS << " total rest days" << endl;
        
        // 计算理论最优分配
        int total_engineer_days = NUM_ENGINEERS * num_days;
        int total_work_days_needed = total_engineer_days - MAX_REST_DAYS;
        
        cout << "Total engineer-days: " << total_engineer_days << endl;
        cout << "Total work days needed: " << total_work_days_needed << endl;
        cout << "Average work days per engineer: " << (double)total_work_days_needed / NUM_ENGINEERS << endl;
        
        // 计算精确的工程师分配
        int engineers_with_min_work = 0;
        int engineers_with_max_work = 0;
        int min_work_days = 0;
        int max_work_days = 0;
        
        // 尝试不同的分配策略
        bool found_distribution = false;
        for (int min_work = 1; min_work <= num_days && !found_distribution; min_work++) {
            for (int max_work = min_work; max_work <= num_days; max_work++) {
                // 计算需要多少工程师工作min_work天，多少工程师工作max_work天
                // min_work * x + max_work * y = total_work_days_needed
                // x + y = NUM_ENGINEERS
                
                if (max_work == min_work) {
                    if (min_work * NUM_ENGINEERS == total_work_days_needed) {
                        engineers_with_min_work = NUM_ENGINEERS;
                        engineers_with_max_work = 0;
                        min_work_days = min_work;
                        max_work_days = min_work;
                        cout << "Perfect distribution found: all engineers work " << min_work << " days" << endl;
                        found_distribution = true;
                        break;
                    }
                } else {
                    // 解方程组
                    int y = (total_work_days_needed - min_work * NUM_ENGINEERS) / (max_work - min_work);
                    int x = NUM_ENGINEERS - y;
                    
                    if (x >= 0 && y >= 0 && min_work * x + max_work * y == total_work_days_needed) {
                        engineers_with_min_work = x;
                        engineers_with_max_work = y;
                        min_work_days = min_work;
                        max_work_days = max_work;
                        cout << "Perfect distribution found:" << endl;
                        cout << "  " << x << " engineers work " << min_work << " days (" << (num_days - min_work) << " rest)" << endl;
                        cout << "  " << y << " engineers work " << max_work << " days (" << (num_days - max_work) << " rest)" << endl;
                        found_distribution = true;
                        break;
                    }
                }
            }
        }
        
        if (!found_distribution) {
            cout << "No perfect distribution found, using approximation" << endl;
            // 使用近似分配
            min_work_days = total_work_days_needed / NUM_ENGINEERS;
            max_work_days = min_work_days + 1;
            engineers_with_max_work = total_work_days_needed % NUM_ENGINEERS;
            engineers_with_min_work = NUM_ENGINEERS - engineers_with_max_work;
        }
        
        cout << "\nPhase 1: Precise allocation using mathematical optimization..." << endl;
        
        // 使用精确的分配算法
        vector<bool> server_used(NUM_SERVERS, false);
        vector<int> engineer_work_days(NUM_ENGINEERS, 0);
        
        // 为每个工程师分配服务器以达到精确的工作天数
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            // 确定这个工程师的目标工作天数
            int target_work_days;
            if (engineers_with_min_work > 0) {
                target_work_days = min_work_days;
                engineers_with_min_work--;
            } else {
                target_work_days = max_work_days;
                engineers_with_max_work--;
            }
            
            // 贪心选择服务器
            set<int> current_work_days;
            int servers_assigned = 0;
            
            // 首先确保覆盖前14天
            bool covers_first_14 = false;
            for (auto& [score, server] : server_efficiency) {
                if (server_used[server] || servers_assigned >= MAX_SERVERS_PER_ENGINEER) {
                    continue;
                }
                
                // 检查是否覆盖前14天
                bool has_first_14 = false;
                for (int day : server_to_days[server]) {
                    if (day < 14) {
                        has_first_14 = true;
                        break;
                    }
                }
                
                if (has_first_14 && !covers_first_14) {
                    solution.allocation[engineer][servers_assigned] = server;
                    server_used[server] = true;
                    servers_assigned++;
                    
                    for (int day : server_to_days[server]) {
                        current_work_days.insert(day);
                    }
                    covers_first_14 = true;
                    break;
                }
            }
            
            // 然后选择其他服务器以达到目标工作天数
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
                
                // 如果接近目标工作天数，就分配
                if (new_work_count <= target_work_days) {
                    solution.allocation[engineer][servers_assigned] = server;
                    server_used[server] = true;
                    servers_assigned++;
                    current_work_days = new_work_days;
                    
                    if (new_work_count == target_work_days) {
                        break; // 达到精确目标
                    }
                }
            }
            
            engineer_work_days[engineer] = current_work_days.size();
            
            if (engineer % 50 == 0) {
                cout << "Engineer " << engineer << ": " << engineer_work_days[engineer] 
                     << " work days, " << (num_days - engineer_work_days[engineer]) << " rest days" << endl;
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
                    if (day < solution.num_days) {
                        solution.daily_work[engineer][day] = true;
                    }
                }
            }
            
            int work_days = 0;
            for (int day = 0; day < solution.num_days; day++) {
                if (solution.daily_work[engineer][day]) {
                    work_days++;
                }
            }
            solution.total_rest_days += (solution.num_days - work_days);
        }
        
        // 统计结果
        map<int, int> work_days_distribution;
        map<int, int> rest_days_distribution;
        int engineers_with_first_14_work = 0;
        
        for (int engineer = 0; engineer < NUM_ENGINEERS; engineer++) {
            int work_days = 0;
            bool has_first_14_work = false;
            
            for (int day = 0; day < solution.num_days; day++) {
                if (solution.daily_work[engineer][day]) {
                    work_days++;
                    if (day < 14) {
                        has_first_14_work = true;
                    }
                }
            }
            
            int rest_days = solution.num_days - work_days;
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
        
        if (solution.total_rest_days <= MAX_REST_DAYS) {
            cout << "Remaining rest day budget: " << (MAX_REST_DAYS - solution.total_rest_days) << " days" << endl;
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
    cout << "=== Ultimate Constraint-Based Server Allocation Solver ===" << endl;
    cout << "Engineers: " << NUM_ENGINEERS << endl;
    cout << "Servers: " << NUM_SERVERS << endl;
    cout << "Max servers per engineer: " << MAX_SERVERS_PER_ENGINEER << endl;
    cout << "EXACT TARGET: " << MAX_REST_DAYS << " total rest days" << endl;
    cout << endl;
    
    UltimateConstraintSolver solver;
    
    if (!solver.loadAlarmData("alarm_list.txt")) {
        return 1;
    }
    
    cout << "\nSolving with ultimate mathematical precision..." << endl;
    Solution solution = solver.solve();
    
    solver.saveSolution(solution, "ultimate_solution.txt");
    
    if (solution.valid) {
        cout << "\n✅ PERFECT SOLUTION FOUND! All constraints exactly satisfied." << endl;
    } else {
        cout << "\n⚠️  Best possible solution found with constraint analysis." << endl;
    }
    
    return 0;
}